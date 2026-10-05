---
title: "Category Share of Revenue"
description: "Percent of total and percent within group using window aggregates over the whole partition."
url: "/interview-prep/practice/sql/06-percent-of-total/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 6
---

# Category Share of Revenue

**Difficulty:** Easy · **Topics:** window-functions, aggregation, percent-of-total · **Asked at:** Amazon, Walmart, Instacart

## Problem

For each `(category, product)`, return total revenue, its share of the **category's** revenue (`pct_of_category`), and its share of **all** revenue (`pct_of_total`), both as percentages rounded to 1 decimal. Order by category, then revenue descending.

## Schema and sample data

```sql schema
CREATE TABLE sales (product TEXT, category TEXT, revenue INTEGER);
INSERT INTO sales VALUES
('laptop','electronics',1200),('laptop','electronics',800),('phone','electronics',1000),
('desk','furniture',400),('chair','furniture',150),('chair','furniture',50),('lamp','furniture',400);
```

## Expected output

<!-- expected:start -->
| category | product | revenue | pct_of_category | pct_of_total |
|---|---|---|---|---|
| electronics | laptop | 2000 | 66.7 | 50.0 |
| electronics | phone | 1000 | 33.3 | 25.0 |
| furniture | desk | 400 | 40.0 | 10.0 |
| furniture | lamp | 400 | 40.0 | 10.0 |
| furniture | chair | 200 | 20.0 | 5.0 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Aggregate to product level first with GROUP BY, then apply window functions on the aggregated result.

</details>

<details><summary>Hint 2</summary>

`SUM(SUM(revenue)) OVER (...)` is legal: the inner SUM is the GROUP BY aggregate.

</details>

## Solution

```sql solution
SELECT category, product,
       SUM(revenue) AS revenue,
       ROUND(100.0 * SUM(revenue) / SUM(SUM(revenue)) OVER (PARTITION BY category), 1) AS pct_of_category,
       ROUND(100.0 * SUM(revenue) / SUM(SUM(revenue)) OVER (), 1)                      AS pct_of_total
FROM sales
GROUP BY category, product
ORDER BY category, revenue DESC, product;
```

## Explanation

Window functions run **after** GROUP BY, so they can aggregate the aggregates. `OVER ()` with an empty window spans all grouped rows. `100.0 *` avoids integer division.

## Follow-up questions

<details><summary>Return only products that make up the top 80% of each category’s revenue.</summary>

Add a running share: `SUM(SUM(revenue)) OVER (PARTITION BY category ORDER BY SUM(revenue) DESC ROWS UNBOUNDED PRECEDING) / SUM(SUM(revenue)) OVER (PARTITION BY category)` and keep rows where the *previous* running share is < 0.8.

</details>
