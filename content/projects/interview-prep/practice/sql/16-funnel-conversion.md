---
title: "Ordered Funnel Conversion"
description: "Count users reaching each funnel step in order (view, cart, purchase) within a time limit."
url: "/interview-prep/practice/sql/16-funnel-conversion/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 16
---

# Ordered Funnel Conversion

**Difficulty:** Medium · **Topics:** funnel, conditional-aggregation, product-analytics · **Asked at:** Meta, Amazon, Booking.com, Shopify

## Problem

Funnel: `view` → `add_to_cart` → `purchase`. A user counts for a step only if they did the previous step **earlier** (use each user's first occurrence of each event), and the purchase must happen **within 24 hours of the first view**. Return one row with `viewed, carted, purchased, view_to_purchase_pct` (rounded to 1 decimal).

## Schema and sample data

```sql schema
CREATE TABLE events (user_id INTEGER, event TEXT, ts TEXT);
INSERT INTO events VALUES
(1,'view','2026-05-01 10:00'),(1,'add_to_cart','2026-05-01 10:05'),(1,'purchase','2026-05-01 10:20'),
(2,'view','2026-05-01 11:00'),(2,'add_to_cart','2026-05-01 11:30'),
(3,'add_to_cart','2026-05-01 09:00'),(3,'view','2026-05-01 09:10'),(3,'purchase','2026-05-01 09:20'),
(4,'view','2026-05-01 08:00'),(4,'add_to_cart','2026-05-02 07:00'),(4,'purchase','2026-05-02 09:00'),
(5,'view','2026-05-02 12:00'),(5,'view','2026-05-02 12:30'),(5,'add_to_cart','2026-05-02 12:40'),(5,'purchase','2026-05-02 13:00');
```

## Expected output

<!-- expected:start -->
| viewed | carted | purchased | view_to_purchase_pct |
|---|---|---|---|
| 5 | 4 | 2 | 40.0 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

One row per user with MIN(ts) per event type (conditional aggregation).

</details>

<details><summary>Hint 2</summary>

Then count users with ordered, non-NULL timestamps.

</details>

## Solution

```sql solution
WITH f AS (
  SELECT user_id,
         MIN(CASE WHEN event = 'view'        THEN ts END) AS t_view,
         MIN(CASE WHEN event = 'add_to_cart' THEN ts END) AS t_cart,
         MIN(CASE WHEN event = 'purchase'    THEN ts END) AS t_buy
  FROM events GROUP BY user_id
)
SELECT COUNT(t_view) AS viewed,
       SUM(CASE WHEN t_cart > t_view THEN 1 ELSE 0 END) AS carted,
       SUM(CASE WHEN t_cart > t_view AND t_buy > t_cart
                 AND (julianday(t_buy) - julianday(t_view)) * 24 <= 24 THEN 1 ELSE 0 END) AS purchased,
       ROUND(100.0 * SUM(CASE WHEN t_cart > t_view AND t_buy > t_cart
                 AND (julianday(t_buy) - julianday(t_view)) * 24 <= 24 THEN 1 ELSE 0 END) / COUNT(t_view), 1) AS view_to_purchase_pct
FROM f;
```

## Explanation

- User 3 carted **before** viewing → counts as viewed only.
- User 4 purchased 25 h after the first view → not a converted purchase.
- User 5 viewed twice; first occurrence semantics make this one funnel entry.

Comparisons with NULL are UNKNOWN → `CASE` falls to 0, so users who never reached a step are excluded naturally.

## Follow-up questions

<details><summary>What changes if the funnel is per session instead of per user?</summary>

Group by (user_id, session_id) after sessionizing; the denominator becomes sessions with a view.

</details>

<details><summary>Why might "first occurrence" be wrong?</summary>

A user who viewed in January and returned in March to buy would be excluded by the 24 h rule. A per-attempt funnel (each view starts an attempt) needs LEAD-based matching of the next cart/purchase after each view.

</details>
