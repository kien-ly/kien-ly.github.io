---
title: "p95 Latency per Endpoint (Nearest-Rank)"
description: "Compute a percentile per group with window functions using the nearest-rank method."
url: "/interview-prep/practice/sql/36-p95-latency/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 36
---

# p95 Latency per Endpoint (Nearest-Rank)

**Difficulty:** Hard · **Topics:** percentiles, window-functions, observability · **Asked at:** Datadog, Google, AWS, Cloudflare

## Problem

Using the **nearest-rank** definition (p-th percentile = the value at rank `ceil(p × n)` in ascending order), return `endpoint, requests, p50_ms, p95_ms, max_ms` per endpoint, ordered by p95 descending.

## Schema and sample data

```sql schema
CREATE TABLE requests (endpoint TEXT, latency_ms INTEGER);
INSERT INTO requests VALUES
('/search',120),('/search',80),('/search',95),('/search',300),('/search',110),('/search',105),('/search',90),('/search',2000),('/search',100),('/search',115),
('/cart',40),('/cart',45),('/cart',50),('/cart',35),('/cart',500),
('/home',20);
```

## Expected output

<!-- expected:start -->
| endpoint | requests | p50_ms | p95_ms | max_ms |
|---|---|---|---|---|
| /search | 10 | 105 | 2000 | 2000 |
| /cart | 5 | 45 | 500 | 500 |
| /home | 1 | 20 | 20 | 20 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

ROW_NUMBER over latency and COUNT over the partition, then pick the rows whose rank equals ceil(p·n).

</details>

<details><summary>Hint 2</summary>

SQLite has no CEIL in older versions: `CAST(x AS INTEGER) + (x > CAST(x AS INTEGER))`.

</details>

## Solution

```sql solution
WITH r AS (
  SELECT endpoint, latency_ms,
         ROW_NUMBER() OVER (PARTITION BY endpoint ORDER BY latency_ms) AS rn,
         COUNT(*)     OVER (PARTITION BY endpoint)                    AS n
  FROM requests
), k AS (
  SELECT *,
         CAST(0.50 * n AS INTEGER) + (0.50 * n > CAST(0.50 * n AS INTEGER)) AS k50,
         CAST(0.95 * n AS INTEGER) + (0.95 * n > CAST(0.95 * n AS INTEGER)) AS k95
  FROM r
)
SELECT endpoint, n AS requests,
       MAX(CASE WHEN rn = k50 THEN latency_ms END) AS p50_ms,
       MAX(CASE WHEN rn = k95 THEN latency_ms END) AS p95_ms,
       MAX(latency_ms) AS max_ms
FROM k
GROUP BY endpoint, n
ORDER BY p95_ms DESC;
```

## Explanation

/search has 10 requests → p95 rank = ceil(9.5) = 10 → 2000 ms (one slow request dominates small samples). Percentile definitions differ (nearest-rank, linear interpolation as in `PERCENTILE_CONT`, approximate sketches), so state which one you use. With 1 request (/home) every percentile is that value.

In production, latency percentiles are computed with mergeable sketches (t-digest, HDR histograms, DDSketch) per time bucket, because **you cannot average percentiles** across buckets or hosts.
