---
title: "Spark Performance Tuning Deep Dive: Plans, Executors, Partitioning, Caching, AQE and DPP"
description: "Read physical plans like a pro, size executors with arithmetic, choose partitioning and bucketing, decide when to cache, and know exactly what AQE, broadcast joins and dynamic partition pruning do, with worked examples."
url: "/interview-prep/learn/spark-databricks/05-performance-tuning-deep-dive/"
hiddenInHomeList: true
showToc: true
weight: 5
---

# Spark Performance Tuning Deep Dive

This module is the hands-on companion to [Spark internals](/interview-prep/learn/spark-databricks/01-spark-internals/) and [shuffle, spill & salting](/interview-prep/learn/spark-databricks/03-shuffle-spill-salting/). It covers the twelve topics that come up most in senior Spark interviews, each with *what it is*, *how to see it* and *how to decide*.

---

## 1. Reading a query plan

```python
df.explain("formatted")    # also: "simple", "extended" (parsed → analyzed → optimized → physical), "cost", "codegen"
```

Spark turns your code into a **logical plan** → **optimised logical plan** (Catalyst rules: predicate pushdown, column pruning, constant folding, join reordering with CBO) → **physical plan** (concrete operators and join algorithms). Read physical plans **bottom-up**.

```
== Physical Plan ==
AdaptiveSparkPlan isFinalPlan=false
+- HashAggregate(keys=[country], functions=[sum(amount)])
   +- Exchange hashpartitioning(country, 200)                                  ← shuffle #2
      +- HashAggregate(keys=[country], functions=[partial_sum(amount)])
         +- Project [country, amount]
            +- BroadcastHashJoin [customer_id], [id], Inner, BuildRight       ← no shuffle for the join
               :- Filter isnotnull(customer_id)
               :  +- FileScan parquet orders[customer_id, amount, order_date]
               :       PartitionFilters: [order_date >= 2024-05-01]           ← partition pruning ✓
               :       PushedFilters: [IsNotNull(customer_id)]                ← pushed to the reader ✓
               :       ReadSchema: struct<customer_id:bigint,amount:double>   ← column pruning ✓
               +- BroadcastExchange HashedRelationBroadcastMode(...)           ← small side broadcast
                  +- Filter (segment = 'enterprise')
                     +- FileScan parquet customers[id, country, segment]
```

**What to look for:**

| Node / field | Meaning | Worry if… |
|---|---|---|
| `Exchange hashpartitioning(k, n)` | Shuffle by key | More Exchanges than expected (e.g. repeated on the same key) |
| `Exchange rangepartitioning` | Global sort (`orderBy`) | You didn't need a global order |
| `BroadcastHashJoin … BuildRight` | Right side broadcast | The broadcast side is large (driver/executor memory risk) |
| `SortMergeJoin` | Both sides shuffled and sorted | One side is small enough to broadcast |
| `BroadcastNestedLoopJoin` / `CartesianProduct` | Non-equi or missing join condition | Almost always a bug or a range join needing a rewrite |
| `PartitionFilters: []` on a partitioned table | No partition pruning | You filtered on a derived expression (e.g. `year(ts)`) instead of the partition column |
| `PushedFilters` | Filters evaluated by the file reader (row-group skipping) | A filter you expected isn't there (UDFs and casts block pushdown) |
| `*(n)` prefixes | Whole-stage codegen stage n | Missing on hot operators (often caused by Python UDFs) |
| `AdaptiveSparkPlan isFinalPlan=true` (after running) | AQE's final, re-optimised plan | Compare with the initial plan to see what AQE changed |

---

## 2. Jobs, stages, tasks and the DAG

- **Action** (`count`, `write`, `collect`) → one or more **jobs**.
- Each job is split into **stages** at shuffle boundaries (wide dependencies). Within a stage, narrow transformations (`filter`, `select`, `withColumn`) are **pipelined**: one task runs them all on one partition without materialising intermediates.
- Each stage runs **one task per partition**. Tasks are scheduled onto executor cores in **waves**: 2,000 tasks on 200 cores = 10 waves.

