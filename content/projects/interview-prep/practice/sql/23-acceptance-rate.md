---
title: "Friend Request Acceptance Rate by Day"
description: "Ratio of two event types joined on a composite key, with a cumulative acceptance rate."
url: "/interview-prep/practice/sql/23-acceptance-rate/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 23
---

# Friend Request Acceptance Rate by Day

**Difficulty:** Medium · **Topics:** ratios, left-join, running-total · **Asked at:** Meta, LinkedIn

## Problem

`requests(sender, receiver, sent_date)` and `accepts(sender, receiver, accept_date)`. For each `sent_date`, return `requests`, `accepted` (requests sent that day that were **ever** accepted), `acceptance_rate` (2 decimals), and `cumulative_rate` across all days so far (2 decimals). Duplicate requests (same sender, receiver) count once, on the first sent date. Order by date.

## Schema and sample data

```sql schema
CREATE TABLE requests (sender INTEGER, receiver INTEGER, sent_date TEXT);
CREATE TABLE accepts (sender INTEGER, receiver INTEGER, accept_date TEXT);
INSERT INTO requests VALUES (1,2,'2026-01-01'),(1,3,'2026-01-01'),(1,4,'2026-01-01'),(2,3,'2026-01-02'),(3,4,'2026-01-02'),(1,2,'2026-01-02'),(4,5,'2026-01-03');
INSERT INTO accepts VALUES (1,2,'2026-01-02'),(1,3,'2026-01-05'),(3,4,'2026-01-02'),(3,4,'2026-01-03');
```

## Expected output

<!-- expected:start -->
| sent_date | requests | accepted | acceptance_rate | cumulative_rate |
|---|---|---|---|---|
| 2026-01-01 | 3 | 2 | 0.67 | 0.67 |
| 2026-01-02 | 2 | 1 | 0.5 | 0.6 |
| 2026-01-03 | 1 | 0 | 0.0 | 0.5 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Deduplicate requests by (sender, receiver) keeping MIN(sent_date); deduplicate accepts by pair too.

</details>

<details><summary>Hint 2</summary>

Cumulative rate = running SUM(accepted) / running SUM(requests), not an average of daily rates.

</details>

## Solution

```sql solution
WITH req AS (
  SELECT sender, receiver, MIN(sent_date) AS sent_date FROM requests GROUP BY sender, receiver
), acc AS (
  SELECT DISTINCT sender, receiver FROM accepts
), daily AS (
  SELECT r.sent_date, COUNT(*) AS requests, COUNT(a.sender) AS accepted
  FROM req r LEFT JOIN acc a ON a.sender = r.sender AND a.receiver = r.receiver
  GROUP BY r.sent_date
)
SELECT sent_date, requests, accepted,
       ROUND(1.0 * accepted / requests, 2) AS acceptance_rate,
       ROUND(1.0 * SUM(accepted) OVER (ORDER BY sent_date ROWS UNBOUNDED PRECEDING)
                 / SUM(requests) OVER (ORDER BY sent_date ROWS UNBOUNDED PRECEDING), 2) AS cumulative_rate
FROM daily
ORDER BY sent_date;
```

## Explanation

Two traps: **duplicates** on both sides inflate counts (the (3,4) acceptance appears twice; (1,2) was requested twice), and **averaging ratios** (mean of daily rates) weights small days the same as big days. Always compute a cumulative ratio as ratio of cumulative sums.
