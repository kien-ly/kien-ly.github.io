---
title: "Read the Physical Plan and Fix the Query"
description: "Given a slow query's formatted plan, find the four problems hiding in it (no partition pruning, a missed broadcast, a Python UDF blocking pushdown, a redundant shuffle) and rewrite it."
url: "/interview-prep/practice/spark/read-the-plan/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 6
---

# Read the Physical Plan and Fix the Query

**Difficulty:** Medium · **Topics:** explain plans, partition pruning, broadcast joins, UDFs · **Asked at:** Databricks, Apple, Netflix, Uber

## Scenario

An analyst's daily report takes 35 minutes. Tables:
- `sales`: 4 TB Parquet, **partitioned by `sale_date`** (date type), 3 years of history.
- `stores`: 25 MB, 8,000 rows.

```python
from pyspark.sql import functions as F, types as T

@F.udf(T.StringType())
def region_of(country):
    return {"DE": "EMEA", "FR": "EMEA", "US": "AMER"}.get(country, "OTHER")

report = (sales
    .withColumn("day", F.to_date(F.col("sale_ts")))                 # sale_ts is a timestamp column
    .filter(F.col("day") >= "2024-05-01")
    .join(stores, "store_id")
    .withColumn("region", region_of("country"))
    .filter(F.col("region") == "EMEA")
    .repartition(400)
    .groupBy("region", "store_id").agg(F.sum("amount").alias("revenue")))
```

## Evidence

```
== Physical Plan ==
AdaptiveSparkPlan isFinalPlan=false
+- HashAggregate(keys=[region, store_id], functions=[sum(amount)])
   +- Exchange hashpartitioning(region, store_id, 200)
      +- HashAggregate(keys=[region, store_id], functions=[partial_sum(amount)])
         +- Exchange RoundRobinPartitioning(400)
            +- Filter (pythonUDF0 = EMEA)
               +- BatchEvalPython [region_of(country)], [pythonUDF0]
                  +- SortMergeJoin [store_id], [store_id], Inner
                     :- Sort [store_id ASC]
                     :  +- Exchange hashpartitioning(store_id, 200)
                     :     +- Filter (to_date(sale_ts) >= 2024-05-01)
                     :        +- FileScan parquet sales[store_id, amount, sale_ts, sale_date]
                     :             PartitionFilters: []
                     :             PushedFilters: []
                     +- Sort [store_id ASC]
                        +- Exchange hashpartitioning(store_id, 200)
                           +- FileScan parquet stores[store_id, country]
```

## Your task

1. List every problem you can see in the plan, citing the node or field that reveals it.
2. Explain the cost of each.
3. Rewrite the query.

## Hints

<details><summary>Hint 1</summary>

Look at `PartitionFilters` on the `sales` scan. What is the table partitioned by, and what does the query filter on?

</details>

<details><summary>Hint 2</summary>

How big is `stores`, and which join algorithm was chosen? How many Exchange nodes are there, and are they all necessary?

</details>

## Solution

**Problems found:**

| # | Evidence in the plan | Problem | Cost |
|---|---|---|---|
| 1 | `PartitionFilters: []`, filter on `to_date(sale_ts)` | The filter is on a derived expression of a non-partition column, so Spark can't prune `sale_date` partitions and reads **all 3 years (4 TB)** | Reads ~35× more data than needed for one month |
| 2 | `SortMergeJoin` with `Exchange` on both sides | `stores` (25 MB) is above the 10 MB auto-broadcast threshold, so 4 TB of `sales` is shuffled and sorted | A multi-TB shuffle and sort |
| 3 | `BatchEvalPython` + `Filter (pythonUDF0 = EMEA)` above the join | The Python UDF is opaque: rows are pickled to Python workers, and the region filter can't be pushed below the join or into the `stores` scan | Every joined row crosses into Python; no pruning of stores |
| 4 | `Exchange RoundRobinPartitioning(400)` right before an aggregation that shuffles again | `repartition(400)` adds a full extra shuffle that the next `groupBy` immediately undoes | A pointless shuffle of all joined rows |

**Rewrite:**

```python
region = (F.when(F.col("country").isin("DE", "FR"), "EMEA")
           .when(F.col("country") == "US", "AMER")
           .otherwise("OTHER"))

emea_stores = (stores
    .withColumn("region", region)
    .filter(F.col("region") == "EMEA")              # filter the small side first
    .select("store_id", "region"))

report = (sales
    .filter(F.col("sale_date") >= "2024-05-01")     # partition column → pruning
    .select("store_id", "amount")                   # column pruning
    .join(F.broadcast(emea_stores), "store_id")     # broadcast: no shuffle of sales
    .groupBy("region", "store_id")
    .agg(F.sum("amount").alias("revenue")))
```

**Expected plan after the fix:**

```
HashAggregate(keys=[region, store_id], functions=[sum(amount)])
+- Exchange hashpartitioning(region, store_id, …)          ← the only shuffle (small: partial aggregates)
   +- HashAggregate(... partial_sum(amount))
      +- BroadcastHashJoin [store_id], [store_id], Inner, BuildRight
         :- FileScan parquet sales[store_id, amount, sale_date]
         :     PartitionFilters: [isnotnull(sale_date), (sale_date >= 2024-05-01)]   ✓
         +- BroadcastExchange
            +- Filter (CASE WHEN country IN (DE,FR) THEN EMEA ... = EMEA)            ✓ native, pushed to stores
               +- FileScan parquet stores[store_id, country]
```

**Result:** about 110 GB scanned instead of 4 TB, no shuffle of the fact table, no Python serialization, and one small shuffle of partial aggregates. Typical runtime drops from 35 minutes to 1-2 minutes.

**If filtering by `sale_ts` really were required** (e.g. a time-of-day window), add a redundant partition-column filter as well: `filter((sale_date >= '2024-05-01') & (sale_ts >= '2024-05-01 06:00'))`. The first enables pruning, the second keeps exact semantics.

## What interviewers look for

- Reading the plan **bottom-up** and tying each symptom to a node or field (`PartitionFilters`, `PushedFilters`, `BatchEvalPython`, `Exchange`).
- Knowing that functions over columns block pruning, and that **UDFs block pushdown and codegen**.
- Choosing broadcast for small dimensions, and applying filters to the small side before broadcasting.
- Spotting redundant shuffles (`repartition` before `groupBy`).
- Quantifying the impact (TB scanned, shuffle volume), not just naming fixes.