**Reading the DAG in the UI:** a stage with a huge input and a short duration is fine; a stage with **many retries**, a long **tail** of slow tasks, or a much larger shuffle write than input is where to dig.

**Lazy evaluation trap:** reusing a DataFrame in two actions recomputes its whole lineage twice unless it's cached or written out. Seeing the same scan twice in the SQL tab is the giveaway.

---

## 3. Executor sizing: the arithmetic

Interviewers often hand you a cluster and ask for executor settings.

> **Cluster:** 10 worker nodes, each 16 cores and 64 GB RAM (YARN or a standalone cluster).

1. **Leave room for the OS and node daemons:** 1 core and about 1 GB per node → 15 cores, 63 GB usable.
2. **Cores per executor:** 4-5 is the sweet spot (enough parallelism per JVM; above about 5, HDFS/S3 client throughput and GC suffer). Choose **5** → 15 / 5 = **3 executors per node**.
3. **Memory per executor:** 63 GB / 3 = 21 GB, minus overhead (max(384 MB, 10%), more for PySpark) → `spark.executor.memory ≈ 18-19g`, `memoryOverhead ≈ 2-3g`.
4. **Executor count:** 10 nodes × 3 = 30, minus 1 for the YARN ApplicationMaster/driver → **29 executors**, 145 cores in total.
5. **Per-task memory:** about 19 GB × 0.6 (unified fraction) / 5 cores ≈ **2.3 GB of execution+storage per concurrent task**. If shuffle partitions are ~200 MB compressed (maybe 1 GB deserialised), that fits without spill.

| Anti-pattern | Why it's bad |
|---|---|
| **Tiny executors** (1 core each) | No sharing of broadcast variables or cache across tasks; per-JVM overhead multiplied; more executors to coordinate |
| **Fat executors** (all 16 cores, 60 GB) | Long GC pauses, poor I/O throughput per core, one failure loses lots of work |
| Ignoring overhead in PySpark | Python workers and Arrow buffers exceed the overhead → containers killed |

**On Databricks** you pick instance types instead of executor flags (one executor per worker node using all its cores). The same reasoning becomes *memory per core*: choose memory-optimised instances for heavy joins/aggregations, compute-optimised for CPU-bound transforms, storage-optimised (local SSD) for heavy disk cache use, and enable autoscaling with sensible bounds. Serverless removes most of this tuning.

**Dynamic allocation** scales executor count with the backlog of pending tasks; it needs shuffle data to survive executor removal (an external shuffle service, or shuffle tracking/decommissioning on Kubernetes).

---

## 4. Shuffle partitions (and AQE coalescing)

- `spark.sql.shuffle.partitions` (default 200) is the partition count after every shuffle unless AQE changes it.
- Target **~128-200 MB of shuffle data per partition**; see the sizing arithmetic in [section 3 of the shuffle module](/interview-prep/learn/spark-databricks/03-shuffle-spill-salting/).
- With AQE, set `spark.sql.adaptive.coalescePartitions.initialPartitionNum` high and `advisoryPartitionSizeInBytes` to your target; AQE merges small partitions after it sees real sizes.
- On Databricks, `spark.sql.shuffle.partitions=auto` enables auto-optimised shuffle.

---

## 5. Data partitioning: in memory and on disk

**In memory:**

| Operation | Shuffle? | Use for |
|---|---|---|
| `repartition(n)` | Yes (round-robin) | Increase parallelism, even out skewed input partitions |
| `repartition(n, "k")` / `repartition("k")` | Yes (hash) | Co-locate keys before several key-based ops; control output files per partition value |
| `repartitionByRange(n, "k")` | Yes (range, sampled) | Sorted, non-overlapping output files (good min/max stats) |
| `coalesce(n)` | No | Reduce partitions cheaply before writing; can create uneven tasks and reduce upstream parallelism |

**Input partitions:** `spark.sql.files.maxPartitionBytes` (128 MB) controls how files are split into read tasks; `spark.sql.files.openCostInBytes` makes Spark pack many small files into one task.

