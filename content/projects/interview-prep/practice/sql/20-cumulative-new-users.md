---
title: "New Users per Day and Cumulative User Count"
description: "First-seen date per user, daily new-user counts and a running total, including days with zero new users."
url: "/interview-prep/practice/sql/20-cumulative-new-users/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 20
---

# New Users per Day and Cumulative User Count

**Difficulty:** Medium · **Topics:** running-total, first-seen, date-spine · **Asked at:** Meta, Snap, Discord

## Problem

For each day between the first and last activity date (inclusive), return `day`, `new_users` (users whose first activity is that day, 0 if none) and `cumulative_users`. Order by day.

## Schema and sample data

```sql schema
CREATE TABLE activity (user_id INTEGER, ts TEXT);
INSERT INTO activity VALUES
(1,'2026-08-01 10:00'),(2,'2026-08-01 11:00'),(1,'2026-08-02 09:00'),
(3,'2026-08-03 12:00'),(2,'2026-08-03 13:00'),(4,'2026-08-05 08:00'),(5,'2026-08-05 09:00'),(1,'2026-08-05 10:00');
```

## Expected output

<!-- expected:start -->
| day | new_users | cumulative_users |
|---|---|---|
| 2026-08-01 | 2 | 2 |
| 2026-08-02 | 0 | 2 |
| 2026-08-03 | 1 | 3 |
| 2026-08-04 | 0 | 3 |
| 2026-08-05 | 2 | 5 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

First-seen date = MIN(DATE(ts)) per user.

</details>

<details><summary>Hint 2</summary>

Days with no new users must appear: build a spine between MIN and MAX date.

</details>

## Solution

```sql solution
WITH RECURSIVE first_seen AS (
  SELECT user_id, MIN(DATE(ts)) AS d FROM activity GROUP BY user_id
), bounds AS (
  SELECT MIN(DATE(ts)) AS lo, MAX(DATE(ts)) AS hi FROM activity
), days(day) AS (
  SELECT lo FROM bounds
  UNION ALL
  SELECT DATE(day, '+1 day') FROM days, bounds WHERE day < hi
), daily AS (
  SELECT days.day, COUNT(f.user_id) AS new_users
  FROM days LEFT JOIN first_seen f ON f.d = days.day
  GROUP BY days.day
)
SELECT day, new_users,
       SUM(new_users) OVER (ORDER BY day ROWS UNBOUNDED PRECEDING) AS cumulative_users
FROM daily
ORDER BY day;
```

## Explanation

Computing first-seen per user before counting is what prevents double counting returning users. Densifying keeps the running total visible on quiet days (08-04).
