---
title: "Exponential Moving Average with a Recursive CTE"
description: "Compute an EMA, where each value depends on the previous result, using a recursive CTE over ordered rows."
url: "/interview-prep/practice/sql/40-exponential-moving-average/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 40
---

# Exponential Moving Average with a Recursive CTE

**Difficulty:** Hard · **Topics:** recursive-cte, moving-average, time-series · **Asked at:** Two Sigma, Citadel, Robinhood, Bloomberg

## Problem

Compute the exponential moving average of `price` with smoothing factor α = 0.5: `ema_1 = price_1` and `ema_t = α·price_t + (1−α)·ema_{t−1}`. Return `day, price, ema` (2 decimals) ordered by day.

## Schema and sample data

```sql schema
CREATE TABLE prices (day TEXT, price REAL);
INSERT INTO prices VALUES ('2026-01-01',10),('2026-01-02',12),('2026-01-05',11),('2026-01-06',15),('2026-01-07',14),('2026-01-08',8);
```

## Expected output

<!-- expected:start -->
| day | price | ema |
|---|---|---|
| 2026-01-01 | 10.0 | 10.0 |
| 2026-01-02 | 12.0 | 11.0 |
| 2026-01-05 | 11.0 | 11.0 |
| 2026-01-06 | 15.0 | 13.0 |
| 2026-01-07 | 14.0 | 13.5 |
| 2026-01-08 | 8.0 | 10.75 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

A window function can't reference its own previous output, which is why recursion is needed.

</details>

<details><summary>Hint 2</summary>

Number the rows first, then recurse on row number n → n+1.

</details>

## Solution

```sql solution
WITH RECURSIVE numbered AS (
  SELECT day, price, ROW_NUMBER() OVER (ORDER BY day) AS n FROM prices
), ema(n, day, price, ema) AS (
  SELECT n, day, price, price FROM numbered WHERE n = 1
  UNION ALL
  SELECT p.n, p.day, p.price, 0.5 * p.price + 0.5 * e.ema
  FROM ema e JOIN numbered p ON p.n = e.n + 1
)
SELECT day, price, ROUND(ema, 2) AS ema FROM ema ORDER BY day;
```

## Explanation

EMA is **stateful**: each output depends on the previous output, not just previous inputs, so a plain window aggregate can't express it (though it can be approximated with weighted sums over a long finite window). Recursive CTEs process one row per iteration, so they're slow on large data. In practice compute EMA in pandas (`ewm(alpha=0.5, adjust=False)`), Spark `applyInPandas` per key, or a streaming job with state.
