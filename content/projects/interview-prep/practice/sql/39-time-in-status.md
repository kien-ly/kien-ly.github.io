---
title: "Time Spent in Each Ticket Status"
description: "Turn a status-change event log into durations with LEAD, including the still-open current status."
url: "/interview-prep/practice/sql/39-time-in-status/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 39
---

# Time Spent in Each Ticket Status

**Difficulty:** Hard · **Topics:** lead, event-log, durations · **Asked at:** Atlassian, ServiceNow, Zendesk, Salesforce

## Problem

`ticket_events` records each status change. A status lasts until the next change for the same ticket; the latest status of an open ticket lasts until the reporting time `'2026-03-10 00:00'`. Return total **hours** spent per `status` across all tickets (1 decimal), excluding the terminal status `closed`. Order by hours desc.

## Schema and sample data

```sql schema
CREATE TABLE ticket_events (ticket_id INTEGER, status TEXT, changed_at TEXT);
INSERT INTO ticket_events VALUES
(1,'open','2026-03-01 09:00'),(1,'in_progress','2026-03-01 12:00'),(1,'waiting','2026-03-02 09:00'),(1,'in_progress','2026-03-02 21:00'),(1,'closed','2026-03-03 09:00'),
(2,'open','2026-03-08 00:00'),(2,'in_progress','2026-03-09 06:00'),
(3,'open','2026-03-05 10:00'),(3,'closed','2026-03-05 11:30');
```

## Expected output

<!-- expected:start -->
| status | hours |
|---|---|
| in_progress | 51.0 |
| open | 34.5 |
| waiting | 12.0 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

`LEAD(changed_at)` gives when each status ended. Use COALESCE with the reporting time for the last status.

</details>

<details><summary>Hint 2</summary>

Statuses can repeat (in_progress twice for ticket 1); summing handles it.

</details>

## Solution

```sql solution
WITH spans AS (
  SELECT ticket_id, status, changed_at,
         COALESCE(LEAD(changed_at) OVER (PARTITION BY ticket_id ORDER BY changed_at), '2026-03-10 00:00') AS ended_at
  FROM ticket_events
)
SELECT status, ROUND(SUM(julianday(ended_at) - julianday(changed_at)) * 24, 1) AS hours
FROM spans
WHERE status <> 'closed'
GROUP BY status
ORDER BY hours DESC;
```

## Explanation

Event logs store **points in time**; most questions need **intervals**. `LEAD` converts one to the other. This same transformation builds SCD2 `valid_to`, session ends and machine-state durations. Ticket 2 is still open, so its current status is measured up to the reporting time, a detail interviewers look for.
