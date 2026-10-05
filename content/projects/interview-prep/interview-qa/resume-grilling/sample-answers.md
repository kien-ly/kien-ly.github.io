---
title: "Resume Grilling: Worked Example for a Senior Lakehouse and AI Data Engineer"
description: "How interviewers drill into a senior data engineering resume, with model answers for lakehouse, streaming, governance, LLM migration and leadership projects."
url: "/interview-prep/interview-qa/resume-grilling/sample-answers/"
hiddenInHomeList: true
showToc: true
weight: 12
---

# Resume Grilling: Worked Example

> A worked example built on a common senior profile: **a data engineer who owns a large dbt lakehouse on Databricks across several business domains, runs streaming ingestion, built governance layers for GDPR, and is now building LLM systems (RAG, multi-agent) on top of the platform.** Replace the bracketed placeholders with your own facts. Never claim numbers you can't defend.

**Example resume bullets used below:**
1. Own a production dbt lakehouse with 300+ models and 40 custom macros across 8 business domains, serving 1,000+ users.
2. Architected a 6-layer medallion architecture with dedicated GDPR and ABAC security layers, Unity Catalog, row-level security and column masking.
3. Built 45+ streaming pipelines with Spark Structured Streaming and AutoLoader with schema evolution, error handling and retries.
4. Built a multi-agent LLM system with RAG to automate legacy warehouse → Databricks SQL migration.
5. Optimised Spark/Delta workloads (Z-ordering, liquid clustering, compaction, skew handling, AQE).
6. Led cloud migration of 50+ legacy ETL pipelines to Azure Data Factory + Synapse; built a data quality framework.
7. Mentored 6+ engineers; set coding standards and PR review workflows.

How to use this page: for each bullet, interviewers go **3–5 levels deep**. The questions below follow the real drill-down path. Practise answering out loud in 1–2 minutes each.

---

## 1. The dbt lakehouse (300+ models, 8 domains)

<details><summary>Walk me through the architecture of the lakehouse you own.</summary>

Structure the answer as **sources → layers → consumers → operations**:
"Data lands from [N] source systems (CDC from operational databases, files, APIs) into bronze via AutoLoader/streaming. We have six layers: landing, bronze, silver (conformed entities), a GDPR layer where direct identifiers are pseudonymised and consent-filtered, gold domain marts, and a secure serving layer with ABAC policies. Transformations are dbt on Databricks, organised per domain, with a shared macro package. Consumers are [BI tool] dashboards for ~1,000 users across [regions], plus data science notebooks. Orchestration is [Workflows/Airflow]; CI runs slim dbt builds on every PR."
Then pause and let them choose where to go deeper.
</details>

<details><summary>Why six layers instead of standard bronze/silver/gold?</summary>

Each extra layer has a distinct, enforceable contract: "nothing downstream of the GDPR layer contains direct identifiers" and "everything consumers query goes through ABAC policies". That makes compliance auditable by construction instead of by convention. Trade-off: more storage and more models to maintain. We mitigated with views where a layer is thin and with macros that generate the boilerplate.
</details>

<details><summary>How do 8 domains share logic without copying it?</summary>

A versioned internal dbt package with ~40 macros: surrogate keys, audit columns, GDPR masking, ghost/unknown-member records for dimensions, dynamic schema resolution per environment, and generic data quality tests. Domains pin a version; changes go through PR review by the platform team; breaking changes get a new major version. This turned standards from wiki pages into code.
</details>

<details><summary>How do you keep a 300-model dbt project fast to build and safe to change?</summary>

Incremental models for large facts (merge with lookback windows for late data), slim CI (`state:modified+` with prod deferral), tagging/selectors per domain so jobs run independently, model contracts on public gold models, tests on every primary/foreign key, and [run time before → after] from moving full refreshes to incremental. Mention one concrete incident that a test caught before production.
</details>

