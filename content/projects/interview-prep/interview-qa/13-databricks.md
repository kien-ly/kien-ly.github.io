---
title: "Databricks Interview Questions"
description: "The Databricks questions interviewers ask most, with crisp model answers: architecture, compute and cost, Delta Lake, Unity Catalog, Auto Loader, Declarative Pipelines, Jobs, streaming, performance, DevOps and security."
url: "/interview-prep/interview-qa/13-databricks/"
hiddenInHomeList: true
showToc: true
weight: 13
---

# Databricks Interview Questions

> Rapid-fire but deep. Each answer is what you'd say in 30-60 seconds. Learn the details in the [Databricks track](/interview-prep/learn/cloud/).

Tags: **[core]** = expected at every level · **[senior]** = expected at senior/staff level.

## Platform and compute

<details><summary>[core] What are the control plane and the compute plane?</summary>

The control plane is Databricks-managed: UI, notebooks, job scheduler, cluster manager, APIs. The compute plane processes data: classic clusters run in your cloud account and network; serverless compute runs in Databricks-managed, workspace-isolated infrastructure. Table data stays in your cloud storage (or UC managed storage) governed by Unity Catalog.

</details>

<details><summary>[core] All-purpose cluster vs job cluster vs serverless?</summary>

All-purpose: interactive, shared, higher DBU rate, for development. Job cluster: created per job run and terminated after, cheaper DBU rate, isolated and reproducible, for production on classic compute. Serverless: instant start, autoscaling, no infrastructure to manage, billed in DBUs only, for most jobs and notebooks when libraries and configs are supported.

</details>

<details><summary>[core] What is Photon?</summary>

Databricks' vectorised C++ query engine that executes Spark SQL/DataFrame operations on columnar batches, speeding up scans, joins, aggregations, writes and MERGE. It doesn't accelerate Python UDFs or RDD code and has a higher DBU rate, so it pays off on SQL/DataFrame-heavy workloads.

</details>

<details><summary>[senior] How do DBUs and costs work, and what are your top cost levers?</summary>

Classic cost = cloud VMs + DBUs (rate depends on compute type and tier); serverless = DBUs only. Levers: production on jobs compute or serverless (not all-purpose), auto-termination, cluster policies (instance types, max workers, tags), spot workers for batch, SQL warehouse auto-stop and right-sizing, Photon where it pays back, liquid clustering and predictive optimisation to scan less, incremental instead of full refreshes, and billing system tables for per-team dashboards and budgets.

</details>

<details><summary>[senior] What are cluster policies for?</summary>

They constrain compute creation: allowed instance types and runtimes, max workers, mandatory tags, auto-termination, spot settings, access mode. They enforce cost control, security and consistency, and give teams self-service within guardrails.

</details>

## Delta Lake

<details><summary>[core] How does Delta Lake give ACID on object storage?</summary>

An ordered transaction log of JSON commits (with periodic Parquet checkpoints) records which immutable Parquet files make up each version. A commit atomically creates the next log entry; readers reconstruct consistent snapshots from the log; writers use optimistic concurrency with conflict detection; schema enforcement and constraints are checked before commit.

</details>

<details><summary>[senior] What happens when two writers commit at the same time?</summary>

Both try to write the next log version; one wins. The loser checks whether the winning commits logically conflict with what it read and wrote. Disjoint appends succeed on retry; overlapping updates/deletes/merges on the same files fail with a concurrent modification error. Reduce conflicts with disjoint partitions/clustering, explicit predicates, row-level concurrency (deletion vectors + liquid clustering), or serialising writers.

</details>

<details><summary>[core] OPTIMIZE, Z-order and liquid clustering: what's the difference?</summary>

OPTIMIZE compacts small files. Z-order rewrites data sorted on a space-filling curve over several columns for better data skipping, but it's a full, non-incremental rewrite. Liquid clustering is incremental, its keys can change without rewriting the table, it supports row-level concurrency, and it's the recommended default for new tables (or `CLUSTER BY AUTO`). It can't be combined with partitioning or Z-order.

</details>

<details><summary>[core] What does VACUUM do and what's the risk?</summary>

