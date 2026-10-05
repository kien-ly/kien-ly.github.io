---
title: "Senior Deep Dive: Pipeline Reliability and Correctness"
description: "In-depth model answers on building reliable pipelines: idempotency, exactly-once, late-arriving data, backfills, backpressure, consistency, deduplication, schema evolution, retries and DLQs, ordering, replay, deletes and reconciliation."
url: "/interview-prep/interview-qa/10-pipeline-reliability-correctness/"
hiddenInHomeList: true
showToc: true
weight: 10
---

# Senior Deep Dive: Pipeline Reliability and Correctness

> These are the open-ended questions that decide senior and staff data engineering loops. Each answer is written the way a strong candidate would say it: **a crisp headline first, then the mechanism, then the trade-offs and the operational details** that show you've run this in production. Learn the structure, then retell it with your own examples.

Tags: **[core]** = expected at every level · **[senior]** = expected at senior/staff level.

## Reliability fundamentals

<details><summary>[senior] How do you build a reliable data pipeline? Walk me through your principles.</summary>

**Headline:** a reliable pipeline produces **correct, complete and timely** data, and when something breaks it **fails loudly, recovers automatically where it can and can be safely re-run**. I design for that with seven principles:

1. **Immutable, replayable raw layer.** Land source data as-is (append-only bronze, or retained Kafka topics) before transforming. Any bug downstream can be fixed by reprocessing, without going back to the source.
2. **Idempotent steps.** Every task can run twice with the same result: partition overwrite, `MERGE` on business keys, deterministic outputs. This makes retries and backfills safe (see the idempotency question).
3. **Explicit contracts at boundaries.** Schemas, keys, freshness and volume expectations are agreed with producers and enforced (schema registry, data contracts, contract tests in CI).
4. **Validate before publishing.** Write → audit → publish: compute into a staging location, run quality checks (row counts, null rates, uniqueness, reconciliation against the source), and only then swap it into the consumer-facing table. Bad data never reaches dashboards.
5. **Observability by default.** Freshness, volume, schema-change and distribution monitors on key tables; pipeline metrics (duration, rows in/out, lag); lineage so you know who's affected. Alerts are actionable and routed to owners.
6. **Graceful failure handling.** Retries with backoff for transient errors only; a dead-letter path for bad records so one poison row doesn't block the batch; circuit breakers on upstream outages; timeouts everywhere.
7. **Operational readiness.** Runbooks, an on-call owner, SLAs/SLOs per data product, CI/CD with tests, and backfill tooling that's been exercised before you need it.

**What a senior adds:** tie reliability to **business impact** ("the finance close depends on this table by 6am, so it has an SLO of 99.5% on-time with a reconciliation check"), and mention the trade-off. Every check and staging step costs latency and money, so the rigour is proportional to the data's criticality.

</details>

<details><summary>[core] What makes a pipeline idempotent, and how do you implement it?</summary>

**Headline:** running the same job for the same input **any number of times** leaves the output in the same state as running it once. It's the property that makes retries, reruns and backfills safe.

**Patterns:**

| Pattern | How | Good for |
|---|---|---|
| **Partition overwrite** | Recompute a whole partition (e.g. `dt=2024-05-01`) and atomically replace it (`INSERT OVERWRITE`, Delta `replaceWhere`, dynamic partition overwrite) | Daily batch facts and aggregates |
| **MERGE / upsert on a business key** | `MERGE INTO target USING source ON key` with update/insert logic | Dimensions, CDC, late updates |
| **Deterministic keys** | Derive IDs from content or source keys (hash of natural key), never `uuid()` or `now()` at write time | Dedup across retries |
| **Dedup on write** | Keep the latest record per key/version before writing | At-least-once sources |
| **Transactional sink + offsets** | Commit output and the source position in the same transaction (or make the write idempotent per batch id) | Streaming exactly-once |

**Anti-patterns:** plain `INSERT INTO`/append for reruns (duplicates), `DELETE` then `INSERT` without a transaction (a crash in between loses data), using processing time (`current_timestamp()`) in business logic (different results on rerun), and incrementing counters in place.

**Senior nuance:** idempotency must hold for **side effects** too: emails sent, API calls, downstream triggers. Make those keyed (an idempotency key per event) or move them after a commit point.

