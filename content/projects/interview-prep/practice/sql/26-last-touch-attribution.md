---
title: "Last-Touch Marketing Attribution"
description: "Attribute each conversion to the most recent ad click before it within a 7-day lookback window."
url: "/interview-prep/practice/sql/26-last-touch-attribution/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 26
---

# Last-Touch Marketing Attribution

**Difficulty:** Medium · **Topics:** attribution, as-of-join, row-number · **Asked at:** Google, Meta, TikTok, Uber

## Problem

Attribute each `conversion` to the **last ad click by the same user before the conversion**, within a 7-day lookback. Conversions with no qualifying click are `'organic'`. Return `channel, conversions, revenue` per channel (including `'organic'`), ordered by revenue descending.

## Schema and sample data

```sql schema
CREATE TABLE clicks (user_id INTEGER, channel TEXT, click_ts TEXT);
CREATE TABLE conversions (conversion_id INTEGER, user_id INTEGER, conv_ts TEXT, revenue INTEGER);
INSERT INTO clicks VALUES
(1,'search','2026-04-01 10:00'),(1,'social','2026-04-03 12:00'),
(2,'email','2026-04-01 09:00'),
(3,'search','2026-03-20 09:00'),
(4,'social','2026-04-05 09:00'),(4,'search','2026-04-05 11:00');
INSERT INTO conversions VALUES
(100,1,'2026-04-04 08:00',120),(101,2,'2026-04-02 10:00',80),(102,3,'2026-04-02 10:00',60),
(103,4,'2026-04-05 10:00',40),(104,1,'2026-04-20 10:00',30);
```

## Expected output

<!-- expected:start -->
| channel | conversions | revenue |
|---|---|---|
| social | 2 | 160 |
| organic | 2 | 90 |
| email | 1 | 80 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

This is an "as-of" join: for each conversion find the latest click ≤ conv_ts and ≥ conv_ts − 7 days.

</details>

<details><summary>Hint 2</summary>

LEFT JOIN all candidate clicks, then ROW_NUMBER by click_ts DESC per conversion.

</details>

## Solution

```sql solution
WITH candidates AS (
  SELECT c.conversion_id, c.revenue, k.channel,
         ROW_NUMBER() OVER (PARTITION BY c.conversion_id ORDER BY k.click_ts DESC) AS rn
  FROM conversions c
  LEFT JOIN clicks k
    ON k.user_id = c.user_id
   AND k.click_ts <= c.conv_ts
   AND julianday(c.conv_ts) - julianday(k.click_ts) <= 7
)
SELECT COALESCE(channel, 'organic') AS channel, COUNT(*) AS conversions, SUM(revenue) AS revenue
FROM candidates
WHERE rn = 1
GROUP BY COALESCE(channel, 'organic')
ORDER BY revenue DESC, channel;
```

## Explanation

- Conversion 100 → `social` (the last click before it). Conversion 102: the only click is 13 days old → organic. Conversion 103: the 11:00 search click is **after** the conversion → social. Conversion 104: clicks too old → organic.
- The LEFT JOIN keeps unmatched conversions (channel NULL) and ROW_NUMBER picks the latest candidate: a portable **as-of join**.
- Engines with native as-of joins: DuckDB/Snowflake `ASOF JOIN`, pandas `merge_asof`, kdb.

## Follow-up questions

<details><summary>How would you implement linear or position-based attribution?</summary>

Keep all candidate clicks per conversion with `COUNT(*) OVER (PARTITION BY conversion_id)`; linear credit = revenue / n per click; position-based gives 40% to first, 40% to last, 20% spread across the middle (handle n = 1 and 2).

</details>
