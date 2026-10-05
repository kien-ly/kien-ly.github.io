---
title: "Customers Driving 80% of Revenue"
description: "Cumulative share with a window running sum to find the smallest set of customers producing 80% of revenue."
url: "/interview-prep/practice/sql/28-pareto-customers/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 28
---

# Customers Driving 80% of Revenue

**Difficulty:** Medium · **Topics:** running-total, pareto, window-functions · **Asked at:** Amazon, Salesforce, Uber

## Problem

Rank customers by total revenue (descending; ties by customer_id). Return the customers needed to reach **at least 80%** of total revenue: `customer_id, revenue, cumulative_pct` (1 decimal). A customer is included if the cumulative share **before** them is below 80%. Order by rank.

## Schema and sample data

```sql schema
CREATE TABLE orders (customer_id INTEGER, amount INTEGER);
INSERT INTO orders VALUES (1,500),(2,300),(1,200),(3,150),(4,100),(5,50),(6,40),(7,30),(8,20),(2,10);
```

## Expected output

<!-- expected:start -->
| customer_id | revenue | cumulative_pct |
|---|---|---|
| 1 | 700 | 50.0 |
| 2 | 310 | 72.1 |
| 3 | 150 | 82.9 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Running sum ordered by revenue desc divided by the grand total.

</details>

<details><summary>Hint 2</summary>

Include the customer that crosses the threshold: compare the running share *excluding* the current customer.

</details>

## Solution

```sql solution
WITH c AS (
  SELECT customer_id, SUM(amount) AS revenue FROM orders GROUP BY customer_id
), s AS (
  SELECT customer_id, revenue,
         SUM(revenue) OVER (ORDER BY revenue DESC, customer_id ROWS UNBOUNDED PRECEDING) AS cum,
         SUM(revenue) OVER () AS total
  FROM c
)
SELECT customer_id, revenue, ROUND(100.0 * cum / total, 1) AS cumulative_pct
FROM s
WHERE (cum - revenue) * 1.0 / total < 0.8
ORDER BY revenue DESC, customer_id;
```

## Explanation

Total = 1400. Running shares: 50% (c1), 72.1% (c2), 82.9% (c3) → c3 crosses 80%, so it's included; c4's previous share (82.9%) is already ≥ 80% → excluded. Using `cum <= 0.8 * total` would stop *before* reaching 80%, a classic off-by-one.