It permanently deletes data files no longer referenced by the current table version and older than the retention threshold (default 7 days). Older versions referencing them can no longer be time-travelled, and long-running readers of old snapshots can fail. It's also required to physically remove deleted data for GDPR.

</details>

<details><summary>[senior] What are deletion vectors?</summary>

Bitmap files that mark rows as deleted without rewriting the Parquet file (merge-on-read). They make DELETE, UPDATE and MERGE much faster; readers apply the bitmaps, and files are rewritten later by OPTIMIZE/REORG. Physically purging deleted data requires `REORG TABLE … APPLY (PURGE)` followed by VACUUM.

</details>

<details><summary>[senior] How do you speed up a slow MERGE?</summary>

Deduplicate the source per key, add pruning predicates on clustering/partition columns, cluster the target on the merge key, enable deletion vectors and Photon, keep files well-sized, and check `DESCRIBE HISTORY` metrics (files rewritten, time) to confirm the effect.

</details>

<details><summary>[core] What is Change Data Feed?</summary>

A table property that records row-level changes per commit (insert, update pre/post image, delete, with version and timestamp), so downstream jobs read only changes between versions (`readChangeFeed`). It's the standard way to propagate incremental changes from silver to gold or to external systems.

</details>

## Unity Catalog

<details><summary>[core] What is Unity Catalog?</summary>

Databricks' account-level governance layer for data and AI assets: the three-level namespace (`catalog.schema.object`), centralised permissions inherited down the hierarchy, row filters, column masks and tag-based ABAC, governed volumes, functions and models, automatic table/column lineage, audit logs and system tables, credential management via storage credentials and external locations, plus Delta Sharing and Lakehouse Federation.

</details>

<details><summary>[core] Managed vs external tables in Unity Catalog?</summary>

Managed: UC controls the storage location and lifecycle; DROP removes data (with an UNDROP window); eligible for predictive optimisation and automatic clustering. External: data at a path you specify in an external location; DROP removes metadata only. Default to managed.

</details>

<details><summary>[senior] How do you design catalogs for environments and domains?</summary>

Catalogs per environment (and often per domain: `prod_sales`, `dev_sales`) with separate managed storage; schemas per layer (bronze/silver/gold) or per data product; workspace-catalog binding so prod catalogs are only reachable from prod workspaces; grants to groups only; pipelines run as service principals with MODIFY on their schemas; consumers get SELECT on gold.

</details>

<details><summary>[senior] How do you implement row- and column-level security?</summary>

Attach SQL UDF row filters (`ALTER TABLE … SET ROW FILTER`) and column masks (`ALTER COLUMN … SET MASK`) that use `current_user()` / `is_account_group_member()`, or at scale define ABAC policies on governed tags (e.g. `pii`) at catalog/schema level so tagged columns are masked everywhere automatically. Dynamic views are the legacy alternative.

</details>

<details><summary>[core] What are volumes?</summary>

Unity Catalog objects that govern non-tabular files (raw CSV/JSON, images, PDFs, ML artifacts) under `catalog.schema.volume` with the same permission model, accessed at `/Volumes/...`. They replace ungoverned DBFS mounts.

</details>

<details><summary>[senior] What is Delta Sharing and when would you use Lakehouse Federation instead?</summary>

Delta Sharing shares live, read-only tables/views/volumes/models with other Databricks accounts or external tools without copying, audited and revocable. Lakehouse Federation goes the other way: it queries external databases (Postgres, Snowflake, SQL Server…) through UC connections and foreign catalogs without ingesting, which is good for exploration and migration but not for heavy repeated workloads.

</details>

## Ingestion, pipelines and jobs

<details><summary>[core] What is Auto Loader and how does it track files?</summary>

A Structured Streaming source (`cloudFiles`) that incrementally ingests new files from cloud storage, using directory listing or cloud file notifications for discovery, and tracking processed files in its checkpoint (RocksDB) for exactly-once ingestion. It supports schema inference, evolution modes and a rescued data column; run it continuously or with `availableNow` as a scheduled batch.

</details>

<details><summary>[senior] Auto Loader schema evolution modes?</summary>

