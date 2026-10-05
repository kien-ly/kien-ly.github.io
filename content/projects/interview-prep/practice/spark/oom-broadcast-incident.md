---
title: "Debug a Nightly Job: Driver OOM, Broadcast Timeouts and a Stale Cache"
description: "An incident scenario combining the classic Spark failure modes: a broadcast chosen from stale statistics, a driver OOM, executors killed for exceeding memory, and a cached DataFrame serving stale data. Diagnose each from the evidence and fix the root causes."
url: "/interview-prep/practice/spark/oom-broadcast-incident/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 11
---

# Debug a Nightly Job: Driver OOM, Broadcast Timeouts and a Stale Cache

**Difficulty:** Hard · **Topics:** OOM, broadcast joins, caching, memory · **Time:** 40 minutes

## Scenario

A nightly PySpark job builds `gold.customer_daily` by joining `events` (3 TB/day) with `customers` (dimension, ~400M rows, 60 GB in Parquet) and enriching with a scoring step. It ran fine for a year. After last week's customer migration (an extra 300M rows), three things started happening on different nights:

1. The job fails within 10 minutes with `java.lang.OutOfMemoryError: Java heap space` in the **driver** log, or with `Could not execute broadcast in 300 secs`.
2. On nights it gets past the join, stage 7 (the scoring step, a pandas UDF) fails with `Container killed by YARN for exceeding memory limits. 21.3 GB of 21 GB physical memory used` on several executors, then `FetchFailedException` loops.
3. An analyst reports that a notebook dashboard built on the same tables shows **yesterday's** totals even after the job succeeds.

## Evidence

```python
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", 2 * 1024**3)   # set by someone "to speed up joins"
customers = spark.table("silver.customers").filter("is_active")
joined = events.join(customers, "customer_id")
scored = joined.groupBy("customer_id").applyInPandas(score_fn, schema)   # stage 7
```

- `DESCRIBE TABLE EXTENDED silver.customers` shows statistics last computed **8 months ago**: `sizeInBytes = 1.4 GB`.
- Executors: 18 GB heap, 5 cores, default overhead (10%). Stage 7 task metrics: median input 300 MB, max 9 GB; GC time 35% on the slowest tasks.
- The analyst's notebook (a long-lived cluster session) contains `daily = spark.table("gold.customer_daily"); daily.cache(); daily.count()`, run on Monday.

## Your task

Explain the root cause of each symptom, fix each one properly (not just "add memory"), and say what you'd put in place so it doesn't recur.

## Hints

<details><summary>Hint 1</summary>

Where is a broadcast relation built before it's shipped? What size does the planner think `customers` is, and what size is it really, especially once deserialized into a hash table?

</details>

<details><summary>Hint 2</summary>

Where does pandas UDF memory live, and what does max 9 GB vs median 300 MB tell you about `groupBy(customer_id)`?

</details>

## Solution

**1. Driver OOM / broadcast timeout: a broadcast from stale statistics.**
- The threshold was raised to 2 GB, and the stale statistics say `customers` is 1.4 GB, so the planner chooses a **broadcast hash join**.
- In reality the active customers are now ~40 GB on disk and many times larger as an in-memory hash relation.
- The relation is **collected to the driver** first (driver heap OOM), or takes longer than `broadcastTimeout` to build and ship.

*Fix:*
- Restore a sane threshold (default 10 MB, or up to ~100-200 MB only for known small dimensions).
- Recompute statistics (`ANALYZE TABLE silver.customers COMPUTE STATISTICS FOR COLUMNS customer_id, is_active`) and make it part of the load job, or rely on table-format stats.
- Let the join fall back to sort-merge, with **AQE** enabled so it can still convert to broadcast if a filtered side turns out small at runtime.
- If only a subset of customers is needed per day, semi-join or filter first; a runtime Bloom filter can reduce the shuffle of `events`.

**2. Containers killed in stage 7: skew plus Python memory in overhead.**
- `applyInPandas` loads **an entire group into one pandas DataFrame** in a Python worker. A 9 GB max vs 300 MB median means a few customers (likely migration artefacts, e.g. a default customer_id, or bot accounts) have huge groups.
- Python workers live **outside the JVM heap**, so with 5 cores up to 5 workers share a ~1.8 GB overhead. The container limit is exceeded and YARN kills it.
- Killed executors lose shuffle output, causing the `FetchFailedException` loops.

*Fix:*
- Investigate the hot keys. If they're junk (a default ID introduced by the migration), filter or fix them upstream.
- For legitimate large groups, pre-aggregate in Spark before the pandas step, or split the scoring into a native Spark aggregation plus a pandas UDF over smaller inputs.
- Give Python explicit memory: `spark.executor.pyspark.memory=4g` (or raise `memoryOverhead`), fewer cores per executor (e.g. 3), and a reasonable Arrow batch size.
- Watch GC (35% suggests heap pressure from the skewed tasks too).

**3. Stale dashboard: the cache is a snapshot.**
- The notebook cached `gold.customer_daily` on Monday in a long-lived session. The nightly job (a different application) commits new versions, but the cached DataFrame keeps serving Monday's snapshot.

*Fix:*
- Don't use long-lived caches of tables that change. Refresh (`spark.catalog.refreshTable` / `uncacheTable`, then re-cache) after each load, or remove the cache and rely on the Databricks disk cache or a SQL warehouse, which read the latest table version.
- If the dashboard needs a stable snapshot, read an explicit version (`VERSION AS OF`) and display it.

**Prevent recurrence:**
- Configuration review: forbid global broadcast thresholds in job code (cluster policy or code review); hints only for documented small dimensions.
- Statistics maintained automatically (predictive optimisation on Databricks managed tables, or ANALYZE in the job).
- Data quality monitors on key distribution: alert when the top customer_id's share of events jumps (it would have caught the migration artefact).
- Job SLOs with alerts on stage duration and executor loss; dashboards from executor memory metrics (heap, off-heap, Python).
- A post-incident note documenting the root causes.

## What interviewers look for

- Knowing that broadcast relations are built **on the driver** and sized from **estimates**, and treating stale statistics and a careless threshold as the root cause.
- Recognising `applyInPandas` per-group memory, **overhead vs heap**, and skew from max/median metrics.
- Explaining `FetchFailedException` as a consequence of lost executors, not a separate bug.
- Understanding cache semantics (a snapshot per application) and stale reads.
- Prevention: guardrails, statistics, monitoring, not one-off fixes.
