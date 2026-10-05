---
title: "Senior Deep Dive: Operating Data Pipelines at Scale"
description: "In-depth model answers on observability and SLOs, data quality strategy, incident response, testing, CI/CD, scaling 10×, cost, multi-tenancy, dependencies, freshness trade-offs, time zones, batch/stream consistency, migrations and build-vs-buy."
url: "/interview-prep/interview-qa/11-operating-pipelines-at-scale/"
hiddenInHomeList: true
showToc: true
weight: 11
---

# Senior Deep Dive: Operating Data Pipelines at Scale

> Building the pipeline is half the job; running it for years is the other half. These questions test whether you've owned production data systems: on-call, SLAs, cost, change management and growth. Answers lead with a headline, then the mechanism, then the trade-offs.

Tags: **[core]** = expected at every level · **[senior]** = expected at senior/staff level.

## Observability and quality

<details><summary>[senior] What do you monitor in a data platform, and how do you define SLAs, SLOs and SLIs for data?</summary>

**Headline:** monitor **the data itself** (freshness, volume, schema, distribution, quality) as well as **the pipelines** (runs, durations, resource use), and express reliability as SLOs on the things consumers care about.

**The five data health signals:**
1. **Freshness:** time since the latest data landed or partition completed (`now - max(event_time)` or `now - last_successful_publish`).
2. **Volume:** row counts per run or partition vs an expected band (seasonality-aware).
3. **Schema:** added, removed or type-changed columns.
4. **Distribution:** null rates, distinct counts, min/max/mean of key metrics, category mix.
5. **Lineage:** what's upstream/downstream, for impact analysis and root cause.

**Pipeline signals:** success/failure, duration vs baseline, retries, streaming lag, rows in/out per stage (detect silent drops), cost per run.

**SLI → SLO → SLA:**
- **SLI** (what you measure): "the `daily_revenue` partition for D is published and passes checks by 06:00 UTC".
- **SLO** (internal target): "99% of days in a rolling 90-day window".
- **SLA** (external commitment with consequences): "finance is notified by 06:30 if late; a fix within 4 business hours".
- An **error budget** (1% ≈ 1 late day per quarter) guides trade-offs: if it's spent, prioritise reliability work over features.

**Make it actionable:** alerts route to the owning team with context (which table, which check, the last good run, the downstream impact) and link to a runbook. Tier tables (tier 1: finance/regulatory → page; tier 3: exploratory → ticket) to avoid alert fatigue.

</details>

<details><summary>[senior] What's your data quality strategy? Where do checks live and what happens when they fail?</summary>

**Headline:** a layered strategy. **Contracts** stop bad data at the producer, **validation** at ingestion catches malformed records, **business rules** gate publishing of curated tables, and **monitoring** catches what nobody thought to test.

| Layer | Checks | On failure |
|---|---|---|
| Producer / contract | Schema compatibility, required fields, enums | Block the producer's deploy (CI) |
| Ingestion (bronze) | Parseable, schema-conformant, key present | Quarantine/DLQ the record; alert on rate |
| Transformation (silver) | Uniqueness of keys, referential integrity, accepted values, no unexpected nulls, row-count reconciliation | **Fail and don't publish** (critical) or warn |
| Publication (gold) | Business invariants (revenue ≥ 0, totals reconcile with the source system, YoY change within bounds) | Block publishing (write-audit-publish); keep yesterday's good data visible |
| Monitoring | Anomaly detection on volume, freshness, distributions | Alert the owner; investigate |

**Severity matters:** every check gets a severity (block / warn / info) and an owner. Blocking on non-critical checks causes stale dashboards and teaches people to ignore failures; never blocking lets bad numbers reach executives.

**Tools:** dbt tests and contracts, Great Expectations/Soda, Lakeflow expectations (`expect_or_drop`, `expect_or_fail`), Databricks Lakehouse Monitoring, observability platforms (Monte Carlo and similar).

**Senior add:** track quality as a product metric (incidents per month, time to detect, time to resolve), and prioritise checks by the cost of bad data in each table, not by ease of writing them.

</details>

<details><summary>[senior] A critical dashboard shows wrong numbers at 7am. Walk me through your incident response.</summary>

**Headline:** **stabilise → communicate → diagnose → fix → prevent**, in that order.