<details><summary>What breaks most often, and what did you do about it?</summary>

Pick a real pattern. Example: upstream schema changes and late-arriving source data. Fixes: schema evolution handling with rescue columns in bronze and contracts in silver, freshness checks with alerts routed to the owning domain, and a backfill runbook with idempotent partition overwrites. Show you measured improvement: [incidents/month before vs after].
</details>

<details><summary>If you rebuilt it from scratch today, what would you change?</summary>

A strong answer names 1–2 real weaknesses: e.g. "I'd introduce a semantic/metrics layer earlier, because metric definitions drifted between domains", or "I'd use liquid clustering from day one instead of partitioning some tables by high-cardinality columns." Senior signal: honest self-critique with a reason.
</details>

---

## 2. Governance: GDPR and ABAC layers

<details><summary>How exactly do row-level security and column masking work in your setup?</summary>

Unity Catalog row filters and column masks are SQL functions bound to tables and evaluated with the querying user's identity. Columns tagged as PII are masked unless the user is in an approved group; row filters restrict rows by attributes such as [country/business unit] mapped from IdP groups. Policies are tag-driven, so a new table with correctly tagged columns is protected without new grants.
</details>

<details><summary>How do you handle a GDPR deletion request across all layers?</summary>

Deletion requests table → identify all keys for the subject → batched deletes/anonymisation per table found via tags/lineage → physical removal (deletion vectors purged, VACUUM within the legal window) → verification queries → audit record. Downstream layers only hold pseudonymous keys, so most deletions are a mapping-table delete plus a few silver tables. Mention your actual SLA ([30] days) and how you prove completion.
</details>

<details><summary>How do you know PII doesn't leak into new tables?</summary>

Automated PII detection on new columns, tagging enforced in CI for gold models, audit logs reviewed for access to sensitive tags, and lineage to find derived copies. Be honest about gaps (e.g. ad-hoc notebooks) and how you mitigated them (personal schemas with TTLs, no PII allowed without approval).
</details>

---

## 3. Streaming pipelines (45+)

<details><summary>Why Structured Streaming + AutoLoader rather than batch for these sources?</summary>

Give the business reason first: [freshness requirement] for [use case]. AutoLoader also gives incremental file discovery with exactly-once tracking, so even "batch-like" sources benefit from `availableNow` triggers. Be precise about which pipelines truly run continuously vs incremental batch, since interviewers respect that nuance.
</details>

<details><summary>How do you handle schema evolution in streaming?</summary>

AutoLoader with schema location and `addNewColumns` (stream restarts once on new columns, by design) or `rescue` mode for strict tables; unexpected data goes to `_rescued_data`; silver enforces types and quarantines violations; breaking changes go through a contract process with the producer.
</details>

<details><summary>What does "error handling and retries" mean concretely?</summary>

Separate transient failures (cloud storage throttling, cluster loss → job retries with backoff; checkpoints make restarts safe) from data errors (malformed records → rescue column/quarantine table, alert if rate exceeds threshold). Exactly-once comes from checkpoints + idempotent Delta writes; `foreachBatch` sinks use MERGE so replays don't duplicate.
</details>

<details><summary>A stream fell behind by 6 hours. Walk me through what you'd do.</summary>

Check input rate vs processing rate, batch duration vs trigger, skewed partitions, small-file explosion in the source, state store growth (missing watermark), and slow sinks (MERGE scanning too many files). Short-term: scale up, limit `maxFilesPerTrigger` to stabilise. Long-term: fix the root cause and add lag alerting.
</details>

---

## 4. LLM multi-agent SQL migration

<details><summary>Explain the architecture of your SQL migration system.</summary>

"The input is legacy [dialect] SQL. A classifier routes simple statements to deterministic translation; complex ones go to an agent pipeline: one agent analyses the statement and dependencies, retrieval pulls similar already-migrated examples and dialect rules from a vector store (RAG with [ChromaDB]), a generator produces Databricks SQL, and a validator compiles it and compares results against the legacy system on sample data. Failures loop back with the error message for repair, up to N attempts; low-confidence cases go to human review, and every reviewed fix is added to the knowledge base."
</details>

