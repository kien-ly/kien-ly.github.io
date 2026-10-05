---
title: "Slowly Changing Dimensions: Types 0 to 7"
description: "Every SCD type with examples, when to use each, SCD2 implementation with MERGE and dbt snapshots, and point-in-time joins."
url: "/interview-prep/learn/data-modeling/03-slowly-changing-dimensions/"
hiddenInHomeList: true
showToc: true
weight: 3
---

# Slowly Changing Dimensions: Types 0 to 7

> "Customer moved from Berlin to Munich. What happens to last year's sales by city?" That one question is what SCD types answer.

---

## 1. All types at a glance

Scenario: customer C-42 moves from **Berlin** to **Munich** on 2026-06-01.

| Type | Name | What happens | Last year's sales by city | Use when |
|---|---|---|---|---|
| **0** | Retain original | Never change (e.g. `original_signup_city`) | Berlin | Attribute is fixed by definition |
| **1** | Overwrite | `city = Munich` | **Munich** (history rewritten) | Corrections, attributes where history doesn't matter |
| **2** | Add new row | Close Berlin row, insert Munich row with new surrogate key | **Berlin** (facts point to the old version) | Need history "as it was" (most common) |
| **3** | Add column | `current_city = Munich`, `previous_city = Berlin` | Choice of either | Limited history (one prior value), e.g. sales territory realignment |
| **4** | History table | Current table (Munich) + separate history table | Via history table | Rapidly changing attributes; keep main dim small |
| **5** | Mini-dimension + type 1 outrigger | Mini-dim for volatile attributes, current key copied to base dim | Flexible | Large dims with volatile banded attributes |
| **6** | Hybrid 1+2+3 | SCD2 rows **plus** a `current_city` column overwritten on all rows | Both "as was" and "as is" easily | Analysts need both perspectives often |
| **7** | Dual keys | Fact stores both the surrogate key (as was) and the durable natural key (join to current view) | Both | Same as 6, with cleaner implementation |

## 2. SCD Type 2 in detail

```
customer_key | customer_id | city    | tier   | valid_from | valid_to   | is_current
-------------|-------------|---------|--------|------------|------------|-----------
101          | C-42        | Berlin  | silver | 2024-03-10 | 2026-06-01 | false
257          | C-42        | Munich  | silver | 2026-06-01 | 9999-12-31 | true
```

- **Surrogate key per version** (101, 257); natural key (C-42) repeats.
- Half-open intervals `[valid_from, valid_to)` avoid overlaps/gaps at boundaries.
- `valid_to = 9999-12-31` (not NULL) for current rows makes range predicates simple.
- Optional: `version_no`, `row_hash` (hash of tracked columns), `is_deleted`, audit columns.

### How facts use it

**At load time (preferred):** look up the version valid at the event time and store its surrogate key in the fact:

```sql
SELECT o.order_id, d.customer_key, o.amount
FROM staging_orders o
LEFT JOIN dim_customer d
  ON d.customer_id = o.customer_id
 AND o.order_ts >= d.valid_from AND o.order_ts < d.valid_to;
```

