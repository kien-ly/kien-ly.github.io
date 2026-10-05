---
title: "Build an SCD Type 2 Dimension from Daily Snapshots"
description: "Turn full daily snapshots into validity intervals: one row per version with valid_from, valid_to and is_current."
url: "/interview-prep/practice/sql/32-scd2-from-snapshots/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 32
---

# Build an SCD Type 2 Dimension from Daily Snapshots

**Difficulty:** Hard · **Topics:** scd2, gaps-and-islands, data-modeling · **Asked at:** Databricks, Snowflake, Airbnb, any data warehouse team

## Problem

A source system only provides **full daily snapshots** of customers. Build SCD2 history for the tracked attributes `(tier, city)`: one row per continuous version with `valid_from` (first snapshot date of the version), `valid_to` (the first date of the **next** version, or `9999-12-31` if current) and `is_current` (1/0). If a customer disappears from the latest snapshot, their last version is closed at the first snapshot date where they're missing. Order by customer_id, valid_from.

## Schema and sample data

```sql schema
CREATE TABLE customer_snapshots (snapshot_date TEXT, customer_id INTEGER, tier TEXT, city TEXT);
INSERT INTO customer_snapshots VALUES
('2026-01-01',1,'bronze','Berlin'),('2026-01-01',2,'gold','Paris'),
('2026-01-02',1,'bronze','Berlin'),('2026-01-02',2,'gold','Paris'),
('2026-01-03',1,'silver','Berlin'),('2026-01-03',2,'gold','Lyon'),('2026-01-03',3,'bronze','Rome'),
('2026-01-04',1,'silver','Berlin'),('2026-01-04',2,'gold','Lyon'),('2026-01-04',3,'bronze','Rome'),
('2026-01-05',1,'bronze','Berlin'),('2026-01-05',3,'bronze','Rome');
```

## Expected output

<!-- expected:start -->
| customer_id | tier | city | valid_from | valid_to | is_current |
|---|---|---|---|---|---|
| 1 | bronze | Berlin | 2026-01-01 | 2026-01-03 | 0 |
| 1 | silver | Berlin | 2026-01-03 | 2026-01-05 | 0 |
| 1 | bronze | Berlin | 2026-01-05 | 9999-12-31 | 1 |
| 2 | gold | Paris | 2026-01-01 | 2026-01-03 | 0 |
| 2 | gold | Lyon | 2026-01-03 | 2026-01-05 | 0 |
| 3 | bronze | Rome | 2026-01-03 | 9999-12-31 | 1 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Detect changes with LAG over the tracked columns; a change (or first appearance) starts a new version: flag + running sum.

</details>

<details><summary>Hint 2</summary>

valid_to of a version = valid_from of the next version; for the last version, check whether the customer is in the latest snapshot.

</details>

## Solution

```sql solution
WITH s AS (
  SELECT *,
         CASE WHEN LAG(tier) OVER w IS NULL
                OR LAG(tier) OVER w <> tier
                OR LAG(city) OVER w <> city THEN 1 ELSE 0 END AS changed
  FROM customer_snapshots
  WINDOW w AS (PARTITION BY customer_id ORDER BY snapshot_date)
), v AS (
  SELECT *, SUM(changed) OVER (PARTITION BY customer_id ORDER BY snapshot_date ROWS UNBOUNDED PRECEDING) AS version
  FROM s
), versions AS (
  SELECT customer_id, version, tier, city,
         MIN(snapshot_date) AS valid_from, MAX(snapshot_date) AS last_seen
  FROM v GROUP BY customer_id, version, tier, city
), dates AS (
  SELECT DISTINCT snapshot_date FROM customer_snapshots
)
SELECT customer_id, tier, city, valid_from,
       COALESCE(
         LEAD(valid_from) OVER (PARTITION BY customer_id ORDER BY valid_from),
         (SELECT MIN(snapshot_date) FROM dates WHERE snapshot_date > versions.last_seen),
         '9999-12-31') AS valid_to,
       CASE WHEN LEAD(valid_from) OVER (PARTITION BY customer_id ORDER BY valid_from) IS NULL
             AND last_seen = (SELECT MAX(snapshot_date) FROM dates) THEN 1 ELSE 0 END AS is_current
FROM versions
ORDER BY customer_id, valid_from;
```

## Explanation

- Customer 1 goes bronze → silver → **bronze again**. Grouping by `(customer_id, tier, city)` alone would merge the two bronze periods into one wrong interval. The **version counter** (flag + running sum) keeps them apart, the same gaps-and-islands trick as streaks.
- Customer 2 vanishes on 01-05 → last version closed with `valid_to = 2026-01-05`, `is_current = 0` (a soft delete in SCD2 terms).
- Intervals are half-open `[valid_from, valid_to)`, so a point-in-time lookup is `valid_from <= d AND d < valid_to`.

In production you'd do this incrementally: compare today's snapshot to the current rows (hash of tracked columns), close changed rows, insert new versions, via `MERGE` (Delta/Snowflake) or `dbt snapshot` with `strategy: check`.

## Follow-up questions

<details><summary>Why compare a hash instead of each column?</summary>

`sha2(concat_ws('||', tier, city))` makes the change test one comparison regardless of column count and handles NULLs if you coalesce first (`NULL <> 'x'` is UNKNOWN, so naive comparisons miss NULL→value changes).

</details>

<details><summary>How do fact tables join to this dimension?</summary>

On the business key and `fact.event_date >= valid_from AND fact.event_date < valid_to`, or better, resolve the surrogate key at fact load time and store `customer_sk` in the fact.

</details>
