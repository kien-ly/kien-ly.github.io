---
title: "Pivot Monthly Revenue into Columns"
description: "Turn rows into columns with conditional aggregation, plus a row total and a column total."
url: "/interview-prep/practice/sql/22-pivot-monthly-revenue/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 22
---

# Pivot Monthly Revenue into Columns

**Difficulty:** Medium · **Topics:** pivot, conditional-aggregation, rollup · **Asked at:** Microsoft, Salesforce, Oracle

## Problem

Produce one row per `region` with columns `jan`, `feb`, `mar` (2026 revenue per month, 0 if none) and `q1_total`. Add a final row with `region = 'TOTAL'` that sums every column. Order regions alphabetically with TOTAL last.

## Schema and sample data

```sql schema
CREATE TABLE sales (region TEXT, sale_date TEXT, amount INTEGER);
INSERT INTO sales VALUES
('EMEA','2026-01-10',100),('EMEA','2026-01-20',50),('EMEA','2026-03-05',70),
('APAC','2026-02-14',200),('APAC','2026-03-01',30),
('AMER','2026-01-05',300),('AMER','2026-02-07',100),('AMER','2026-02-28',25),('AMER','2026-04-01',999);
```

## Expected output

<!-- expected:start -->
| region | jan | feb | mar | q1_total |
|---|---|---|---|---|
| AMER | 300 | 125 | 0 | 425 |
| APAC | 0 | 200 | 30 | 230 |
| EMEA | 150 | 0 | 70 | 220 |
| TOTAL | 450 | 325 | 100 | 875 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

`SUM(CASE WHEN month = ... THEN amount ELSE 0 END)` per column.

</details>

<details><summary>Hint 2</summary>

The TOTAL row can come from `UNION ALL` of the same aggregation without GROUP BY region (or `GROUP BY ROLLUP`).

</details>

## Solution

```sql solution
WITH q1 AS (
  SELECT region, strftime('%m', sale_date) AS m, amount
  FROM sales WHERE sale_date >= '2026-01-01' AND sale_date < '2026-04-01'
), by_region AS (
  SELECT region,
         SUM(CASE WHEN m = '01' THEN amount ELSE 0 END) AS jan,
         SUM(CASE WHEN m = '02' THEN amount ELSE 0 END) AS feb,
         SUM(CASE WHEN m = '03' THEN amount ELSE 0 END) AS mar,
         SUM(amount) AS q1_total
  FROM q1 GROUP BY region
)
SELECT * FROM (
  SELECT * FROM by_region
  UNION ALL
  SELECT 'TOTAL', SUM(jan), SUM(feb), SUM(mar), SUM(q1_total) FROM by_region
)
ORDER BY region = 'TOTAL', region;
```

## Explanation

Conditional aggregation is the portable pivot. `ORDER BY region = 'TOTAL'` sorts FALSE (0) before TRUE (1), pushing the total last. The April sale is excluded by the date filter, so filter *before* pivoting rather than relying on CASE to drop it.

## Dialect notes

- Spark/Databricks/Snowflake: `SELECT * FROM q1 PIVOT (SUM(amount) FOR m IN ('01' AS jan, '02' AS feb, '03' AS mar))`
- Totals: `GROUP BY ROLLUP(region)` with `COALESCE(region, 'TOTAL')` (Postgres, Spark, Snowflake, BigQuery).
- Postgres: `SUM(amount) FILTER (WHERE m = '01')`.
