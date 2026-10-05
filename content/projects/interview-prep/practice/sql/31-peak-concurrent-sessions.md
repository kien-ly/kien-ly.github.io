---
title: "Peak Concurrent Sessions per Day"
description: "Convert intervals into +1/-1 events and use a running sum to find maximum concurrency."
url: "/interview-prep/practice/sql/31-peak-concurrent-sessions/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 31
---

# Peak Concurrent Sessions per Day

**Difficulty:** Hard · **Topics:** intervals, sweep-line, running-total · **Asked at:** Netflix, Zoom, Twitch, AWS

## Problem

Each row is a streaming session `[start_ts, end_ts)`. For each day (by the date of the start/end event), return the **maximum number of simultaneous sessions** observed that day and the first timestamp at which that peak was reached. A session ending at the same instant another starts does **not** overlap. Order by day.

## Schema and sample data

```sql schema
CREATE TABLE sessions (session_id INTEGER, start_ts TEXT, end_ts TEXT);
INSERT INTO sessions VALUES
(1,'2026-09-01 10:00','2026-09-01 11:00'),(2,'2026-09-01 10:30','2026-09-01 10:45'),
(3,'2026-09-01 10:40','2026-09-01 12:00'),(4,'2026-09-01 11:00','2026-09-01 11:30'),
(5,'2026-09-02 09:00','2026-09-02 09:30'),(6,'2026-09-02 09:30','2026-09-02 10:00'),
(7,'2026-09-02 09:10','2026-09-02 09:20');
```

## Expected output

<!-- expected:start -->
| day | peak_concurrent | peak_at |
|---|---|---|
| 2026-09-01 | 3 | 2026-09-01 10:40 |
| 2026-09-02 | 2 | 2026-09-02 09:10 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Emit (+1 at start, −1 at end). Running SUM ordered by time = concurrency after each event.

</details>

<details><summary>Hint 2</summary>

At equal timestamps process −1 before +1 so touching sessions don't overlap.

</details>

## Solution

```sql solution
WITH ev AS (
  SELECT start_ts AS ts, 1 AS delta FROM sessions
  UNION ALL
  SELECT end_ts, -1 FROM sessions
), running AS (
  SELECT ts, DATE(ts) AS day,
         SUM(delta) OVER (ORDER BY ts, delta ROWS UNBOUNDED PRECEDING) AS concurrent
  FROM ev
), ranked AS (
  SELECT day, ts, concurrent,
         ROW_NUMBER() OVER (PARTITION BY day ORDER BY concurrent DESC, ts) AS rn
  FROM running
)
SELECT day, concurrent AS peak_concurrent, ts AS peak_at
FROM ranked WHERE rn = 1
ORDER BY day;
```

## Explanation

The **sweep line**: sort all start/end events; concurrency is the running sum. `ORDER BY ts, delta` puts −1 before +1 at the same instant, so session 1 ending at 11:00 and session 4 starting at 11:00 don't count as overlapping. On 09-01 the peak is 3 at 10:40 (sessions 1, 2, 3).

Caveat: the running sum spans all days, which is fine if sessions never cross midnight; otherwise the per-day max still works because concurrency carries over correctly. Only the *day attribution* of events changes.

## Follow-up questions

<details><summary>Do this per minute for a dashboard (concurrent viewers per minute).</summary>

Generate a minute spine and count sessions with `start_ts <= minute < end_ts` (range join), or accumulate deltas per minute bucket and take a running sum, which is much cheaper at scale.

</details>
