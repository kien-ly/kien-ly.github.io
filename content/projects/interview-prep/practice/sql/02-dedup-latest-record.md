---
title: "Keep the Latest Record per Customer"
description: "Deduplicate a raw change table so each customer appears once with their most recent values, deterministically."
url: "/interview-prep/practice/sql/02-dedup-latest-record/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 2
---

# Keep the Latest Record per Customer

**Difficulty:** Easy · **Topics:** deduplication, row-number, window-functions · **Asked at:** Databricks, Airbnb, Netflix

## Problem

`customers_raw` receives a new row every time a customer's profile changes, and the ingestion sometimes delivers the same change twice. Return **one row per `customer_id`** with the values from the most recent `updated_at`. If two rows share the same `updated_at`, prefer the one with the higher `ingest_id`.

Output: `customer_id, email, tier, updated_at`, ordered by `customer_id`.

## Schema and sample data

```sql schema
CREATE TABLE customers_raw (ingest_id INTEGER, customer_id INTEGER, email TEXT, tier TEXT, updated_at TEXT);
INSERT INTO customers_raw VALUES
(1, 10, 'a@x.com',  'bronze', '2026-01-01 09:00'),
(2, 10, 'a@x.com',  'silver', '2026-02-01 10:00'),
(3, 10, 'a@x.com',  'silver', '2026-02-01 10:00'),
(4, 20, 'b@x.com',  'gold',   '2026-01-15 08:00'),
(5, 30, 'c@x.com',  'bronze', '2026-03-01 12:00'),
(6, 30, 'c2@x.com', 'bronze', '2026-03-01 12:00'),
(7, 20, 'b@y.com',  'gold',   '2026-01-10 08:00');
```

## Expected output

<!-- expected:start -->
| customer_id | email | tier | updated_at |
|---|---|---|---|
| 10 | a@x.com | silver | 2026-02-01 10:00 |
| 20 | b@x.com | gold | 2026-01-15 08:00 |
| 30 | c2@x.com | bronze | 2026-03-01 12:00 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

`ROW_NUMBER()` partitioned by the business key, ordered by recency.

</details>

<details><summary>Hint 2</summary>

Without a tie-breaker the result is non-deterministic. Which column breaks ties?

</details>

## Solution

```sql solution
WITH ranked AS (
  SELECT *,
         ROW_NUMBER() OVER (PARTITION BY customer_id
                            ORDER BY updated_at DESC, ingest_id DESC) AS rn
  FROM customers_raw
)
SELECT customer_id, email, tier, updated_at
FROM ranked
WHERE rn = 1
ORDER BY customer_id;
```

## Explanation

This is the most common pattern in silver layers (CDC, re-delivered files, at-least-once streams).
- `ROW_NUMBER` (not `RANK`) guarantees exactly one row per key.
- The **tie-breaker** (`ingest_id DESC`) makes the result deterministic across re-runs. Without it, customer 30 could flip between `c@x.com` and `c2@x.com`.
- `GROUP BY customer_id` with `MAX(updated_at)` and `MAX(email)` would mix columns from different rows: a classic bug.

## Follow-up questions

<details><summary>How would you do this incrementally in a lakehouse every 5 minutes?</summary>

Dedup only the new batch with the same ROW_NUMBER logic, then `MERGE INTO silver USING batch ON customer_id WHEN MATCHED AND batch.updated_at > silver.updated_at THEN UPDATE ... WHEN NOT MATCHED THEN INSERT`. The extra condition prevents an older late record from overwriting a newer one.

</details>

<details><summary>Spark DataFrame equivalent?</summary>

`df.withColumn("rn", row_number().over(Window.partitionBy("customer_id").orderBy(col("updated_at").desc(), col("ingest_id").desc()))).filter("rn = 1")`. Note that `dropDuplicates(["customer_id"])` keeps an arbitrary row, which is wrong here.

</details>

## Dialect notes

Snowflake/Databricks/BigQuery: `SELECT * FROM customers_raw QUALIFY ROW_NUMBER() OVER (...) = 1`. Postgres: `SELECT DISTINCT ON (customer_id) * FROM customers_raw ORDER BY customer_id, updated_at DESC, ingest_id DESC`.