**On disk (`partitionBy` on write):**
- Partition by a **low-cardinality column that queries filter on** (date, region). Aim for partitions of ≥ 1 GB; thousands of tiny partitions create small files and slow metadata listing.
- Don't partition by high-cardinality columns (user_id, order_id).
- The classic small-files explosion: `df.write.partitionBy("date")` where each of 2,000 tasks holds rows for 30 dates → up to 60,000 files. Fix: `df.repartition("date").write.partitionBy("date")` (one task per date; watch for skewed dates) or rely on optimized writes / auto-compaction.
- On Delta/Iceberg, prefer **liquid clustering / clustering keys** for high-cardinality filter columns instead of directory partitioning.

---

## 6. Bucketing

Bucketing pre-shuffles a table on write into a fixed number of buckets by `hash(key) mod B`, and records that in the metastore.

```python
(orders.write.bucketBy(64, "customer_id").sortBy("customer_id")
       .mode("overwrite").saveAsTable("orders_bucketed"))
```

- **Benefit:** joining two tables bucketed on the join key **with the same bucket count** (and enabled bucketing reads) skips the Exchange on both sides; aggregations on the bucket key can skip it too.
- **Costs:** bucket count is fixed at write time; each write task can create up to B files (small-file risk), and it only helps when the join/aggregation key exactly matches.
- **Format support:** bucketing is a Hive/Spark table feature. Delta Lake does not support Spark bucketing; on Delta you rely on liquid clustering (for data skipping) and accept the shuffle, or on broadcast joins and AQE. This is a common interview gotcha.

---

## 7. Caching: when it helps and when it hurts

**Cache when** the same expensive intermediate result is used by **multiple actions**: iterative ML, several aggregations over one filtered dataset, interactive exploration.

**Don't cache when:** it's used once, it's cheap to recompute, it's bigger than cluster memory (it spills, then evicts other data), or the source is already fast (Delta with disk cache).

```python
active = events.filter("event_date >= '2024-05-01' AND country = 'DE'").select("user_id", "event", "ts")
active.cache()
active.count()                           # materialise (cache is lazy)
daily = active.groupBy("event").count()
funnel = active.groupBy("user_id").agg(...)
active.unpersist()                       # free memory when done
```

- **Storage levels:** `MEMORY_AND_DISK` (DataFrame default), `MEMORY_ONLY`, `DISK_ONLY`, serialized variants for RDDs. See [serialization](/interview-prep/learn/spark-databricks/04-serialization/).
- **`cache()` vs `checkpoint()`:** cache keeps lineage (lost partitions are recomputed); checkpoint writes to reliable storage and **truncates lineage**, which is useful for very long iterative lineages.
- **The best cache is often a table:** writing an intermediate Delta table makes it reusable across jobs, inspectable and recoverable.

---

## 8. Broadcast joins

The small side is collected to the driver, then shipped to every executor, which builds an in-memory hash table; the big side streams through **without shuffling**.

