---
title: "Cohort Retention Matrix"
description: "Group users by signup month and compute the percentage active in each subsequent month."
url: "/interview-prep/practice/sql/18-cohort-retention-matrix/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 18
---

# Cohort Retention Matrix

**Difficulty:** Medium · **Topics:** cohorts, retention, window-functions · **Asked at:** Airbnb, Uber, Robinhood, Duolingo

## Problem

A user's cohort is the month of their **first** activity. For each cohort and `month_n` (0 = cohort month, 1 = next month, …) return `cohort, month_n, active_users, cohort_size, retention_pct` (rounded to 1 decimal). Order by cohort, month_n.

## Schema and sample data

```sql schema
CREATE TABLE activity (user_id INTEGER, activity_date TEXT);
INSERT INTO activity VALUES
(1,'2026-01-05'),(1,'2026-02-07'),(1,'2026-03-01'),
(2,'2026-01-20'),(2,'2026-03-15'),
(3,'2026-01-25'),
(4,'2026-02-03'),(4,'2026-02-20'),(4,'2026-03-08'),
(5,'2026-02-14'),
(6,'2026-03-30');
```

## Expected output

<!-- expected:start -->
| cohort | month_n | active_users | cohort_size | retention_pct |
|---|---|---|---|---|
| 2026-01 | 0 | 3 | 3 | 100.0 |
| 2026-01 | 1 | 1 | 3 | 33.3 |
| 2026-01 | 2 | 2 | 3 | 66.7 |
| 2026-02 | 0 | 2 | 2 | 100.0 |
| 2026-02 | 1 | 1 | 2 | 50.0 |
| 2026-03 | 0 | 1 | 1 | 100.0 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Cohort = MIN(month) per user.

</details>

<details><summary>Hint 2</summary>

Month difference = (year*12 + month) − (cohort_year*12 + cohort_month).

</details>

## Solution

```sql solution
WITH um AS (
  SELECT DISTINCT user_id,
         CAST(strftime('%Y', activity_date) AS INTEGER) * 12 + CAST(strftime('%m', activity_date) AS INTEGER) AS mi
  FROM activity
), cohorts AS (
  SELECT user_id, MIN(mi) AS cohort_mi FROM um GROUP BY user_id
), grid AS (
  SELECT c.cohort_mi, um.mi - c.cohort_mi AS month_n, COUNT(*) AS active_users
  FROM um JOIN cohorts c USING (user_id)
  GROUP BY c.cohort_mi, um.mi - c.cohort_mi
)
SELECT printf('%04d-%02d', (cohort_mi - 1) / 12, (cohort_mi - 1) % 12 + 1) AS cohort,
       month_n, active_users,
       MAX(CASE WHEN month_n = 0 THEN active_users END) OVER (PARTITION BY cohort_mi) AS cohort_size,
       ROUND(100.0 * active_users / MAX(CASE WHEN month_n = 0 THEN active_users END) OVER (PARTITION BY cohort_mi), 1) AS retention_pct
FROM grid
ORDER BY cohort, month_n;
```

## Explanation

- A **month index** (`year*12 + month`) turns month arithmetic into integer subtraction and works in every SQL dialect.
- Cohort size is the month-0 count, broadcast to all rows of the cohort with a window.
- Missing cells (no active users in a cohort-month, e.g. cohort 2026-01 in month 1 if nobody returned) simply don't appear; densify with a month grid if a full matrix is needed.
- To display as a matrix, pivot `month_n` into columns in the BI tool, or with conditional aggregation.

## Follow-up questions

<details><summary>Why can the latest cohorts look like they have better retention?</summary>

Survivorship and incomplete periods: recent cohorts have fewer observable months, and partial months inflate or deflate rates. Compare cohorts only on months that are complete for all of them.

</details>
