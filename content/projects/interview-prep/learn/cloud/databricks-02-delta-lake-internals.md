---
title: "Databricks 2: Delta Lake Internals"
description: "How the transaction log, checkpoints and optimistic concurrency work; MERGE internals; time travel and VACUUM; OPTIMIZE, Z-order vs liquid clustering, deletion vectors, change data feed, constraints, clones, predictive optimisation and UniForm."
url: "/interview-prep/learn/cloud/databricks-02-delta-lake-internals/"
hiddenInHomeList: true
showToc: true
weight: 2
---

# Databricks 2: Delta Lake Internals

Every Databricks interview probes Delta Lake: not just "it adds ACID to Parquet", but *how*, and what happens when two jobs write at once, why `VACUUM` can break time travel, or when to choose liquid clustering. This module covers the internals behind those questions.

---

## 1. Anatomy of a Delta table

```
s3://lake/sales/orders/
├── _delta_log/
│   ├── 00000000000000000000.json     ← commit 0: protocol, metadata (schema, partitioning), add files
│   ├── 00000000000000000001.json     ← commit 1: add/remove actions
│   ├── ...
│   ├── 00000000000000000010.checkpoint.parquet   ← snapshot of table state every N commits
│   └── _last_checkpoint
├── part-00000-…-c000.snappy.parquet  ← data files (immutable)
├── part-00001-….snappy.parquet
└── deletion_vector_….bin             ← (if deletion vectors are enabled)
```

- **Data files** are ordinary Parquet and are **never modified in place**. Updates write new files and mark old ones as removed.
- The **transaction log** (`_delta_log`) is an ordered sequence of JSON commits. Each commit contains **actions**: `add` (file + stats: row count, min/max/null counts per column), `remove`, `metaData` (schema, partition columns, configuration), `protocol` (reader/writer features), `commitInfo` (operation, user, metrics), and `txn` (streaming/idempotent writer progress).
- **Checkpoints** periodically (by default every 10 commits on recent versions; configurable) consolidate the log into Parquet, so readers don't replay thousands of JSON files.
- **Reading version N** = load the latest checkpoint ≤ N, then apply subsequent JSON commits to get the set of active files. That set *is* the table snapshot.

**ACID from a log:**
- **Atomicity:** a commit is one log file write. Either it appears (all its adds/removes take effect) or it doesn't.
- **Consistency:** schema enforcement and constraints are checked before commit.
- **Isolation:** readers always see a complete snapshot (a specific version); writers use optimistic concurrency.
- **Durability:** files and log live in durable object storage.

---

## 2. Optimistic concurrency control and conflicts

Writers don't take locks. Each writer:
1. Reads the latest snapshot (version N) and records what it read.
2. Writes new data files.
3. Tries to commit version N+1 by atomically creating `N+1.json` (put-if-absent semantics, or a commit coordinator on stores lacking it).
4. If another writer already committed N+1, it **checks for logical conflicts** between its operation and the commits that won. If there are none, it retries as N+2. If there's a conflict, it fails with a concurrency exception.

| Operation A | Operation B | Conflict? |
|---|---|---|
| Blind append (INSERT) | Blind append | No: both commit |
| Append | `OPTIMIZE` | Usually no |
| `UPDATE`/`DELETE`/`MERGE` on partition P | Append to partition Q | No (different data) |
| `MERGE` touching files F | Another `MERGE`/`DELETE` that removed or changed files in F | **Yes**: `ConcurrentModificationException`-family errors (e.g. `ConcurrentDeleteReadException`, `ConcurrentAppendException`) |
| Schema/metadata change | Anything | Yes (metadata changed) |

**Reducing conflicts:**
- Partition/cluster so concurrent jobs touch **disjoint files**, and add explicit predicates (`MERGE … ON t.date = s.date AND …`) so the conflict checker knows the scope.
- Enable **row-level concurrency** (Databricks, with deletion vectors and liquid clustering), which detects conflicts at row level instead of file level, so concurrent updates to different rows in the same file succeed.
- Serialise writers per table where possible (one writer job per table, many readers).
- Retry with backoff on conflict exceptions in jobs that can safely re-run (idempotent operations).

---

## 3. MERGE: what really happens

```sql
MERGE INTO silver.customers t
USING updates s
ON t.customer_id = s.customer_id
WHEN MATCHED AND s.op = 'D' THEN DELETE
WHEN MATCHED AND s.updated_at > t.updated_at THEN UPDATE SET *
WHEN NOT MATCHED AND s.op != 'D' THEN INSERT *
```