- **Automatic** when the estimated size is below `spark.sql.autoBroadcastJoinThreshold` (10 MB default; `-1` disables). AQE can also switch to broadcast at runtime using actual post-filter sizes (`spark.sql.adaptive.autoBroadcastJoinThreshold`).
- **Hints:** `broadcast(df)` or `/*+ BROADCAST(t) */` force it.
- **Limits:** the broadcast relation must fit in driver memory (it's collected there first) and in each executor's memory (hard maximum 8 GB; practical limits are far lower, typically up to a few hundred MB). Broadcasting a 2 GB table to 100 executors moves 200 GB over the network.
- **Join types:** the broadcast side must be the non-preserved side (e.g. the right side of a left outer join). A full outer join can't use a broadcast hash join.
- **Failure mode:** stale or missing statistics make Spark think a huge table is small, causing driver OOM or `broadcast timeout`. Fix by computing stats (`ANALYZE TABLE … COMPUTE STATISTICS`), removing a wrong hint, or raising `spark.sql.broadcastTimeout` only if the size really is fine.

---

## 9. Adaptive Query Execution (AQE)

AQE re-plans the query **between stages**, using real statistics from completed shuffle map stages.

| Feature | What it does | Key settings |
|---|---|---|
| Coalesce shuffle partitions | Merges small adjacent partitions to the advisory size | `advisoryPartitionSizeInBytes`, `coalescePartitions.minPartitionSize` |
| Switch join strategy | Sort-merge → broadcast (or shuffled hash) when a side turns out small | `adaptive.autoBroadcastJoinThreshold`, `maxShuffledHashJoinLocalMapThreshold` |
| Skew join | Splits skewed partitions and replicates the matching side | `skewJoin.skewedPartitionFactor` (5), `skewedPartitionThresholdInBytes` (256 MB) |
| Local shuffle reader | After switching to broadcast, reads shuffle files locally instead of over the network | on by default |
| Optimize skews in rebalance | Splits skewed partitions in `REBALANCE` hints (useful before writes) | `optimizeSkewsInRebalancePartitions.enabled` |

**What AQE can't do:** fix skewed aggregations or windows, split a partition that's skewed *within a single map output*, repair a bad file layout, or undo a UDF that blocks optimisation. It also only acts at shuffle boundaries, so a plan with no Exchange gets no adaptive benefit.

---

## 10. Dynamic Partition Pruning (DPP)

**Problem:** a fact table partitioned by `date_key` is joined to a filtered date dimension. The filter is on the dimension (`d.is_holiday = true`), so static pruning can't know which fact partitions to read and scans **all** of them.

```sql
SELECT f.store_id, SUM(f.amount)
FROM sales f JOIN dim_date d ON f.date_key = d.date_key
WHERE d.is_holiday = true          -- filter is on the dimension, not the fact's partition column
GROUP BY f.store_id
```

**DPP** (on by default, `spark.sql.optimizer.dynamicPartitionPruning.enabled`) runs the dimension side first, collects the qualifying `date_key` values (reusing the broadcast when the join is a broadcast join) and injects them as a **runtime partition filter** on the fact scan. In the plan you see `PartitionFilters: [dynamicpruningexpression(date_key IN dynamicpruning#…)]` on the fact `FileScan`.

**Conditions:** the fact side must be **partitioned on the join key**, the join must be an equi-join, the dimension side must be filterable/selective, and the optimiser must estimate the pruning is worth it. On Delta with clustering instead of partitioning, Databricks applies a similar idea via **dynamic file pruning** using file-level min/max statistics.

---

## 11. Data skipping and layout (often the biggest win)

- **Partition pruning:** skips directories (needs filters on partition columns).
- **Min/max statistics:** Parquet row groups and Delta file stats let readers skip files/row groups whose ranges can't match. They only work when data is **clustered** on the filter column; random order gives every file the full range.
- **Z-order / liquid clustering:** co-locate related values across multiple columns so stats become selective.
- **Compaction:** turn thousands of small files into fewer large ones (`OPTIMIZE`, auto-compaction, optimized writes).

A 30-minute query that becomes 30 seconds usually came from reading 1% of the data, not from tuning executors.

---

## 12. Worked tuning scenarios

<details><summary>Scenario 1: A join of 1 TB orders with a 40 MB customers table takes 25 minutes. The plan shows SortMergeJoin. What do you do?</summary>

The small side is just above the 10 MB auto-broadcast threshold (estimates are often based on file size, and compressed Parquet can deserialize larger). Use a `broadcast(customers)` hint or raise `autoBroadcastJoinThreshold` to ~100 MB, select only the needed columns of `customers` first, and confirm that `BroadcastHashJoin` appears and the Exchange on the orders side disappears. Expected: the orders shuffle (about 1 TB of shuffle write) is eliminated.
</details>

<details><summary>Scenario 2: A daily aggregation shows 200 tasks, each spilling 3 GB, and runs for an hour.</summary>

The shuffle is about 600 GB of data in only 200 partitions (the default), so each task processes ~3 GB and spills. Increase shuffle partitions to ~4,000 (or set AQE's initial partitions high with a 128-256 MB advisory size), and select only the needed columns before the aggregation. Check that partial aggregation is happening (`partial_sum` before the Exchange). Spill should drop to zero and tasks to seconds each.
</details>

<details><summary>Scenario 3: A query filters a 5-year partitioned fact table to last month via a join with a calendar table, but reads all partitions.</summary>

Check the plan for `dynamicpruningexpression` on the fact scan. If it's missing: the fact may not be partitioned on the join key (e.g. partitioned by `event_date` but joined on `date_key`), the filter may be on a non-selective column, or DPP may be disabled. Fix by joining on the partition column, or filter the fact directly on its partition column (`event_date >= add_months(current_date(), -1)`), which gives static pruning.
</details>

<details><summary>Scenario 4: A PySpark job with a Python UDF normalising phone numbers runs 10× slower than the rest of the pipeline.</summary>

Rows are pickled to Python workers one by one, and the UDF blocks codegen and pushdown. Rewrite with built-in functions (`regexp_replace`, `substring`, `when`), or as a pandas UDF using vectorised string methods if the logic is complex. Verify the stage no longer shows `BatchEvalPython`/`ArrowEvalPython` (or that it shows `ArrowEvalPython` for the pandas UDF), and check `memoryOverhead` if using pandas UDFs.
</details>

<details><summary>Scenario 5: The same expensive filtered DataFrame feeds five different aggregations and the job reads the source five times.</summary>

Every action recomputes the lineage. Cache (or better, write to a temporary Delta table) the filtered, column-pruned DataFrame after selecting only the needed columns, materialise it once, run the five aggregations, then unpersist. Or restructure into one pass using `GROUPING SETS`/`ROLLUP` if the aggregations share the source.
</details>

---

## Interview questions

<details><summary>How do you size executors for a 10-node cluster with 16 cores and 64 GB per node?</summary>

Reserve 1 core and about 1 GB per node for the OS/daemons → 15 cores, 63 GB. Use 5 cores per executor → 3 executors per node, 21 GB each; subtract overhead (~10%, more for PySpark) → ~18-19 GB heap. 30 executors minus 1 for the driver/AM = 29 executors, 145 cores. Then check the memory per concurrent task (~19 × 0.6 / 5 ≈ 2.3 GB) against the expected shuffle partition size.
</details>

<details><summary>repartition vs coalesce: when do you use each before writing?</summary>

`coalesce(n)` merges partitions without a shuffle, so it's cheap, but it can produce uneven files and it also reduces the parallelism of the upstream stage (all work collapses into n tasks). `repartition(n)` (or by the partition column) shuffles but produces even partitions and keeps upstream parallelism. Before writing a partitioned table, `repartition("date")` (or optimized writes) controls the files per date.
</details>

<details><summary>Why doesn't bucketing help on Delta tables?</summary>

Delta Lake doesn't support Spark/Hive bucketing metadata, so the bucket layout isn't known to the planner and the shuffle still happens. On Delta, use liquid clustering/Z-order for data skipping, broadcast joins for small sides, and AQE; or keep a Hive-style bucketed Parquet table if eliminating that join shuffle is critical.
</details>

<details><summary>What does AQE change at runtime, and what can't it fix?</summary>

It coalesces small shuffle partitions, switches sort-merge joins to broadcast/shuffled-hash joins when a side is small after filtering, splits skewed join partitions, and uses local shuffle reads after a switch. It can't fix skewed aggregations or windows, bad file layouts, missing data skipping, UDF overhead, or problems in stages with no shuffle boundary.
</details>

<details><summary>Explain dynamic partition pruning and when it doesn't kick in.</summary>

At runtime, Spark evaluates the filtered dimension side of a join, collects the qualifying join-key values and applies them as a partition filter on the partitioned fact table's scan, so only matching partitions are read. It requires the fact table to be partitioned on the join key, an equi-join, a selective filter on the other side and the feature enabled. It does nothing for unpartitioned facts (where Databricks' dynamic file pruning with file stats can help instead).
</details>

<details><summary>When is caching a bad idea?</summary>

When the data is used once, is cheap to recompute, or is larger than available memory (it spills and evicts other useful blocks); when the source is already fast (Delta with disk cache); or when you forget to unpersist in long-running sessions. Caching also hides lineage-based recovery costs: if executors die, cached partitions are recomputed anyway.
</details>
