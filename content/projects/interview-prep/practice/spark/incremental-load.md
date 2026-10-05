---
title: "Incremental Load with Watermarks and MERGE"
description: "Load only new and changed rows idempotently using a high-watermark and Delta MERGE."
url: "/interview-prep/practice/spark/incremental-load/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 2
---

# Incremental Load with Watermarks

**Difficulty:** Medium  
**Topics:** Incremental Processing, Watermarks, MERGE  
**Company Tags:** Airbnb, Stripe, Databricks

## Problem Statement

You have a source table `raw.events` that receives new data continuously. You need to build an incremental pipeline that:

1. Only processes new/changed records since the last run
2. Handles late-arriving data (up to 24 hours late)
3. Updates the target table `curated.events_daily` with aggregations

Source schema:
```sql
raw.events (
    event_id STRING,
    user_id STRING,
    event_type STRING,
    event_timestamp TIMESTAMP,
    properties MAP<STRING, STRING>,
    _ingested_at TIMESTAMP  -- when the record landed in raw
)
```

Target schema:
```sql
curated.events_daily (
    event_date DATE,
    user_id STRING,
    event_type STRING,
    event_count BIGINT,
    unique_users BIGINT,
    last_updated TIMESTAMP
)
```

**Your task:** Write SQL that incrementally updates the target, handling late-arriving data correctly.

## Setup

```sql
-- Check the source data
SELECT 
    DATE(event_timestamp) as event_date,
    MIN(_ingested_at) as earliest_ingestion,
    MAX(_ingested_at) as latest_ingestion,
    COUNT(*) as record_count
FROM interview.incremental.events
GROUP BY DATE(event_timestamp)
ORDER BY event_date DESC
LIMIT 10;
```

## Constraints

- Must be idempotent (safe to re-run)
- Must handle late-arriving data within 24-hour window
- Must not reprocess the entire history each run
- Target table uses Delta Lake

## Hints

<details>
<summary>Hint 1</summary>
You need to track "high watermark" - the maximum _ingested_at you've processed.
</details>

<details>
<summary>Hint 2</summary>
For late-arriving data, you need to look back at event_timestamp, not just _ingested_at.
</details>

<details>
<summary>Hint 3</summary>
MERGE INTO is your friend for upserts. Think about your merge key carefully.
</details>

## Solution

<details>
<summary>Click to reveal solution</summary>

```sql
-- Step 1: Get the high watermark from the last run
-- (In production, store this in a control table or Delta table property)
CREATE OR REPLACE TEMP VIEW watermark AS
SELECT COALESCE(
    (SELECT MAX(last_updated) FROM curated.events_daily),
    TIMESTAMP '1970-01-01'
) as high_watermark;

-- Step 2: Get incremental data
-- Include late-arriving data by looking back 24 hours on event_timestamp
CREATE OR REPLACE TEMP VIEW incremental_data AS
SELECT 
    DATE(event_timestamp) as event_date,
    user_id,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    current_timestamp() as last_updated
FROM raw.events
WHERE 
    -- New data since last run
    _ingested_at > (SELECT high_watermark FROM watermark)
    -- Also re-process dates that might have late data
    OR (
        event_timestamp >= (SELECT high_watermark FROM watermark) - INTERVAL 24 HOURS
        AND _ingested_at > (SELECT high_watermark FROM watermark) - INTERVAL 24 HOURS
    )
GROUP BY DATE(event_timestamp), user_id, event_type;

-- Step 3: MERGE into target
MERGE INTO curated.events_daily AS target
USING incremental_data AS source
ON target.event_date = source.event_date 
   AND target.user_id = source.user_id 
   AND target.event_type = source.event_type
WHEN MATCHED THEN UPDATE SET
    event_count = source.event_count,
    unique_users = source.unique_users,
    last_updated = source.last_updated
WHEN NOT MATCHED THEN INSERT *;

-- Step 4: Verify
SELECT * FROM curated.events_daily 
WHERE last_updated >= current_timestamp() - INTERVAL 1 HOUR
ORDER BY event_date DESC, event_count DESC
LIMIT 20;
```

**Production-grade version with explicit watermark tracking:**

```sql
-- Create watermark tracking table
CREATE TABLE IF NOT EXISTS control.watermarks (
    pipeline_name STRING,
    high_watermark TIMESTAMP,
    rows_processed BIGINT,
    updated_at TIMESTAMP
);

-- At end of pipeline, update watermark
INSERT INTO control.watermarks
SELECT 
    'events_daily_pipeline',
    MAX(_ingested_at),
    COUNT(*),
    current_timestamp()
FROM raw.events
WHERE _ingested_at > (
    SELECT COALESCE(MAX(high_watermark), TIMESTAMP '1970-01-01')
    FROM control.watermarks 
    WHERE pipeline_name = 'events_daily_pipeline'
);
```

</details>

## What Interviewers Look For

1. **Incremental thinking** - Do you understand why full reprocessing is bad?
2. **Late data handling** - This trips up most candidates
3. **Idempotency** - Can you explain why MERGE makes this safe to re-run?
4. **Production patterns** - Watermark tracking, control tables, monitoring
