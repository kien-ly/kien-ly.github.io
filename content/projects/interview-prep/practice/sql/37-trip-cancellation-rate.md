---
title: "Trip Cancellation Rate Excluding Banned Users"
description: "Filter on two joined roles of the same users table and compute a daily ratio (classic LeetCode 262)."
url: "/interview-prep/practice/sql/37-trip-cancellation-rate/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 37
---

# Trip Cancellation Rate Excluding Banned Users

**Difficulty:** Hard · **Topics:** joins, ratios, filtering · **Asked at:** Uber, Lyft, DoorDash

## Problem

Compute the daily **cancellation rate** between 2026-10-01 and 2026-10-03 for trips where **neither** the client **nor** the driver is banned. A trip is cancelled if its status starts with `cancelled`. Return `day, cancellation_rate` (2 decimals), ordered by day. Days with no qualifying trips don't appear.

## Schema and sample data

```sql schema
CREATE TABLE users (user_id INTEGER PRIMARY KEY, banned TEXT, role TEXT);
CREATE TABLE trips (id INTEGER PRIMARY KEY, client_id INTEGER, driver_id INTEGER, status TEXT, request_at TEXT);
INSERT INTO users VALUES (1,'No','client'),(2,'Yes','client'),(3,'No','client'),(4,'No','client'),
(10,'No','driver'),(11,'No','driver'),(12,'No','driver'),(13,'Yes','driver');
INSERT INTO trips VALUES
(1,1,10,'completed','2026-10-01'),(2,2,11,'cancelled_by_driver','2026-10-01'),(3,3,12,'completed','2026-10-01'),
(4,4,13,'cancelled_by_client','2026-10-01'),(5,1,10,'completed','2026-10-02'),(6,2,11,'completed','2026-10-02'),
(7,3,12,'completed','2026-10-02'),(8,2,12,'completed','2026-10-03'),(9,3,10,'completed','2026-10-03'),
(10,4,13,'cancelled_by_driver','2026-10-03'),(11,1,11,'cancelled_by_client','2026-10-02'),(12,3,10,'completed','2026-10-04');
```

## Expected output

<!-- expected:start -->
| day | cancellation_rate |
|---|---|
| 2026-10-01 | 0.0 |
| 2026-10-02 | 0.33 |
| 2026-10-03 | 0.0 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Join `users` twice: once as client, once as driver.

</details>

<details><summary>Hint 2</summary>

Rate = SUM(cancelled) / COUNT(*), using 1.0 * to avoid integer division.

</details>

## Solution

```sql solution
SELECT t.request_at AS day,
       ROUND(1.0 * SUM(CASE WHEN t.status LIKE 'cancelled%' THEN 1 ELSE 0 END) / COUNT(*), 2) AS cancellation_rate
FROM trips t
JOIN users c ON c.user_id = t.client_id AND c.banned = 'No'
JOIN users d ON d.user_id = t.driver_id AND d.banned = 'No'
WHERE t.request_at BETWEEN '2026-10-01' AND '2026-10-03'
GROUP BY t.request_at
ORDER BY day;
```

## Explanation

Joining the same dimension in two **roles** (client, driver) is a role-playing dimension in modelling terms. Putting the banned filter in the join conditions keeps the query readable; inner joins drop trips with a banned participant.
10-01: trips 1 and 3 qualify (2 has a banned client, 4 a banned driver) → 0.00. 10-02: trips 5, 7, 11 qualify → 1/3 = 0.33. 10-03: trip 9 only → 0.00.