</details>

<details><summary>[senior] Exactly-once vs at-least-once vs at-most-once: what's realistic end to end?</summary>

**Headline:** true exactly-once *delivery* across arbitrary systems isn't achievable; what we build is **effectively-once results**: at-least-once delivery plus idempotent or transactional processing and sinks.

- **At-most-once:** commit the position before processing; a crash loses data. Rarely acceptable.
- **At-least-once:** process, then commit; a crash causes reprocessing and therefore duplicates. The default for most systems.
- **Effectively-once:** at-least-once + (a) idempotent writes (upsert by key, overwrite by partition), or (b) atomic commit of output **and** source offsets together.

**How the main engines do it:**
- **Kafka transactions** (producer `transactional.id` + `read_committed` consumers): read-process-write within Kafka is atomic, covering consumed offsets and produced records.
- **Spark Structured Streaming:** the checkpoint records the offsets per micro-batch; replay after failure is deterministic, and sinks must be idempotent per batch id (the Delta sink records the batch id in the transaction log, so a replayed batch is skipped). `foreachBatch` is at-least-once unless you make it idempotent, e.g. `MERGE` or the `txnVersion`/`txnAppId` options.
- **Flink:** checkpoints (Chandy-Lamport barriers) snapshot state and source positions consistently; two-phase-commit sinks (Kafka, some file sinks) commit output when the checkpoint completes.

**Where it breaks:** non-idempotent external side effects (calling a payment API), sinks without transactions or keys, and non-deterministic processing (random, wall-clock) that produces different output on replay.

**Interview line:** "I assume at-least-once everywhere and make every write idempotent; then I only need transactions where the sink supports them."

</details>

## Time, lateness and ordering

<details><summary>[senior] How do you handle late-arriving data in batch and streaming pipelines?</summary>

**Headline:** first **measure** how late data arrives, then choose per use case between waiting, correcting and accepting approximation, and make the choice explicit in the data's contract.

**Measure:** the distribution of `ingest_time - event_time` (p50, p99, p99.9, max) per source. Mobile apps that batch offline events can be days late; server logs are seconds.

**Streaming:**
- Use **event time** with a **watermark** = max event time seen − allowed lateness. Windows are finalised when the watermark passes their end; state for older windows is dropped (bounded memory).
- Events later than the watermark are dropped by default. Route them to a **side output / late-events table** instead of silently losing them.
- Pick the allowed lateness from the measured p99/p99.9 and the cost of state: a 2-hour watermark on a high-cardinality aggregation means 2 hours of state.
- Output modes: *append* (emit final results once, after the watermark) vs *update* (emit early results, then corrections), which is a freshness vs stability trade-off for consumers.

**Batch:**
- Partition by **event date** but process by **arrival**: each run reads newly arrived records (by ingest time) and **recomputes the affected event-date partitions** (a sliding reprocessing window, e.g. the last 3 days, plus a weekly sweep of a longer window).
- Use `MERGE` on keys for late updates to facts, or partition overwrite of the affected dates.
- Publish completeness metadata: "yesterday is 99.7% complete; finalised after 72h".

**Late-arriving dimensions (early-arriving facts):** a fact references a customer that isn't in `dim_customer` yet. Don't drop it and don't map it to "unknown" permanently. Insert an **inferred member** (a placeholder dimension row with the natural key and default attributes) and update it when the real record arrives (Kimball's inferred member pattern), or re-key facts in a later run.

**What a senior adds:** align lateness handling with the consumer. Finance needs correct, finalised numbers (wait and reconcile); an ops dashboard needs fast approximate numbers (emit early, correct later, label as provisional).

</details>

<details><summary>[senior] Events arrive out of order. How do you guarantee correct results?</summary>

**Headline:** never rely on arrival order for correctness. Order by **event time plus a tie-breaker** at processing time, and use **version-aware writes**.

