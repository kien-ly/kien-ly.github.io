---
title: "Cloud Platforms: Learning Path"
description: "Platform-specific knowledge interviewers test. Starting with Databricks: architecture and compute, Delta Lake internals, Unity Catalog, ingestion and pipelines, DevOps, security, serving and AI."
url: "/interview-prep/learn/cloud/"
hiddenInHomeList: true
showToc: true
weight: 0
---

# Cloud Platforms: Learning Path

Many senior data engineering roles name a platform in the job description, and the interview probes it in depth: not just "have you used it?" but *how it works*, *what it costs* and *how you'd operate it safely*. This track covers platform-specific knowledge. It starts with **Databricks**; AWS, Azure and GCP data services will follow.

## Databricks

| # | Module | You will be able to |
|---|---|---|
| 1 | [Platform architecture & compute](/interview-prep/learn/cloud/databricks-01-platform-and-compute/) | Explain control vs compute plane, pick the right compute (all-purpose, jobs, serverless, SQL warehouses), reason about Photon and DBU cost |
| 2 | [Delta Lake internals](/interview-prep/learn/cloud/databricks-02-delta-lake-internals/) | Explain the transaction log, optimistic concurrency and conflicts, MERGE internals, VACUUM and time travel, liquid clustering, deletion vectors, CDF and clones |
| 3 | [Unity Catalog & governance](/interview-prep/learn/cloud/databricks-03-unity-catalog/) | Design catalogs and permissions, implement row filters, masks and ABAC, use lineage and system tables, share data with Delta Sharing and federation |
| 4 | [Ingestion, pipelines, jobs & streaming](/interview-prep/learn/cloud/databricks-04-ingestion-pipelines-jobs/) | Choose Auto Loader vs COPY INTO, build Declarative Pipelines with expectations and AUTO CDC, orchestrate with Lakeflow Jobs, run Structured Streaming well |
| 5 | [DevOps, security, serving & AI](/interview-prep/learn/cloud/databricks-05-devops-security-serving/) | Ship with Asset Bundles and CI/CD, secure the deployment, serve BI with SQL warehouses, support MLflow, Model Serving and Vector Search |

Then: [Databricks interview questions](/interview-prep/interview-qa/13-databricks/) · [End-to-end Databricks design scenario](/interview-prep/practice/spark/databricks-end-to-end-design/) · Related: [Spark internals & tuning](/interview-prep/learn/spark-databricks/)

> Databricks evolves quickly and renames products often (Delta Live Tables → Lakeflow Declarative Pipelines, Workflows → Lakeflow Jobs). Interviewers accept either name; knowing both shows you're current.
