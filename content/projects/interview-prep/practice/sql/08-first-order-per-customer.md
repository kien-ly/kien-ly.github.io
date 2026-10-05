---
title: "First Purchase per Customer"
description: "Find each customer's first order and its details, plus the share of revenue coming from first orders."
url: "/interview-prep/practice/sql/08-first-order-per-customer/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 8
---

# First Purchase per Customer

**Difficulty:** Easy · **Topics:** row-number, min-by, window-functions · **Asked at:** DoorDash, Uber Eats, Shopify

## Problem

For each customer return the `order_id`, `order_ts` and `amount` of their **first** order (earliest `order_ts`, ties broken by lowest `order_id`), plus `total_orders` for that customer. Order by `customer_id`.

## Schema and sample data

```sql schema
CREATE TABLE orders (order_id INTEGER, customer_id INTEGER, order_ts TEXT, amount REAL);
INSERT INTO orders VALUES
(11, 1, '2026-02-01 10:00', 30.0),(12, 1, '2026-01-15 09:00', 12.5),(13, 2, '2026-01-20 18:00', 40.0),
(14, 2, '2026-01-20 18:00', 22.0),(15, 3, '2026-03-01 07:30', 9.99),(16, 1, '2026-03-01 08:00', 18.0);
```

## Expected output

<!-- expected:start -->
| customer_id | order_id | order_ts | amount | total_orders |
|---|---|---|---|---|
| 1 | 12 | 2026-01-15 09:00 | 12.5 | 3 |
| 2 | 13 | 2026-01-20 18:00 | 40.0 | 2 |
| 3 | 15 | 2026-03-01 07:30 | 9.99 | 1 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

ROW_NUMBER for the first row and COUNT(*) OVER for the total, in the same pass.

</details>

## Solution

```sql solution
SELECT customer_id, order_id, order_ts, amount, total_orders
FROM (
  SELECT *,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_ts, order_id) AS rn,
         COUNT(*)     OVER (PARTITION BY customer_id)                          AS total_orders
  FROM orders
)
WHERE rn = 1
ORDER BY customer_id;
```

## Explanation

Two windows with the same partition share one sort/shuffle in most engines. `MIN(order_ts)` alone would give the time but not the other columns of that row; that's what `MIN_BY`/`ARG_MIN` or ROW_NUMBER solve.

## Follow-up questions

<details><summary>Spark one-liner?</summary>

`orders.groupBy("customer_id").agg(F.min_by("order_id", F.struct("order_ts","order_id")), F.count("*"))`, or `F.min(F.struct("order_ts","order_id","amount"))`, since structs compare field by field.

</details>
