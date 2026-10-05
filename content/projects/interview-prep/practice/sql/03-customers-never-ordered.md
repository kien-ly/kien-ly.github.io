---
title: "Customers Who Never Ordered"
description: "Anti-join: find customers with no orders, and understand why NOT IN with NULLs is dangerous."
url: "/interview-prep/practice/sql/03-customers-never-ordered/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 3
---

# Customers Who Never Ordered

**Difficulty:** Easy · **Topics:** anti-join, not-exists, nulls · **Asked at:** Amazon, Uber, Meta

## Problem

Return the `name` of every customer who has **never placed an order**, ordered by name. Note that `orders.customer_id` can be NULL (guest checkouts).

## Schema and sample data

```sql schema
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount REAL);
INSERT INTO customers VALUES (1,'Ana'),(2,'Ben'),(3,'Chen'),(4,'Dara');
INSERT INTO orders VALUES (100,1,25.0),(101,1,10.0),(102,3,99.0),(103,NULL,15.0);
```

## Expected output

<!-- expected:start -->
| name |
|---|
| Ben |
| Dara |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Try `NOT IN (SELECT customer_id FROM orders)` first and look at the result. Why is it empty?

</details>

<details><summary>Hint 2</summary>

`NOT EXISTS` or `LEFT JOIN ... IS NULL`.

</details>

## Solution

```sql solution
SELECT c.name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)
ORDER BY c.name;
```

**Alternative 1**

```sql alt1
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL
ORDER BY c.name;
```

## Explanation

`x NOT IN (1, 3, NULL)` evaluates to `x <> 1 AND x <> 3 AND x <> NULL`. The last comparison is UNKNOWN, so the whole predicate is never TRUE and **no rows are returned**. This silent bug appears in production pipelines whenever a nullable column sneaks into the subquery.

`NOT EXISTS` is NULL-safe and optimisers compile it into an efficient **anti-join**. In the `LEFT JOIN` version, test a column that is never NULL on matched rows (the primary key), not `customer_id`.

## Follow-up questions

<details><summary>Which is fastest in Spark?</summary>

`NOT EXISTS` and `LEFT ANTI JOIN` both become a LeftAnti join. In the DataFrame API: `customers.join(orders, customers.id == orders.customer_id, "left_anti")`. If orders is small it is broadcast.

</details>
