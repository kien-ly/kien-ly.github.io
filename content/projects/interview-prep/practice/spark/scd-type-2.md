---
title: "SCD Type 2 with Delta MERGE"
description: "Implement slowly changing dimension type 2 in PySpark with a single MERGE."
url: "/interview-prep/practice/spark/scd-type-2/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 3
---

# SCD Type 2 Implementation

**Difficulty:** Hard  
**Topics:** Slowly Changing Dimensions, MERGE, Historical Tracking  
**Company Tags:** Amazon, Walmart, Target

## Problem Statement

You have a source table `raw.customers` with the current state of customer data. You need to implement SCD Type 2 to track historical changes in the `dim.customers` dimension table.

Source schema (current state):
```sql
raw.customers (
    customer_id STRING,
    name STRING,
    email STRING,
    address STRING,
    segment STRING,      -- Can change (Bronze/Silver/Gold)
    updated_at TIMESTAMP
)
```

Target schema (SCD Type 2):
```sql
dim.customers (
    customer_sk BIGINT,          -- Surrogate key
    customer_id STRING,          -- Business key
    name STRING,
    email STRING,
    address STRING,
    segment STRING,
    effective_from TIMESTAMP,
    effective_to TIMESTAMP,      -- NULL means current
    is_current BOOLEAN,
    _loaded_at TIMESTAMP
)
```

**Your task:** Write SQL to perform an SCD Type 2 merge that:
1. Inserts new customers
2. Updates unchanged existing customers (just update _loaded_at)
3. Creates new versions for changed customers (close old, insert new)

## Setup

```sql
-- Check source data
SELECT * FROM interview.scd.customers_source LIMIT 10;

-- Check current dimension state
SELECT * FROM interview.scd.customers_dim 
WHERE is_current = true 
LIMIT 10;
```

## Constraints

- Must preserve complete history
- Must generate unique surrogate keys
- Must be idempotent
- Must handle same customer changing multiple times in one batch

## Hints

<details>
<summary>Hint 1</summary>
You need to compare source vs current dimension to detect changes. Use a hash of tracked columns.
</details>

<details>
<summary>Hint 2</summary>
MERGE with multiple WHEN MATCHED clauses can handle "update unchanged" vs "close and insert new".
</details>

<details>
<summary>Hint 3</summary>
For surrogate keys, use monotonically_increasing_id() or a sequence.
</details>

## Solution

<details>
<summary>Click to reveal solution</summary>

```sql
-- Step 1: Create a hash of tracked columns for change detection
CREATE OR REPLACE TEMP VIEW source_with_hash AS
SELECT 
    *,
    SHA2(CONCAT_WS('|', 
        COALESCE(name, ''),
        COALESCE(email, ''),
        COALESCE(address, ''),
        COALESCE(segment, '')
    ), 256) as row_hash
FROM raw.customers;

CREATE OR REPLACE TEMP VIEW current_dim_with_hash AS
SELECT 
    *,
    SHA2(CONCAT_WS('|', 
        COALESCE(name, ''),
        COALESCE(email, ''),
        COALESCE(address, ''),
        COALESCE(segment, '')
    ), 256) as row_hash
FROM dim.customers
WHERE is_current = true;

-- Step 2: Identify what action to take for each record
CREATE OR REPLACE TEMP VIEW changes AS
SELECT 
    s.customer_id,
    s.name,
    s.email,
    s.address,
    s.segment,
    s.updated_at,
    s.row_hash as source_hash,
    d.customer_sk as existing_sk,
    d.row_hash as dim_hash,
    CASE 
        WHEN d.customer_id IS NULL THEN 'INSERT'
        WHEN s.row_hash != d.row_hash THEN 'UPDATE'
        ELSE 'NO_CHANGE'
    END as action
FROM source_with_hash s
LEFT JOIN current_dim_with_hash d 
    ON s.customer_id = d.customer_id;

-- Step 3: Close existing records that have changes
UPDATE dim.customers
SET 
    effective_to = current_timestamp(),
    is_current = false
WHERE customer_sk IN (
    SELECT existing_sk 
    FROM changes 
    WHERE action = 'UPDATE' AND existing_sk IS NOT NULL
);

-- Step 4: Insert new records and new versions
INSERT INTO dim.customers
SELECT 
    -- Generate surrogate key (in production, use a proper sequence)
    MONOTONICALLY_INCREASING_ID() + 
        COALESCE((SELECT MAX(customer_sk) FROM dim.customers), 0) + 1 as customer_sk,
    customer_id,
    name,
    email,
    address,
    segment,
    current_timestamp() as effective_from,
    NULL as effective_to,
    true as is_current,
    current_timestamp() as _loaded_at
FROM changes
WHERE action IN ('INSERT', 'UPDATE');

-- Step 5: Update _loaded_at for unchanged records (optional, for audit)
UPDATE dim.customers
SET _loaded_at = current_timestamp()
WHERE customer_sk IN (
    SELECT existing_sk 
    FROM changes 
    WHERE action = 'NO_CHANGE' AND existing_sk IS NOT NULL
);
```

**Using MERGE (more elegant but complex):**

```sql
-- This requires Delta Lake's advanced MERGE capabilities
MERGE INTO dim.customers AS target
USING (
    SELECT 
        s.*,
        SHA2(CONCAT_WS('|', s.name, s.email, s.address, s.segment), 256) as row_hash,
        d.customer_sk,
        d.row_hash as existing_hash
    FROM source_with_hash s
    LEFT JOIN current_dim_with_hash d ON s.customer_id = d.customer_id
) AS source
ON target.customer_sk = source.customer_sk AND target.is_current = true

-- Changed record: close it
WHEN MATCHED AND source.row_hash != source.existing_hash THEN
    UPDATE SET 
        effective_to = current_timestamp(),
        is_current = false

-- Unchanged: just update loaded timestamp
WHEN MATCHED AND source.row_hash = source.existing_hash THEN
    UPDATE SET 
        _loaded_at = current_timestamp();

-- Then insert new versions in a separate statement
INSERT INTO dim.customers
SELECT ...
FROM changes WHERE action IN ('INSERT', 'UPDATE');
```

</details>

## What Interviewers Look For

1. **SCD concepts** - Do you understand Type 1 vs Type 2 vs Type 3?
2. **Change detection** - Hash comparison is the production pattern
3. **Surrogate keys** - Why they matter, how to generate them
4. **Edge cases** - Same customer multiple times in batch, NULL handling
5. **Performance** - This pattern at scale (partitioning, Z-order)
