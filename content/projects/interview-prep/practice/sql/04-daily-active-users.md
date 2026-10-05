---
title: "Daily Active Users and Stickiness"
description: "Compute DAU per day and the DAU/MAU ratio using distinct counts over a trailing window."
url: "/interview-prep/practice/sql/04-daily-active-users/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 4
---

# Daily Active Users and Stickiness

**Difficulty:** Easy · **Topics:** aggregation, count-distinct, self-join · **Asked at:** Meta, Snap, Spotify

## Problem

From `events(user_id, event_ts)`, compute for each day that has events:
- `dau`: distinct users active that day
- `mau_28d`: distinct users active in the **28 days ending that day** (inclusive)
- `stickiness`: `dau / mau_28d` rounded to 2 decimals

Order by day.

## Schema and sample data

```sql schema
CREATE TABLE events (user_id INTEGER, event_ts TEXT);
INSERT INTO events VALUES
(1,'2026-03-01 08:00'),(1,'2026-03-01 09:00'),(2,'2026-03-01 10:00'),
(1,'2026-03-02 08:00'),(3,'2026-03-02 11:00'),
(2,'2026-03-10 12:00'),
(4,'2026-03-29 07:00'),(1,'2026-03-29 08:00'),
(2,'2026-03-30 09:00');
```

## Expected output

<!-- expected:start -->
| day | dau | mau_28d | stickiness |
|---|---|---|---|
| 2026-03-01 | 2 | 2 | 1.0 |
| 2026-03-02 | 2 | 3 | 0.67 |
| 2026-03-10 | 1 | 3 | 0.33 |
| 2026-03-29 | 2 | 4 | 0.5 |
| 2026-03-30 | 1 | 3 | 0.33 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

`COUNT(DISTINCT ...) OVER (...)` is not supported in most engines. Use a self-join of days to activity in the trailing window instead.

</details>

<details><summary>Hint 2</summary>

Build a list of days first, then join user-days whose date is within [day-27, day].

</details>

## Solution

```sql solution
WITH user_days AS (
  SELECT DISTINCT user_id, DATE(event_ts) AS d FROM events
), days AS (
  SELECT DISTINCT d FROM user_days
)
SELECT days.d AS day,
       COUNT(DISTINCT CASE WHEN ud.d = days.d THEN ud.user_id END) AS dau,
       COUNT(DISTINCT ud.user_id)                                  AS mau_28d,
       ROUND(1.0 * COUNT(DISTINCT CASE WHEN ud.d = days.d THEN ud.user_id END)
                 / COUNT(DISTINCT ud.user_id), 2)                   AS stickiness
FROM days
JOIN user_days ud
  ON ud.d BETWEEN DATE(days.d, '-27 days') AND days.d
GROUP BY days.d
ORDER BY days.d;
```

## Explanation

- Reduce to **one row per user per day** first; this shrinks the data and makes the join cheap.
- A rolling *distinct* count can't be built from a rolling sum of daily DAU (the same user would be counted on several days), which is why a range self-join is used.
- At scale: precompute daily HyperLogLog sketches per day and union the last 28 (`hll_union_agg`). That's O(28) sketches instead of a big join.

## Follow-up questions

<details><summary>How would you compute this for 2 billion events/day?</summary>

Daily job writes `user_days` (deduplicated) and a daily HLL sketch. MAU = union of the last 28 sketches. Exact MAU via `user_days` for finance-grade numbers, partitioned by date so only 28 partitions are scanned.

</details>

<details><summary>Why 28 days rather than a calendar month?</summary>

28 days contains exactly 4 of each weekday, so the metric has no weekday-mix seasonality and is comparable across months.

</details>

## Dialect notes

Spark: `approx_count_distinct(user_id)` for approximate, `size(collect_set(user_id) over w)` works with a range window but is memory-heavy.
