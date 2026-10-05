---
title: "Remove Near-Duplicate Events Within 5 Seconds"
description: "Deduplicate double-fired client events: drop an event if the same user sent the same event type less than 5 seconds after the last kept one."
url: "/interview-prep/practice/sql/41-near-duplicate-events/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 41
---

# Remove Near-Duplicate Events Within 5 Seconds

**Difficulty:** Hard · **Topics:** deduplication, lag, event-time · **Asked at:** Segment, Amplitude, Meta, Snowflake

## Problem

Mobile clients sometimes fire the same event twice. Treat an event as a duplicate if the **same user** sent the **same event type** less than **5 seconds** after the **previous event of that type** (chained: a burst of clicks 2 s apart collapses into one). Return the kept events `event_id, user_id, event_type, ts`, ordered by event_id.

## Schema and sample data

```sql schema
CREATE TABLE events (event_id INTEGER, user_id INTEGER, event_type TEXT, ts TEXT);
INSERT INTO events VALUES
(1,1,'click','2026-05-01 10:00:00'),(2,1,'click','2026-05-01 10:00:02'),(3,1,'click','2026-05-01 10:00:04'),
(4,1,'click','2026-05-01 10:00:11'),(5,1,'view','2026-05-01 10:00:01'),(6,2,'click','2026-05-01 10:00:03'),
(7,2,'click','2026-05-01 10:00:08'),(8,2,'click','2026-05-01 10:00:12');
```

## Expected output

<!-- expected:start -->
| event_id | user_id | event_type | ts |
|---|---|---|---|
| 1 | 1 | click | 2026-05-01 10:00:00 |
| 4 | 1 | click | 2026-05-01 10:00:11 |
| 5 | 1 | view | 2026-05-01 10:00:01 |
| 6 | 2 | click | 2026-05-01 10:00:03 |
| 7 | 2 | click | 2026-05-01 10:00:08 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Compare each event with the previous event of the same (user, type) using LAG.

</details>

<details><summary>Hint 2</summary>

"Chained" bursts mean you compare with the previous event, not with the first kept event of the burst. This keeps it a simple LAG.

</details>

## Solution

```sql solution
WITH g AS (
  SELECT *,
         ROUND((julianday(ts) - julianday(LAG(ts) OVER (PARTITION BY user_id, event_type ORDER BY ts, event_id))) * 86400) AS gap_s
  FROM events
)
SELECT event_id, user_id, event_type, ts
FROM g
WHERE gap_s IS NULL OR gap_s >= 5
ORDER BY event_id;
```

## Explanation

Events 1–3 are 2 s apart → only 1 is kept; event 4 is 7 s after event 3 → kept. User 2: 7 is exactly 5 s after 6 → kept (strict "< 5 s" rule); 8 is 4 s after 7 → dropped.

**Clarify the semantics:** "chained" (compare with the previous event) versus "windowed from the first kept event" (compare with the last *kept* event). The second can't be expressed with LAG alone because whether an event is kept depends on earlier decisions; it needs recursion or procedural/stateful processing. In streaming, prefer deduplicating on a client-generated `event_id` (exact) and use time-based dedup only when no id exists.
