---
title: "Products Frequently Bought Together"
description: "Self-join order lines to count product pairs, with support and confidence metrics."
url: "/interview-prep/practice/sql/38-market-basket-pairs/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 38
---

# Products Frequently Bought Together

**Difficulty:** Hard · **Topics:** self-join, market-basket, combinatorics · **Asked at:** Amazon, Instacart, Walmart, Target

## Problem

Find product pairs that appear together in **at least 2 orders**. Return `product_a, product_b` (alphabetical, `product_a < product_b`), `orders_together`, and `confidence_a_to_b` = orders with both / orders containing `product_a` (2 decimals). Order by orders_together desc, then product_a, product_b.

## Schema and sample data

```sql schema
CREATE TABLE order_lines (order_id INTEGER, product TEXT);
INSERT INTO order_lines VALUES
(1,'bread'),(1,'butter'),(1,'milk'),
(2,'bread'),(2,'butter'),
(3,'bread'),(3,'jam'),(3,'butter'),
(4,'milk'),(4,'cereal'),
(5,'milk'),(5,'cereal'),(5,'bread'),
(6,'bread'),(6,'bread');
```

## Expected output

<!-- expected:start -->
| product_a | product_b | orders_together | confidence_a_to_b |
|---|---|---|---|
| bread | butter | 3 | 0.6 |
| bread | milk | 2 | 0.4 |
| cereal | milk | 2 | 1.0 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Self-join on order_id with `a.product < b.product` to get each unordered pair once and exclude self-pairs.

</details>

<details><summary>Hint 2</summary>

Deduplicate lines first: order 6 has bread twice.

</details>

## Solution

```sql solution
WITH lines AS (SELECT DISTINCT order_id, product FROM order_lines),
pairs AS (
  SELECT a.product AS product_a, b.product AS product_b, COUNT(*) AS orders_together
  FROM lines a JOIN lines b ON a.order_id = b.order_id AND a.product < b.product
  GROUP BY a.product, b.product
  HAVING COUNT(*) >= 2
), item_orders AS (
  SELECT product, COUNT(*) AS n FROM lines GROUP BY product
)
SELECT p.product_a, p.product_b, p.orders_together,
       ROUND(1.0 * p.orders_together / i.n, 2) AS confidence_a_to_b
FROM pairs p JOIN item_orders i ON i.product = p.product_a
ORDER BY p.orders_together DESC, p.product_a, p.product_b;
```

## Explanation

`a.product < b.product` halves the work and avoids (x, x) pairs. Without deduplicating lines, order 6 would create a bread–bread pair (excluded anyway by `<`) and in general duplicates inflate counts.

**Scale warning:** an order with k items produces k(k−1)/2 pairs. A few huge B2B orders can explode the join, so cap basket size or sample, and in Spark consider FP-Growth (`pyspark.ml.fpm.FPGrowth`). Lift = confidence / P(b) is the usual next metric.
