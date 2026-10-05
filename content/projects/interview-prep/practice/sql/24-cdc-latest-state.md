---
title: "Apply CDC Events to Get the Current Table State"
description: "Reconstruct the current state of a table from an insert/update/delete change log ordered by LSN."
url: "/interview-prep/practice/sql/24-cdc-latest-state/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 24
---

# Apply CDC Events to Get the Current Table State

**Difficulty:** Medium · **Topics:** cdc, deduplication, merge-logic · **Asked at:** Databricks, Confluent, Netflix, Stripe

## Problem

`orders_cdc` is a Debezium-style change log: `op` is `c` (insert), `u` (update) or `d` (delete); `lsn` is the log sequence number (commit order). Events can arrive **out of order** (`ingested_at` order is not `lsn` order) and can be **duplicated**. Return the **current** state of the orders table: `order_id, status, amount` for orders that are not deleted, ordered by order_id.

## Schema and sample data

```sql schema
CREATE TABLE orders_cdc (order_id INTEGER, op TEXT, status TEXT, amount INTEGER, lsn INTEGER, ingested_at TEXT);
INSERT INTO orders_cdc VALUES
(1,'c','NEW',100,10,'2026-01-01 10:00'),
(1,'u','PAID',100,15,'2026-01-01 10:05'),
(2,'c','NEW',50,11,'2026-01-01 10:01'),
(1,'u','SHIPPED',100,22,'2026-01-01 10:09'),
(1,'u','PAID',100,15,'2026-01-01 10:10'),
(3,'c','NEW',75,12,'2026-01-01 10:02'),
(3,'d',NULL,NULL,30,'2026-01-01 10:11'),
(2,'u','PAID',55,25,'2026-01-01 10:12'),
(4,'u','PAID',20,41,'2026-01-01 10:20'),
(4,'c','NEW',20,40,'2026-01-01 10:21');
```

## Expected output

<!-- expected:start -->
| order_id | status | amount |
|---|---|---|
| 1 | SHIPPED | 100 |
| 2 | PAID | 55 |
| 4 | PAID | 20 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

The latest change per key wins, where "latest" means highest `lsn`, not latest ingestion.

</details>

<details><summary>Hint 2</summary>

If the latest change is a delete, the row must not appear.

</details>

## Solution

```sql solution
WITH latest AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY lsn DESC) AS rn
  FROM orders_cdc
)
SELECT order_id, status, amount
FROM latest
WHERE rn = 1 AND op <> 'd'
ORDER BY order_id;
```

## Explanation

- Order 1: the duplicate `PAID` (lsn 15) re-arrives *after* `SHIPPED` (lsn 22). Ordering by `ingested_at` would wrongly regress the status to PAID.
- Order 3: latest event is a delete → excluded (in silver you might keep it as a soft delete).
- Order 4: the update arrived before the insert; LSN ordering makes it irrelevant.

This is exactly the logic inside `MERGE ... WHEN MATCHED AND s.lsn > t.lsn` and DLT `APPLY CHANGES ... SEQUENCE BY lsn`.

## Follow-up questions

<details><summary>Write the MERGE that applies one micro-batch of these events to a Delta table.</summary>

`MERGE INTO silver.orders t USING (latest-per-key from batch) s ON t.order_id = s.order_id WHEN MATCHED AND s.lsn > t.lsn AND s.op = 'd' THEN DELETE WHEN MATCHED AND s.lsn > t.lsn THEN UPDATE SET * WHEN NOT MATCHED AND s.op <> 'd' THEN INSERT *`.

</details>

<details><summary>How would you build SCD2 history from the same log?</summary>

Keep all non-duplicate events per key ordered by lsn; `valid_from = event time`, `valid_to = LEAD(event time)`; a delete closes the last version.

</details>
