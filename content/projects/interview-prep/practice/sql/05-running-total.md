---
title: "Running Total of Revenue per Customer"
description: "Cumulative sum with a window frame, and why the default RANGE frame gives surprising results on ties."
url: "/interview-prep/practice/sql/05-running-total/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 5
---

# Running Total of Revenue per Customer

**Difficulty:** Easy · **Topics:** window-functions, running-total, frames · **Asked at:** Amazon, Stripe, Shopify

## Problem

For each order, return `customer_id, order_id, order_date, amount` and `running_total`: the customer's cumulative spend **up to and including this order**, processing orders by `order_date` then `order_id`. Order the output by `customer_id, order_date, order_id`.

## Schema and sample data

```sql schema
CREATE TABLE orders (order_id INTEGER, customer_id INTEGER, order_date TEXT, amount INTEGER);
INSERT INTO orders VALUES
(1, 1, '2026-01-01', 100),(2, 1, '2026-01-05', 50),(3, 1, '2026-01-05', 25),
(4, 2, '2026-01-02', 300),(5, 2, '2026-01-09', 20),(6, 1, '2026-02-01', 75);
```

## Expected output

<!-- expected:start -->
| customer_id | order_id | order_date | amount | running_total |
|---|---|---|---|---|
| 1 | 1 | 2026-01-01 | 100 | 100 |
| 1 | 2 | 2026-01-05 | 50 | 150 |
| 1 | 3 | 2026-01-05 | 25 | 175 |
| 1 | 6 | 2026-02-01 | 75 | 250 |
| 2 | 4 | 2026-01-02 | 300 | 300 |
| 2 | 5 | 2026-01-09 | 20 | 320 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

`SUM(amount) OVER (PARTITION BY ... ORDER BY ...)`

</details>

<details><summary>Hint 2</summary>

Customer 1 has two orders on 2026-01-05. What does the default frame do with ties?

</details>

## Solution

```sql solution
SELECT customer_id, order_id, order_date, amount,
       SUM(amount) OVER (PARTITION BY customer_id
                         ORDER BY order_date, order_id
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM orders
ORDER BY customer_id, order_date, order_id;
```

## Explanation

With only `ORDER BY order_date`, the default frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. Both 2026-01-05 orders are **peers** and both would show 175, which isn't a running total per order. Adding a unique tie-breaker (`order_id`) and an explicit `ROWS` frame produces 150 then 175.

## Follow-up questions

<details><summary>How do you reset the running total each month?</summary>

Add the month to the partition: `PARTITION BY customer_id, strftime('%Y-%m', order_date)`.

</details>

<details><summary>How do you find the order where each customer crossed 150 in lifetime spend?</summary>

Compute the running total, then keep the first row per customer where `running_total >= 150` (ROW_NUMBER over those rows, or MIN(order_date) with the condition).

</details>
