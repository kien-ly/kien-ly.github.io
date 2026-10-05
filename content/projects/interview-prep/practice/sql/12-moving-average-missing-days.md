---
title: "Moving Average with Missing Days"
description: "A true 7-calendar-day average when some days have no data: RANGE frames vs densifying with a calendar."
url: "/interview-prep/practice/sql/12-moving-average-missing-days/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 12
---

# Moving Average with Missing Days

**Difficulty:** Medium · **Topics:** moving-average, range-frame, date-spine · **Asked at:** Uber, Airbnb, Stripe

## Problem

`store_sales` only has rows for days with sales. For every day **from 2026-06-01 to 2026-06-10** (including days without sales), return `day`, `revenue` (0 when no sales) and `ma_7d`: the average daily revenue over the 7 calendar days ending on that day, counting missing days as 0 and only days on or after 2026-06-01. Round to 2 decimals. Order by day.

## Schema and sample data

```sql schema
CREATE TABLE store_sales (day TEXT, revenue INTEGER);
INSERT INTO store_sales VALUES
('2026-06-01',70),('2026-06-02',140),('2026-06-05',210),('2026-06-06',70),('2026-06-09',350),('2026-06-10',70);
```

## Expected output

<!-- expected:start -->
| day | revenue | ma_7d |
|---|---|---|
| 2026-06-01 | 70 | 70.0 |
| 2026-06-02 | 140 | 105.0 |
| 2026-06-03 | 0 | 70.0 |
| 2026-06-04 | 0 | 52.5 |
| 2026-06-05 | 210 | 84.0 |
| 2026-06-06 | 70 | 81.67 |
| 2026-06-07 | 0 | 70.0 |
| 2026-06-08 | 0 | 60.0 |
| 2026-06-09 | 350 | 90.0 |
| 2026-06-10 | 70 | 100.0 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Generate all days with a recursive CTE (a date spine), then LEFT JOIN sales.

</details>

<details><summary>Hint 2</summary>

After densifying, a ROWS frame of 7 rows equals 7 calendar days.

</details>

## Solution

```sql solution
WITH RECURSIVE days(day) AS (
  SELECT '2026-06-01'
  UNION ALL
  SELECT DATE(day, '+1 day') FROM days WHERE day < '2026-06-10'
), dense AS (
  SELECT d.day, COALESCE(SUM(s.revenue), 0) AS revenue
  FROM days d LEFT JOIN store_sales s ON s.day = d.day
  GROUP BY d.day
)
SELECT day, revenue,
       ROUND(AVG(revenue) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS ma_7d
FROM dense
ORDER BY day;
```

**Alternative 1**

```sql alt1
WITH RECURSIVE days(day) AS (
  SELECT '2026-06-01' UNION ALL SELECT DATE(day, '+1 day') FROM days WHERE day < '2026-06-10'
), dense AS (
  SELECT d.day, COALESCE(SUM(s.revenue), 0) AS revenue, CAST(julianday(d.day) AS INTEGER) AS dnum
  FROM days d LEFT JOIN store_sales s ON s.day = d.day GROUP BY d.day
)
SELECT day, revenue,
       ROUND(AVG(revenue) OVER (ORDER BY dnum RANGE BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS ma_7d
FROM dense ORDER BY day;
```

## Explanation

Two classic approaches:
1. **Densify** (date spine + LEFT JOIN + COALESCE 0), then `ROWS`. Works in every engine, and the dense table is often useful anyway (charts with zeros).
2. **RANGE frame on a numeric day number** (`RANGE BETWEEN 6 PRECEDING AND CURRENT ROW`) on the *sparse* table. Note this averages only the days that **exist** in the frame, i.e. it ignores missing days rather than treating them as 0. That's a different (and usually wrong) metric. Clarify which one the interviewer wants!

In early June the frame contains fewer than 7 days because history before 06-01 is out of scope, so the first rows average 1..6 days.

## Follow-up questions

<details><summary>Write the RANGE version for Postgres directly on dates.</summary>

`AVG(revenue) OVER (ORDER BY day RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW)` on the sparse table. Remember it averages only existing rows; to treat missing days as zero use `SUM(...) / 7.0`.

</details>

## Dialect notes

Spark: build the spine with `sequence(to_date(start), to_date(end), interval 1 day)` + `explode`. Postgres: `generate_series(date, date, interval '1 day')`. In production, join to a `dim_date` table.