- **Within a stream:** Kafka only guarantees order **per partition**, so keying by entity (`account_id`) gives per-entity order on the happy path. But retries, multiple producers and reprocessing can still reorder events, so don't depend on it for correctness.
- **Last-write-wins by version, not by arrival:** each record carries a monotonic version (`updated_at`, a source LSN/SCN, a sequence number). Upserts apply only if `incoming.version > current.version`: `MERGE … WHEN MATCHED AND s.version > t.version THEN UPDATE`. A late, older update can then never overwrite a newer one.
- **Aggregations:** event-time windows with watermarks; for stateful per-entity logic (sessionization, state machines), buffer events per key and process in event-time order up to the watermark.
- **Tie-breakers:** timestamps collide (millisecond resolution, clock skew). Use `(event_time, source_sequence)` or the CDC log position.
- **Clock skew:** device clocks lie. Clamp absurd timestamps (future dates, 1970), keep both client and server timestamps, and decide which is authoritative per use case.

</details>

<details><summary>[senior] How do you design a safe backfill?</summary>

**Headline:** a backfill is a production change with blast radius. Make it **idempotent, isolated, observable and reversible**, and communicate it.

**Process:**
1. **Scope:** which tables and date range, why, and which downstream consumers and dashboards are affected (lineage).
2. **Code path:** use the **same** transformation code as the daily job, parameterised by date range, never a one-off script with diverging logic. The job must be idempotent (partition overwrite or MERGE).
3. **Isolation:** write to a **shadow table or branch** first (e.g. `orders_v2`, an Iceberg/Nessie branch, a Delta clone), or at least run on a separate cluster or queue so the backfill doesn't starve the daily SLA jobs.
4. **Validate:** compare shadow vs current (row counts, key metrics, distributions per day, `EXCEPT` diffs on samples), and sign off with the data owner.
5. **Publish atomically:** swap partitions or tables in a transaction (Delta `replaceWhere`, `RESTORE`-able versions, view repoint), in chunks (e.g. a month at a time), newest first if consumers mostly read recent data.
6. **Downstream:** trigger dependent models for the same range (data-aware scheduling, dbt `--select model+` with vars), or consumers silently mix old and new logic.
7. **Rollback plan:** table version history (time travel / `RESTORE`), or keep the old table until sign-off.

**Cost and pacing:** estimate compute (e.g. 3 years × 400 GB/day at X $/TB), throttle concurrency, and schedule off-peak. Use autoscaling job clusters or serverless, not the shared interactive cluster.

**Communicate:** announce the window, mark affected dashboards as "restating", and log the restatement (what changed, why, row deltas) for auditors.

</details>

<details><summary>[senior] What is backpressure and how do streaming systems handle it?</summary>

**Headline:** backpressure is the mechanism by which a **slow consumer slows down its producers** instead of being overwhelmed. Without it, buffers grow until something crashes or drops data.

**How it shows up:** consumer lag growing, processing time per batch exceeding the trigger interval, operators at 100% busy, memory climbing, checkpoints getting slower.

**How engines handle it:**
- **Kafka (pull-based):** consumers fetch at their own pace, so the log itself is the buffer; backpressure appears as **lag**, bounded by retention. If lag exceeds retention, you lose data, so alert well before that.
- **Flink:** credit-based flow control between operators; a slow downstream task stops granting credits, upstream buffers fill, and the slowdown propagates back to the source, which reads slower from Kafka. The web UI's backpressure/busy metrics show where the bottleneck is.
- **Spark Structured Streaming:** micro-batches; control batch size with `maxOffsetsPerTrigger` / `maxFilesPerTrigger` (and `maxBytesPerTrigger` on Databricks) so a backlog is consumed in bounded chunks rather than one giant batch that OOMs.
- **Push systems (HTTP ingestion, webhooks):** you must implement it with bounded queues, `429 Too Many Requests` with `Retry-After`, rate limiting and load shedding.

**Designing for it:**
1. **Buffer** with a durable log (Kafka) between bursty producers and consumers.
2. **Scale out** consumers: up to the partition count, or more partitions planned ahead.
3. **Find the bottleneck operator** (slow sink? hot key? external lookups?) and fix it: batch sink writes, use async I/O for lookups, pre-aggregate hot keys.
4. **Bound work per batch** and give **priority** to critical streams.
5. **Shed or degrade gracefully** when overloaded: sample low-value events, drop debug logs, but never silently drop money-related events.

</details>

## Consistency and duplicates

