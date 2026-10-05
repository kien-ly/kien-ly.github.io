---
title: "Databricks 5: DevOps, Security, Serving and AI"
description: "Databricks Asset Bundles and CI/CD, environments and service principals, networking and security controls, SQL warehouses and BI serving, MLflow and Model Serving, Vector Search, and the cost and operations practices interviewers expect."
url: "/interview-prep/learn/cloud/databricks-05-devops-security-serving/"
hiddenInHomeList: true
showToc: true
weight: 5
---

# Databricks 5: DevOps, Security, Serving and AI

Senior Databricks roles are judged on how you **ship and operate** the platform: code promotion, secure networking, serving data to BI and applications, and supporting ML/AI workloads. This module covers what to say about each.

---

## 1. Code as the source of truth: Git folders and Asset Bundles

- **Git folders** (formerly Repos) connect workspace folders to Git for development: branches, commits and PRs from the UI.
- **Databricks Asset Bundles (DABs)** describe a project's jobs, pipelines, dashboards, models and their per-environment settings in YAML, deployed with the Databricks CLI:

```yaml
# databricks.yml
bundle:
  name: sales_pipelines
targets:
  dev:
    mode: development            # prefixes resources with the developer's name, pauses schedules
    workspace: { host: https://dev.cloud.databricks.com }
  prod:
    mode: production
    workspace: { host: https://prod.cloud.databricks.com }
    run_as: { service_principal_name: sp-sales-prod }
resources:
  jobs:
    daily_sales:
      name: daily_sales
      tasks:
        - task_key: ingest
          pipeline_task: { pipeline_id: ${resources.pipelines.sales_ingest.id} }
        - task_key: gold
          depends_on: [{ task_key: ingest }]
          notebook_task: { notebook_path: ./src/gold.py, base_parameters: { catalog: "${var.catalog}" } }
```

**CI/CD flow:**
1. PR → unit tests (pytest with local Spark or Databricks Connect), linting, `databricks bundle validate`.
2. Merge → `bundle deploy -t staging` → integration tests on staging data.
3. Approval → `bundle deploy -t prod` running as a **service principal**.

Infrastructure (workspaces, metastores, networking, UC grants) is usually managed with **Terraform**; application resources with bundles. **No manual changes in prod.**

**Environment isolation:** separate workspaces per environment bound to environment catalogs (`dev`, `prod`), parameterised code (`catalog` as a job parameter), and service principals with least privilege per environment.

---

## 2. Security and networking

| Control | Purpose |
|---|---|
| **SSO + SCIM** from the identity provider | Central identity; groups synced automatically |
| **Service principals** for automation | No personal tokens in production; OAuth M2M |
| **Secure cluster connectivity** (no public IPs) | Compute nodes have no public IPs; outbound-only connection to the control plane |
| **Customer-managed VNet/VPC** | Your network controls (firewalls, routes, egress filtering) for classic compute |
| **Private Link** (front-end and back-end) | Private connectivity between users/compute and the control plane |
| **IP access lists** | Restrict workspace access to corporate networks |
| **Serverless network policies / egress control** | Restrict which destinations serverless compute can reach |
| **Customer-managed keys** | Encrypt managed services data and storage with your keys |
| **Secrets** (secret scopes, backed by Key Vault/Secrets Manager) | Keep credentials out of code; redacted in notebook output |
| **Unity Catalog** | Data access, auditing and lineage (module 3) |
| **Compliance security profile / enhanced security monitoring** | Hardened images and monitoring for regulated workloads (HIPAA, PCI) |

**Interview framing:** "Defence in depth: identity (SSO, SCIM, service principals), network (no public IPs, private link, egress control), data (UC permissions, ABAC, encryption with customer keys), and monitoring (audit logs in system tables, alerts)."

---

## 3. Serving data: SQL warehouses and BI

