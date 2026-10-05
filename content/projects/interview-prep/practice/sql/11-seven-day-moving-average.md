---
title: "7-Day Moving Average of Revenue"
description: "Rolling average with a ROWS frame, emitting a value only when a full 7-day window is available."
url: "/interview-prep/practice/sql/11-seven-day-moving-average/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 11
---

# 7-Day Moving Average of Revenue

**Difficulty:** Medium · **Topics:** moving-average, window-functions, frames · **Asked at:** Amazon, Meta, Google, Netflix

## Problem

`daily_revenue` has exactly one row per day (no gaps). For each day return `revenue`, `ma_7` (the average of the current day and the 6 previous days, rounded to 2 decimals) and `ma_7_full`, which is the same value but **NULL until 7 days of history exist**. Order by day.

## Schema and sample data

```sql schema
CREATE TABLE daily_revenue (day TEXT PRIMARY KEY, revenue INTEGER);
INSERT INTO daily_revenue VALUES
('2026-05-01',100),('2026-05-02',120),('2026-05-03',90),('2026-05-04',150),('2026-05-05',130),
('2026-05-06',170),('2026-05-07',110),('2026-05-08',200),('2026-05-09',160),('2026-05-10',140);
```

## Expected output

<!-- expected:start -->
| day | revenue | ma_7 | ma_7_full |
|---|---|---|---|
| 2026-05-01 | 100 | 100.0 | NULL |
| 2026-05-02 | 120 | 110.0 | NULL |
| 2026-05-03 | 90 | 103.33 | NULL |
| 2026-05-04 | 150 | 115.0 | NULL |
| 2026-05-05 | 130 | 118.0 | NULL |
| 2026-05-06 | 170 | 126.67 | NULL |
| 2026-05-07 | 110 | 124.29 | 124.29 |
| 2026-05-08 | 200 | 138.57 | 138.57 |
| 2026-05-09 | 160 | 144.29 | 144.29 |
| 2026-05-10 | 140 | 151.43 | 151.43 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

`AVG(...) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)`

</details>

<details><summary>Hint 2</summary>

Count rows in the same frame to know whether it is full.

</details>

## Solution

```sql solution
SELECT day, revenue,
       ROUND(AVG(revenue) OVER w, 2) AS ma_7,
       CASE WHEN COUNT(*) OVER w = 7 THEN ROUND(AVG(revenue) OVER w, 2) END AS ma_7_full
FROM daily_revenue
WINDOW w AS (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
ORDER BY day;
```

## Explanation

- `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` = the last 7 **rows**. That equals 7 days only because the data has no gaps (see the next problem for gaps).
- The early rows average fewer than 7 values. Dashboards often show these as misleadingly low or high, which is why `ma_7_full` exists.
- The named `WINDOW w` clause avoids repeating the spec (supported by Postgres, SQLite, MySQL 8, BigQuery and Spark 3+; not by Snowflake).

## Follow-up questions

<details><summary>How would you compute a 7-day moving average per store over 3 years of data in Spark?</summary>

`Window.partitionBy("store_id").orderBy("day").rowsBetween(-6, 0)` after densifying days per store. Each store is one partition; very large stores are fine because the frame is bounded (Spark streams through sorted rows).

</details>

<details><summary>Moving median instead of average?</summary>

Not supported as a window aggregate in most engines. Use `percentile_approx` over a range window in Spark, or collect the 7 values into an array and compute the median.

</details>