<details><summary>[senior] How do you keep data consistent across systems (DB, lake, search index, cache)?</summary>

**Headline:** avoid **dual writes**. Have one system of record and propagate changes from its **log** (CDC or an outbox) to every other store, accepting eventual consistency with measurable lag.

**The dual-write problem:** an application writes to Postgres and then publishes to Kafka (or updates Elasticsearch). If the second step fails or the process crashes between them, the systems diverge permanently, and there's no transaction spanning both.

**Solutions:**
- **CDC from the database log** (Debezium, native CDC): the DB commit is the single source of truth, and every committed change appears in the stream in commit order.
- **Transactional outbox:** in the same DB transaction as the business change, insert an event row into an `outbox` table; a relay (or CDC on the outbox) publishes it. Atomic by construction.
- **Idempotent, version-aware consumers** downstream, so replays and reordering converge (`apply if version > current`).

**Consistency inside the lakehouse:** table formats give **snapshot isolation** per table: readers see a committed version, never half-written files. But there are **no multi-table transactions** in most engines, so a fact and its dimension can be momentarily out of sync. Mitigations: publish related tables together via a view swap or a "publish" step after all are validated, or expose a consistent snapshot version/timestamp to consumers.

**Reconciliation as the safety net:** periodically compare counts, sums and checksums per partition between source and target, and alert on drift (see the reconciliation question).

**Senior framing:** state the consistency model explicitly per consumer ("search may lag the DB by up to 30 seconds; finance reports read the reconciled daily snapshot").

</details>

<details><summary>[senior] What deduplication strategies do you use, and where in the pipeline?</summary>

**Headline:** duplicates come from at-least-once delivery, retries, replays and source quirks. I dedupe **as early as is cheap, on a well-defined key, with bounded state**, and make sinks idempotent so leftover duplicates don't matter.

**Define "duplicate" first:** the same event delivered twice (same `event_id`), or multiple versions of the same entity (keep the latest by version), or semantically equal records without an ID (hash of normalised fields)?

**Techniques:**
- **Batch:** `ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY ingest_time DESC) = 1`, or `dropDuplicates(["event_id"])` within the partition being processed. For entities: keep the latest by `(updated_at, sequence)`.
- **Streaming:** `dropDuplicatesWithinWatermark` (Spark 3.5+) or `dropDuplicates` with a watermark so state expires; Flink keyed state with TTL. The dedup window must cover the realistic duplicate delay (retries usually arrive within minutes; replays can be days later, which the idempotent sink handles).
- **At the sink:** `MERGE` on the key (insert only if not exists), primary keys in serving DBs, Kafka idempotent producers to avoid producer-retry duplicates.
- **Cross-batch duplicates:** a batch job processing day D can receive an event already loaded on day D-1. Either MERGE into the target, or keep a lookup of recent IDs (a bounded window).
- **Very high volume:** Bloom filters for "probably seen" checks, with exact verification on hits.

**Trade-offs:** dedup state costs memory and storage; too short a window lets duplicates through; deduping on the wrong key silently drops legitimate events (e.g. two purchases of the same item in the same second). Monitor the duplicate rate as a data-quality metric, because a spike usually signals an upstream retry storm.

</details>

<details><summary>[senior] An upstream team changes a schema. How do you design for schema evolution without breaking pipelines?</summary>

**Headline:** classify changes as **compatible or breaking**, enforce compatibility at the producer boundary, and make consumers tolerant of compatible changes.

**Compatible (usually safe):** adding an optional/nullable column, widening types (int → long), adding enum values *if* consumers handle unknown values.
**Breaking:** removing or renaming columns, changing types incompatibly, changing semantics (amount in cents → dollars), making a field required, changing the key or grain.

**Mechanisms:**
- **Schema registry with compatibility rules** (Avro/Protobuf, `BACKWARD`/`FORWARD`/`FULL`) so producers can't publish breaking changes to a topic.
- **Data contracts:** a versioned spec (schema, semantics, SLAs, owner), with CI checks on the producer side that fail the PR if a change breaks the contract.
- **Bronze absorbs drift:** land raw data with schema evolution enabled (Delta `mergeSchema`, Auto Loader `schemaEvolutionMode` / rescued data column), so unexpected fields are captured rather than dropped or crashing ingestion.
- **Silver is explicit:** select and cast columns explicitly, never `SELECT *` into curated tables, so new columns don't leak downstream until modelled.
- **Breaking changes get a new version:** `orders_v2` topic or table, run in parallel, migrate consumers, then deprecate v1 with a sunset date.
- **Detection:** schema-change monitors alert on any new, removed or type-changed field, even when ingestion continues.