1. **Find touched files:** join the source with the target to find which target files contain matching keys (using file stats and data skipping where possible).
2. **Rewrite:** for copy-on-write, rewrite each touched file with updated/deleted rows applied, plus new files for inserts; commit `remove` for old files and `add` for new ones. With **deletion vectors**, deletes and updates mark old rows as deleted in a small bitmap file instead of rewriting the whole file (merge-on-read), so writes are much faster.

**Performance rules:**
- **Deduplicate the source** to one row per key first. Multiple source rows matching one target row is an error (non-deterministic update).
- **Prune the target:** add predicates on partition/clustering columns (`AND t.event_date >= '2024-05-01'`), otherwise MERGE may scan the whole table.
- **Cluster the target on the merge key** (liquid clustering), so matches touch few files.
- Enable deletion vectors and Photon; keep files reasonably sized.
- Watch the operation metrics in `DESCRIBE HISTORY` (`numTargetFilesRemoved`, `numTargetRowsUpdated`, `executionTimeMs`). If a small update rewrites thousands of files, the layout is wrong.

---

## 4. Time travel, VACUUM and retention

```sql
SELECT * FROM orders VERSION AS OF 120;
SELECT * FROM orders TIMESTAMP AS OF '2024-05-01T00:00:00Z';
RESTORE TABLE orders TO VERSION AS OF 120;     -- rollback after a bad write
DESCRIBE HISTORY orders;                        -- who did what, with metrics
```

- Time travel works as long as **both** the log entries and the data files for that version still exist.
- **`VACUUM`** physically deletes data files no longer referenced by the current version **and older than the retention threshold** (default 7 days, `delta.deletedFileRetentionDuration`). After vacuuming, older versions whose files were removed can't be read.
- **Log retention** (`delta.logRetentionDuration`, default 30 days) controls how long commit history is kept.
- **Don't** set retention below the longest-running query or streaming job lag: a reader using an old snapshot may lose files mid-read.
- **GDPR:** a `DELETE` alone leaves the deleted rows in old files until `VACUUM` removes them (and deletion vectors must be purged by rewriting files, e.g. `REORG TABLE … APPLY (PURGE)`). Erasure procedures must include the vacuum step.

---

## 5. File layout: OPTIMIZE, Z-order, liquid clustering

**Small files** (from streaming, frequent small batches or over-partitioning) slow reads and inflate metadata.
- **`OPTIMIZE`** compacts small files into larger ones (target ~1 GB by default; adaptive on Databricks).
- **Optimized writes** (shuffle before write to produce right-sized files) and **auto compaction** (compact after writes) prevent the problem at write time.

**Data skipping:** readers skip files whose min/max stats exclude the filter. Stats are collected on the first 32 columns by default (`delta.dataSkippingNumIndexedCols`, or `delta.dataSkippingStatsColumns`), so put filter columns early or configure stats columns.

| Technique | How | Pros | Cons |
|---|---|---|---|
| **Hive-style partitioning** (`PARTITIONED BY date`) | Directory per value | Coarse pruning, easy retention/overwrite by partition | Only for low-cardinality columns; over-partitioning → small files; fixed at creation |
| **Z-order** (`OPTIMIZE … ZORDER BY (a, b)`) | Rewrites files sorted by a space-filling curve on several columns | Good multi-column skipping | Full rewrite of the data being optimised; not incremental; must re-run as data arrives |
| **Liquid clustering** (`CLUSTER BY (a, b)`, or `CLUSTER BY AUTO`) | Incremental clustering managed by Delta; keys can be changed without rewriting the table | Incremental, adapts to changing keys, works with row-level concurrency, recommended for new tables | Requires recent runtimes; not combinable with partitioning or Z-order on the same table |

**Current guidance:** for new tables, use **liquid clustering** on the columns most used in filters and joins (or `CLUSTER BY AUTO` to let the platform pick keys from query patterns), and skip partitioning except for very large tables with clear date-based lifecycle needs.

**Predictive optimisation** (Unity Catalog managed tables) automatically runs `OPTIMIZE`, `VACUUM` and statistics collection when beneficial, removing most manual maintenance jobs.

---

## 6. Other features interviewers ask about

