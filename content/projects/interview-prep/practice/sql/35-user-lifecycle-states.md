---
title: "Classify Users as New, Retained, Resurrected or Churned"
description: "Monthly growth accounting: compare each user's activity in the current and previous month."
url: "/interview-prep/practice/sql/35-user-lifecycle-states/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 35
---

# Classify Users as New, Retained, Resurrected or Churned

**Difficulty:** Hard · **Topics:** growth-accounting, retention, self-join · **Asked at:** Meta, Spotify, Snap, Robinhood

## Problem

For each month M from 2026-02 to 2026-04, count users by state:
- **new**: active in M, never active before M
- **retained**: active in M and in M−1
- **resurrected**: active in M, not in M−1, but active at some point before M−1
- **churned**: active in M−1 but not in M

Return `month, new, retained, resurrected, churned`, ordered by month.

## Schema and sample data

```sql schema
CREATE TABLE activity (user_id INTEGER, day TEXT);
INSERT INTO activity VALUES
(1,'2026-01-05'),(1,'2026-02-10'),(1,'2026-03-03'),(1,'2026-04-01'),
(2,'2026-01-09'),(2,'2026-03-15'),
(3,'2026-02-01'),(3,'2026-02-20'),
(4,'2026-03-03'),(4,'2026-04-04'),
(5,'2026-01-20'),(5,'2026-04-28');
```

## Expected output

<!-- expected:start -->
| month | new | retained | resurrected | churned |
|---|---|---|---|---|
| 2026-02 | 1 | 1 | 0 | 2 |
| 2026-03 | 1 | 1 | 1 | 1 |
| 2026-04 | 0 | 2 | 1 | 1 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Build distinct (user, month index) and each user's first month.

</details>

<details><summary>Hint 2</summary>

For every user and month M in the range: flags active_now, active_prev, first_month.

</details>

## Solution

```sql solution
WITH RECURSIVE um AS (
  SELECT DISTINCT user_id,
         CAST(strftime('%Y', day) AS INTEGER) * 12 + CAST(strftime('%m', day) AS INTEGER) AS mi
  FROM activity
), firsts AS (
  SELECT user_id, MIN(mi) AS first_mi FROM um GROUP BY user_id
), months(mi) AS (
  SELECT 2026 * 12 + 2 UNION ALL SELECT mi + 1 FROM months WHERE mi < 2026 * 12 + 4
), grid AS (
  SELECT m.mi, f.user_id, f.first_mi,
         EXISTS (SELECT 1 FROM um WHERE um.user_id = f.user_id AND um.mi = m.mi)     AS now_active,
         EXISTS (SELECT 1 FROM um WHERE um.user_id = f.user_id AND um.mi = m.mi - 1) AS prev_active
  FROM months m CROSS JOIN firsts f
  WHERE f.first_mi <= m.mi
)
SELECT printf('%04d-%02d', (mi - 1) / 12, (mi - 1) % 12 + 1) AS month,
       SUM(now_active AND first_mi = mi)                       AS new,
       SUM(now_active AND prev_active)                         AS retained,
       SUM(now_active AND NOT prev_active AND first_mi < mi)   AS resurrected,
       SUM(prev_active AND NOT now_active)                     AS churned
FROM grid
GROUP BY mi
ORDER BY mi;
```

## Explanation

Growth accounting identity: `MAU(M) = new + retained + resurrected` and `MAU(M−1) = retained + churned`. Use it to sanity-check your numbers.

The user × month grid restricted to `first_mi <= mi` is small (only users who exist by then). At scale, compute per-user activity bitmaps or `LAG` over a densified user-month table instead of correlated `EXISTS`.

## Follow-up questions

<details><summary>What is "quick ratio" in this context?</summary>

(new + resurrected) / churned: growth inflow per user lost. > 1 means the active base is growing.

</details>
