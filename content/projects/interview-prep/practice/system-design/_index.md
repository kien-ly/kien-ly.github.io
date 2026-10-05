---
title: "System Design Practice Problems"
description: "Full data system design problems with reference answers, diagrams, trade-offs, follow-ups and self-assessment rubrics."
url: "/interview-prep/practice/system-design/"
hiddenInHomeList: true
showToc: true
weight: 0
---

# System Design Practice Problems

Each problem follows the same structure, so you can practise the [interview framework](/interview-prep/learn/system-design/01-interview-framework/) every time:

> Problem → Clarifying questions → Requirements → Estimates → Architecture diagram → Data model → Deep dives → Trade-offs → Failure modes → Senior signals → Follow-ups → **Rubric**

**How to practise:** read only the *Problem* section, set a 45-minute timer, design on paper while talking out loud, then compare with the reference answer and tick the rubric. Re-do anything under 70% a few days later.

## Core data platform designs

| # | Problem | Difficulty | Key concepts |
|---|---|---|---|
| 1 | [Real-time clickstream analytics](/interview-prep/practice/system-design/clickstream-analytics/) | Medium | Kafka, dedup, sessionization, late data, OLAP |
| 2 | [Real-time payment fraud detection](/interview-prep/practice/system-design/fraud-detection/) | Hard | Sync vs async paths, feature store, latency budget |
| 3 | [Ad click aggregation and billing](/interview-prep/practice/system-design/ad-click-aggregation/) | Hard | Exactly-once, approximate vs exact paths, skew |
| 4 | [CDC from 200 OLTP tables into a lakehouse](/interview-prep/practice/system-design/cdc-lakehouse/) | Medium | Debezium, MERGE, SCD2, schema evolution |
| 5 | [Real-time top-K trending](/interview-prep/practice/system-design/trending-topk/) | Medium | Bucketed windows, heavy hitters, count-min sketch |
| 6 | [Ride-hailing surge pricing data](/interview-prep/practice/system-design/ride-hailing-surge/) | Hard | Geospatial (H3), keyed state, timers, safety |
| 7 | [Connected-vehicle telemetry](/interview-prep/practice/system-design/iot-vehicle-telemetry/) | Hard | MQTT, time series, edge filtering, privacy |
| 8 | [Feature platform for recommendations](/interview-prep/practice/system-design/feature-store-recsys/) | Hard | Point-in-time joins, skew, online serving |
| 9 | [A/B testing data pipeline](/interview-prep/practice/system-design/experimentation-platform/) | Hard | Exposure, sufficient stats, SRM, CUPED |
| 10 | [Auditable financial reporting](/interview-prep/practice/system-design/financial-reporting-pipeline/) | Medium | Ledger modelling, reconciliation, SOX |

## Platform, governance and AI

| # | Problem | Difficulty | Key concepts |
|---|---|---|---|
| 11 | [Governed lakehouse for 8 domains](/interview-prep/practice/system-design/multi-domain-lakehouse/) | Hard | Catalog layout, ABAC, shared standards, CI/CD |
| 12 | [Data quality and observability platform](/interview-prep/practice/system-design/data-quality-platform/) | Medium | Rules as code, anomaly detection, WAP, routing |
| 13 | [GDPR right-to-erasure platform](/interview-prep/practice/system-design/gdpr-deletion-platform/) | Hard | Discovery via tags, VACUUM vs SLA, crypto-shredding |
| 14 | [Legacy warehouse migration with AI-assisted SQL conversion](/interview-prep/practice/system-design/warehouse-migration/) | Hard | Validation harness, LLM agents, parallel runs |
| 15 | [Enterprise RAG knowledge assistant](/interview-prep/practice/system-design/rag-knowledge-platform/) | Hard | Incremental embedding, ACL-aware retrieval, evals |
| 16 | [LLM observability and evaluation platform](/interview-prep/practice/system-design/llm-observability-platform/) | Medium | Tracing, cost attribution, judge calibration |

## Product and operations data systems

| # | Problem | Difficulty | Key concepts |
|---|---|---|---|
| 17 | [Usage metering and billing](/interview-prep/practice/system-design/usage-metering-billing/) | Hard | Effectively-once metering, as-of pricing, ledger, finalisation, reconciliation |
| 18 | [Real-time inventory availability](/interview-prep/practice/system-design/realtime-inventory/) | Hard | Ledger + derived state, sequence dedup, reservations, oversell prevention |
| 19 | [Logs and metrics observability platform](/interview-prep/practice/system-design/observability-platform/) | Hard | Tiered storage, cardinality, sampling, reliable alerting, cost |
| 20 | [Real-time customer data platform](/interview-prep/practice/system-design/realtime-cdp/) | Hard | Identity graph, streaming segments, consent-aware activation |

## Scenario and debugging questions (30 min)

| Problem | Focus |
|---|---|
| [Data reconciliation between conflicting sources](/interview-prep/practice/system-design/scenarios/data-reconciliation/) | Data quality, conflict resolution |
| [Exactly-once in a Kafka payment pipeline](/interview-prep/practice/system-design/scenarios/kafka-exactly-once/) | Idempotent producers, transactions, sinks |
| [Pipeline fails only on Mondays](/interview-prep/practice/system-design/scenarios/monday-failures/) | Structured debugging |

## Suggested order

- **Week 1:** 1 → 4 → 5 → 10 (fundamentals: streaming, CDC, windows, correctness)
- **Week 2:** 3 → 2 → 8 → 11 (exactly-once, low latency, ML data, platform)
- **Week 3:** 7 → 6 → 9 → 13 (domain-specific depth)
- **Week 4:** 17 → 18 → 20 → 19 (product data systems: money, inventory, identity, observability)
- **AI track:** 15 → 16 → 14
