---
title: "Back-of-Envelope Estimation for Data Systems"
description: "Numbers to memorise and worked capacity estimates that drive real design decisions."
url: "/interview-prep/learn/system-design/02-back-of-envelope/"
hiddenInHomeList: true
showToc: true
weight: 2
---

# Back-of-Envelope Estimation for Data Systems

> You are not graded on arithmetic. You are graded on whether the numbers **drive decisions**: streaming vs batch, how many partitions, can it fit in memory, which serving store, what it costs.

---

## Numbers to memorise

### Time
| Quantity | Value | Shortcut |
|---|---|---|
| Seconds per day | 86,400 | **≈ 10⁵** (overestimates rate by ~15%, which is fine) |
| Seconds per month | 2.6 M | ≈ 2.5 × 10⁶ |
| Seconds per year | 31.5 M | ≈ 3 × 10⁷ |

**1 M/day ≈ 12/s · 100 M/day ≈ 1.2k/s · 1 B/day ≈ 12k/s · 10 B/day ≈ 120k/s**

### Size
| Thing | Typical size |
|---|---|
| Clickstream / app event (JSON) | 0.5–2 KB |
| Same event in Avro/Protobuf | 100–300 B |
| CDC row change (envelope) | 0.5–1 KB |
| IoT sensor reading | 50–200 B |
| Log line | 200 B – 1 KB |
| Embedding vector (1536 dims × float32) | **6 KB** |
| Text chunk (500 tokens) | ~2 KB |

### Compression & formats
| | Ratio vs raw JSON |
|---|---|
| Parquet + Snappy/ZSTD (columnar) | **5–10×** smaller |
| Gzip JSON | 5–8× |
| Avro (binary, row) | 2–4× |

### Throughput rules of thumb (conservative, interview-safe)
| Component | Number |
|---|---|
| Kafka partition throughput | ~10 MB/s write (can be more; use 5–10 for planning) |
| Kafka broker | ~100s MB/s; plan for ~50–100 MB/s each |
| Spark executor core processing simple transforms | ~10–50 MB/s per core |
| Flink / Spark streaming per core | ~10k–100k simple events/s |
| Redis single node | ~100k ops/s |
| Postgres single node writes | ~5–20k rows/s (batched more) |
| Object storage (S3) per prefix | 3,500 PUT / 5,500 GET per sec |
| Network (10 Gbps NIC) | ~1 GB/s |
| SSD sequential read | ~1–3 GB/s |
| Memory read | ~10+ GB/s |

### Latency hierarchy (order of magnitude)
```
L1/L2 cache     ~1–10 ns
RAM             ~100 ns
SSD random read ~100 µs
Same-DC network ~0.5 ms
Redis GET       ~1 ms
Kafka produce→consume  ~5–50 ms
Cross-region    ~50–150 ms
S3 GET first byte ~20–100 ms
Spark micro-batch     ~seconds
Batch job        minutes–hours
```

### Cost anchors (cloud list price, rough)
| Item | Cost |
|---|---|
| Object storage (S3 standard) | ~$23 / TB-month |
| Cold / archive | ~$1–4 / TB-month |
| Commodity VM core | ~$0.03–0.05 / core-hour |
| 1 TB scanned (BigQuery on-demand) | ~$6 |
| Embedding 1M tokens (small model) | ~$0.02–0.10 |

---

## The estimation template

```
1. Volume:     N events/day  →  N / 10⁵  = avg/s  →  × peak factor (3–10×)
2. Bandwidth:  peak/s × bytes/event  = MB/s  (decides Kafka partitions, brokers)
3. Storage:    events/day × bytes × retention days
               ÷ compression (Parquet ~5–10×) × replication (3× for Kafka/HDFS; 1× object store)
4. Compute:    bytes to process ÷ per-core throughput ÷ time budget  = cores
5. Serving:    QPS × rows scanned per query  → OLAP store? KV? warehouse?
6. Cost:       storage TB × $/TB + core-hours × $/core-hour
```

---

## Worked example 1: Clickstream for an e-commerce site

**Given:** 500 M events/day, 1 KB JSON, 3× peak, keep 90 days hot, 3 years cold.

```
Rate:      500M / 10⁵ = 5k/s avg      → 15k/s peak
Bandwidth: 15k × 1 KB = 15 MB/s peak  (Avro ~4 MB/s)
Kafka:     15 MB/s ÷ ~5 MB/s/partition = 3 → choose 24–48 partitions
           (partitions also = max consumer parallelism; leave room for 3–5 yrs growth)
Kafka disk: 15 MB/s × 86,400 × 7 days × 3 replicas ≈ 9 TB → fine on 6 brokers
Lake:      500 GB/day raw JSON → ~70 GB/day Parquet
           90 days hot ≈ 6 TB   ·   3 years ≈ 75 TB  → ~$1.7k/month S3 standard
```
**Decision:** Kafka + Spark Structured Streaming is comfortably enough; this is *not* a huge system. Say so. Over-engineering is a negative signal.

