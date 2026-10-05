---
title: "Spark Caching and Persistence: The Complete Guide"
description: "How caching works inside Spark (lazy materialisation, the BlockManager, LRU eviction), every storage level, the in-memory columnar format, cache vs checkpoint vs temp view, how much to cache, the Storage tab, proven patterns, pitfalls such as stale caches with Delta and Iceberg, and the configuration that matters."
url: "/interview-prep/learn/spark-databricks/08-caching-and-persistence/"
hiddenInHomeList: true
showToc: true
weight: 8
---

# Spark Caching and Persistence

`cache()` is the most over-used and under-understood call in Spark. Used well, it turns a 20-minute iterative job into 2 minutes; used badly, it evicts useful data, adds GC pressure, hides stale results and slows everything down. This module explains what really happens, and when (not) to cache.

---

## 1. How caching works internally

### Nothing happens on `.cache()`
`df.cache()` (= `persist(MEMORY_AND_DISK)` for DataFrames) only **marks** the plan as cacheable and registers it with the cache manager. Data is materialised by the **first action** that computes it, and only for the partitions that action computes: `df.cache().show()` caches just the partitions needed to show 20 rows.

```python
df = spark.read.table("events").filter("country = 'DE'").select("user_id", "event", "ts")
df.cache()
df.count()        # full materialisation: every partition computed and stored
```

### Where cached data lives: the BlockManager
Each executor's **BlockManager** stores cached partitions as blocks (`rdd_<id>_<partition>`) in **storage memory** (part of the unified pool; see [memory](/interview-prep/learn/spark-databricks/06-memory-and-oom/)) and/or on local disk. The driver's BlockManagerMaster tracks which executor holds which block, so later tasks are scheduled where the data is (`PROCESS_LOCAL` locality).

### Eviction
When storage memory is full, blocks are evicted in **LRU** order, and execution can also evict cached blocks to get memory. Evicted `MEMORY_ONLY` blocks are **recomputed** from lineage when needed; `MEMORY_AND_DISK` blocks are written to local disk first. A cache that silently thrashes (evict, recompute, evict) can make a job slower than no cache at all.

### Losing executors
Cached blocks live on executors. If an executor dies (or is removed by dynamic allocation), its blocks are gone and get recomputed. Replicated levels (`_2`) keep a second copy at double the memory cost.

---

## 2. Storage levels

| Level | In memory | Spills to disk | Format | Use when |
|---|---|---|---|---|
| `MEMORY_ONLY` | ✓ | ✗ (recompute on eviction) | Deserialized (RDD) / columnar (DataFrame) | Fits comfortably; recompute is cheap |
| `MEMORY_AND_DISK` (DataFrame default) | ✓ | ✓ | as above | Default choice |
| `MEMORY_ONLY_SER` / `MEMORY_AND_DISK_SER` | ✓ serialized | ✗ / ✓ | Serialized bytes (RDD) | RDD caches where memory is tight: 2-5× smaller, more CPU |
| `DISK_ONLY` | ✗ | ✓ | Serialized | Expensive to recompute, too big for memory, read a few times |
| `OFF_HEAP` | off-heap | ✗ | Serialized | Reduce GC with large caches (needs off-heap memory configured) |
| `*_2` variants | replicated on two executors | | | Faster recovery on executor loss (rarely worth 2× memory) |

For **DataFrames**, Spark caches in a compressed **in-memory columnar format** regardless of the "deserialized" wording, so the serialized/deserialized distinction mainly matters for RDDs.

---

## 3. All the ways to cache

```python
df.cache()                                   # lazy, MEMORY_AND_DISK
df.persist(StorageLevel.DISK_ONLY)           # lazy, chosen level
spark.catalog.cacheTable("sales.dim_store")  # lazy, by table name
df.unpersist()  /  spark.catalog.uncacheTable("sales.dim_store")  /  spark.catalog.clearCache()
```
```sql
CACHE TABLE dim_store;                       -- EAGER by default: materialises now
CACHE LAZY TABLE dim_store;
CACHE TABLE de_events AS SELECT * FROM events WHERE country = 'DE';   -- cache a query result
UNCACHE TABLE dim_store;
```

**Eager vs lazy:** eager (`CACHE TABLE`, or `cache()` followed by `count()`) pays the cost up front, so timings are predictable and the first downstream query isn't mysteriously slow. Lazy only caches what's actually used.

> `createOrReplaceTempView()` is **not** caching: it just names a plan. Every query on the view recomputes it unless the underlying DataFrame is cached.

---