<details><summary>Why multiple agents rather than one prompt?</summary>

Separation of concerns makes each step testable and cheaper (smaller contexts, smaller models for simple steps) and makes failures diagnosable ("generation was fine, validation failed on NULL semantics"). Trade-off: more orchestration complexity and latency. Use a single prompt when the task is simple enough.
</details>

<details><summary>How do you know the migrated SQL is correct?</summary>

The honest answer interviewers want: you don't trust the LLM, you trust **validation**. Compile/EXPLAIN on the target, then result-set equivalence on representative data (row counts, column checksums, row diffs on keys with tolerance rules for floats and timestamps), plus generated tests. Report the auto-validated rate and the human-review rate instead of claiming "fully automated".
</details>

<details><summary>What were the hardest dialect issues?</summary>

Have 2–3 concrete examples ready: NULL handling in string concatenation, integer division, date functions and week numbering, implicit casts, procedural constructs (loops, temp tables) that must become set-based SQL or dbt models. Interviewers love specific examples.
</details>

<details><summary>How did you measure the impact?</summary>

Use real numbers only: objects migrated, % auto-validated, average human minutes per object before vs after, defects found post-migration. If numbers are confidential, give ratios ("roughly a third of the manual effort").
</details>

---

## 5. Performance optimisation

<details><summary>Tell me about the biggest performance win you delivered.</summary>

STAR with numbers: Situation (job/table, size, runtime/cost), Task (target), Action (diagnosis via Spark UI: skewed join, small files, no data skipping; fixes: liquid clustering on filter keys, OPTIMIZE, broadcast hint/AQE skew join, removing a Python UDF), Result ([runtime before → after], [cost saved]). Say how you verified it and kept it from regressing.
</details>

<details><summary>Z-ordering vs liquid clustering: which did you use and why?</summary>

Liquid clustering for new and evolving tables (incremental, keys changeable, no partition small-file issues); Z-order on older partitioned tables until migration. Explain how you chose keys from query patterns (system tables / query history).
</details>

---

## 6. Migration and data quality (earlier roles)

<details><summary>How did you migrate 50+ on-prem ETL pipelines to the cloud without breaking reports?</summary>

Inventory + dependency order, migrate in waves, parallel runs with automated reconciliation (counts and aggregates per key), business sign-off per wave, cutover and decommission. Mention one thing that went wrong and how you handled it.
</details>

<details><summary>Your data quality framework reduced issues by 90%. How was that measured?</summary>

Define the baseline (incidents/tickets per month or failed checks reaching consumers), the measurement window, and what the framework did (profiling, row-level validation rules, quarantine, alerting). Be ready to explain the denominator. Unclear metrics invite skepticism.
</details>

---

## 7. Leadership and mentoring

<details><summary>How did you raise the bar for the 6 engineers you mentored?</summary>

Concrete mechanisms: coding standards and PR review checklist, pairing on complex models, design reviews for new domains, internal talks, onboarding guides. Evidence: [faster onboarding, fewer production incidents, promotions]. Senior signal: you scaled yourself through systems, not heroics.
</details>

<details><summary>Tell me about a technical disagreement with another senior engineer.</summary>

Pick a real one (e.g. partitioning strategy, adopting DLT vs dbt). Show you listened, framed options with data (benchmarks, cost), agreed on decision criteria, and committed to the outcome even if not your preference.
</details>

---

## Universal follow-ups to prepare for every bullet

1. "What was **your** part versus the team's?"
2. "What would you do differently?"
3. "What was the hardest bug or incident?"
4. "How did you measure success?"
5. "What would break first at 10× scale?"
6. "How much did it cost to run, and how did you control it?"