## Worked example 2: Ad impressions (big)

**Given:** 10 B impressions/day, 300 B (Avro), 5× peak.

```
Rate:      10B / 10⁵ = 100k/s avg → 500k/s peak
Bandwidth: 500k × 300 B = 150 MB/s peak
Kafka:     150 / 10 = 15 → choose 128 partitions (parallelism + hot-key spread)
Stream:    500k events/s ÷ ~25k events/s/core ≈ 20 cores (+2× headroom = 40)
Storage:   10B × 300 B = 3 TB/day → ~500 GB/day Parquet → 2 yrs ≈ 365 TB
Aggregates: campaigns (100k) × minutes (1,440) × few metrics = 144M rows/day → OLAP store
```
**Decision:** pre-aggregate in streaming (per campaign per minute) instead of querying raw events for dashboards. Raw events go only to the lake.

## Worked example 3: Can the state fit in memory?

**"Count distinct users per page per hour in streaming."** 50 M daily users, 10k pages.

```
Exact distinct via sets: worst case 50M user_ids × 16 B ≈ 800 MB per hour window, plus
per-page duplication → multiple GB of state. Doable with RocksDB state backend, but expensive.
HyperLogLog: ~12 KB per sketch (≈0.8% error) × 10k pages × 24 windows ≈ 3 GB → or 1.5 KB
sketches at ~2% error ≈ 360 MB.
```
**Decision:** HLL sketches for real-time; exact `COUNT(DISTINCT)` in the nightly batch if finance needs it.

## Worked example 4: RAG index sizing

**Given:** 2 M documents × average 10 pages; ~1 chunk per half page.

```
Chunks: 2M × 10 × 2 = 40M chunks
Vectors: 40M × 6 KB (1536-d float32) = 240 GB raw → HNSW overhead ~1.5× → ~360 GB RAM
  → options: shard across nodes, use 768-d model (half), or quantize (int8 = 4× smaller → ~90 GB)
Embedding cost: 40M × 500 tokens = 20B tokens × $0.02/M ≈ $400 one-off; re-embed on model change
Incremental: 1% docs change/day → 400k chunks/day → trivial
```
**Decision:** quantisation and/or a smaller embedding dimension; incremental re-embedding with content hashing; blue/green index on model change.

## Worked example 5: How long will a backfill take?

**"Reprocess 1 year of clickstream with new sessionization logic."**

```
1 year ≈ 25 TB Parquet. Cluster: 50 workers × 16 cores = 800 cores at ~20 MB/s/core = 16 GB/s
25 TB / 16 GB/s ≈ 1,600 s ≈ 30 min of pure scan … realistically 3–5× for shuffle (session = groupBy user)
≈ 2–3 hours. Cost: 800 cores × 3 h × $0.04 ≈ $100.
```
**Decision:** backfill is cheap; partition it by month and run in parallel with idempotent `INSERT OVERWRITE` per partition so retries are safe.

---

## Common mistakes

- **Doing math that changes nothing.** If the answer doesn't affect a design choice, skip it.
- **Forgetting peak.** Systems are sized for peak, not average.
- **Forgetting replication** (Kafka 3×) **and compression** (Parquet 5–10×). They roughly cancel out, which is worth saying.
- **False precision.** "17,361 events/sec" sounds junior; "~20k/s" sounds senior.
- **Not sanity-checking.** If your answer says a single Postgres can't handle 50 writes/sec, something's wrong.

---

## Practice drills (answers below)

1. Uber: 20 M trips/day, GPS ping every 4 s during a 20-minute trip, 100 B/ping. Peak 3×. What's peak ingest MB/s?
2. 2 B rows/day CDC into Delta, 500 B/row. How much Delta storage per year (with ~5× compression)?
3. A dashboard queries 30 days × 1 B rows/day of raw events. Is a warehouse scan at 1-second latency realistic?

<details><summary>Answers</summary>

1. Pings/trip = 1,200 s / 4 = 300 → 6 B pings/day → 60k/s avg → 180k/s peak × 100 B = **18 MB/s**. Kafka with ~16–32 partitions, keyed by `driver_id` or geo cell.
2. 2B × 500 B = 1 TB/day raw → ~200 GB/day → **~73 TB/year** (before history/time-travel retention; VACUUM matters).
3. 30 B rows: even at 1 B rows/s scanned that's 30 s. **No** → pre-aggregate to the dashboard grain (e.g. hourly per dimension) or use an OLAP store with rollups.
</details>
