---
title: "Users with 3+ Consecutive Login Days"
description: "Gaps and islands: find streaks of consecutive days per user using date minus row number."
url: "/interview-prep/practice/sql/14-consecutive-login-streak/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 14
---

# Users with 3+ Consecutive Login Days

**Difficulty:** Medium · **Topics:** gaps-and-islands, row-number, dates · **Asked at:** Meta, Google, LinkedIn, Uber

## Problem

Find every streak of **at least 3 consecutive login days** per user. A user may log in several times per day. Return `user_id, start_date, end_date, streak_days`, ordered by user and start date.

## Schema and sample data

```sql schema
CREATE TABLE logins (user_id INTEGER, login_ts TEXT);
INSERT INTO logins VALUES
(1,'2026-01-01 08:00'),(1,'2026-01-01 21:00'),(1,'2026-01-02 09:00'),(1,'2026-01-03 07:00'),(1,'2026-01-05 10:00'),
(2,'2026-01-01 12:00'),(2,'2026-01-03 12:00'),
(3,'2026-01-10 06:00'),(3,'2026-01-11 06:00'),(3,'2026-01-12 06:00'),(3,'2026-01-13 06:00'),(3,'2026-01-15 06:00'),
(3,'2026-01-16 06:00'),(3,'2026-01-17 06:00');
```

## Expected output

<!-- expected:start -->
| user_id | start_date | end_date | streak_days |
|---|---|---|---|
| 1 | 2026-01-01 | 2026-01-03 | 3 |
| 3 | 2026-01-10 | 2026-01-13 | 4 |
| 3 | 2026-01-15 | 2026-01-17 | 3 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Deduplicate to one row per user per day first.

</details>

<details><summary>Hint 2</summary>

For consecutive dates, `date − row_number` is constant. Use it as a group key.

</details>

## Solution

```sql solution
WITH days AS (
  SELECT DISTINCT user_id, DATE(login_ts) AS d FROM logins
), grouped AS (
  SELECT user_id, d,
         DATE(d, '-' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY d) || ' days') AS grp
  FROM days
)
SELECT user_id, MIN(d) AS start_date, MAX(d) AS end_date, COUNT(*) AS streak_days
FROM grouped
GROUP BY user_id, grp
HAVING COUNT(*) >= 3
ORDER BY user_id, start_date;
```

**Alternative 1**

```sql alt1
WITH days AS (SELECT DISTINCT user_id, DATE(login_ts) AS d FROM logins),
flagged AS (
  SELECT *, CASE WHEN julianday(d) - julianday(LAG(d) OVER (PARTITION BY user_id ORDER BY d)) = 1 THEN 0 ELSE 1 END AS new_streak
  FROM days
), grouped AS (
  SELECT *, SUM(new_streak) OVER (PARTITION BY user_id ORDER BY d ROWS UNBOUNDED PRECEDING) AS grp FROM flagged
)
SELECT user_id, MIN(d) AS start_date, MAX(d) AS end_date, COUNT(*) AS streak_days
FROM grouped GROUP BY user_id, grp HAVING COUNT(*) >= 3 ORDER BY user_id, start_date;
```

## Explanation

| d | row_number | d − rn |
|---|---|---|
| 01-10 | 1 | 01-09 |
| 01-11 | 2 | 01-09 |
| 01-12 | 3 | 01-09 |
| 01-13 | 4 | 01-09 |
| 01-15 | 5 | 01-10 ← new island |

**Dedup is essential**: two logins on 01-01 would give two row numbers for the same date and break the arithmetic. The alternative (LAG flag + running sum) generalises to any "new group when…" rule, e.g. a gap of ≤ 1 day allowed.

## Follow-up questions

<details><summary>Return each user’s longest streak only.</summary>

Wrap the grouped result and pick `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY streak_days DESC, start_date)` = 1.

</details>

<details><summary>What if a streak should tolerate one missed day?</summary>

Use the LAG approach with `new_streak = CASE WHEN day_diff <= 2 THEN 0 ELSE 1 END`. The row-number trick can't express that.

</details>