Then "sales by city as it was" is a simple equi-join on `customer_key`. "Sales by **current** city" joins through `customer_id` to `is_current = true` (that's type 7).

### Implementing SCD2 with MERGE (Delta / Snowflake / BigQuery)

The trick: stage each changed key **twice**: one row to close the old version (matched by key) and one row to insert the new version (with a NULL merge key so it never matches).

```sql
MERGE INTO dim_customer t
USING (
  -- rows that update/close existing current versions
  SELECT s.customer_id AS merge_key, s.* FROM staged s
  UNION ALL
  -- rows that insert new versions for changed customers (merge_key NULL never matches)
  SELECT NULL AS merge_key, s.*
  FROM staged s JOIN dim_customer t
    ON s.customer_id = t.customer_id AND t.is_current AND s.row_hash <> t.row_hash
) s
ON t.customer_id = s.merge_key AND t.is_current
WHEN MATCHED AND t.row_hash <> s.row_hash THEN
  UPDATE SET t.is_current = false, t.valid_to = s.effective_ts
WHEN NOT MATCHED THEN
  INSERT (customer_key, customer_id, city, tier, row_hash, valid_from, valid_to, is_current)
  VALUES (xxhash64(s.customer_id, s.effective_ts), s.customer_id, s.city, s.tier, s.row_hash,
          s.effective_ts, TIMESTAMP '9999-12-31', true);
```

Brand-new customers fall into `NOT MATCHED` via the first branch (no current row to match). Unchanged customers match with equal hashes and do nothing.

### dbt snapshots

```sql
{% snapshot customers_snapshot %}
{{ config(target_schema='snapshots', unique_key='customer_id',
          strategy='check', check_cols=['city', 'tier'], invalidate_hard_deletes=True) }}
SELECT * FROM {{ source('crm', 'customers') }}
{% endsnapshot %}
```
`strategy='timestamp'` (uses `updated_at`) is cheaper and more reliable when the source maintains it; `check` compares columns.

### Databricks DLT / Lakeflow

```sql
CREATE FLOW customers_scd2 AS AUTO CDC INTO silver.dim_customer
FROM STREAM(bronze.customers_cdc)
KEYS (customer_id) SEQUENCE BY lsn
APPLY AS DELETE WHEN op = 'd'
STORED AS SCD TYPE 2
TRACK HISTORY ON city, tier;
```

## 3. Edge cases interviewers love

| Case | Handling |
|---|---|
| Multiple changes for the same key in one batch | Process in order (window by key ordered by effective time; LEAD for valid_to) or you'll lose intermediate versions |
| Late-arriving change (effective date in the past) | Must **split** an existing version: insert the new version and adjust `valid_to` of the prior one, and possibly re-key affected facts. Painful, so mention it and the cost |
| Change in an untracked column | SCD1 update in place on all versions, or ignore |
| NULL handling in change detection | `NULL <> 'x'` is UNKNOWN → use null-safe comparison (`IS DISTINCT FROM`, `<=>`) or hash of coalesced values |
| Hard deletes in source | Close the current row (`valid_to = delete time`, `is_deleted = true`) |
| Re-running the same load | Must be idempotent: unchanged hashes → no new versions |
| Dimension explodes (attribute changes daily) | Move volatile attributes to a mini-dimension (type 4/5) or a periodic snapshot fact |

## 4. SCD2 vs snapshots vs time travel

| Approach | Pros | Cons |
|---|---|---|
| SCD2 dimension | Compact, explicit history, point-in-time joins | Logic complexity, late changes are painful |
| Daily full snapshots (`dim_customer_daily`) | Trivial logic, easy point-in-time | Storage grows linearly (fine with columnar compression for small dims), only daily granularity |
| Table time travel (Delta/Iceberg) | Free | Retention-limited (VACUUM), not a modelling tool. Use for recovery/audit, not business history |

## 5. Interview questions

<details><summary>Why do SCD2 dimensions need surrogate keys?</summary>

The natural key repeats across versions, so it can't be a primary key. Facts must reference a specific version, which only a surrogate (version-level) key can do. Surrogates also insulate the warehouse from source key changes and collisions across sources.
</details>

<details><summary>An analyst asks for "revenue by customer's current segment" and "revenue by segment at time of purchase". How does your model support both?</summary>

Facts store the version surrogate key (as-was via direct join). For as-is, either a type 6 `current_segment` column on every version, or type 7: join through the durable natural key to the current row (`is_current = true`), often exposed as a `dim_customer_current` view.
</details>

<details><summary>How do you make SCD2 loads idempotent?</summary>

Compare a hash of tracked attributes with the current version; insert a new version only when it differs; derive valid_from from source effective time (not load time) so re-runs produce the same rows; deterministic surrogate keys (hash of natural key + valid_from).
</details>