1. **Stabilise and contain (minutes):** confirm the issue (compare against a trusted source), then stop the bleeding. Mark the dashboard as "under investigation" (banner or status page), pause downstream jobs that would propagate the bad data (exports to finance, reverse ETL to the CRM), and if possible **roll back** the table to the last good version (time travel / `RESTORE`).
2. **Communicate:** notify affected stakeholders with what's wrong, what to avoid using and the next update time. Silence destroys trust faster than the bug.
3. **Diagnose using lineage:** walk upstream. Did the pipeline run? Which step's output first looks wrong? Check recent changes (deploys, upstream schema changes, config), data health signals (volume drop? null spike? duplicate spike?), and source-system incidents.
4. **Fix and backfill:** correct the code or data, re-run the affected partitions idempotently, validate against the source, then republish and notify.
5. **Prevent:** a blameless post-mortem with timeline, root cause, why it wasn't caught, and action items, typically a new automated check that would have caught it, a contract with the upstream team, or a test in CI.

**What interviewers want:** calm prioritisation, rollback before root cause, proactive communication, and turning the incident into a systemic improvement.

</details>

## Engineering practices

<details><summary>[senior] How do you test data pipelines?</summary>

**Headline:** test **logic** with unit tests, **integration** with small realistic runs, **data** with in-pipeline checks, and **changes** with diffs against production.

- **Unit tests:** transformations as pure functions (`DataFrame → DataFrame`, SQL models) tested on tiny handcrafted inputs, including edge cases (nulls, duplicates, late records, time zones, empty input).
- **Contract tests:** producers and consumers verify the agreed schema and semantics in CI.
- **Integration tests:** run the pipeline end to end on a small sample in an isolated environment (ephemeral schema/catalog), asserting row counts, keys and a few golden values.
- **Data tests in production:** uniqueness, not-null, referential integrity, accepted values and reconciliation, running on every load (see the quality question).
- **Regression / data diff:** for a change to an existing model, compare the new output against production on the same input (row counts, key metrics, column-level diffs). dbt slim CI + data-diff tools do this per PR.
- **Idempotency test:** run twice and assert the same result.
- **Performance tests** for critical jobs on production-sized data before big changes.

**What not to do:** rely only on "it ran without errors". Most data bugs produce wrong numbers, not exceptions.

</details>

<details><summary>[senior] What does CI/CD look like for a data platform?</summary>

**Headline:** everything is code (pipelines, SQL models, infrastructure, permissions, data quality rules), every change goes through a PR with automated checks, and promotion through environments is automated and reversible.

**Pipeline:**
1. **PR checks:** lint/format (sqlfluff, ruff), unit tests, compile/parse models (`dbt parse`), contract checks, build only the modified models and their children in an ephemeral schema with production data deferred (**slim CI**), data diff against production, code-owner review.
2. **Merge → deploy to staging/test** with integration tests on realistic data.
3. **Promote to production** via the same artifact (Databricks Asset Bundles, Terraform, container images), never manual notebook edits.
4. **Post-deploy:** smoke checks, monitoring of the first runs, quick rollback (redeploy the previous version; tables restorable by version).

**Environments:** dev/test/prod separated by catalog or workspace with least-privilege service principals; no human write access to prod data.

**Data-specific challenges:** you can't easily "roll back" data written by a buggy release. Hence write-audit-publish, table versioning, and backfill tooling as part of the release process. Schema changes need migration plans (expand → migrate → contract).

</details>

<details><summary>[senior] Your pipelines need to handle 10× more data next year. What changes?</summary>

**Headline:** find which dimension grows (volume, velocity, number of sources, number of consumers), then remove the bottlenecks that scale super-linearly. Most systems break on **coordination, layout and cost** before raw compute.