`addNewColumns` (default: the stream fails once on a new column, updates the schema, and continues after restart, which is automatic in jobs with retries), `rescue` (never evolve; unknown fields go to `_rescued_data`), `failOnNewColumns` (fail until the schema is updated manually), `none` (ignore new columns; rescued data only if configured).

</details>

<details><summary>[core] What are Lakeflow Declarative Pipelines (formerly DLT)?</summary>

A declarative framework for batch and streaming ETL: you define streaming tables, materialized views and views in SQL or Python; the engine builds the dependency graph and manages incremental processing, checkpoints, retries, compute (including serverless with enhanced autoscaling), data quality expectations and an event log. AUTO CDC handles CDC and SCD1/SCD2.

</details>

<details><summary>[core] Expectations in Declarative Pipelines?</summary>

Declarative data quality constraints: `expect` records violations (warn), `expect_or_drop` drops violating rows, `expect_or_fail` stops the update. Metrics go to the pipeline event log for monitoring.

</details>

<details><summary>[senior] How does AUTO CDC (APPLY CHANGES) handle out-of-order CDC events?</summary>

It orders changes per key by the `sequence_by` column (e.g. LSN or timestamp) and applies only the latest; late-arriving older changes don't overwrite newer state. Deletes come from `apply_as_deletes`, and SCD2 history is maintained with start/end columns automatically.

</details>

<details><summary>[core] What is a repair run in Lakeflow Jobs?</summary>

Re-running only the failed tasks and their downstream dependents of a failed job run, keeping successful tasks' results. Combined with idempotent tasks, it makes recovery fast and cheap.

</details>

<details><summary>[senior] What job triggers exist, and why prefer data-aware ones?</summary>

Schedule (cron), file arrival, table update (UC tables changed), and continuous. Data-aware triggers run work when upstream data is actually ready, avoiding "schedule and hope" timing that processes incomplete data or wastes time waiting.

</details>

## Streaming and performance

<details><summary>[core] What does trigger(availableNow=True) do?</summary>

It processes all data available at start (in multiple batches, respecting rate limits), then stops. It gives batch-like scheduled runs with streaming's incremental bookkeeping (checkpoints, exactly-once), and is often the most cost-efficient choice for hourly/daily SLAs.

</details>

<details><summary>[senior] How do you get exactly-once writes from foreachBatch to Delta?</summary>

Use idempotent logic in the batch function (MERGE on keys), or Delta's idempotent write options `txnAppId` (a stable id for the query) and `txnVersion` (the batch id), so a replayed batch is skipped. The plain Delta streaming sink already records batch ids in the transaction log.

</details>

<details><summary>[senior] What is predictive optimisation?</summary>

For Unity Catalog managed tables, Databricks automatically decides when to run OPTIMIZE, VACUUM and statistics collection based on usage, removing manual maintenance jobs and improving query performance and storage cost.

</details>

<details><summary>[senior] The disk cache vs Spark cache?</summary>

The disk cache automatically stores copies of remote Parquet/Delta data on local SSDs in a fast format and stays consistent with table changes, with no code needed; it's great for repeated reads of tables. Spark `cache()` stores a DataFrame's computed result in memory/disk for reuse within one application and must be managed manually.

</details>

## DevOps and security

<details><summary>[core] What are Databricks Asset Bundles?</summary>

YAML-based project definitions of jobs, pipelines and other resources with per-environment targets, deployed via the Databricks CLI. They enable code review, CI/CD and consistent promotion from dev to prod, running as service principals.

</details>

<details><summary>[senior] How do you secure network access for Databricks?</summary>

Secure cluster connectivity (no public IPs), customer-managed VNet/VPC with egress controls, Private Link for front-end/back-end, IP access lists, serverless egress policies, customer-managed keys, and SSO/SCIM with service principals for automation.

</details>

<details><summary>[senior] What are system tables and how would you use them?</summary>

Databricks-managed Delta tables in the `system` catalog: audit logs, lineage, billing, compute, jobs/pipelines, query history. Uses: cost dashboards and budgets per team, access reviews and anomaly detection, SLA monitoring of job durations, and finding unused tables to delete.

</details>
