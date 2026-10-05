---
title: "Median Order Value per Country"
description: "Compute an exact median per group with window functions, for engines without PERCENTILE_CONT."
url: "/interview-prep/practice/sql/19-median-per-group/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 19
---

# Median Order Value per Country

**Difficulty:** Medium · **Topics:** median, percentiles, window-functions · **Asked at:** Google, Airbnb, Lyft

## Problem

Return the **median** order `amount` per `country` (average of the two middle values when the count is even), ordered by country.

## Schema and sample data

```sql schema
CREATE TABLE orders (order_id INTEGER, country TEXT, amount INTEGER);
INSERT INTO orders VALUES
(1,'DE',10),(2,'DE',30),(3,'DE',20),(4,'DE',100),
(5,'FR',5),(6,'FR',50),(7,'FR',15),
(8,'US',7);
```

## Expected output

<!-- expected:start -->
| country | median_amount |
|---|---|
| DE | 25.0 |
| FR | 15.0 |
| US | 7.0 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Number rows per country in amount order and count rows per country.

</details>

<details><summary>Hint 2</summary>

The middle rows are `(n+1)/2` and `(n+2)/2` with integer division; they coincide when n is odd.

</details>

## Solution

```sql solution
WITH r AS (
  SELECT country, amount,
         ROW_NUMBER() OVER (PARTITION BY country ORDER BY amount) AS rn,
         COUNT(*)     OVER (PARTITION BY country)                  AS n
  FROM orders
)
SELECT country, AVG(amount) AS median_amount
FROM r
WHERE rn IN ((n + 1) / 2, (n + 2) / 2)
GROUP BY country
ORDER BY country;
```

## Explanation

n=4 (DE): rows 2 and 3 (20, 30) → 25. n=3 (FR): (3+1)/2 = 2 and (3+2)/2 = 2 → row 2 only → 15. n=1: row 1.

In practice: `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount)` (Postgres/Snowflake), `MEDIAN()` (Snowflake, Databricks), `percentile_approx(amount, 0.5)` (Spark, approximate, distributed-friendly). Exact medians need a global sort per group, which is expensive at scale. Know when approximate is acceptable.

## Follow-up questions

<details><summary>How would you compute p95 latency per endpoint over billions of rows?</summary>

`percentile_approx(latency, 0.95, 10000)` in Spark, or t-digest/KLL sketches per (endpoint, hour) that can be merged for any time range. Exact percentiles require sorting each group.

</details>