**Checklist:**
- **Ingestion:** Kafka partitions and broker capacity sized for 10× peak (partitions can't be reduced and repartitioning breaks key ordering, so plan ahead); producers batching and compression.
- **Processing:** move full reprocessing to **incremental** (CDC, change feeds, `MERGE` on recent partitions); remove driver bottlenecks (`collect`, Python loops); fix skew and hot keys, which get worse with volume.
- **Storage layout:** partitioning and clustering for the larger volume; compaction to avoid small-file explosions; retention and tiering (hot/warm/cold).
- **Serving:** pre-aggregations and materialised views; a real-time OLAP store if interactive queries over raw events become too slow.
- **Metadata and orchestration:** thousands of tasks/partitions stress schedulers and catalogs, so group work and use data-aware triggers.
- **Cost model:** project cost at 10× (it's often the binding constraint), add per-domain chargeback, and use autoscaling, spot and serverless where appropriate.
- **People and process:** self-serve ingestion and templates so the platform team doesn't become the bottleneck.

**Then validate:** load-test with synthetic or replayed data at 10× before it's real.

</details>

<details><summary>[senior] How do you reduce the cost of a data platform without hurting reliability?</summary>

**Headline:** make cost **visible**, then attack the biggest line items: **wasted compute, unnecessary data scanned, and idle resources**.

1. **Visibility:** tag all compute and storage by team/pipeline; dashboards of cost per job, per table and per query; owners review top spenders monthly.
2. **Compute:** right-size clusters (look at utilisation), autoscaling and auto-termination, job clusters or serverless instead of always-on all-purpose clusters, spot instances for fault-tolerant batch, Photon or vectorised engines where they pay off.
3. **Scan less:** partition pruning, clustering/Z-order, column pruning, incremental instead of full refreshes, materialising heavily reused intermediates.
4. **Storage:** retention policies, `VACUUM`/snapshot expiry, compression (zstd), compaction, tiering cold data, deleting unused tables (lineage + access logs show what nobody reads).
5. **Workload hygiene:** kill zombie jobs and duplicate pipelines, lower the refresh frequency where the business doesn't need it ("does this really need to run every 5 minutes?").
6. **Warehouse/BI:** query result caching, warehouse sizing and auto-stop, query timeouts, aggregate tables for dashboards.

**Guardrails:** budgets and alerts per team, cluster policies limiting instance types and max workers, and cost review in design docs. Reliability-critical paths keep headroom; savings come from waste, not from cutting margins on tier-1 SLAs.

</details>

<details><summary>[senior] How do you handle multi-tenant pipelines and noisy neighbours?</summary>

**Headline:** isolate tenants **logically by default and physically where needed**, so one tenant's volume or failure doesn't affect others' SLAs.

- **Fairness in processing:** per-tenant queues or weighted fair scheduling; limit per-tenant concurrency; big tenants get dedicated partitions, clusters or "cells".
- **Failure isolation:** process tenants independently (separate tasks or partitions), so one tenant's bad data quarantines that tenant only.
- **Hot keys:** a whale tenant on a key-partitioned system creates hot partitions, so salt or give it a dedicated partition (see [hot keys](/interview-prep/learn/system-design/05-hot-keys/)).
- **Data isolation and security:** row-level security, per-tenant catalogs or schemas for strict isolation, encryption keys per tenant if contracts require it.
- **Observability per tenant:** freshness, volume and cost by tenant, for SLAs and chargeback.

</details>

<details><summary>[senior] How do you manage dependencies between pipelines owned by different teams?</summary>

**Headline:** depend on **data, not schedules**. Trigger downstream work when upstream data is published and valid, and make the contract between teams explicit.

- **Anti-pattern:** "the upstream job usually finishes by 3am, so we schedule ours at 4am". When upstream is late you process incomplete data; when it's early you waste time.
- **Data-aware scheduling:** Airflow datasets/assets, Dagster asset sensors, Databricks table-update triggers, or a completion marker/event ("partition D published") that downstream subscribes to.
- **Publish semantics:** upstream publishes atomically after validation, with metadata (completeness, version), so downstream can trust "published" means "complete and checked".
- **Cross-team contracts:** schemas, SLAs (published by 05:00), change notification process, owner and escalation path.
- **Lineage** across teams for impact analysis; deprecations announced with timelines.
- **Timeouts and fallbacks:** if upstream misses its SLA, downstream alerts (doesn't wait forever) and may publish with clear "incomplete" flags if the business prefers partial data.

</details>

<details><summary>[senior] How do you choose between batch every few hours, micro-batch and real-time streaming?</summary>

**Headline:** pick the **slowest freshness the business can tolerate**, because cost and complexity rise steeply as latency drops.

| Freshness need | Typical approach | Why |
|---|---|---|
| Daily / hourly | Scheduled batch (incremental) | Cheapest, simplest, easy reprocessing |
| 1-15 minutes | Micro-batch streaming (Structured Streaming, scheduled incremental jobs) | Good balance; reuses batch semantics |
| Seconds | True streaming (Flink, Kafka Streams, Spark real-time mode) + a real-time serving store | Needed for fraud, operations, user-facing features |
| Sub-second decisions | Online services with streaming features, not analytics pipelines | Different SLAs, on the request path |

**Questions to ask:** what decision is made with this data, and how much worse is it if the data is 1 hour old vs 1 minute? Who's on call for a real-time pipeline? What happens on failure: is a stale value acceptable?

**Senior nuance:** a streaming pipeline is "always running" software, with on-call, state management and upgrades, so justify it with business value. Often the best design is hybrid: a streaming path for a few real-time metrics and a batch path for the full, reconciled dataset.

</details>

<details><summary>[core] What time zone and DST pitfalls do you watch for in pipelines?</summary>

**Headline:** store and process in **UTC**, convert at the presentation layer, and be explicit about which calendar a "day" belongs to.

- **Store timestamps in UTC** (or with an offset); keep the original local time zone as a column if business logic needs it.
- **"Daily" is ambiguous:** a UTC day isn't the business day for a store in Tokyo. Define reporting days per entity (`local_date` computed with the entity's time zone) and partition accordingly.
- **DST:** local days can have 23 or 25 hours; local times can repeat (fall back) or not exist (spring forward). Hourly aggregates in local time must handle duplicate hours, and schedules defined in local time can run twice or be skipped. Prefer cron in UTC.
- **Naive timestamps:** strings without zone info are interpreted differently by different engines/sessions (Spark `spark.sql.session.timeZone`), so set session time zones explicitly in jobs.
- **Late-night boundaries:** events near midnight may land in different days in different systems; reconciliation must use the same day definition.

</details>

<details><summary>[senior] How do you keep batch and streaming results consistent (the Lambda drift problem)?</summary>

**Headline:** avoid two implementations of the same logic. **One codebase, one definition**, with streaming providing a fast provisional view and batch the authoritative, reconciled view.

- **Lambda architecture drift:** separate batch and speed layers with different code inevitably diverge (different dedup rules, time zones, late-data handling), and users see two different numbers.
- **Unify the logic:** engines like Spark (same DataFrame code for batch and streaming), Flink (unified batch/stream API) or SQL models run in both modes; or Kappa (streaming only, replay for reprocessing).
- **If both paths exist:** label real-time numbers as provisional, reconcile daily (streaming totals vs batch totals per key/day with tolerances), and have batch **overwrite** the streaming-derived values once finalised.
- **Shared semantics documented:** event time vs processing time, dedup key, lateness cut-off, currency conversion timing.

</details>

<details><summary>[senior] How would you migrate a critical pipeline to a new platform with zero downtime?</summary>

**Headline:** **run old and new in parallel, compare outputs automatically, switch consumers gradually, and keep the old path until confidence is proven**.

1. **Inventory:** sources, outputs, consumers (lineage + access logs), SLAs, and hidden behaviours (implicit sorting, rounding, time zone handling).
2. **Build the new pipeline from the same sources** (not from the old pipeline's outputs, which perpetuates its bugs).
3. **Shadow run:** both pipelines produce outputs daily; an automated **reconciliation** compares row counts, keys and aggregates per partition, with an agreed tolerance. Investigate every difference: some will be old bugs, so decide explicitly whether to replicate or fix them (and communicate fixes).
4. **Switch consumers incrementally:** via views or aliases that can be repointed (a consumer reads `orders` → repoint from old to new), starting with low-risk consumers.
5. **Rollback path:** repoint back instantly if issues appear.
6. **Decommission** after an agreed period of clean parallel runs (e.g. one month-end close), then archive the old outputs.

**For streaming:** run the new consumer group from the same topic into a new sink, compare, then switch readers.

</details>

<details><summary>[senior] Build vs buy for ingestion (Fivetran/Airbyte vs custom pipelines)?</summary>

**Headline:** **buy for commodity connectors, build for differentiating or unusual sources**, and decide on total cost of ownership, not license cost alone.

**Buy (managed connectors) when:** standard SaaS/DB sources (Salesforce, Stripe, Postgres), the team is small, time-to-value matters, and schema drift handling, API changes and rate limits would otherwise eat engineering time.

**Build when:** sources are proprietary or high-volume where per-row pricing explodes; you need low latency or custom CDC semantics; there are strict data residency/security constraints; or the connector is core to the product.

**Evaluate:** cost at projected volume (MAR-based pricing grows with data), reliability and SLAs, schema change handling, delete and history support, observability, vendor lock-in and exit plan, security reviews.

**Common outcome:** a hybrid, with managed connectors for the long tail of SaaS sources, custom/streaming pipelines for the core high-volume event and CDC data, and both landing in the same bronze layer under the same contracts and monitoring.

</details>

<details><summary>[senior] How do distributed transactions work across services, and what do data engineers use instead?</summary>

**Headline:** classic two-phase commit (2PC) gives atomicity across systems but is slow, blocking and poorly supported by modern data systems. Data platforms use **logs, outboxes, idempotency and sagas** instead.

- **2PC:** a coordinator asks all participants to *prepare*, then *commit*. If the coordinator fails after prepare, participants are stuck holding locks. Kafka transactions and Flink's two-phase-commit sinks use 2PC-style protocols internally, but in a constrained setting.
- **Outbox + CDC:** make the business write and the event write atomic in one database, then propagate (see the consistency question).
- **Sagas:** a sequence of local transactions, each with a **compensating action** (reserve inventory → charge payment → if payment fails, release inventory). This gives eventual consistency with explicit failure handling.
- **Idempotency keys:** every step can be retried safely.
- **In the lakehouse:** single-table ACID commits; for multi-table publishes, stage everything and expose it via an atomic pointer swap (views, catalog-level transactions where available).

</details>
