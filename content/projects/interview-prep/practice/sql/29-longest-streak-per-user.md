---
title: "Longest Activity Streak per User"
description: "Gaps and islands with ties: each user's longest run of consecutive active days, earliest streak on ties."
url: "/interview-prep/practice/sql/29-longest-streak-per-user/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 29
---

# Longest Activity Streak per User

**Difficulty:** Hard · **Topics:** gaps-and-islands, ranking, dates · **Asked at:** Duolingo, Strava, Meta, Google

## Problem

For every user, return their **longest** streak of consecutive active days: `user_id, streak_start, streak_end, length`. If there's a tie, return the earliest streak. Users with any activity have a streak of at least 1. Order by user_id.

## Schema and sample data

```sql schema
CREATE TABLE activity (user_id INTEGER, day TEXT);
INSERT INTO activity VALUES
(1,'2026-01-01'),(1,'2026-01-02'),(1,'2026-01-04'),(1,'2026-01-05'),(1,'2026-01-06'),(1,'2026-01-06'),
(2,'2026-01-10'),(2,'2026-01-12'),
(3,'2026-02-27'),(3,'2026-02-28'),(3,'2026-03-01'),(3,'2026-03-03'),(3,'2026-03-04'),(3,'2026-03-05');
```

## Expected output

<!-- expected:start -->
| user_id | streak_start | streak_end | length |
|---|---|---|---|
| 1 | 2026-01-04 | 2026-01-06 | 3 |
| 2 | 2026-01-10 | 2026-01-10 | 1 |
| 3 | 2026-02-27 | 2026-03-01 | 3 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Islands first (date − row_number), then rank islands per user by length desc, start asc.

</details>

<details><summary>Hint 2</summary>

User 3 crosses a month boundary; date arithmetic must handle it.

</details>

## Solution

```sql solution
WITH d AS (SELECT DISTINCT user_id, day FROM activity),
g AS (
  SELECT user_id, day,
         DATE(day, '-' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day) || ' days') AS grp
  FROM d
), islands AS (
  SELECT user_id, MIN(day) AS streak_start, MAX(day) AS streak_end, COUNT(*) AS length
  FROM g GROUP BY user_id, grp
), ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY length DESC, streak_start) AS rn
  FROM islands
)
SELECT user_id, streak_start, streak_end, length FROM ranked WHERE rn = 1 ORDER BY user_id;
```

## Explanation

Two-stage pattern: **build islands, then rank islands**. User 3 has two 3-day streaks (Feb 27–Mar 1 across the month boundary, and Mar 3–5). The earliest wins the tie. String arithmetic on dates (e.g. day-of-month minus row number) would break at month ends; use real date functions.

## Follow-up questions

<details><summary>How would you maintain "current streak" for 100M users daily without recomputing history?</summary>

Keep a state table (user_id, current_streak_start, last_active_day, longest). Each day MERGE today's active users: if last_active_day = yesterday → extend, else reset to 1; users not active today keep state (streak breaks implicitly when last_active_day < yesterday). O(daily actives) instead of O(history).

</details>
