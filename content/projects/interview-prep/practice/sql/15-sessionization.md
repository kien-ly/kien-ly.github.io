---
title: "Sessionize Clickstream Events"
description: "Assign session ids with a 30-minute inactivity gap and compute per-session metrics."
url: "/interview-prep/practice/sql/15-sessionization/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 15
---

# Sessionize Clickstream Events

**Difficulty:** Medium · **Topics:** sessionization, lag, running-sum · **Asked at:** Google, Amazon, Spotify, Pinterest

## Problem

A new session starts when a user has been inactive for **more than 30 minutes**. For every session return `user_id, session_no` (1, 2, … per user), `session_start, session_end, events` and `duration_min`. Order by user and session_no.

## Schema and sample data

```sql schema
CREATE TABLE events (user_id INTEGER, event_ts TEXT, page TEXT);
INSERT INTO events VALUES
(1,'2026-04-01 10:00:00','home'),(1,'2026-04-01 10:05:00','search'),(1,'2026-04-01 10:20:00','product'),
(1,'2026-04-01 11:30:00','home'),(1,'2026-04-01 11:31:00','cart'),
(2,'2026-04-01 09:00:00','home'),(2,'2026-04-01 09:30:00','product'),(2,'2026-04-01 10:00:01','checkout'),
(3,'2026-04-01 23:50:00','home');
```

## Expected output

<!-- expected:start -->
| user_id | session_no | session_start | session_end | events | duration_min |
|---|---|---|---|---|---|
| 1 | 1 | 2026-04-01 10:00:00 | 2026-04-01 10:20:00 | 3 | 20.0 |
| 1 | 2 | 2026-04-01 11:30:00 | 2026-04-01 11:31:00 | 2 | 1.0 |
| 2 | 1 | 2026-04-01 09:00:00 | 2026-04-01 09:30:00 | 2 | 30.0 |
| 2 | 2 | 2026-04-01 10:00:01 | 2026-04-01 10:00:01 | 1 | 0.0 |
| 3 | 1 | 2026-04-01 23:50:00 | 2026-04-01 23:50:00 | 1 | 0.0 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

LAG the timestamp per user; flag a new session when the gap is NULL or > 30 minutes.

</details>

<details><summary>Hint 2</summary>

A running SUM of the flag numbers the sessions.

</details>

## Solution

```sql solution
WITH gaps AS (
  SELECT *,
         ROUND((julianday(event_ts) - julianday(LAG(event_ts) OVER (PARTITION BY user_id ORDER BY event_ts))) * 86400) AS gap_sec
  FROM events
), flagged AS (
  SELECT *, CASE WHEN gap_sec IS NULL OR gap_sec > 1800 THEN 1 ELSE 0 END AS is_new
  FROM gaps
), numbered AS (
  SELECT *, SUM(is_new) OVER (PARTITION BY user_id ORDER BY event_ts ROWS UNBOUNDED PRECEDING) AS session_no
  FROM flagged
)
SELECT user_id, session_no,
       MIN(event_ts) AS session_start, MAX(event_ts) AS session_end, COUNT(*) AS events,
       ROUND((julianday(MAX(event_ts)) - julianday(MIN(event_ts))) * 1440, 1) AS duration_min
FROM numbered
GROUP BY user_id, session_no
ORDER BY user_id, session_no;
```

## Explanation

User 2's events are exactly 30:00 and then 30:01 apart: the first gap stays in the session (> 30 means strictly greater), the second starts a new one. Boundary conditions like this are what interviewers check. Ask "is 30 minutes exactly a new session?"

`julianday` arithmetic is floating point: 30 minutes can come out as 30.0000001. Rounding to whole **seconds** before comparing avoids an off-by-epsilon boundary bug (in Postgres/Spark, compare intervals or epoch seconds directly).

This **flag + running sum** pattern is the general tool for "start a new group when a condition is met".

## Follow-up questions

<details><summary>How do you sessionize 5 billion events/day in Spark?</summary>

Same logic with `Window.partitionBy("user_id").orderBy("event_ts")`. Watch for bot users with millions of events (skew); filter bots first, or cap session length. In streaming use `session_window(event_ts, "30 minutes")`.

</details>

<details><summary>Sessions must also end at midnight. Change?</summary>

Add `OR DATE(event_ts) <> DATE(LAG(event_ts) ...)` to the new-session condition.

</details>
