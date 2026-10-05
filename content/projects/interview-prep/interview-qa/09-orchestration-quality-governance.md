---
title: "Orchestration, Data Quality and Governance Questions"
description: "Airflow/Dagster/dbt, data quality, contracts, observability, lineage, access control, PII and GDPR questions."
url: "/interview-prep/interview-qa/09-orchestration-quality-governance/"
hiddenInHomeList: true
showToc: true
weight: 9
---

# Orchestration, Data Quality and Governance Questions

> Operational excellence questions. Senior candidates are expected to own reliability, quality and compliance, not just pipelines.

Tags: **[core]** = expected at every level · **[senior]** = expected at senior/staff level.

## Orchestration and dbt

<details><summary>[core] What does an orchestrator do and not do?</summary>

Schedules and orders tasks, handles retries, dependencies, parameters, alerting and run history. It shouldn't do heavy data processing itself; it triggers Spark/dbt/warehouse jobs.

</details>

<details><summary>[senior] Airflow vs Dagster vs Databricks Workflows?</summary>

Airflow: task-centric, huge ecosystem, good for heterogeneous orchestration. Dagster: asset-centric with lineage, partitions and testing built in. Workflows: managed and lakehouse-native with zero infrastructure. Choose by ecosystem breadth vs asset awareness vs platform integration.

</details>

<details><summary>[senior] dbt incremental strategies?</summary>

append (inserts only), merge (upsert on unique_key), delete+insert, insert_overwrite (replace partitions). Choose by update patterns and engine. Add a lookback window for late data, and use full refresh as a safety valve.

</details>

<details><summary>[senior] What is slim CI in dbt?</summary>

Build and test only modified models and their downstream dependants (`state:modified+`) in a CI schema, deferring unchanged upstream references to production artifacts. Fast, cheap PR validation.

</details>

## Data quality

<details><summary>[core] What data quality dimensions do you monitor?</summary>

Completeness, uniqueness, validity, consistency, accuracy and timeliness/freshness, plus volume and schema changes. Pipeline health: lag, duration, failures.

</details>

<details><summary>[senior] Where should quality checks live and what happens on failure?</summary>

Shift left: contracts in producer CI, schema validation at ingestion, row-level expectations in silver (quarantine), dataset-level business rules and reconciliation in gold (block publish via WAP). Severity decides warn vs quarantine vs fail.

</details>

<details><summary>[senior] What is a data contract?</summary>

An agreement between a producer and its consumers covering schema, semantics, SLAs, quality rules, ownership and evolution policy, enforced automatically (schema registry, CI tests, ingestion validation).

</details>

<details><summary>[senior] How do you avoid alert fatigue in data observability?</summary>

Tier tables by criticality, seasonal baselines instead of static thresholds, consecutive-failure rules, dedupe incidents by root table using lineage, route to owners, feedback loops to tune sensitivity, and track alert precision.

</details>

## Governance and privacy

<details><summary>[core] RBAC vs ABAC?</summary>

RBAC grants permissions to roles/groups on objects. ABAC evaluates policies on attributes/tags (data classification, user region), so new tagged tables are protected automatically. Scales better for fine-grained, many-domain governance.

</details>

<details><summary>[senior] How do row filters and column masks work in a lakehouse catalog?</summary>

Functions attached to tables evaluated at query time with the caller's identity: masks transform column values (e.g. hide email unless in pii_readers); row filters restrict visible rows (e.g. by region membership). Applied uniformly across engines that go through the catalog.

</details>

<details><summary>[senior] How do you implement GDPR deletion in Delta tables?</summary>

Find subject data via catalog tags/lineage; batched DELETE/anonymise per table; physically remove with deletion-vector purge/OPTIMIZE and VACUUM within the legal window (time travel retention below the SLA); crypto-shredding for immutable stores; prevent resurrection on backfills/late data; audit evidence.

</details>

<details><summary>[senior] Pseudonymisation vs anonymisation?</summary>

Pseudonymised data can be re-identified with additional information (keys, mapping tables): still personal data under GDPR. Anonymised data cannot reasonably be re-identified (aggregation, k-anonymity) and falls outside GDPR scope.

</details>

<details><summary>[senior] What is data lineage used for?</summary>

Impact analysis before changes, root-cause analysis in incidents, compliance (where PII flows), trust (where numbers come from), and cost cleanup (unused tables). Column-level lineage is most valuable for PII and metric tracing.

</details>
