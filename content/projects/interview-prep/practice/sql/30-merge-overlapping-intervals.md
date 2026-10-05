---
title: "Merge Overlapping Subscription Periods"
description: "Collapse overlapping or touching date ranges per user into continuous coverage periods."
url: "/interview-prep/practice/sql/30-merge-overlapping-intervals/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 30
---

# Merge Overlapping Subscription Periods

**Difficulty:** Hard · **Topics:** intervals, gaps-and-islands, running-max · **Asked at:** Netflix, Spotify, Amazon, Apple

## Problem

Users can hold overlapping subscriptions. Merge each user's periods into continuous coverage: periods that **overlap or touch** (next start ≤ previous end) merge. Return `user_id, coverage_start, coverage_end, total_days` (end − start), ordered by user and start.

## Schema and sample data

```sql schema
CREATE TABLE subscriptions (user_id INTEGER, start_date TEXT, end_date TEXT);
INSERT INTO subscriptions VALUES
(1,'2026-01-01','2026-01-31'),(1,'2026-01-15','2026-02-15'),(1,'2026-02-15','2026-03-01'),(1,'2026-04-01','2026-04-30'),
(2,'2026-01-01','2026-12-31'),(2,'2026-03-01','2026-03-31'),(2,'2027-01-05','2027-01-10'),
(3,'2026-05-01','2026-05-10');
```

## Expected output

<!-- expected:start -->
| user_id | coverage_start | coverage_end | total_days |
|---|---|---|---|
| 1 | 2026-01-01 | 2026-03-01 | 59 |
| 1 | 2026-04-01 | 2026-04-30 | 29 |
| 2 | 2026-01-01 | 2026-12-31 | 364 |
| 2 | 2027-01-05 | 2027-01-10 | 5 |
| 3 | 2026-05-01 | 2026-05-10 | 9 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Sort by start. A period starts a new group if its start is after the **max end of all previous periods** (not just the previous row: think of user 2).

</details>

<details><summary>Hint 2</summary>

Running MAX over `ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING`, then flag + running sum.

</details>

## Solution

```sql solution
WITH o AS (
  SELECT *,
         MAX(end_date) OVER (PARTITION BY user_id ORDER BY start_date, end_date
                             ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prev_max_end
  FROM subscriptions
), g AS (
  SELECT *,
         SUM(CASE WHEN prev_max_end IS NULL OR start_date > prev_max_end THEN 1 ELSE 0 END)
           OVER (PARTITION BY user_id ORDER BY start_date, end_date ROWS UNBOUNDED PRECEDING) AS grp
  FROM o
)
SELECT user_id, MIN(start_date) AS coverage_start, MAX(end_date) AS coverage_end,
       CAST(julianday(MAX(end_date)) - julianday(MIN(start_date)) AS INTEGER) AS total_days
FROM g
GROUP BY user_id, grp
ORDER BY user_id, coverage_start;
```

## Explanation

Comparing only with the **previous row's** end fails for user 2: the March subscription ends before the next one starts, but the yearly subscription still covers it. The running **max** end of everything before is the correct "current coverage end". Same algorithm as LeetCode 56 (merge intervals), expressed in SQL.

## Follow-up questions

<details><summary>Compute total distinct covered days per user (overlaps counted once).</summary>

Sum `total_days` (or +1 for inclusive ends) of the merged periods.

</details>

<details><summary>How does this change if adjacent periods (end = Jan 31, next start = Feb 1) should merge too?</summary>

Change the new-group condition to `start_date > DATE(prev_max_end, '+1 day')`.

</details>