**Semantic changes** are the dangerous ones: a column with the same name and type but a different meaning passes every schema check. Only contracts, documentation and distribution monitors (e.g. the mean of `amount` jumps 100×) catch them.

</details>

## Failure handling

<details><summary>[senior] How do you handle retries, poison messages and dead-letter queues?</summary>

**Headline:** retry **transient** failures with backoff; quarantine **permanent** failures (bad records) to a dead-letter queue/table with enough context to fix and replay them; never let one bad record block the stream.

**Classify errors:**
- *Transient:* timeouts, throttling (429/503), broker leader elections, lock contention → retry with exponential backoff + jitter, bounded attempts, and idempotent operations.
- *Permanent, record-level:* unparseable JSON, schema violations, impossible values → don't retry; send to a **DLQ** with the raw payload, error type, message, source topic/partition/offset, timestamp and pipeline version.
- *Permanent, systemic:* bad config, missing table, auth failure → fail fast and page; retrying just burns time.

**Poison message:** a record that always fails. Without a DLQ, an at-least-once consumer retries it forever and the partition stalls (head-of-line blocking).

**Operating DLQs:**
- Alert on DLQ **rate** (not just existence); a spike usually means an upstream change.
- Provide **replay tooling**: fix the code or data, then re-inject DLQ records into the main flow (idempotency makes this safe).
- Set retention and ownership; a DLQ nobody reads is silent data loss.
- For ordered streams, decide whether a DLQ'd record must block later records for the same key (e.g. account balance events) by parking the key or quarantining the whole key.

**Batch equivalent:** a quarantine table for rows failing validation, with a threshold. If more than X% of rows fail, fail the whole job (systemic issue); otherwise publish the valid rows and report the rejects.

</details>

<details><summary>[senior] How do you design pipelines so you can replay or reprocess history?</summary>

**Headline:** keep **immutable raw data**, make transformations **deterministic functions of their inputs and code version**, and make outputs **replaceable**.

- **Raw retention:** bronze tables or long-retention topics (Kafka tiered storage, or archiving the topic to object storage). Retention is a business decision: how far back might you need to recompute?
- **Deterministic logic:** no `now()` or random values in business logic; pass the logical run date as a parameter; pin reference data versions (as-of joins to SCD2 dimensions rather than "current" lookups).
- **Versioned code and outputs:** record the code version (git SHA) and run parameters in output metadata; table formats keep versions for time travel and rollback.
- **Replaceable outputs:** partition overwrite/MERGE; downstream jobs triggered for the replayed range.
- **Streaming replay:** reset consumer offsets or start a new job from a timestamp with a **new checkpoint** and a new output table, run it in parallel, compare, then swap ("blue/green" for streams). Kappa architecture formalises this.
- **Cost guardrails:** replaying 3 years of events is expensive, so keep compacted snapshots (e.g. daily entity snapshots) so most replays can start from a snapshot instead of the beginning of time.

</details>

<details><summary>[senior] Sources hard-delete rows. How do you propagate deletes correctly?</summary>

**Headline:** incremental extracts based on `updated_at` **can't see hard deletes**, so you need a mechanism that does: CDC, soft deletes, or periodic full comparison.

- **Log-based CDC** (Debezium, native CDC) emits delete events (with the key and, ideally, the before-image). Apply them with `MERGE … WHEN MATCHED AND op = 'd' THEN DELETE` (or set `is_deleted`/`valid_to` for SCD2 history).
- **Soft deletes at the source** (`deleted_at` column) turn deletes into updates that incremental extracts can see. This is the best option if you can influence the source.
- **Full key comparison:** periodically extract all primary keys (cheap: keys only) and anti-join against the target to find deleted keys. Works for any source, costs a full key scan.
- **Delete semantics downstream:** decide per table whether a delete should remove history (GDPR erasure must; analytics may want to keep the fact that it existed) and propagate through all derived tables. Lineage tells you where.
- **Table formats:** deletes rewrite files (copy-on-write) or write deletion vectors (merge-on-read); then `VACUUM`/expire snapshots so deleted data is physically removed when required.

