---
title: "Architecture and Streaming Interview Questions"
description: "Lakehouse, medallion, table formats, batch vs streaming, Kafka, exactly-once, watermarks, CDC and orchestration questions."
url: "/interview-prep/interview-qa/05-architecture-streaming/"
hiddenInHomeList: true
showToc: true
weight: 5
---

# Architecture and Streaming Interview Questions

> Breadth-and-depth questions on data architecture. Learn the concepts in learn/architecture.

Tags: **[core]** = expected at every level · **[senior]** = expected at senior/staff level.

## Lakehouse and storage

<details><summary>[core] Data warehouse vs data lake vs lakehouse?</summary>

Warehouse: structured, schema-on-write, ACID, great BI, proprietary storage. Lake: cheap open files of anything, schema-on-read, no ACID → swamps. Lakehouse: open table formats on object storage adding ACID, schema enforcement, time travel and governance, so BI and ML share one copy.

</details>

<details><summary>[core] Explain the medallion architecture.</summary>

Bronze (raw, append-only, replayable), silver (cleaned, deduplicated, conformed entities, SCD), gold (business-level marts/aggregates). Each layer has a contract, owners and consumers; it enables replay, debugging and decoupling of ingestion from modeling.

</details>

<details><summary>[core] Why Parquet over CSV/JSON for analytics?</summary>

Columnar: read only needed columns; strong compression; per-row-group statistics enable predicate pushdown; typed schema. CSV/JSON must be parsed fully and have no stats.

</details>

<details><summary>[senior] Delta vs Iceberg vs Hudi?</summary>

All provide ACID, time travel, schema evolution on object storage. Delta: ordered JSON log, tight Spark/Databricks integration, CDF, liquid clustering. Iceberg: snapshot/manifest tree, engine-neutral, hidden partitioning and partition evolution. Hudi: upsert-heavy pipelines, merge-on-read, indexing. Choose by engine ecosystem and workload.

</details>

<details><summary>[senior] What causes small files and how do you fix them?</summary>

Frequent streaming commits, over-partitioning, many writers, too many shuffle partitions. Fix: compaction (OPTIMIZE), optimized writes/auto-compaction, coarser partitioning or clustering instead, longer triggers, fewer output partitions.

</details>

<details><summary>[senior] Partitioning vs Z-ordering vs liquid clustering?</summary>

Partitioning creates directories by a low-cardinality column for pruning (risk: small files, hard to change). Z-order co-locates multi-column values within files via OPTIMIZE rewrite. Liquid clustering clusters incrementally with changeable keys: the default for new Delta tables.

</details>

## Batch vs streaming

<details><summary>[core] When should you choose streaming over batch?</summary>

When acting on fresher data creates value (fraud, pricing, alerting, personalisation, user-facing analytics). Otherwise batch or incremental batch is cheaper and simpler. Use the slowest approach that meets the freshness SLA.

</details>

<details><summary>[core] Lambda vs Kappa architecture?</summary>

Lambda: separate batch (correct) and speed (fresh) layers merged at query time, with two codebases that drift. Kappa: one streaming pipeline; reprocess by replaying the log. Lakehouse hybrid: one codebase run as stream or batch, replaying from bronze tables.

</details>

<details><summary>[senior] Micro-batch vs continuous processing?</summary>

Micro-batch groups records per trigger (simple, efficient, exactly-once per batch, latency ≥ trigger). Continuous processes records individually with checkpoint barriers (ms latency, more complex). Matters only below ~1 s latency budgets.

</details>

## Kafka

<details><summary>[core] How does Kafka guarantee ordering?</summary>

Only within a partition. Messages with the same key go to the same partition (hash(key) % partitions), so per-key order holds. No global ordering across partitions.

</details>

<details><summary>[core] What is a consumer group?</summary>

A set of consumers sharing a topic's partitions; each partition is consumed by one member at a time. Different groups each receive all messages independently (fan-out). Max parallelism = number of partitions.