## 4. The in-memory columnar format

DataFrame caches are stored column by column in batches (`spark.sql.inMemoryColumnarStorage.batchSize`, 10,000 rows) with **per-column compression** chosen automatically (dictionary, run-length, delta, etc., with `spark.sql.inMemoryColumnarStorage.compressed=true`). Consequences:
- **Column pruning on cached data:** a query selecting 3 of 50 cached columns reads only those columns.
- **Batch-level pruning:** min/max statistics per batch let filters skip batches (`spark.sql.inMemoryColumnarStorage.partitionPruning`).
- In the plan you'll see `InMemoryRelation` / `InMemoryTableScan` instead of the file scan.
- Cached DataFrames are typically far smaller than an RDD of objects with the same data.

---

## 5. Caching can change join strategies

A cached DataFrame's size statistics come from the **actual cached size**, which is often much smaller (and more accurate) than the estimate for a filtered file scan. That can turn a sort-merge join into a broadcast join:

```python
small = spark.table("dim_customer").filter("segment = 'enterprise'").select("customer_id", "region")
small.cache().count()          # actual in-memory size now known (e.g. 4 MB)
fact.join(small, "customer_id").explain()   # BroadcastHashJoin: estimate now below the threshold
```

AQE achieves similar results at runtime from shuffle sizes, but caching makes the decision visible at planning time and reusable across queries. The flip side: a large cached DataFrame can also *lose* a broadcast that a hint previously forced, if you hinted the source rather than the cached plan. Always re-check `explain()` after introducing a cache.

---

## 6. How much to cache?