</details>

## Incremental processing and verification

<details><summary>[senior] What are the incremental processing strategies, and what can go wrong with each?</summary>

**Headline:** incremental processing means each run reads only what changed since the last successful run. Choose the change-detection mechanism by what the source can guarantee.

| Strategy | How | Pitfalls |
|---|---|---|
| **High-watermark column** (`updated_at > last_max`) | Query the source for rows changed since the stored watermark | Misses hard deletes; misses rows whose `updated_at` isn't maintained by every writer; clock skew and long transactions commit rows with older timestamps (**use an overlap window** and dedupe/MERGE); ties at the boundary |
| **Monotonic ID** (`id > last_id`) | For append-only tables | Misses updates; IDs from sequences can commit out of order |
| **Log-based CDC** | Read the DB's transaction log | Operational complexity (slots/binlog retention, snapshots, schema changes), but sees every change including deletes |
| **Partition-based** (process new `dt` partitions) | For files landing by date | Late files for old partitions; partial partitions read too early (use completion markers or file-arrival triggers) |
| **File-arrival / notification** (Auto Loader, S3 events) | Track processed files in a checkpoint | Overwritten files with the same name; out-of-order arrival |
| **Table format change feeds** (Delta CDF, Iceberg incremental reads) | Read changes between table versions | Retention of change data; must handle update pre/post images correctly |

**Universal rules:** persist the checkpoint/watermark **only after** the sink commit succeeds, use an overlap window plus idempotent writes to handle boundary issues, and run a periodic full reconciliation to catch what incremental logic missed.

</details>

<details><summary>[senior] How do you reconcile a target against its source to prove nothing was lost?</summary>

**Headline:** compare **cheap aggregates at a meaningful granularity** between source and target on a schedule, and alert on drift beyond a tolerance.

- **Counts per partition/day/key range:** source `COUNT(*)` grouped by date vs target. A mismatch narrows the problem immediately.
- **Sums and checksums:** `SUM(amount)`, `SUM(hash(key))` or an order-independent hash aggregate per partition, which catches changed values, not just missing rows.
- **Key-level diffs on mismatch:** only when aggregates disagree, pull keys for that partition and anti-join both ways to list missing and extra rows.
- **Account for timing:** compare up to a cut-off that both sides have fully processed (e.g. CDC lag < 5 min, so reconcile up to T-1h).
- **Financial data:** reconcile against an independent control total (ledger balances, payment provider settlement files), not just against our own extract.
- **Automate and record:** results go to a reconciliation table (partition, source value, target value, diff, status) so trends and audits are easy, and failures block publishing for critical tables.

</details>

<details><summary>[senior] How do you make sure no data is lost when ingesting from Kafka into a lakehouse?</summary>

**Headline:** commit the **sink first and the offsets second** (or atomically together), never the other way round, and size retention so a long outage can't age data out before you consume it.

1. **Producer side:** `acks=all`, `min.insync.replicas=2` with replication factor 3, idempotent producer enabled, so acknowledged writes survive a broker failure.
2. **Consumer side:** disable auto-commit (or use Structured Streaming/Flink checkpoints); offsets advance only after the micro-batch is durably committed to the Delta/Iceberg table. A crash then replays the batch, and the idempotent sink (batch-id tracking, MERGE) prevents duplicates.
3. **Retention headroom:** topic retention ≫ your worst realistic downtime + backlog drain time (e.g. 7 days for a pipeline with a 4-hour recovery target). Alert on consumer lag as a fraction of retention.
4. **Checkpoint durability:** checkpoints live on reliable storage and are versioned with the job. Changing a query in incompatible ways means a new checkpoint plus a controlled backfill, never deleting the checkpoint "to fix it" (that silently skips or duplicates data).
5. **Verification:** reconcile per-partition offsets consumed vs records written, and count records per hour on both sides.
6. **Schema failures:** malformed records go to a DLQ rather than failing the stream (or being dropped silently).

</details>
