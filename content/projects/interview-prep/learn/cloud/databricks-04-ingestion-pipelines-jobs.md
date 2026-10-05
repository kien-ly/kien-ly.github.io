---
title: "Databricks 4: Ingestion, Declarative Pipelines, Jobs and Streaming"
description: "Auto Loader and COPY INTO, Lakeflow Connect, Lakeflow Declarative Pipelines (streaming tables, materialized views, expectations, AUTO CDC / SCD2), Lakeflow Jobs (task graphs, triggers, repair runs), and Structured Streaming on Databricks."
url: "/interview-prep/learn/cloud/databricks-04-ingestion-pipelines-jobs/"
hiddenInHomeList: true
showToc: true
weight: 4
---

# Databricks 4: Ingestion, Declarative Pipelines, Jobs and Streaming

This module covers how data gets into Databricks and how pipelines are built and orchestrated. Expect scenario questions such as *"ingest 50,000 JSON files per hour with evolving schemas"*, *"implement SCD2 from a CDC feed"* or *"how do you rerun only the failed part of a job?"*.

> **Naming note:** Delta Live Tables (DLT) was renamed **Lakeflow Declarative Pipelines**, and its engine was open-sourced into Apache Spark as **Spark Declarative Pipelines**; Workflows became **Lakeflow Jobs**; managed connectors are **Lakeflow Connect**. Interviewers use old and new names interchangeably.

---

## 1. File ingestion: Auto Loader vs COPY INTO

**Auto Loader** (`cloudFiles` source) incrementally ingests new files from cloud storage as a stream:

```python
(spark.readStream.format("cloudFiles")
    .option("cloudFiles.format", "json")
    .option("cloudFiles.schemaLocation", "/Volumes/prod/raw/_schemas/orders")   # inferred schema + evolution history
    .option("cloudFiles.schemaEvolutionMode", "addNewColumns")                  # or rescue / failOnNewColumns / none
    .option("cloudFiles.inferColumnTypes", "true")
    .load("s3://landing/orders/")
  .writeStream
    .option("checkpointLocation", "/Volumes/prod/raw/_checkpoints/orders")
    .trigger(availableNow=True)                                                 # process the backlog, then stop
    .toTable("prod.bronze.orders"))
```

- **File discovery modes:**
  - *Directory listing* is simple, with no extra cloud setup, and efficient for most sources with incremental listing.
  - *File notification* subscribes to cloud storage events (SNS/SQS, Event Grid, Pub/Sub) and scales to very high file counts without listing. Newer runtimes also offer managed file events via external locations.
- **Exactly-once file tracking:** processed files are tracked in the checkpoint (RocksDB), so each file is ingested once even across restarts.
- **Schema handling:** inference with sampling, a stored schema history, evolution modes, and the **rescued data column** (`_rescued_data`), which captures fields that don't match the schema instead of dropping them.
- **Triggers:** `availableNow=True` gives batch-like scheduled runs with streaming bookkeeping; `processingTime` for continuous micro-batches.

**COPY INTO** is an idempotent SQL command that loads files not loaded before. It's simple for thousands of files and SQL-first teams, but less scalable than Auto Loader for millions of files and continuous ingestion.

| | Auto Loader | COPY INTO |
|---|---|---|
| Interface | Structured Streaming (Python/SQL, pipelines) | SQL command |
| Scale | Millions of files, continuous | Thousands of files, scheduled |
| Schema evolution | Rich (inference, modes, rescued column) | Basic |
| Use | Default for production file ingestion | Simple, ad-hoc or SQL warehouse loads |

**Lakeflow Connect** provides managed connectors for SaaS apps (Salesforce, Workday, ServiceNow…) and databases (SQL Server, Postgres, etc., via CDC), writing into streaming tables with incremental sync, so there's no custom ingestion code for common sources.

---

## 2. Lakeflow Declarative Pipelines (formerly DLT)

You declare **what** tables should contain; the framework handles dependency ordering, incremental processing, retries, checkpoints, infrastructure and data quality.