- **Cache the hot, reused working set,** not raw tables. Typical good candidates: a filtered and projected slice (tens of GB, not TBs), small dimension tables used in many joins, intermediate results reused by several aggregations, and training data iterated by ML algorithms.
- **Rule of thumb:** keep the total cached data comfortably below the cluster's **storage memory** (e.g. ≤ 50-60% of total unified memory), so execution still has room. Beyond that you'll spill to disk or thrash, and local disk reads may not beat reading well-laid-out Parquet/Delta from object storage (especially with Databricks' disk cache).
- **Don't cache TB-scale tables:** fix the layout instead (partition pruning, clustering, data skipping) or write an intermediate table.
- **Coalesce after a selective filter before caching:** 2,000 mostly empty partitions waste overhead.

---

## 7. Reading the Storage tab

For each cached dataset: storage level, **number of cached partitions vs total ("Fraction Cached")**, size in memory and on disk, and which executors hold it.
- **Fraction cached < 100%:** not fully materialised (lazy) or partitions evicted.
- **Large "Size on Disk" for a MEMORY_AND_DISK cache:** memory pressure, so you're paying for disk caching.
- **Many forgotten entries:** someone never unpersisted (common in notebooks).

`spark.catalog.isCached("table")` and `df.storageLevel` check cache status programmatically.

---

## 8. Patterns that work

1. **Iterative algorithms:** ML training loops, graph algorithms or iterative refinement reading the same data many times. Cache the prepared feature DataFrame (often a 5-20× speedup).
2. **One source, many outputs:** a filtered slice feeding several aggregations in the same job. Cache it once (or better, write an intermediate table for production jobs).
3. **Small dimensions in a star schema:** cache (or broadcast) dimensions joined repeatedly in interactive sessions.
4. **Hot recent data:** in an interactive/BI-like Spark session, cache the last 7 days that every query touches.
5. **Cache + repartition by key:** repartition by the join key and cache, then several downstream joins/aggregations on that key reuse the partitioning without new shuffles within the session.
6. **Interactive exploration:** cache after the expensive parse/clean step so iterations are fast; unpersist at the end.

---

## 9. Pitfalls

- **Memory pressure and GC:** big caches shrink execution memory (more spill) and add old-generation objects (longer GC).
- **Over-caching:** caching DataFrames used once costs a full extra materialisation for no benefit.
- **Stale caches:** a cache is a snapshot. If the underlying Delta/Iceberg table changes (a new commit or snapshot), the cached DataFrame keeps returning old data until refreshed (`REFRESH TABLE`, `uncacheTable` + re-cache). Spark invalidates caches for writes it performs itself through the same session, but not for writes by other jobs. That's a classic source of "the dashboard shows yesterday's numbers".
- **Lost source pushdown:** filters applied *after* caching run on the cached data, not at the source, so cache *after* filtering and projecting.
- **Cache lost on restart:** caches don't survive application restarts; don't rely on them for correctness or recovery.
- **Partial caching:** lazy caching plus `show()`/`limit` caches only some partitions, confusing timing measurements.
- **Broadcast hints and stats change** after caching (section 5).

---

## 10. Cache vs checkpoint vs intermediate table vs temp view

| | Keeps lineage? | Survives executor loss? | Survives app restart? | Reusable by other jobs? | Use for |
|---|---|---|---|---|---|
| `cache()` / `persist()` | Yes (recompute on loss) | Recomputed | No | No | Reuse within one application |
| `checkpoint()` (reliable) | **Truncates** lineage | Yes (reliable storage) | Files remain, but the app must reload them | Not easily | Very long lineages (iterative algorithms), stabilising complex plans |
| `localCheckpoint()` | Truncates | No (executor storage) | No | No | Cheaper lineage truncation when failure recovery isn't critical |
| Intermediate Delta/Iceberg table | Starts a new lineage | Yes | Yes | **Yes** | Production pipelines: restartability, debugging, sharing |
| Temp view | — | — | No | No | Naming a plan for SQL; not a cache |

---

## 11. Caching with Delta and Iceberg

- **Databricks disk cache** (formerly Delta cache) automatically keeps local SSD copies of remote Parquet/Delta files in a fast format, is consistent with table changes (it caches immutable files), and needs no code. For repeated reads of tables it usually beats `df.cache()`, and it doesn't consume executor storage memory.
- **Iceberg catalog caching** (`cache-enabled` on the catalog) caches **table metadata** (which snapshot is current) for a session, separate from data caching. A long-lived session may not see new snapshots until the cache expires (`cache.expiration-interval-ms`) or tables are refreshed.
- **Time travel + caching:** caching `VERSION AS OF` / snapshot reads is safe (immutable); caching "latest" is a snapshot that goes stale.
- **During maintenance** (compaction, expiring snapshots), avoid long-lived caches of the affected tables, or refresh after the maintenance completes.

---

## 12. Configuration reference

| Setting | Default | Notes |
|---|---|---|
| `spark.memory.fraction` | 0.6 | Unified execution + storage share |
| `spark.memory.storageFraction` | 0.5 | Storage share protected from eviction |
| `spark.sql.inMemoryColumnarStorage.compressed` | true | Per-column compression for DataFrame caches |
| `spark.sql.inMemoryColumnarStorage.batchSize` | 10000 | Rows per columnar batch |
| `spark.serializer` | Java | Kryo helps serialized RDD caches |
| `spark.dynamicAllocation.cachedExecutorIdleTimeout` | infinity | Executors holding cached data aren't released by dynamic allocation (unless set) |
| `spark.sql.autoBroadcastJoinThreshold` | 10 MB | Interacts with cached sizes (section 5) |

---

## Interview questions

<details><summary>What happens when you call df.cache()?</summary>

Nothing is computed. The plan is registered with the cache manager at the default storage level (MEMORY_AND_DISK for DataFrames). The first action that computes partitions stores them as blocks in executors' storage memory (in a compressed columnar format) or on disk, tracked by the BlockManager. Only computed partitions are cached, so an action that touches every partition (like `count()`) materialises it fully.
</details>

<details><summary>When does caching make a job slower?</summary>

When the data is used once (an extra materialisation for nothing); when it doesn't fit and thrashes (evict, recompute or spill); when it steals execution memory and causes spill and GC in the actual work; or when it replaces efficient source reads (pushdown, data skipping, disk cache) with scans of a big cache. Also when people forget to unpersist in long sessions.
</details>

<details><summary>cache vs checkpoint vs writing a table: when do you use each?</summary>

Cache for reuse within one application when recomputation is expensive and the data fits. Checkpoint to truncate a very long lineage (iterative algorithms), so failures don't trigger huge recomputations and plans stay manageable. Write an intermediate Delta/Iceberg table in production pipelines for restartability, observability, reuse across jobs and debugging.
</details>

<details><summary>How can caching change a join strategy?</summary>

After caching, Spark uses the actual in-memory size of the cached data as its statistic. If a filtered dimension is much smaller than its estimated scan size, the join can switch from sort-merge to broadcast. Conversely, hints written against the original plan may no longer apply. Always check the plan after caching.
</details>

<details><summary>Why might a cached DataFrame return stale data?</summary>

A cache is a snapshot of the data when it was materialised. If another job commits new data to the underlying Delta or Iceberg table, the cache isn't invalidated automatically, so queries keep reading the old snapshot until you refresh or uncache and recache. Writes made through the same Spark session to that table do invalidate dependent caches.
</details>
