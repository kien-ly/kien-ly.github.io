---
title: "Partitioning, Dynamic Partition Pruning and Caching Decisions"
description: "Design a table layout for a 5-year event table, make a star-schema query prune partitions dynamically, and decide between cache, checkpoint and an intermediate table for a multi-output job."
url: "/interview-prep/practice/spark/partitioning-dpp-caching/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 9
---

# Partitioning, Dynamic Partition Pruning and Caching Decisions

**Difficulty:** Hard · **Topics:** table layout, DPP, caching, clustering · **Asked at:** Databricks, Netflix, Airbnb, Walmart

## Scenario

You own `events` (180 TB, 5 years, ~400 GB/day, columns include `event_ts`, `event_date`, `user_id`, `country`, `event_type`, `payload`). Common queries:
- Q1: last 7 days, filtered by `country` and `event_type`.
- Q2: one user's full history (support tooling), by `user_id`.
- Q3: a star join with `dim_date` filtered on `dim_date.fiscal_quarter = '2024-Q2'`, joined on `date_key`.

A daily job also builds **five** different aggregate tables from the same filtered slice of yesterday's events.

## Your task

1. Propose the physical layout for `events` (partitioning and clustering), with numbers.
2. Q3 scans all 5 years. Explain why, and fix it.
3. For the daily five-output job, choose between `cache()`, `checkpoint()` and an intermediate table, with reasons.

## Hints

<details><summary>Hint 1</summary>

400 GB/day is a healthy partition size; what would partitioning by `user_id` or `country` do to file counts?

</details>

<details><summary>Hint 2</summary>

Dynamic partition pruning needs the fact table to be partitioned on the **join key**. Is `date_key` the partition column?

</details>

## Solution

**1. Layout.**
- **Partition by `event_date`** (≈ 1,800 partitions of ~400 GB each). Every query is time-bounded, so partition pruning removes most data, and daily partitions make backfills and retention (`DELETE` or dropping old dates) cheap.
- **Don't partition by `country`, `event_type` or `user_id`:** country × event_type × date would create tens of thousands of tiny partitions, and `user_id` would create billions of directories.
- **Cluster within partitions** for the other filters. On Delta, use liquid clustering on `(country, event_type, user_id)` (or Z-order the same columns), so file-level min/max stats let readers skip files for Q1 and Q2. Target files of ~256 MB-1 GB.
- **Q2 (user history)** across 5 years still touches every date partition, but clustering on `user_id` means only one or a few files per date match, so data skipping reads a tiny fraction. If support needs millisecond lookups, serve Q2 from an operational store (e.g. a key-value table keyed by `user_id`) fed by the pipeline; a lakehouse table isn't a point-lookup database.

**2. Q3 scans everything.** The query filters on `dim_date.fiscal_quarter` and joins on `date_key`, but `events` is partitioned by `event_date`. Dynamic partition pruning only applies when the fact table is **partitioned on the join key**, so Spark can't turn the dimension filter into a partition filter and reads all 1,800 partitions.

Fixes (any one):
- Join on the partition column: make `dim_date` expose `event_date` (the calendar date) and join `events.event_date = dim_date.calendar_date`. DPP now injects `dynamicpruningexpression(event_date IN …)` into the fact scan. Verify in `explain()`.
- Or add the derived static filter explicitly: compute the quarter's date range first and filter `events.event_date BETWEEN '2024-04-01' AND '2024-06-30'`.
- On Databricks, dynamic file pruning can also skip files using stats on the join key if the table is clustered on it, but partition-level pruning is the cleaner fix.

**3. The five-output job.**

| Option | Pros | Cons |
|---|---|---|
| `cache()` / `persist(MEMORY_AND_DISK)` | Simple; fast reuse within one Spark application | Lost if executors die (recomputed); memory pressure; invisible outside the job |
| `checkpoint()` | Truncates lineage; reliable storage | Writes to a checkpoint dir that nobody can query; you still manage cleanup |
| **Intermediate Delta table** (e.g. `stg_events_daily`, partitioned by date) | Computed once, reusable by the five jobs **and** others; restartable (if output 4 fails, rerun only 4 and 5); queryable for debugging; data-quality checks can gate it | Extra storage and a write (cheap relative to recomputing a 400 GB filter five times) |

Choose the **intermediate table** for a production daily job: it gives restartability, observability and reuse, and lets the five aggregates run as separate tasks (even in parallel) in the orchestrator. Use `cache()` for ad-hoc analysis or when all five outputs are computed in one short-lived session and the slice comfortably fits in memory. Either way, select only the needed columns before persisting.

## What interviewers look for

- Partition sizing with numbers (GB per partition, count of partitions, file sizes) and the anti-patterns (high-cardinality partition columns).
- Understanding that clustering/Z-order and statistics complement partitioning.
- Precise DPP preconditions, and verifying with the plan.
- Production thinking for intermediate results: restartability, observability and cost, not just speed.
