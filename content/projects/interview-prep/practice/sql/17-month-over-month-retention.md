---
title: "Month-over-Month User Retention"
description: "Share of users active in a month who are also active in the following month."
url: "/interview-prep/practice/sql/17-month-over-month-retention/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 17
---

# Month-over-Month User Retention

**Difficulty:** Medium · **Topics:** retention, self-join, product-analytics · **Asked at:** Meta, Spotify, Netflix, Duolingo

## Problem

For each month M (that has activity), compute `active_users` in M, `retained_next_month` (active in M **and** M+1) and `retention_pct` (rounded to 1 decimal). Only report months where M+1 is fully in the data (i.e. exclude the last month). Order by month.

## Schema and sample data

```sql schema
CREATE TABLE activity (user_id INTEGER, activity_date TEXT);
INSERT INTO activity VALUES
(1,'2026-01-03'),(1,'2026-01-20'),(1,'2026-02-11'),(1,'2026-03-02'),
(2,'2026-01-15'),(2,'2026-03-09'),
(3,'2026-01-28'),(3,'2026-02-01'),
(4,'2026-02-14'),(4,'2026-03-30'),
(5,'2026-03-05');
```

## Expected output

<!-- expected:start -->
| month | active_users | retained_next_month | retention_pct |
|---|---|---|---|
| 2026-01 | 3 | 2 | 66.7 |
| 2026-02 | 3 | 2 | 66.7 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Reduce to distinct (user, month).

</details>

<details><summary>Hint 2</summary>

Self-join each user-month to the same user in the next month with a LEFT JOIN.

</details>

## Solution

```sql solution
WITH um AS (
  SELECT DISTINCT user_id, strftime('%Y-%m-01', activity_date) AS m FROM activity
)
SELECT substr(a.m, 1, 7) AS month,
       COUNT(*) AS active_users,
       COUNT(b.user_id) AS retained_next_month,
       ROUND(100.0 * COUNT(b.user_id) / COUNT(*), 1) AS retention_pct
FROM um a
LEFT JOIN um b ON b.user_id = a.user_id AND b.m = DATE(a.m, '+1 month')
WHERE a.m < (SELECT MAX(m) FROM um)
GROUP BY a.m
ORDER BY a.m;
```

## Explanation

Normalising every date to the first of its month (`'%Y-%m-01'`) makes `DATE(m, '+1 month')` exact. Excluding the last month avoids reporting a misleading 0% for a month whose successor hasn't happened yet: a common dashboard bug.

## Follow-up questions

<details><summary>How is this different from cohort retention?</summary>

Here the base is "everyone active in M" (it mixes new and old users). Cohort retention fixes the group at first activity and follows it over months 1, 2, 3, … (next problem).

</details>
