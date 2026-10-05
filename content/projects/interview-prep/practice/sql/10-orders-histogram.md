---
title: "Histogram of Orders per Customer"
description: "Two-level aggregation: count customers by how many orders they placed, including customers with zero orders."
url: "/interview-prep/practice/sql/10-orders-histogram/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 10
---

# Histogram of Orders per Customer

**Difficulty:** Easy · **Topics:** aggregation, left-join, histogram · **Asked at:** Meta, Twitter/X, Etsy

## Problem

Build a histogram: for each `num_orders` value (0, 1, 2, …), how many customers placed exactly that many orders in 2026? Include customers with zero orders. Order by `num_orders`.

## Schema and sample data

```sql schema
CREATE TABLE customers (id INTEGER PRIMARY KEY, signup_date TEXT);
CREATE TABLE orders (id INTEGER, customer_id INTEGER, order_date TEXT);
INSERT INTO customers VALUES (1,'2025-12-01'),(2,'2026-01-03'),(3,'2026-01-09'),(4,'2026-02-11'),(5,'2026-02-20');
INSERT INTO orders VALUES (1,1,'2026-01-02'),(2,1,'2026-01-09'),(3,2,'2026-01-05'),(4,3,'2025-12-31'),
(5,1,'2026-02-01'),(6,4,'2026-02-12'),(7,2,'2026-03-01');
```

## Expected output

<!-- expected:start -->
| num_orders | customers |
|---|---|
| 0 | 2 |
| 1 | 1 |
| 2 | 1 |
| 3 | 1 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

First count orders per customer (LEFT JOIN so zero-order customers survive), then count customers per value.

</details>

<details><summary>Hint 2</summary>

Put the 2026 filter in the ON clause, not WHERE. Why?

</details>

## Solution

```sql solution
WITH per_customer AS (
  SELECT c.id, COUNT(o.id) AS num_orders
  FROM customers c
  LEFT JOIN orders o
    ON o.customer_id = c.id AND o.order_date >= '2026-01-01' AND o.order_date < '2027-01-01'
  GROUP BY c.id
)
SELECT num_orders, COUNT(*) AS customers
FROM per_customer
GROUP BY num_orders
ORDER BY num_orders;
```

## Explanation

- `COUNT(o.id)` counts only matched rows (0 for no orders); `COUNT(*)` would count 1 for unmatched customers.
- A date filter in `WHERE` would remove customers whose only orders are from 2025 (customer 3) or who have none, which silently turns the LEFT JOIN into an INNER JOIN.
