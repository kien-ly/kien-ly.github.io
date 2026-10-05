---
title: "Fix the Skewed Join"
description: "Diagnose and fix a Spark join where one key dominates, using AQE, broadcast and salting."
url: "/interview-prep/practice/spark/fix-skewed-join/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 1
---

# Fix the Skewed Join

**Difficulty:** Medium  
**Topics:** Data Skew, Join Optimization, Salting  
**Company Tags:** Meta, Netflix, Uber

## Problem Statement

You have two tables:
- `orders` - 100 million rows, heavily skewed on `customer_id` (top 1% of customers have 50% of orders)
- `customers` - 1 million rows, evenly distributed

The following query times out due to data skew:

```sql
SELECT 
    c.customer_name,
    c.segment,
    COUNT(*) as order_count,
    SUM(o.amount) as total_spent
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.customer_name, c.segment;
```

**Your task:** Rewrite the query to handle the skew efficiently.

## Setup

```sql
-- Tables are pre-loaded in: interview.skew.orders and interview.skew.customers
-- Check the skew:
SELECT 
    customer_id, 
    COUNT(*) as cnt 
FROM interview.skew.orders 
GROUP BY customer_id 
ORDER BY cnt DESC 
LIMIT 20;
```

## Constraints

- You cannot modify the underlying data or table structure
- Solution must complete in under 30 seconds
- Result must match the expected output exactly

## Hints

<details>
<summary>Hint 1</summary>
The problem is that a few customer_ids have millions of rows, causing executor skew during the join.
</details>

<details>
<summary>Hint 2</summary>
Consider "salting" - adding a random suffix to the join key for high-cardinality customers.
</details>

<details>
<summary>Hint 3</summary>
You can use CASE WHEN with RAND() or create an "exploded" version of the smaller table.
</details>

## Solution

<details>
<summary>Click to reveal solution</summary>

```sql
-- Approach 1: Broadcast the small table (if it fits in memory)
SELECT /*+ BROADCAST(c) */
    c.customer_name,
    c.segment,
    COUNT(*) as order_count,
    SUM(o.amount) as total_spent
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.customer_name, c.segment;

-- Approach 2: Salting for extreme skew
WITH salted_orders AS (
    SELECT 
        *,
        CONCAT(customer_id, '_', FLOOR(RAND() * 10)) as salted_key
    FROM orders
),
exploded_customers AS (
    SELECT 
        c.*,
        CONCAT(c.customer_id, '_', salt.n) as salted_key
    FROM customers c
    CROSS JOIN (SELECT explode(sequence(0, 9)) as n) salt
)
SELECT 
    c.customer_name,
    c.segment,
    COUNT(*) as order_count,
    SUM(o.amount) as total_spent
FROM salted_orders o
JOIN exploded_customers c ON o.salted_key = c.salted_key
GROUP BY c.customer_name, c.segment;

-- Approach 3: AQE with skew join hint (Spark 3.0+)
SET spark.sql.adaptive.enabled = true;
SET spark.sql.adaptive.skewJoin.enabled = true;
SET spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes = 256MB;

SELECT 
    c.customer_name,
    c.segment,
    COUNT(*) as order_count,
    SUM(o.amount) as total_spent
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.customer_name, c.segment;
```

**Explanation:**
- Approach 1 works if the small table fits in memory (~1M rows typically does)
- Approach 2 (salting) is the classic solution - it distributes skewed keys across 10 partitions
- Approach 3 uses Spark's Adaptive Query Execution to automatically handle skew

</details>

## What Interviewers Look For

1. **Recognition** - Can you identify that this is a skew problem?
2. **Multiple approaches** - Do you know more than one solution?
3. **Trade-offs** - Can you explain when to use broadcast vs salting vs AQE?
4. **Spark internals** - Do you understand shuffle and partition behavior?
