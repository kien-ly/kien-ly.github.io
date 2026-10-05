---
title: "Average Days Between Purchases"
description: "Use LAG to compute time between consecutive purchases per customer and summarise repeat behaviour."
url: "/interview-prep/practice/sql/25-repeat-purchase-interval/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 25
---

# Average Days Between Purchases

**Difficulty:** Medium · **Topics:** lag, time-between-events, aggregation · **Asked at:** Amazon, Starbucks, Chewy

## Problem

For each customer with **at least two** purchases, return `customer_id`, `purchases`, `avg_days_between` (average gap between consecutive purchase dates, 1 decimal) and `max_gap_days`. Order by customer_id.

## Schema and sample data

```sql schema
CREATE TABLE purchases (customer_id INTEGER, purchase_date TEXT);
INSERT INTO purchases VALUES
(1,'2026-01-01'),(1,'2026-01-11'),(1,'2026-01-31'),
(2,'2026-02-01'),
(3,'2026-01-05'),(3,'2026-01-06'),(3,'2026-03-07'),(3,'2026-03-08');
```

## Expected output

<!-- expected:start -->
| customer_id | purchases | avg_days_between | max_gap_days |
|---|---|---|---|
| 1 | 3 | 15.0 | 20 |
| 3 | 4 | 20.7 | 60 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

LAG(purchase_date) per customer, then aggregate the differences (NULL for the first purchase is ignored by AVG).

</details>

## Solution

```sql solution
WITH g AS (
  SELECT customer_id,
         julianday(purchase_date) - julianday(LAG(purchase_date) OVER (PARTITION BY customer_id ORDER BY purchase_date)) AS gap
  FROM purchases
)
SELECT customer_id, COUNT(*) AS purchases,
       ROUND(AVG(gap), 1) AS avg_days_between,
       CAST(MAX(gap) AS INTEGER) AS max_gap_days
FROM g
GROUP BY customer_id
HAVING COUNT(*) >= 2
ORDER BY customer_id;
```

## Explanation

Shortcut worth mentioning: the average consecutive gap equals `(last − first) / (n − 1)` (customer 1: 30/2 = 15). The mean hides bimodal behaviour (customer 3: three gaps of 1, 60, 1 days → mean 20.7), so `max_gap_days` or a median is often more useful for churn definitions.
