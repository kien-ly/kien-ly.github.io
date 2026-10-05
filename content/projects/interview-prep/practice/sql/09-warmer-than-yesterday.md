---
title: "Days Warmer Than the Previous Day"
description: "Compare each row with the previous calendar day using LAG, and avoid the missing-day trap."
url: "/interview-prep/practice/sql/09-warmer-than-yesterday/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 9
---

# Days Warmer Than the Previous Day

**Difficulty:** Easy · **Topics:** lag, self-join, dates · **Asked at:** Amazon, Adobe

## Problem

Return the `day` of every reading whose temperature is higher than the reading of the **previous calendar day**. If the previous day has no reading, the day doesn't qualify. Order by day.

## Schema and sample data

```sql schema
CREATE TABLE weather (day TEXT, temperature INTEGER);
INSERT INTO weather VALUES
('2026-07-01',20),('2026-07-02',25),('2026-07-03',22),('2026-07-05',30),('2026-07-06',31),('2026-07-07',29);
```

## Expected output

<!-- expected:start -->
| day |
|---|
| 2026-07-02 |
| 2026-07-06 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

LAG gives the previous **row**. 07-05 comes right after 07-03 in row order, but they aren't consecutive days.

</details>

## Solution

```sql solution
SELECT day FROM (
  SELECT day, temperature,
         LAG(day)         OVER (ORDER BY day) AS prev_day,
         LAG(temperature) OVER (ORDER BY day) AS prev_temp
  FROM weather
)
WHERE temperature > prev_temp
  AND julianday(day) - julianday(prev_day) = 1
ORDER BY day;
```

**Alternative 1**

```sql alt1
SELECT w.day
FROM weather w JOIN weather y ON y.day = DATE(w.day, '-1 day')
WHERE w.temperature > y.temperature
ORDER BY w.day;
```

## Explanation

Without the date-difference check, 2026-07-05 (30 vs 22 on 07-03) would wrongly qualify. Both approaches are valid; the self-join reads naturally, while LAG scans the table once.
