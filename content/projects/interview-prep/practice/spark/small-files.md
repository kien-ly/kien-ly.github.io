---
title: "Fix the Small Files Problem"
description: "Diagnose small files in a Delta table and fix them with OPTIMIZE, optimized writes and coalescing."
url: "/interview-prep/practice/spark/small-files/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 5
---

# Optimize Small Files

**Difficulty:** Easy  
**Topics:** Delta Lake, Performance, OPTIMIZE  
**Company Tags:** Databricks, Any Delta Lake User

## Problem Statement

You have a Delta table that has accumulated thousands of small files due to frequent streaming writes. Query performance has degraded significantly.

```sql
-- Table info
DESCRIBE DETAIL slow_table;

-- Shows:
-- numFiles: 15,847
-- sizeInBytes: 2,147,483,648  (2 GB total)
-- Average file size: 135 KB  (should be 128+ MB!)
```

**Your task:** 
1. Diagnose the small file problem
2. Optimize the table to consolidate files
3. Set up proper configuration to prevent this in the future

## Setup

```sql
-- Check the current state
DESCRIBE DETAIL interview.delta.small_files_table;

-- Check file distribution
SELECT 
    size / 1024 / 1024 as size_mb,
    COUNT(*) as file_count
FROM (
    SELECT input_file_size() as size 
    FROM interview.delta.small_files_table
)
GROUP BY 1
ORDER BY 1;
```

## Constraints

- Table has 2GB of data total
- Currently has 15,847 files
- Target: ~16 files (128MB each)
- Minimize write amplification

## Hints

<details>
<summary>Hint 1</summary>
OPTIMIZE command consolidates small files into larger ones.
</details>

<details>
<summary>Hint 2</summary>
Consider Z-ORDER if there are frequently filtered columns.
</details>

<details>
<summary>Hint 3</summary>
Auto-optimization settings can prevent this in the future.
</details>

## Solution

<details>
<summary>Click to reveal solution</summary>

```sql
-- Step 1: Basic OPTIMIZE
OPTIMIZE interview.delta.small_files_table;

-- Step 2: If you have frequently filtered columns, use Z-ORDER
OPTIMIZE interview.delta.small_files_table
ZORDER BY (date_col, category_col);

-- Step 3: Verify improvement
DESCRIBE DETAIL interview.delta.small_files_table;
-- numFiles should now be ~16-20

-- Step 4: Clean up old files
VACUUM interview.delta.small_files_table RETAIN 168 HOURS;
```

**Preventing small files in the future:**

```sql
-- Option 1: Enable auto-optimize (Databricks)
ALTER TABLE interview.delta.small_files_table 
SET TBLPROPERTIES (
    'delta.autoOptimize.optimizeWrite' = 'true',
    'delta.autoOptimize.autoCompact' = 'true'
);

-- Option 2: Tune target file size
ALTER TABLE interview.delta.small_files_table 
SET TBLPROPERTIES (
    'delta.targetFileSize' = '134217728'  -- 128 MB
);

-- Option 3: For streaming, use trigger.processingTime
-- In your streaming write:
-- .trigger(processingTime="5 minutes")  -- Batch more data per write
```

**For Spark SQL (non-Databricks):**

```sql
-- Set file size at session level
SET spark.sql.files.maxPartitionBytes = 134217728;

-- Repartition before write
INSERT OVERWRITE interview.delta.small_files_table
SELECT /*+ REPARTITION(16) */ * 
FROM interview.delta.small_files_table;
```

**Why small files are bad:**

1. **Metadata overhead:** Each file has metadata in the transaction log
2. **Task overhead:** Spark creates one task per file (min)
3. **Cloud storage:** More API calls = more latency and cost
4. **Query planning:** Longer time to list and plan files

**Target file sizes:**

| Scenario | Target Size |
|----------|-------------|
| General tables | 128 MB - 1 GB |
| Frequently updated | 64 MB - 256 MB |
| Archive/cold data | 256 MB - 1 GB |

</details>

## Follow-up Questions

1. **When NOT to optimize?** - Right before a large write (optimize after)
2. **OPTIMIZE vs VACUUM?** - OPTIMIZE compacts, VACUUM deletes old versions
3. **What about partitioned tables?** - Can optimize specific partitions: `OPTIMIZE table WHERE date = '2024-01-01'`

## What Interviewers Look For

1. **Problem recognition:** Can you diagnose small files from metrics?
2. **Solution:** Know the OPTIMIZE command and options
3. **Prevention:** Auto-optimize, tuning, streaming best practices
4. **Trade-offs:** When to Z-ORDER vs plain OPTIMIZE
