---
title: "Users Who Bought A and Then B Within 7 Days"
description: "Event sequencing with a self-join and time bounds: find customers who purchased product A and later product B within a week."
url: "/interview-prep/practice/sql/21-bought-a-then-b/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 21
---

# Users Who Bought A and Then B Within 7 Days

**Difficulty:** Medium · **Topics:** self-join, sequencing, time-bounds · **Asked at:** Amazon, Instacart, Walmart

## Problem

Return the distinct `customer_id`s who bought `'phone'` and then bought `'case'` **after** it, within **7 days** (inclusive) of a phone purchase. Order by customer_id.

## Schema and sample data

```sql schema
CREATE TABLE purchases (customer_id INTEGER, product TEXT, ts TEXT);
INSERT INTO purchases VALUES
(1,'phone','2026-02-01 10:00'),(1,'case','2026-02-03 18:00'),
(2,'case','2026-02-01 09:00'),(2,'phone','2026-02-02 09:00'),
(3,'phone','2026-02-01 10:00'),(3,'case','2026-02-12 10:00'),
(4,'phone','2026-01-01 10:00'),(4,'phone','2026-02-10 10:00'),(4,'case','2026-02-15 10:00'),
(5,'phone','2026-03-01 10:00'),(5,'case','2026-03-08 10:00');
```

## Expected output

<!-- expected:start -->
| customer_id |
|---|
| 1 |
| 4 |
| 5 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Join purchases to itself: left side = phone, right side = case of the same customer.

</details>

<details><summary>Hint 2</summary>

Bound the time difference on both sides: > 0 and <= 7 days.

</details>

## Solution

```sql solution
SELECT DISTINCT a.customer_id
FROM purchases a
JOIN purchases b
  ON b.customer_id = a.customer_id
 AND a.product = 'phone' AND b.product = 'case'
 AND b.ts > a.ts
 AND julianday(b.ts) - julianday(a.ts) <= 7
ORDER BY a.customer_id;
```

**Alternative 1**

```sql alt1
SELECT DISTINCT customer_id FROM purchases a
WHERE product = 'phone'
  AND EXISTS (SELECT 1 FROM purchases b
              WHERE b.customer_id = a.customer_id AND b.product = 'case'
                AND b.ts > a.ts AND julianday(b.ts) - julianday(a.ts) <= 7)
ORDER BY customer_id;
```

## Explanation

- Customer 2 bought the case **before** the phone, customer 3 waited 11 days: both excluded.
- Customer 4's first phone is too early, but the second phone qualifies. Any phone can start the window, which is why we don't use "first phone only".
- Customer 5: exactly 7 days → included (inclusive bound). Clarify boundaries in interviews.

At scale, self-joins on customer can explode for heavy customers; the `EXISTS` form lets engines stop at the first match (semi-join), and in Spark you can pre-filter both sides to the two products before joining.
