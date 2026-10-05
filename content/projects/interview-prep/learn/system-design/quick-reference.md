---
title: "System Design Quick Reference"
description: "One-page refresher of patterns, technologies and trade-offs to scan the day before an interview."
url: "/interview-prep/learn/system-design/quick-reference/"
hiddenInHomeList: true
showToc: true
weight: 90
---

# System Design Quick Reference

> Print this or keep it open during prep. Covers everything you need in one page.

---

## The 45-Minute Framework

| Phase | Time | What to Do |
|-------|------|------------|
| **1. Clarify** | 5 min | Ask requirements questions (see below) |
| **2. High-Level** | 10 min | Draw boxes: Sources → Ingestion → Storage → Processing → Serving → Consumers |
| **3. Deep Dive** | 20 min | Pick 2-3 components, go deep on trade-offs |
| **4. Trade-offs** | 5 min | "We could also do X, but Y is better because..." |
| **5. Operations** | 5 min | Monitoring, failure handling, scaling |

---

## Requirements Questions (Ask These First!)

### Functional
- What are the data sources?
- Who are the consumers?
- What queries will be common?
- Historical data requirements?

### Non-Functional
- Data volume? (GB/TB/PB per day)
- Latency requirements? (real-time/near-real-time/batch)
- Availability SLA?
- Data freshness tolerance?

### Constraints
- Budget? (serverless vs provisioned)
- Compliance? (GDPR/HIPAA/PCI)
- Existing infrastructure?

---

## Architecture Patterns

### Medallion (Lakehouse)
```
Bronze (raw) → Silver (cleaned) → Gold (aggregated)
```
- **Bronze:** Raw, append-only, schema-on-read
- **Silver:** Validated, typed, deduplicated
- **Gold:** Business aggregates, star schema

### Lambda vs Kappa vs Delta

| Pattern | Description | Use When |
|---------|-------------|----------|
| **Lambda** | Separate batch + stream, merge at serving | Legacy, different latency needs |
| **Kappa** | Stream-only, replay for corrections | Event-sourced, Kafka-native |
| **Delta** | Unified: streaming writes, batch reads same tables | Modern greenfield |

---

## Data Modeling Cheat Sheet

### Star Schema vs Data Vault

| Aspect | Star Schema | Data Vault 2.0 |
|--------|-------------|----------------|
| Speed | Fast (fewer joins) | Slow (many joins) |
| Flexibility | Low | High |
| Use Case | BI/Reporting | Enterprise DWH, audit |

### SCD Types

| Type | Behavior | History? | Use Case |
|------|----------|----------|----------|
| SCD-1 | Overwrite | No | Corrections |
| SCD-2 | New row with dates | Full | Customer history |
| SCD-3 | Add previous column | Limited | One previous value |

---

## Batch vs Streaming

| Aspect | Batch | Micro-Batch | True Streaming |
|--------|-------|-------------|----------------|
| Latency | Hours | Minutes | Milliseconds |
| Complexity | Low | Medium | High |
| Exactly-once | Easy | Medium | Hard |
| Tools | Spark, dbt | Spark Streaming | Flink |

### Streaming Concepts
- **Watermark:** "I've seen all events up to time T"
- **Window:** Tumbling (fixed), Sliding (overlap), Session (gap-based)
- **Checkpoint:** Snapshot of state for recovery

---

## Partitioning & Storage

### Partitioning Strategies

| Strategy | Use When | Example |
|----------|----------|---------|
| Date/Time | Time-series queries | `year=2024/month=07` |
| Hash | Even distribution | `customer_id % 256` |
| List | Categorical | `region IN ('US', 'EU')` |

### File Sizing
- **Target:** 128MB - 1GB per file
- **Too small:** Metadata overhead
- **Too big:** Poor parallelism

### Delta Lake Optimization
```sql
OPTIMIZE table ZORDER BY (customer_id, date)
```

---

## Tool Comparisons

### Message Queue

| | Kafka | Kinesis | Pub/Sub |
|-|-------|---------|---------|
| **Managed** | No (or Confluent) | Yes (AWS) | Yes (GCP) |
| **Throughput** | Millions/sec | 1MB/shard | Auto-scale |
| **Retention** | Unlimited | 7 days max | 7 days |

### Processing Engine

| | Spark | Flink |
|-|-------|-------|
| **Model** | Micro-batch | True streaming |
| **Latency** | Seconds-minutes | Milliseconds |
| **CEP** | Limited | First-class |
| **Batch** | Excellent | Good |

---

## Back-of-Envelope Math

### Data Size
- Clickstream event: ~500 bytes → 1B events/day = 500GB/day
- Transaction: ~1KB → 100M/day = 100GB/day
- Log line: ~200 bytes → 10B/day = 2TB/day

### Throughput
- 1M events/day ≈ 12 events/sec
- 1B events/day ≈ 12K events/sec
- 100 GB/day ≈ 1.2 MB/sec

### Kafka Sizing
- Partitions = max(throughput/10MB/s, consumer parallelism)
- Replication = 3 (always for prod)

---

## Data Quality Pattern

```
Source → Validation → Pass → Main Pipeline
                   ↘ Fail → DLQ → Alert
```

Layers:
1. **Schema:** Types, required fields
2. **Constraints:** Unique, not null, referential
3. **Business:** amount > 0, status IN (...)
4. **Statistical:** Row count drift, null % spike

---

## Common Performance Issues

| Problem | Symptom | Fix |
|---------|---------|-----|
| **Data Skew** | One task 10x slower | Salting, broadcast, AQE |
| **Shuffle Spill** | Disk I/O during joins | More memory, broadcast |
| **Small Files** | Slow reads, driver OOM | OPTIMIZE, coalesce |
| **Full Scans** | Reading entire table | Partition pruning, ZORDER |

---

## Phrases That Impress

### Architecture
- "Decoupling ingestion from processing for independent scaling"
- "Event sourcing for full audit trail and replay capability"
- "Schema-on-read at Bronze, schema-on-write at Gold"
- "Idempotent writes for exactly-once semantics"

### Data Quality
- "Data contracts between producer and consumer"
- "Circuit breaker pattern for cascading failures"
- "Quarantine bad records to DLQ, never lose data"

### Performance
- "Partition pruning to minimize I/O"
- "Broadcast join for dimension tables under 100MB"
- "Salting to handle skewed keys"
- "AQE for dynamic optimization"

### Operations
- "Time-travel for debugging and rollback"
- "Lineage tracking for impact analysis"
- "Blue-green deployment for zero-downtime migrations"

---

## Things NOT to Say

- "Just add more machines" (without identifying bottleneck)
- "Use microservices" (for data pipelines)
- "Real-time everything" (ask latency requirements first)
- "NoSQL because it scales" (without understanding trade-offs)
- "We'll figure out data quality later"
- Jumping to solutions without clarifying requirements

---

## Quick Wins for Any Design

1. **Always mention:** Monitoring, alerting, failure handling
2. **Always ask:** Scale, latency, freshness requirements
3. **Always draw:** Clear boxes and arrows
4. **Always discuss:** At least one trade-off per component
5. **Always cover:** What happens when things fail

---

## References

- [Designing Data-Intensive Applications](https://dataintensive.net/)
- [Netflix Tech Blog](https://netflixtechblog.com/)
- [Uber Engineering](https://www.uber.com/blog/engineering/)
- [Databricks Blog](https://www.databricks.com/blog)