</details>

<details><summary>[senior] How do you choose the number of partitions?</summary>

Peak throughput ÷ per-partition throughput (plan ~5–10 MB/s), max consumer parallelism needed, headroom for growth (adding partitions later breaks key→partition mapping), and broker limits. Typically dozens to low hundreds.

</details>

<details><summary>[senior] What does acks=all with min.insync.replicas=2 guarantee?</summary>

A write is acknowledged only when at least 2 in-sync replicas have it, so losing one broker doesn't lose acknowledged data. If fewer than 2 replicas are in sync, producers get errors instead of silently losing durability.

</details>

<details><summary>[senior] What is log compaction and when is it used?</summary>

Kafka retains at least the latest value per key (older values cleaned up; tombstones delete keys). Used for changelog/CDC topics and state restore, where the latest state per key matters more than full history.

</details>

## Streaming semantics

<details><summary>[core] Event time vs processing time?</summary>

Event time is when the event happened (in the payload); processing time is when the system sees it. Aggregate on event time for correctness; processing time varies with delays and replays.

</details>

<details><summary>[core] What is a watermark?</summary>

The engine's estimate that all events up to time T have arrived (e.g. max event time − 10 min). It finalises windows, evicts state, and defines how late data can be before it's dropped or side-output.

</details>

<details><summary>[core] Tumbling vs sliding vs session windows?</summary>

Tumbling: fixed, non-overlapping. Sliding/hopping: fixed size, overlapping by slide interval (an event lands in several windows). Session: dynamic per key, closed after an inactivity gap.

</details>

<details><summary>[senior] How do you achieve exactly-once end to end?</summary>

Replayable source (offsets) + engine checkpointing offsets and state atomically + idempotent or transactional sink (MERGE by key, Kafka transactions, Delta txn ids). External side effects need idempotency keys. One at-least-once hop breaks the guarantee.

</details>

<details><summary>[senior] How do you join two streams without unbounded state?</summary>

Watermarks on both sides plus a time-range join condition (e.g. click within 15 minutes after impression), so the engine can evict state older than the bound. Outer joins require both.

</details>

<details><summary>[senior] How do you handle very late data (days)?</summary>

Stream with a modest watermark for freshness; late events still land in bronze; a batch restatement job recomputes affected periods (MERGE into aggregates); dashboards label recent periods as preliminary.

</details>

## Ingestion and CDC

<details><summary>[core] Full load vs incremental vs CDC?</summary>

Full: simple, heavy, catches deletes via diff. Incremental watermark (updated_at): light, misses deletes and intermediate states, depends on app discipline. Log-based CDC: every change incl. deletes in commit order, minimal source load, more infrastructure.

</details>

<details><summary>[senior] What can go wrong with Debezium on Postgres?</summary>

Replication slot lag retains WAL and can fill the source disk; schema changes; TOAST columns missing in updates; initial snapshot load on large tables; ordering only per key; failover handling of slots.

</details>

<details><summary>[senior] What is the outbox pattern?</summary>

Write the business change and an event row in the same local DB transaction; CDC publishes the outbox to Kafka. Solves the dual-write problem: events are published if and only if the transaction committed.

</details>

## Orchestration and reliability

<details><summary>[core] What makes a pipeline idempotent?</summary>

Re-running with the same input yields the same output: overwrite partitions for a logical date or MERGE on keys, deterministic logic (no now()), deterministic keys, no side effects in transformations.

</details>

<details><summary>[senior] How do you design a safe backfill?</summary>

Confirm raw data retention, run partition-parallel idempotent jobs into a shadow table, cap concurrency, validate vs prod, swap atomically, rebuild downstream in lineage order, communicate restated numbers.

</details>

<details><summary>[senior] What is write-audit-publish?</summary>

Write new data to a staging location/branch, run quality checks, and only then atomically publish to the production table, so consumers never see unvalidated data.

</details>