```python
import dlt                      # newer API: from pyspark import pipelines as dp  (@dp.table, @dp.materialized_view)
from pyspark.sql import functions as F

@dlt.table(comment="Raw orders from Auto Loader")
def bronze_orders():
    return (spark.readStream.format("cloudFiles")
            .option("cloudFiles.format", "json").load("/Volumes/prod/landing/orders"))

@dlt.table
@dlt.expect_or_drop("valid_amount", "amount >= 0")
@dlt.expect_or_fail("has_key", "order_id IS NOT NULL")
@dlt.expect("recent", "order_ts > '2020-01-01'")            # warn only: recorded in metrics
def silver_orders():
    return (dlt.read_stream("bronze_orders")
            .withColumn("order_date", F.to_date("order_ts")))

@dlt.table                                                     # batch read → materialized view semantics
def gold_daily_revenue():
    return (dlt.read("silver_orders").groupBy("order_date")
            .agg(F.sum("amount").alias("revenue")))
```

**Dataset types:**
- **Streaming table:** append-only incremental processing; each input record is processed once. Use it for ingestion and incremental transformations.
- **Materialized view:** the result of a query, kept up to date; the engine recomputes **incrementally when possible** (on serverless, via Enzyme incremental refresh) or fully otherwise. Use it for aggregations, joins and anything where inputs can change.
- **View:** temporary, not persisted.

**Expectations** (data quality): `expect` (warn: keep rows, record metrics), `expect_or_drop` (drop violating rows), `expect_or_fail` (stop the update). Metrics land in the pipeline **event log**, a queryable Delta table, for quality dashboards.

**CDC and SCD with AUTO CDC (formerly `APPLY CHANGES INTO`):**

```python
dlt.create_streaming_table("silver_customers")

dlt.create_auto_cdc_flow(                  # older name: dlt.apply_changes(...)
    target="silver_customers",
    source="bronze_customer_changes",
    keys=["customer_id"],
    sequence_by=F.col("lsn"),              # ordering column: handles out-of-order events
    apply_as_deletes=F.expr("op = 'D'"),
    except_column_list=["op", "lsn"],
    stored_as_scd_type=2,                  # 1 = overwrite in place, 2 = keep history (__START_AT/__END_AT)
)
```

It handles out-of-order records by `sequence_by`, deletes, and SCD1/SCD2 bookkeeping, replacing hundreds of lines of hand-written MERGE logic.

**Pipeline settings to know:**
- **Triggered** (run then stop) vs **continuous** (always on).
- **Development mode** (reuses the cluster, no retries) vs **production mode** (retries, restarts on failure).
- **Serverless** or classic compute, with enhanced autoscaling.
- **Full refresh** (recompute everything; dangerous for streaming tables whose sources no longer hold old data) vs normal incremental updates.
- Publishing to Unity Catalog catalogs/schemas.

**When not to use Declarative Pipelines:** very custom low-level Spark logic or tuning, complex arbitrary stateful processing, or teams standardised on another orchestration/transformation framework (e.g. dbt + Jobs).

---

## 3. Lakeflow Jobs (orchestration)

A **job** is a DAG of **tasks**: notebook, Python script/wheel, SQL (queries, dashboards, alerts), dbt, pipeline, JAR, Spark submit, "run job" (call another job), and control-flow tasks.

| Feature | What it gives you |
|---|---|
| **Task dependencies** | DAG with run-if conditions (all succeeded, at least one failed, all done…) |
| **If/else and for-each tasks** | Branching on task values; looping over a list (e.g. per-country tasks) with bounded concurrency |
| **Task values** | Pass small values between tasks (`dbutils.jobs.taskValues.set/get`) |
| **Job parameters** | Parameterise runs (`{{job.start_time}}`, custom params) for backfills |
| **Triggers** | Schedule (cron), **file arrival** (new files in a location), **table update** (when upstream UC tables change: data-aware), continuous |
| **Retries & timeouts** | Per task, with alerts on failure/duration thresholds |
| **Repair run** | Re-run **only failed and downstream tasks** of a failed run, keeping successful ones |
| **Compute per task** | Job clusters shared across tasks, serverless, or SQL warehouses |
| **Notifications** | Email, Slack, webhooks; system tables for run history |

**Interview points:**
- Use **table-update or file-arrival triggers** instead of "run at 4am and hope upstream finished".
- **Repair run** plus idempotent tasks is the efficient recovery story.
- Jobs are defined as code with **Databricks Asset Bundles** (YAML) and deployed via CI/CD (see module 5).
- External orchestrators (Airflow, Dagster) can trigger Databricks jobs via operators/APIs when a company standardises on them; a common pattern is Airflow for cross-system orchestration and Databricks Jobs for Databricks-internal DAGs.

