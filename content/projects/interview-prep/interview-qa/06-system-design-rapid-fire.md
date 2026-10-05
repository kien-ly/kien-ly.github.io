---
title: "System Design Rapid-Fire Questions"
description: "Short trade-off questions interviewers ask during and after a data system design round."
url: "/interview-prep/interview-qa/06-system-design-rapid-fire/"
hiddenInHomeList: true
showToc: true
weight: 6
---

# System Design Rapid-Fire Questions

> Quick trade-off questions. Each answer should take 30–90 seconds out loud: choice, reason, cost.

Tags: **[core]** = expected at every level · **[senior]** = expected at senior/staff level.

## Trade-offs

<details><summary>[senior] Redis vs Pinot/Druid vs warehouse for serving a real-time dashboard?</summary>

Redis: a handful of precomputed keys, ms lookups, no ad-hoc slicing. Pinot/Druid/ClickHouse: sub-second slice-and-dice on fresh data with high concurrency (user-facing). Warehouse/lakehouse SQL: flexible joins, seconds latency, cheaper per TB, moderate concurrency (internal BI).

</details>

<details><summary>[senior] Spark Structured Streaming vs Flink?</summary>

Spark: micro-batch, seconds latency, unified with batch/Delta, team familiarity. Flink: true streaming, ms latency, rich keyed state, timers, event-time handling. Pick Flink for sub-second, complex stateful CEP; Spark when seconds are fine and you're on a lakehouse.

</details>

<details><summary>[senior] Kafka vs Kinesis vs Pub/Sub?</summary>

All are durable logs with replay. Kafka: highest flexibility/throughput, ecosystem, ops burden (or MSK/Confluent). Kinesis/Pub/Sub: managed, simpler, cloud-native, limits on throughput per shard and retention semantics. Choose by cloud, scale and ops capacity.

</details>

<details><summary>[senior] ETL vs ELT?</summary>

ETL transforms before loading (historically to save warehouse compute). ELT loads raw first and transforms inside the warehouse/lakehouse (dbt), keeping raw data for replay and using scalable compute. Modern default is ELT, with light validation/PII handling on ingest.

</details>

<details><summary>[senior] Push vs pull ingestion?</summary>

Push (sources send events/webhooks): low latency, but you must handle bursts and source retries. Pull (you poll APIs/DBs): you control rate and retries, higher latency, can miss deletes. CDC is a pull of the log with push-like latency.

</details>

<details><summary>[senior] Exact vs approximate counting?</summary>

Exact (COUNT DISTINCT, sets) for billing and finance; approximate (HLL, count-min, t-digest) for dashboards and real time with bounded memory and mergeability. Often both: approximate live, exact in batch.

</details>

<details><summary>[senior] Normalised OLTP replica vs dimensional model for analytics?</summary>

Replica (CDC mirror) is fast to deliver and good for operational reporting, but analysts must understand source schemas and join many tables. A dimensional model costs design effort but gives stable, understandable, performant analytics. Usually: mirror in silver, model in gold.

</details>

## Scaling and failure

<details><summary>[senior] Your pipeline must handle 10× traffic next year. What changes?</summary>

Re-check partition counts (Kafka/shuffles), autoscaling and backpressure, hot keys at higher scale, storage layout/compaction, serving store capacity, cost per unit of data, and whether pre-aggregation earlier in the pipeline is needed. Load-test with replayed production data.

</details>

<details><summary>[senior] How do you handle a hot key in a streaming aggregation?</summary>

Detect via per-partition lag/skew; salt the key with a random suffix and aggregate in two stages (partials then merge), pre-aggregate locally before the shuffle, or route the hot key to dedicated capacity.

</details>

<details><summary>[senior] An upstream team changed a column type and your pipeline broke at 3 a.m. How do you prevent this?</summary>

Data contracts with schema registry compatibility checks in the producer's CI, schema validation at ingestion with quarantine instead of failure, alerts to the producing team, versioned schemas with deprecation windows.

</details>

<details><summary>[senior] How do you set an SLA for a data product?</summary>

Agree with consumers on freshness (ready by 07:00), completeness and accuracy thresholds; express as SLOs with an error budget; monitor freshness/volume/quality; publish status; define incident response and communication.

</details>

<details><summary>[senior] What is your disaster recovery plan for a lakehouse?</summary>

Define RPO/RTO; object storage replication across regions; catalog metadata backup/replication; Kafka mirroring; infrastructure as code to recreate compute; time travel for logical corruption (within VACUUM retention); periodic restore drills.

</details>

## Estimation shortcuts

<details><summary>[core] Seconds per day shortcut and why it is OK?</summary>

86,400 ≈ 10⁵. Overestimates rates by ~15%, which is conservative and fine for sizing. 1 B events/day ≈ 12k/s average.

</details>

<details><summary>[core] How much does columnar compression typically save versus JSON?</summary>

Parquet with Snappy/ZSTD is typically 5–10× smaller than raw JSON, more for low-cardinality, sorted data.

</details>

<details><summary>[senior] How do you size Kafka partitions for 200 MB/s peak?</summary>

200 ÷ ~10 MB/s per partition ≈ 20 minimum; choose 64–128 for consumer parallelism, growth and hot-key spread. Check broker count and replication (×3 disk/network).

</details>
