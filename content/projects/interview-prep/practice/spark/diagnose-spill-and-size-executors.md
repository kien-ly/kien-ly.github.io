---
title: "Diagnose Spill From Spark UI Metrics and Size the Executors"
description: "Interpret a stage's task metrics (spill, GC, shuffle read distribution), separate partition sizing from skew from executor shape, and produce a justified executor and shuffle configuration."
url: "/interview-prep/practice/spark/diagnose-spill-and-size-executors/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 7
---

# Diagnose Spill From Spark UI Metrics and Size the Executors

**Difficulty:** Hard · **Topics:** spill, executor sizing, shuffle partitions, memory model · **Asked at:** Databricks, Amazon, LinkedIn, Pinterest

## Scenario

A nightly PySpark aggregation over 1.2 TB of Parquet (8 columns read out of 60) runs for 2 hours 40 minutes on a YARN cluster of **12 nodes, each 32 cores and 128 GB RAM**. Current settings:

```
spark.executor.instances=12
spark.executor.cores=31
spark.executor.memory=110g
spark.sql.shuffle.partitions=200
spark.sql.adaptive.enabled=true
```

The job reads the data, applies a pandas UDF that parses a JSON column, then does `groupBy(account_id, day).agg(...)` with 6 aggregates.

## Evidence

Spark UI, the aggregation stage (200 tasks):

| Metric | Min | Median | 75th pct | Max |
|---|---|---|---|---|
| Duration | 38 min | 41 min | 43 min | 52 min |
| Shuffle Read Size | 2.9 GB | 3.1 GB | 3.2 GB | 3.6 GB |
| Spill (Memory) | 19 GB | 21 GB | 22 GB | 25 GB |
| Spill (Disk) | 3.1 GB | 3.4 GB | 3.5 GB | 4.0 GB |
| GC Time | 9 min | 11 min | 12 min | 15 min |

Also observed: several executors were lost with `Container killed by YARN for exceeding memory limits. 118.4 GB of 115.5 GB physical memory used`, and the whole stage retried once.

## Your task

1. Is this skew, under-partitioning or an executor-shape problem? Justify from the numbers.
2. Explain the executor losses.
3. Propose a new configuration with the arithmetic, and other changes to the job.
4. Say what you'd check in the UI after the change.

## Hints

<details><summary>Hint 1</summary>

Compare max vs median shuffle read. What does an even distribution with large values tell you?

</details>

<details><summary>Hint 2</summary>

Where do pandas UDF workers allocate memory: on the JVM heap or outside it? How many run concurrently in one 31-core executor?

</details>

## Solution

**1. Diagnosis: under-partitioning plus a bad executor shape, not skew.**
- Max shuffle read (3.6 GB) is only ~1.2× the median (3.1 GB), so the data is **evenly distributed** and there's no skew.
- Every task reads ~3 GB of compressed shuffle data, which deserialises to ~21 GB (Spill Memory). With 31 concurrent tasks sharing roughly 110 GB × 0.6 ≈ 66 GB of unified memory, each task gets about **2 GB** for a 21 GB working set → **every task spills**.
- GC time is ~25% of task time: giant heaps with many concurrent tasks churning objects, another sign of fat executors.
- Shuffle size ≈ 200 × 3.1 GB ≈ **620 GB**. With 200 partitions the work also runs as one wave on 372 cores, leaving 172 cores idle.

**2. Executor losses.** YARN counts the **whole container**: heap (110 GB) + overhead. Pandas UDFs run in **Python worker processes outside the JVM heap**, one per concurrent task (up to 31 per executor), each holding Arrow batches and pandas DataFrames. The default overhead (10% ≈ 11 GB) can't hold 31 Python workers, so the container exceeds its limit and is killed. Losing an executor also loses its shuffle output, so the stage retries.

**3. New configuration.**

*Executors (per node: 32 cores, 128 GB):*
- Reserve 1 core + ~8 GB for OS/NodeManager → **31 cores, ~120 GB usable**.
- 5 cores per executor → **6 executors per node** (30 cores used).
- 120 GB / 6 = 20 GB per executor container. PySpark with pandas UDFs needs generous overhead: `executor.memory=14g`, `memoryOverhead=6g` (or `spark.executor.pyspark.memory=4g` + 2g overhead).
- 12 nodes × 6 = 72 executors, minus 1 for the AM → **71 executors × 5 cores = 355 cores**.

*Shuffle partitions:*
- 620 GB / ~150 MB target ≈ **4,000 partitions** (about 11 waves on 355 cores, fine). With AQE: `initialPartitionNum=4000`, `advisoryPartitionSizeInBytes=128m`, so AQE coalesces if the actual size is smaller.
- Per-task memory: 14 GB × 0.6 / 5 ≈ **1.7 GB**, against ~150 MB compressed (~1 GB deserialised) per partition, so it fits without spill.

```
spark.executor.instances=71
spark.executor.cores=5
spark.executor.memory=14g
spark.executor.memoryOverhead=6g
spark.sql.shuffle.partitions=4000
spark.sql.adaptive.coalescePartitions.initialPartitionNum=4000
spark.sql.adaptive.advisoryPartitionSizeInBytes=128m
spark.sql.execution.arrow.maxRecordsPerBatch=5000       # smaller Arrow batches → less Python memory
```

*Job changes:*
- **Replace the pandas UDF** with `from_json` + a schema (native, JVM-only) if the JSON structure is known: this removes Python memory pressure entirely and allows codegen.
- **Project early:** select only the needed fields from the parsed JSON before the `groupBy`, which shrinks the shuffle.
- Check partial aggregation (`partial_*` before the Exchange) is present; if any aggregate is `collect_list`, reconsider it.

**4. Verify after the change:** spill ≈ 0, GC time < 10% of task time, task durations of seconds to a couple of minutes, max/median ratios still ~1-2×, no executor loss, and the stage's total shuffle read unchanged (or lower after projection). Expected runtime: roughly 10-20 minutes.

## What interviewers look for

- Using **max vs median** to rule skew in or out before proposing salting.
- Converting compressed shuffle size into deserialised memory and comparing it with **per-task** memory (not per executor).
- Knowing that PySpark/pandas UDF memory lives in **overhead**, and that YARN kills containers on total memory.
- Executor sizing arithmetic with reserved resources, 4-5 cores per executor, overhead and the AM.
- Fixing the cause (native `from_json`, column pruning) as well as tuning knobs, and saying how you'd verify.
