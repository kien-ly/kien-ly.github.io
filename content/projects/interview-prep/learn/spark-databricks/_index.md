---
title: "Spark and Databricks: Learning Path"
description: "Spark execution internals, performance tuning, Delta Lake, Structured Streaming, Lakeflow, Unity Catalog and the Databricks platform."
url: "/interview-prep/learn/spark-databricks/"
hiddenInHomeList: true
showToc: true
weight: 0
---

# Spark and Databricks: Learning Path

| # | Module | You will be able to |
|---|---|---|
| 1 | [Spark internals & tuning](/interview-prep/learn/spark-databricks/01-spark-internals/) | Explain stages, shuffles, joins, AQE, memory; diagnose and fix slow or skewed jobs |
| 2 | [Delta Lake & Databricks](/interview-prep/learn/spark-databricks/02-delta-and-databricks/) | Use MERGE, CDF, deletion vectors, liquid clustering, streaming, Lakeflow, Unity Catalog |
| 3 | [Shuffle, spill & salting](/interview-prep/learn/spark-databricks/03-shuffle-spill-salting/) | Explain what physically happens in a shuffle, size shuffle partitions with arithmetic, diagnose spill and skew, and salt joins and aggregations correctly |
| 4 | [Serialization internals](/interview-prep/learn/spark-databricks/04-serialization/) | Know every place Spark serializes, Java vs Kryo vs Tungsten rows, Arrow for PySpark, and fix 'Task not serializable' |
| 5 | [Performance tuning deep dive](/interview-prep/learn/spark-databricks/05-performance-tuning-deep-dive/) | Read physical plans, size executors, choose partitioning/bucketing, decide when to cache, and use AQE, broadcast joins and DPP deliberately |
| 6 | [Memory architecture & OOM debugging](/interview-prep/learn/spark-databricks/06-memory-and-oom/) | Explain the unified memory model, decode every OOM error, and debug driver vs executor memory failures step by step |
| 7 | [Join strategies & broadcast joins](/interview-prep/learn/spark-databricks/07-join-strategies-and-broadcast/) | Predict and control join strategies, use hints, understand broadcast internals and failures, AQE join changes, range joins and storage-partitioned joins |
| 8 | [Caching & persistence](/interview-prep/learn/spark-databricks/08-caching-and-persistence/) | Know when caching helps or hurts, pick storage levels, avoid stale caches with Delta/Iceberg, choose cache vs checkpoint vs table |
| 9 | [Reading explain plans](/interview-prep/learn/spark-databricks/09-reading-explain-plans/) | Read any physical plan with an operator field guide, confirm it in the SQL tab, and diagnose slow queries from the plan |

Then: [Spark practice problems](/interview-prep/practice/spark/) · [Spark & Databricks interview questions](/interview-prep/interview-qa/03-spark-databricks/)
