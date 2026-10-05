---
title: "Rolling 3-Month Revenue per Customer"
description: "A calendar-aware rolling window using a month index with RANGE, robust to months with no orders."
url: "/interview-prep/practice/sql/27-rolling-3-month-revenue/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 27
---

# Rolling 3-Month Revenue per Customer

**Difficulty:** Medium · **Topics:** range-frame, rolling-window, time-series · **Asked at:** Stripe, Shopify, Adobe

## Problem

For each customer and each month in which they ordered, return `customer_id, month, revenue` and `rolling_3m`: the customer's revenue in that month plus the **two previous calendar months** (months without orders count as 0). Order by customer, month.

## Schema and sample data

```sql schema
CREATE TABLE orders (customer_id INTEGER, order_date TEXT, amount INTEGER);
INSERT INTO orders VALUES
(1,'2026-01-05',100),(1,'2026-01-25',50),(1,'2026-02-10',70),(1,'2026-05-02',40),(1,'2026-06-15',10),
(2,'2026-03-03',300),(2,'2026-04-04',30);
```

## Expected output

<!-- expected:start -->
| customer_id | month | revenue | rolling_3m |
|---|---|---|---|
| 1 | 2026-01 | 150 | 150 |
| 1 | 2026-02 | 70 | 220 |
| 1 | 2026-05 | 40 | 40 |
| 1 | 2026-06 | 10 | 50 |
| 2 | 2026-03 | 300 | 300 |
| 2 | 2026-04 | 30 | 330 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

For customer 1, a 3-row ROWS frame on May would include January and February, which are more than two months back. Use a month index and RANGE.

</details>

<details><summary>Hint 2</summary>

Month index = year*12 + month.

</details>

## Solution

```sql solution
WITH monthly AS (
  SELECT customer_id,
         strftime('%Y-%m', order_date) AS month,
         CAST(strftime('%Y', order_date) AS INTEGER) * 12 + CAST(strftime('%m', order_date) AS INTEGER) AS mi,
         SUM(amount) AS revenue
  FROM orders GROUP BY customer_id, month
)
SELECT customer_id, month, revenue,
       SUM(revenue) OVER (PARTITION BY customer_id ORDER BY mi
                          RANGE BETWEEN 2 PRECEDING AND CURRENT ROW) AS rolling_3m
FROM monthly
ORDER BY customer_id, month;
```

## Explanation

Customer 1's months are Jan, Feb, May, Jun. A `ROWS 2 PRECEDING` frame on May would sum Jan + Feb + May, which is wrong because Jan/Feb are 3–4 months back. `RANGE BETWEEN 2 PRECEDING` on the integer month index includes only Mar–May, of which only May exists → 40. Jun → May + Jun = 50.

## Follow-up questions

<details><summary>Spark version?</summary>

`Window.partitionBy("customer_id").orderBy("mi").rangeBetween(-2, 0)`.

</details>