- **SQL warehouses** (serverless recommended) run SQL with Photon, a result cache, disk cache, intelligent workload management and autoscaling for concurrency. Sizing: the T-shirt size sets cluster size per query; min/max clusters set concurrency scaling.
- **Query profile** shows operator time, Photon coverage, spill, and rows/bytes per operator, which you use to tune slow dashboards.
- **Materialized views and streaming tables in SQL** keep aggregates fresh for BI without separate pipelines.
- **AI/BI dashboards** and **Genie** (natural-language exploration grounded in UC metadata and curated instructions); **metric views** define governed business metrics in UC (a semantic layer).
- **External BI tools** (Power BI, Tableau) connect via partner connectors; use Unity Catalog permissions end to end with OAuth/SSO pass-through where possible.
- **Databricks Apps** host internal data apps; **Lakebase** provides a managed Postgres for low-latency operational serving next to the lakehouse (useful for app backends and online features).

---

## 4. ML and AI on Databricks (what data engineers should know)

- **MLflow:** experiment tracking, model packaging, and the **model registry in Unity Catalog** (models as governed objects with versions and aliases like `@champion`).
- **Feature engineering in Unity Catalog:** feature tables are Delta tables with primary keys (and timestamp keys for point-in-time lookups); training sets are built with point-in-time joins; online serving through online tables/stores.
- **Model Serving:** REST endpoints for custom models, foundation models and external models (via an AI gateway with rate limits, guardrails and usage tracking); **inference tables** log requests/responses to Delta for monitoring.
- **Vector Search:** vector indexes synced from Delta tables (delta sync) for RAG retrieval, governed by UC.
- **Agent framework and evaluation:** building and evaluating RAG/agent applications, with tracing in MLflow.
- **Data engineer's role:** reliable ingestion and chunking of documents into Delta/volumes, embedding pipelines, keeping vector indexes in sync, feature pipelines, inference table processing, and governance of all of it. See [AI data architecture](/interview-prep/learn/architecture/09-ai-data-architecture/).

---

## 5. Operating the platform

- **Observability:** system tables (jobs, pipelines, billing, audit, query history) feeding dashboards and alerts; pipeline event logs; Lakehouse Monitoring for data quality and drift; SQL alerts for business rules.
- **Cost management:** budgets and tags, cluster policies, serverless where it fits, warehouse auto-stop, predictive optimisation, and monthly reviews of the top spenders (see module 1).
- **Reliability:** job retries and repair runs, idempotent tasks, table versioning (`RESTORE`) for rollback, deep clones or replication for DR, and tested runbooks.
- **Upgrades:** pin LTS runtimes in production, test new LTS versions in staging, and track deprecations (e.g. DBFS mounts, legacy Hive metastore, no-isolation clusters).

---

## Interview questions

<details><summary>How do you implement CI/CD for Databricks pipelines?</summary>

Keep code in Git; define jobs and pipelines as Databricks Asset Bundles with dev/staging/prod targets; run unit tests and `bundle validate` on PRs; deploy to staging on merge and run integration tests; promote to prod with approval, running as a service principal. Infrastructure and permissions go in Terraform. Use parameterised catalogs per environment and never edit prod resources manually.
</details>

<details><summary>How do you secure a Databricks deployment for a regulated company?</summary>

SSO and SCIM groups, service principals for automation, secure cluster connectivity with no public IPs in a customer-managed VNet, Private Link for front-end and back-end traffic, IP access lists, egress controls for serverless, customer-managed keys, secrets in a vault-backed scope, Unity Catalog with least-privilege group grants, row filters/column masks or ABAC for PII, the compliance security profile where required, and audit logs in system tables monitored with alerts.
</details>

<details><summary>Dashboards on a SQL warehouse are slow at 9am. What do you check?</summary>

Query profiles for the slow queries (scan size, spill, Photon coverage, join types); whether warehouses are queueing (scale max clusters up or use serverless with intelligent workload management); whether queries hit the result/disk cache; table layout (liquid clustering on filter columns, file sizes, stats); and whether the dashboard should read a materialized view or aggregate table instead of raw facts. Also stagger heavy scheduled refreshes.
</details>

<details><summary>What's the data engineer's role in a RAG application on Databricks?</summary>

Build reliable ingestion of source documents into volumes/Delta, parse and chunk them with metadata and access-control attributes, compute embeddings in a pipeline, keep a Vector Search index in sync with the source table (delta sync), handle updates and deletes (including permission changes), log and process inference tables for quality monitoring, and govern everything in Unity Catalog.
</details>