---

## 4. Structured Streaming on Databricks

- **Checkpoints** store source offsets, state and sink commit info. Each streaming query needs its own checkpoint location (in a volume or cloud path), and changing the query in incompatible ways (e.g. a different aggregation) requires a new checkpoint.
- **Triggers:** `availableNow` (incremental batch: process everything new, then stop, which is cost-efficient for hourly SLAs), `processingTime="1 minute"`, continuous pipelines for low latency. Newer runtimes add a real-time mode for very low latency workloads.
- **State store:** use **RocksDB** for large state (`spark.sql.streaming.stateStore.providerClass`), plus changelog checkpointing for faster checkpoints.
- **Watermarks** bound state for aggregations, stream-stream joins and dedup (`dropDuplicatesWithinWatermark`).
- **Rate limiting:** `maxFilesPerTrigger` / `maxBytesPerTrigger` (Auto Loader), `maxOffsetsPerTrigger` (Kafka) to control batch size and backpressure.
- **Delta as source:** stream from a Delta table (appends), or read its **change data feed** (`readChangeFeed`) to also get updates and deletes; `skipChangeCommits` to ignore non-append commits.
- **Exactly-once to Delta:** the Delta sink records the batch id in the transaction log, so replays don't duplicate; `foreachBatch` + MERGE should use `txnAppId`/`txnVersion` or idempotent logic.
- **Monitoring:** `StreamingQueryListener`, the query progress metrics (input rate, processing rate, batch duration, state size), and the pipeline event log for declarative pipelines.

---

## Interview questions

<details><summary>Auto Loader vs COPY INTO: when do you use each?</summary>

Auto Loader for production, high-volume or continuous file ingestion: scalable discovery (incremental listing or file notifications), exactly-once file tracking in a checkpoint, schema inference/evolution and the rescued data column, and both streaming and `availableNow` batch modes. COPY INTO for simple, idempotent SQL loads of thousands of files, ad-hoc loads, or SQL-warehouse-only teams.
</details>

<details><summary>Streaming table vs materialized view in Declarative Pipelines?</summary>

A streaming table processes each new input record once (append-only, incremental), ideal for ingestion and transformations of append-only sources. A materialized view represents a query's full result, refreshed incrementally when possible or fully recomputed otherwise, ideal for aggregations, joins with changing dimensions and anything where inputs are updated or deleted.
</details>

<details><summary>How do you implement SCD Type 2 from a CDC feed on Databricks with minimal code?</summary>

In Lakeflow Declarative Pipelines, create a streaming table target and use AUTO CDC (formerly APPLY CHANGES) with `keys`, `sequence_by` (the CDC ordering column, e.g. LSN), `apply_as_deletes` for delete ops and `stored_as_scd_type=2`. It handles out-of-order events, deletes and validity columns automatically. Without pipelines, write a MERGE that closes the current version and inserts the new one, ordering by the sequence column and deduplicating per key per batch.
</details>

<details><summary>Expectations: warn vs drop vs fail. How do you choose?</summary>

`expect` (warn) for soft rules where you want metrics but not data loss; `expect_or_drop` for record-level validity rules where bad rows should be excluded (and ideally captured elsewhere for review); `expect_or_fail` for invariants whose violation means the data or pipeline is fundamentally wrong (missing keys, impossible states), so the update stops before publishing bad data.
</details>

<details><summary>A 12-task job failed at task 9. How do you recover efficiently?</summary>

Fix the cause, then use **Repair run** to re-run only the failed task and its downstream dependents, reusing the successful tasks' results. Tasks must be idempotent (partition overwrite/MERGE) so re-running is safe. Add retries with backoff for transient failures and alerts on duration so you hear about it before consumers do.
</details>

<details><summary>How do you make a Databricks pipeline run only when its upstream data is ready?</summary>

Use a table-update trigger on the upstream Unity Catalog tables or a file-arrival trigger on the landing location (or chain jobs with "run job" tasks), instead of fixed schedules. For cross-system dependencies orchestrated elsewhere, have the upstream publish a completion signal that triggers the job via the API.
</details>
