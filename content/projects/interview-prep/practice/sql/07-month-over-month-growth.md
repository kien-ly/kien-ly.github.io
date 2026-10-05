---
title: "Month-over-Month and Year-over-Year Growth"
description: "Use LAG to compare each month with the previous month and the same month last year."
url: "/interview-prep/practice/sql/07-month-over-month-growth/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 7
---

# Month-over-Month and Year-over-Year Growth

**Difficulty:** Easy · **Topics:** lag, window-functions, time-series · **Asked at:** Google, Netflix, Airbnb

## Problem

From daily `orders`, compute monthly revenue and:
- `prev_month_revenue` and `mom_pct` (percentage change vs the previous **calendar** month, rounded to 1 decimal)
- `yoy_pct`: percentage change vs the same month one year earlier (NULL if not available)

Months with no orders don't exist in this data. Order by month.

## Schema and sample data

```sql schema
CREATE TABLE orders (order_date TEXT, amount INTEGER);
INSERT INTO orders VALUES
('2025-01-15',100),('2025-02-10',120),('2025-03-03',90),
('2026-01-05',150),('2026-01-20',50),('2026-02-14',210),('2026-03-30',180);
```

## Expected output

<!-- expected:start -->
| month | revenue | prev_month_revenue | mom_pct | yoy_pct |
|---|---|---|---|---|
| 2025-01 | 100 | NULL | NULL | NULL |
| 2025-02 | 120 | 100 | 20.0 | NULL |
| 2025-03 | 90 | 120 | -25.0 | NULL |
| 2026-01 | 200 | 90 | 122.2 | 100.0 |
| 2026-02 | 210 | 200 | 5.0 | 75.0 |
| 2026-03 | 180 | 210 | -14.3 | 100.0 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Aggregate to month first: `strftime('%Y-%m', order_date)`.

</details>

<details><summary>Hint 2</summary>

`LAG(revenue, 12)` only works if every month exists. Is that true here? Join on the month string instead.

</details>

## Solution

```sql solution
WITH monthly AS (
  SELECT strftime('%Y-%m', order_date) AS month, SUM(amount) AS revenue
  FROM orders GROUP BY 1
)
SELECT m.month, m.revenue,
       LAG(m.revenue) OVER (ORDER BY m.month) AS prev_month_revenue,
       ROUND(100.0 * (m.revenue - LAG(m.revenue) OVER (ORDER BY m.month))
             / LAG(m.revenue) OVER (ORDER BY m.month), 1) AS mom_pct,
       ROUND(100.0 * (m.revenue - ly.revenue) / ly.revenue, 1) AS yoy_pct
FROM monthly m
LEFT JOIN monthly ly
  ON ly.month = strftime('%Y-%m', DATE(m.month || '-01', '-1 year'))
ORDER BY m.month;
```

## Explanation

- `LAG` compares with the **previous row**, which equals the previous calendar month only if no months are missing. Here 2025-03 → 2026-01 is a 10-month jump, so the "MoM" for 2026-01 compares against March 2025. Point this out in an interview, then fix it by densifying with a calendar of months or by joining on `month - 1`.
- For YoY the solution joins on the computed month string, which is robust to gaps. `LAG(revenue, 12)` would be wrong here.

## Follow-up questions

<details><summary>Make MoM robust to missing months.</summary>

Generate a month spine (recursive CTE or calendar table), left join revenue with COALESCE(…, 0), then LAG. Or self-join on `month = previous calendar month` like the YoY join.

</details>