| Feature | What it does | Typical use |
|---|---|---|
| **Schema enforcement** | Rejects writes whose schema doesn't match | Protect curated tables |
| **Schema evolution** (`mergeSchema`, `ALTER TABLE ADD COLUMN`, column mapping for rename/drop) | Controlled schema changes | Bronze ingestion, evolving sources |
| **Constraints** (`NOT NULL`, `CHECK (amount >= 0)`) | Commit fails if violated | Enforce invariants at write time |
| **Generated columns / identity columns** | Derived values (`event_date GENERATED ALWAYS AS (CAST(ts AS DATE))`), surrogate keys | Partition columns derived from timestamps; dimension keys |
| **Change Data Feed** (`delta.enableChangeDataFeed = true`) | Records row-level inserts, updates (pre/post images) and deletes per commit | Incremental downstream processing, CDC out of the lakehouse |
| **Deletion vectors** | Marks deleted rows in bitmaps instead of rewriting files | Fast DELETE/UPDATE/MERGE (merge-on-read) |
| **Shallow clone** | New table pointing at the source's files (metadata copy) | Cheap test copies, experiments |
| **Deep clone** | Full copy of data and metadata, incrementally syncable | Backups, DR copies, migrating tables |
| **UniForm** | Writes Iceberg (and Hudi) metadata alongside Delta | Let Iceberg engines read Delta tables |
| **Idempotent writes** (`txnAppId` + `txnVersion` options) | Skip a batch already committed by that writer | Exactly-once `foreachBatch` sinks |

---

## Interview questions

<details><summary>How does Delta Lake provide ACID transactions on object storage?</summary>

Through an ordered transaction log of JSON commits (plus periodic Parquet checkpoints). Each commit atomically adds and removes immutable data files by creating the next numbered log file (put-if-absent, or via a commit coordinator). Readers reconstruct a consistent snapshot from the log, so they never see partial writes. Writers use optimistic concurrency with conflict detection, and schema enforcement and constraints are checked before commit.
</details>

<details><summary>Two jobs MERGE into the same table and one fails with a concurrent modification error. Why, and how do you fix it?</summary>

Both read the same snapshot and their operations touched overlapping files (one removed or rewrote files the other read), so optimistic concurrency detected a logical conflict. Fixes: make the jobs touch disjoint data (partition/cluster by the dimension each job writes, and add explicit predicates in the `ON` clause), enable row-level concurrency (deletion vectors + liquid clustering), serialise writers to that table, and retry idempotent operations with backoff.
</details>

<details><summary>Why can VACUUM break time travel or running queries?</summary>

VACUUM deletes data files no longer referenced by the current snapshot that are older than the retention period. Older versions that reference those files become unreadable, and a long-running query or lagging stream reading an old snapshot can fail if its files disappear. Keep retention longer than the longest query or stream lag and your required time-travel window.
</details>

<details><summary>Z-order vs liquid clustering vs partitioning: what would you choose for a new 50 TB events table queried by date, customer and event type?</summary>

Liquid clustering on (event_date, customer_id, event_type), or `CLUSTER BY AUTO`, with predictive optimisation. It clusters incrementally, the keys can evolve, it supports row-level concurrency, and it avoids the small-file risk of partitioning by high-cardinality columns. Z-order requires repeated full rewrites. Directory partitioning by date only makes sense if you need partition-level lifecycle operations and partitions are large; it can't be combined with liquid clustering.
</details>

<details><summary>How do you make MERGE faster on a large table?</summary>

Deduplicate the source to one row per key; add pruning predicates on clustering/partition columns; cluster the target on the merge key so matches touch few files; enable deletion vectors (and row-level concurrency) to avoid full file rewrites; use Photon; compact small files; and check `DESCRIBE HISTORY` metrics to confirm few files are rewritten per run.
</details>

<details><summary>What does Change Data Feed give you, and how is it different from time travel?</summary>

CDF records row-level changes per commit (`_change_type` = insert, update_preimage, update_postimage, delete, plus commit version and timestamp), so downstream jobs can read just the changes between versions and propagate them incrementally. Time travel gives full snapshots at a version, so you'd have to diff snapshots yourself. CDF must be enabled before the changes happen and is subject to retention.
</details>

<details><summary>Shallow vs deep clone?</summary>

A shallow clone copies only metadata and points at the source's data files: instant and cheap, good for testing, but dependent on the source files (VACUUM on the source can break it). A deep clone copies data and metadata into an independent table, can be re-run to sync incrementally, and is suitable for backups, DR and migrations.
</details>
