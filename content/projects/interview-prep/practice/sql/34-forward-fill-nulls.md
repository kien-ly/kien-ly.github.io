---
title: "Forward-Fill Missing Sensor Readings"
description: "Replace NULLs with the last non-NULL value per device using a running count as a group key."
url: "/interview-prep/practice/sql/34-forward-fill-nulls/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 34
---

# Forward-Fill Missing Sensor Readings

**Difficulty:** Hard · **Topics:** forward-fill, window-functions, time-series · **Asked at:** Tesla, Siemens, Bloomberg, Two Sigma

## Problem

Sensor readings sometimes arrive as NULL. For each device, replace NULL `value`s with the **most recent non-NULL value** at or before that timestamp (leave NULL if none exists yet). Return `device_id, ts, value, filled_value`, ordered by device and ts.

## Schema and sample data

```sql schema
CREATE TABLE readings (device_id TEXT, ts TEXT, value REAL);
INSERT INTO readings VALUES
('A','2026-07-01 00:00',10.5),('A','2026-07-01 00:01',NULL),('A','2026-07-01 00:02',NULL),('A','2026-07-01 00:03',11.0),('A','2026-07-01 00:04',NULL),
('B','2026-07-01 00:00',NULL),('B','2026-07-01 00:01',20.0),('B','2026-07-01 00:02',NULL);
```

## Expected output

<!-- expected:start -->
| device_id | ts | value | filled_value |
|---|---|---|---|
| A | 2026-07-01 00:00 | 10.5 | 10.5 |
| A | 2026-07-01 00:01 | NULL | 10.5 |
| A | 2026-07-01 00:02 | NULL | 10.5 |
| A | 2026-07-01 00:03 | 11.0 | 11.0 |
| A | 2026-07-01 00:04 | NULL | 11.0 |
| B | 2026-07-01 00:00 | NULL | NULL |
| B | 2026-07-01 00:01 | 20.0 | 20.0 |
| B | 2026-07-01 00:02 | NULL | 20.0 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

`COUNT(value)` ignores NULLs, so a running COUNT(value) increments only on non-NULL rows. Rows that share the same running count belong to the same "fill group".

</details>

<details><summary>Hint 2</summary>

Within a group, exactly one row (the first) has a value: take MAX(value) over the group.

</details>

## Solution

```sql solution
WITH g AS (
  SELECT *, COUNT(value) OVER (PARTITION BY device_id ORDER BY ts ROWS UNBOUNDED PRECEDING) AS grp
  FROM readings
)
SELECT device_id, ts, value,
       MAX(value) OVER (PARTITION BY device_id, grp) AS filled_value
FROM g
ORDER BY device_id, ts;
```

## Explanation

Many engines support `LAST_VALUE(value IGNORE NULLS) OVER (... ROWS UNBOUNDED PRECEDING)` (Snowflake, BigQuery, Oracle, Spark `last(value, ignorenulls=True)`), but Postgres/SQLite don't. The running-COUNT trick works everywhere and is worth knowing.

Device B's first reading stays NULL because there's nothing to carry forward. Mention whether **backfill** (next value) or interpolation is preferable for the use case.

## Dialect notes

Spark: `F.last("value", ignorenulls=True).over(Window.partitionBy("device_id").orderBy("ts").rowsBetween(Window.unboundedPreceding, 0))`. pandas: `df.groupby("device_id")["value"].ffill()`.
