---
title: "Spark and Databricks Interview Questions"
description: "Grilling questions on Spark internals, performance, Delta Lake, Databricks, Unity Catalog and Structured Streaming."
url: "/interview-prep/interview-qa/03-spark-databricks/"
hiddenInHomeList: true
showToc: true
weight: 3
---

# Spark and Databricks Interview Questions

> Grilling questions for senior roles on Databricks, Delta Lake and Spark. Click a question to reveal the answer; the web platform turns these into spaced-repetition flashcards.

---

## Quick Navigation

- [Spark Core Concepts](#spark-core-concepts)
- [Spark Performance & Optimization](#spark-performance--optimization)
- [Delta Lake](#delta-lake)
- [Databricks Platform](#databricks-platform)
- [Unity Catalog & Governance](#unity-catalog--governance)
- [Structured Streaming](#structured-streaming)
- [Advanced Scenarios](#advanced-scenarios)
- [Gotcha Questions](#gotcha-questions)

---

## Spark Core Concepts

<details><summary>Explain the Spark architecture. What are drivers and executors?</summary>

```
┌─────────────────────────────────────────────────────────────┐
│                      SPARK CLUSTER                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐                                            │
│  │   DRIVER    │  - Runs main() function                    │
│  │             │  - Creates SparkContext/SparkSession       │
│  │  SparkCtx   │  - Builds DAG of transformations           │
│  │             │  - Schedules tasks on executors            │
│  └──────┬──────┘  - Collects results                        │
│         │                                                    │
│    ┌────┴────┬────────────┬────────────┐                    │
│    ▼         ▼            ▼            ▼                    │
│ ┌──────┐ ┌──────┐    ┌──────┐    ┌──────┐                  │
│ │Exec 1│ │Exec 2│    │Exec 3│    │Exec N│                  │
│ │      │ │      │    │      │    │      │                  │
│ │Task  │ │Task  │    │Task  │    │Task  │                  │
│ │Task  │ │Task  │    │Task  │    │Task  │                  │
│ └──────┘ └──────┘    └──────┘    └──────┘                  │
│   Worker Node 1        Worker Node 2      ...              │
└─────────────────────────────────────────────────────────────┘
```

**Key points:**
- **Driver**: Orchestrates execution, holds SparkContext, runs on one node
- **Executors**: Run tasks, store data in memory/disk, report back to driver
- **Cluster Manager**: YARN, Kubernetes, or Standalone - allocates resources

</details>

<details><summary>What is lazy evaluation? Why does Spark use it?</summary>

Transformations (map, filter, select) don't execute immediately. Spark builds a DAG (Directed Acyclic Graph) and only executes when an **action** is called.

| Type | Examples | When Executed |
|------|----------|---------------|
| **Transformation** | map, filter, select, groupBy, join | Never (lazy) |
| **Action** | count, collect, write, show, take | Triggers execution |

**Why lazy?**
1. **Optimization**: Catalyst can optimize the entire query plan
2. **Pipelining**: Chain operations without intermediate materialization
3. **Fault tolerance**: Can recompute from lineage if partition lost

```python
# Nothing happens here - just builds DAG
df = spark.read.parquet("data/")
filtered = df.filter(col("status") == "active")
grouped = filtered.groupBy("region").count()

# NOW it executes
grouped.show()  # Action triggers the entire chain
```

</details>

<details><summary>Explain RDD vs DataFrame vs Dataset.</summary>

| Aspect | RDD | DataFrame | Dataset |
|--------|-----|-----------|---------|
| **Type Safety** | Compile-time | Runtime | Compile-time |
| **API** | Functional (map, reduce) | SQL-like (select, where) | Both |
| **Optimization** | None | Catalyst optimizer | Catalyst optimizer |
| **Schema** | No schema | Has schema | Has schema |
| **Language** | Scala, Java, Python | All | Scala, Java only |
| **When to use** | Low-level control | 95% of use cases | Type safety needed |

**Modern guidance:** Use DataFrames. RDDs are legacy. Datasets are Scala/Java only.

</details>

<details><summary>What is a Spark partition? How do you control it?</summary>

A partition is a chunk of data that can be processed independently on one executor.

**Default partitioning:**
- `spark.sql.files.maxPartitionBytes` (128MB default)
- HDFS block size (128MB)
- `spark.default.parallelism`

**Control methods:**
```python
# Reading
df = spark.read.option("maxPartitionBytes", "64m").parquet("data/")

# Repartitioning
df.repartition(100)                    # Full shuffle, even distribution
df.repartition("date")                 # Partition by column
df.coalesce(10)                        # Reduce partitions (no shuffle)

# Writing
df.write.partitionBy("year", "month").parquet("output/")
```

**Rule of thumb:** 2-4 partitions per CPU core, 128MB-1GB per partition.

</details>

<details><summary>What's the difference between repartition() and coalesce()?</summary>

| Aspect | repartition() | coalesce() |
|--------|---------------|------------|
| **Shuffle** | Yes (full shuffle) | No (narrow transformation) |
| **Increase partitions** | Yes | No |
| **Decrease partitions** | Yes | Yes |
| **Data distribution** | Even | Uneven (combines existing) |
| **Use when** | Need even distribution | Reducing partitions |

```python
# 1000 partitions → 100 partitions
df.coalesce(100)      # Fast, no shuffle, but uneven
df.repartition(100)   # Slower, shuffle, but even

# 100 partitions → 1000 partitions
df.repartition(1000)  # Only way (coalesce can't increase)
```

</details>

<details><summary>Explain Spark's shuffle. Why is it expensive?</summary>

Shuffle moves data between executors when operations require data from multiple partitions (groupBy, join, distinct, repartition).

```
BEFORE SHUFFLE (data local to partitions)
┌────────┐  ┌────────┐  ┌────────┐
│ Part 1 │  │ Part 2 │  │ Part 3 │
│ A: 1,2 │  │ A: 3   │  │ B: 1,2 │
│ B: 3   │  │ B: 4,5 │  │ A: 4   │
└────────┘  └────────┘  └────────┘

         ↓ groupBy("key") ↓

AFTER SHUFFLE (data grouped by key)
┌────────┐  ┌────────┐
│ Part 1 │  │ Part 2 │
│ A: 1-4 │  │ B: 1-5 │
└────────┘  └────────┘
```

**Why expensive:**
1. **Disk I/O**: Writes shuffle files to disk
2. **Network I/O**: Transfers data between nodes
3. **Serialization**: Encode/decode data
4. **Memory pressure**: Can cause spill to disk

**How to minimize:**
- Broadcast small tables in joins
- Use proper partitioning
- Filter early to reduce data volume
- Enable AQE (Adaptive Query Execution)

</details>

## Spark Performance & Optimization

<details><summary>What is data skew? How do you handle it?</summary>

Data skew occurs when some partitions have significantly more data than others, causing some tasks to take much longer.

**Symptoms:**
- Spark UI shows one task taking 10x longer
- "Shuffle spill" warnings
- Out of memory errors on specific executors

**Solutions:**

| Technique | How | When |
|-----------|-----|------|
| **Salting** | Add random prefix to skewed key, aggregate twice | Skewed groupBy |
| **Broadcast join** | Broadcast small table to all executors | Small table joins |
| **AQE skew join** | `spark.sql.adaptive.skewJoin.enabled=true` | Spark 3.0+ |
| **Isolate skew** | Process skewed keys separately | Known skewed values |

```python
# Salting example for skewed aggregation
from pyspark.sql.functions import concat, lit, floor, rand

# Add salt (0-9) to skewed column
salted = df.withColumn("salted_key", 
    concat(col("skewed_col"), lit("_"), floor(rand() * 10))
)

# First aggregation with salt
step1 = salted.groupBy("salted_key").agg(sum("value").alias("partial_sum"))

# Remove salt, aggregate again
step2 = step1.withColumn("original_key", 
    split(col("salted_key"), "_")[0]
).groupBy("original_key").agg(sum("partial_sum").alias("total"))
```

</details>

<details><summary>What is AQE (Adaptive Query Execution)?</summary>

AQE optimizes queries at runtime based on actual data statistics, not estimates.

**Features (Spark 3.0+):**

| Feature | What it does |
|---------|-------------|
| **Coalesce shuffle partitions** | Reduces small partitions after shuffle |
| **Convert sort-merge to broadcast** | Switches join strategy if table is small |
| **Skew join optimization** | Splits skewed partitions automatically |
| **Dynamic partition pruning** | Prunes partitions based on join filters |

```python
# Enable AQE (default in Databricks)
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

</details>

<details><summary>How do you debug a slow Spark job?</summary>

**Step 1: Check Spark UI**
```
Stages tab → Look for:
- Long-running tasks (data skew)
- High shuffle read/write (expensive shuffle)
- Spill to disk (memory pressure)
```

**Step 2: Identify bottleneck type**

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| One task 10x slower | Data skew | Salt keys, AQE |
| All tasks slow | Wrong join strategy | Broadcast hint |
| Shuffle spill | Not enough memory | Increase executor memory |
| Many small tasks | Too many partitions | Coalesce |
| Few large tasks | Too few partitions | Repartition |

**Step 3: Use explain()**
```python
df.explain("cost")      # Show query plan with costs
df.explain("formatted") # Readable format
```

**Step 4: Check for common issues**
```python
# Cartesian join (missing join condition)
# UDFs (break Catalyst optimization)
# collect() on large data
# count() just for debugging (use limit instead)
```

</details>

<details><summary>When would you use a broadcast join?</summary>

When one table is small enough to fit in executor memory (default < 10MB, can increase).

```python
from pyspark.sql.functions import broadcast

# Explicit broadcast hint
result = large_df.join(broadcast(small_df), "key")

# Configure threshold
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "100m")  # 100MB
```

**When to use:**
- Dimension table joins (small dims, large facts)
- Lookup/enrichment joins
- When shuffle is the bottleneck

**When NOT to use:**
- Both tables are large
- Small table is actually big (driver OOM)
- Table size varies (use AQE instead)

</details>

<details><summary>Explain cache() vs persist(). When to use each?</summary>

```python
df.cache()                           # Memory only (MEMORY_AND_DISK in Spark 3.0+)
df.persist(StorageLevel.MEMORY_ONLY) # Memory only, lose if evicted
df.persist(StorageLevel.DISK_ONLY)   # Disk only
df.persist(StorageLevel.MEMORY_AND_DISK)  # Memory, spill to disk
```

**When to cache:**
- DataFrame used multiple times
- After expensive transformation
- Before iterative algorithms (ML)

**When NOT to cache:**
- Used only once
- Data changes frequently
- Memory constrained

**Important:** Always `unpersist()` when done!

</details>

## Delta Lake

<details><summary>What is Delta Lake? Why use it over plain Parquet?</summary>

Delta Lake is an open-source storage layer that adds ACID transactions to data lakes.

| Feature | Parquet | Delta Lake |
|---------|---------|------------|
| **ACID Transactions** | No | Yes |
| **Schema enforcement** | No | Yes |
| **Schema evolution** | Manual | Built-in |
| **Time travel** | No | Yes |
| **MERGE/UPDATE/DELETE** | No | Yes |
| **Audit history** | No | Yes (transaction log) |
| **Small file compaction** | Manual | OPTIMIZE command |
| **Data skipping** | Limited | Z-order, stats |

</details>

<details><summary>Explain the Delta Lake transaction log.</summary>

The `_delta_log/` folder contains JSON files tracking every change.

```
my_table/
├── _delta_log/
│   ├── 00000000000000000000.json  # Version 0
│   ├── 00000000000000000001.json  # Version 1
│   ├── 00000000000000000002.json  # Version 2
│   └── 00000000000000000010.checkpoint.parquet  # Checkpoint
├── part-00000-xxx.parquet
├── part-00001-xxx.parquet
└── ...
```

**Transaction log contains:**
- Add/remove file actions
- Metadata changes
- Commit info (timestamp, operation)

**Checkpoints:** Every 10 commits, creates a Parquet checkpoint for faster reads.

</details>

<details><summary>How does MERGE work in Delta Lake?</summary>

MERGE performs upsert (update + insert) in a single atomic operation.

```sql
MERGE INTO target_table t
USING source_table s
ON t.id = s.id
WHEN MATCHED AND s.is_deleted = true THEN DELETE
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *
```

**Behind the scenes:**
1. Scan target for matching files
2. Read matching rows + source
3. Apply merge logic
4. Write new files
5. Update transaction log (remove old files, add new)

**Performance tips:**
- Partition target table on join key
- Use `ZORDER BY` on merge key
- Filter source before merge

</details>

<details><summary>What is Z-ordering? When would you use it?</summary>

Z-ordering co-locates related data in the same files for better data skipping.

```sql
OPTIMIZE my_table ZORDER BY (column1, column2)
```

**How it works:**
- Interleaves bits of multiple columns into a single value
- Sorts data by this value
- Related data ends up in same files

**Use when:**
- Queries filter on specific columns frequently
- Columns have high cardinality
- Not the partition column

**Don't use for:**
- Low cardinality columns (use partitioning instead)
- Columns rarely filtered
- More than 4 columns (diminishing returns)

</details>

<details><summary>Explain Delta Lake time travel.</summary>

Query previous versions of a table using version number or timestamp.

```sql
-- By version
SELECT * FROM my_table VERSION AS OF 5

-- By timestamp  
SELECT * FROM my_table TIMESTAMP AS OF '2024-01-01'

-- In Python
df = spark.read.format("delta").option("versionAsOf", 5).load("path")
df = spark.read.format("delta").option("timestampAsOf", "2024-01-01").load("path")
```

**Use cases:**
- Audit/compliance queries
- Rollback from bad data
- Reproducing ML experiments
- Debug data issues

**Retention:**
```sql
-- Default: 30 days
ALTER TABLE my_table SET TBLPROPERTIES ('delta.logRetentionDuration' = '60 days')

-- Vacuum removes old files
VACUUM my_table RETAIN 168 HOURS  -- 7 days minimum
```

</details>

<details><summary>What's the difference between OPTIMIZE and VACUUM?</summary>

| Command | Purpose | When to Run |
|---------|---------|-------------|
| **OPTIMIZE** | Compacts small files into larger ones | After many small writes |
| **VACUUM** | Deletes old/orphaned files | Periodically for storage cleanup |

```sql
-- OPTIMIZE: Compact small files
OPTIMIZE my_table
OPTIMIZE my_table ZORDER BY (col1, col2)
OPTIMIZE my_table WHERE date = '2024-01-01'  -- Partial optimize

-- VACUUM: Clean up old files
VACUUM my_table                    -- Uses default retention (7 days)
VACUUM my_table RETAIN 168 HOURS   -- Explicit retention
```

**Warning:** VACUUM breaks time travel for vacuumed versions!

</details>

## Databricks Platform

<details><summary>What are the different cluster types in Databricks?</summary>

| Type | Use Case | Billing |
|------|----------|---------|
| **All-Purpose** | Interactive development, notebooks | DBU while running |
| **Job Cluster** | Scheduled jobs, one-time runs | DBU during job only |
| **SQL Warehouse** | BI queries, SQL analytics | DBU per query |

**Cluster modes:**

| Mode | Workers | Use Case |
|------|---------|----------|
| **Standard** | Fixed count | Predictable workloads |
| **Autoscaling** | Min-max range | Variable workloads |
| **Single Node** | 0 (driver only) | Small data, development |

</details>

<details><summary>Explain Databricks Runtime versions.</summary>

Databricks Runtime (DBR) is the software running on clusters.

| Runtime | Contents |
|---------|----------|
| **Standard** | Spark + Delta + MLlib + utilities |
| **ML Runtime** | Standard + ML libraries (TensorFlow, PyTorch, scikit-learn) |
| **Photon Runtime** | Standard + Photon engine (C++ query engine, 2-8x faster) |
| **GPU Runtime** | ML Runtime + GPU drivers |

**Version format:** `13.3 LTS` = Spark 3.4.1, Scala 2.12, LTS supported

**LTS (Long Term Support):** Supported for 2+ years, recommended for production.

</details>

<details><summary>What is Photon? When does it help?</summary>

Photon is a vectorized C++ query engine that replaces parts of Spark SQL execution.

**Best for:**
- Aggregations
- Joins
- Filters
- Parquet/Delta reads

**Not for:**
- UDFs (falls back to Spark)
- Python transformations
- Streaming (limited support)

**When to enable:**
- SQL-heavy workloads
- Large scans and aggregations
- When Spark SQL is the bottleneck

</details>

## Unity Catalog & Governance

<details><summary>What is Unity Catalog? Why is it important?</summary>

Unity Catalog is Databricks' unified governance layer for all data assets.

**Features:**

| Feature | Description |
|---------|-------------|
| **Centralized access control** | One place for all permissions |
| **Data lineage** | Track data flow across tables |
| **Audit logging** | Who accessed what, when |
| **Data discovery** | Search across all catalogs |
| **Secure sharing** | Delta Sharing for external access |

**Hierarchy:**
```
Metastore
└── Catalog
    └── Schema (Database)
        └── Table/View/Function
```

</details>

<details><summary>Explain the three-level namespace in Unity Catalog.</summary>

```
catalog.schema.table

Examples:
- prod.sales.transactions
- dev.marketing.campaigns  
- sandbox.user_siddiam.test_data
```

**Access patterns:**
```sql
-- Full path
SELECT * FROM prod.sales.transactions

-- With default catalog/schema
USE CATALOG prod;
USE SCHEMA sales;
SELECT * FROM transactions
```

</details>

<details><summary>How do you handle PII data in Databricks?</summary>

**Column-level security:**
```sql
-- Dynamic view with masking
CREATE VIEW masked_customers AS
SELECT 
  id,
  CASE WHEN is_member('pii_readers') THEN email 
       ELSE 'xxx@xxx.com' END AS email,
  CASE WHEN is_member('pii_readers') THEN ssn
       ELSE 'XXX-XX-XXXX' END AS ssn
FROM customers
```

**Row-level security:**
```sql
CREATE VIEW regional_sales AS
SELECT * FROM sales
WHERE region = current_user_region()
```

**Tags for governance:**
```sql
ALTER TABLE customers ALTER COLUMN ssn SET TAGS ('pii' = 'true')
```

</details>

## Structured Streaming

<details><summary>Explain Structured Streaming's processing model.</summary>

Treats streaming data as an unbounded table, appending new rows as data arrives.

```
                    Input (Unbounded Table)
                    ┌──────────────────────┐
Time 1:             │ row1, row2, row3     │
                    └──────────────────────┘
                              ↓
                    ┌──────────────────────┐
Time 2:             │ row1-3, row4, row5   │
                    └──────────────────────┘
                              ↓
                        Incremental Query
                              ↓
                    Output (Result Table)
```

**Triggers:**

| Trigger | Behavior |
|---------|----------|
| `processingTime="10 seconds"` | Micro-batch every 10s |
| `availableNow=True` | Process all available, then stop |
| `once=True` | Single micro-batch |
| `continuous="1 second"` | True streaming (experimental) |

</details>

<details><summary>What is a checkpoint in Structured Streaming?</summary>

Checkpoints store query progress and state for fault tolerance.

```python
query = df.writeStream \
    .format("delta") \
    .option("checkpointLocation", "/checkpoints/my_stream") \
    .start()
```

**Contains:**
- Offsets processed (Kafka offsets, file paths)
- State data (for aggregations)
- Commit log

**Rules:**
- One checkpoint per query (never share)
- Don't delete while query runs
- Change location = restart from scratch

</details>

<details><summary>How do you handle late data in streaming?</summary>

Use watermarks to define how late data can be.

```python
df = spark.readStream.format("kafka")...

result = df \
    .withWatermark("event_time", "10 minutes") \  # Allow 10 min late
    .groupBy(
        window("event_time", "5 minutes"),
        "user_id"
    ).count()
```

**What happens:**
- Events within watermark: Processed normally
- Events beyond watermark: Dropped
- State cleanup: Old state removed after watermark passes

</details>

## Advanced Scenarios

<details><summary>How would you implement SCD Type 2 in Delta Lake?</summary>

```sql
-- Target table structure
CREATE TABLE dim_customer (
    customer_id STRING,
    name STRING,
    email STRING,
    effective_date DATE,
    end_date DATE,
    is_current BOOLEAN
);

-- SCD Type 2 MERGE
MERGE INTO dim_customer t
USING (
    SELECT 
        s.*,
        current_date() as effective_date,
        NULL as end_date,
        true as is_current
    FROM staging_customer s
) s
ON t.customer_id = s.customer_id AND t.is_current = true
WHEN MATCHED AND (t.name != s.name OR t.email != s.email) THEN 
    UPDATE SET 
        end_date = current_date(),
        is_current = false
WHEN NOT MATCHED THEN 
    INSERT *;

-- Insert new current records for changed rows (separate statement)
INSERT INTO dim_customer
SELECT 
    customer_id, name, email,
    current_date() as effective_date,
    NULL as end_date,
    true as is_current
FROM staging_customer s
WHERE EXISTS (
    SELECT 1 FROM dim_customer t 
    WHERE t.customer_id = s.customer_id 
    AND t.is_current = false 
    AND t.end_date = current_date()
);
```

</details>

<details><summary>How do you migrate from Hive tables to Delta?</summary>

**Option 1: CONVERT (in-place, no data movement)**
```sql
CONVERT TO DELTA parquet.`/path/to/table`
CONVERT TO DELTA parquet.`/path/to/table` PARTITIONED BY (date DATE)
```

**Option 2: CTAS (copy)**
```sql
CREATE TABLE new_delta_table
USING DELTA
AS SELECT * FROM old_hive_table
```

**Option 3: Deep clone**
```sql
CREATE TABLE new_table DEEP CLONE old_table
```

**Post-migration:**
- Run OPTIMIZE
- Add Z-ORDER if needed
- Update downstream jobs
- Validate row counts

</details>

<details><summary>Explain the medallion architecture in practice.</summary>

```
┌─────────────────────────────────────────────────────────────┐
│                    MEDALLION ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BRONZE (Raw)          SILVER (Cleaned)       GOLD (Curated)│
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │ • Raw JSON  │  →   │ • Validated │  →   │ • Aggregated│ │
│  │ • As-is     │      │ • Deduped   │      │ • Joined    │ │
│  │ • Append    │      │ • Typed     │      │ • Star schema│ │
│  │ • All data  │      │ • Cleansed  │      │ • Metrics   │ │
│  └─────────────┘      └─────────────┘      └─────────────┘ │
│                                                             │
│  Schema:               Schema:              Schema:         │
│  - Raw strings         - Proper types       - Fact tables   │
│  - _rescued_data       - Constraints        - Dim tables    │
│                                                             │
│  Update:               Update:              Update:         │
│  - Append only         - MERGE/overwrite    - Full rebuild  │
│  - Streaming           - Incremental        - or incremental│
└─────────────────────────────────────────────────────────────┘
```

**Bronze:**
```python
df = spark.readStream.format("cloudFiles") \
    .option("cloudFiles.format", "json") \
    .option("cloudFiles.schemaLocation", "/schema/bronze") \
    .load("/raw/events/")

df.writeStream.format("delta") \
    .option("checkpointLocation", "/checkpoints/bronze") \
    .toTable("bronze.events")
```

**Silver:**
```python
bronze = spark.readStream.table("bronze.events")

silver = bronze \
    .dropDuplicates(["event_id"]) \
    .filter(col("event_type").isNotNull()) \
    .withColumn("processed_at", current_timestamp())

silver.writeStream.format("delta") \
    .option("checkpointLocation", "/checkpoints/silver") \
    .toTable("silver.events")
```

**Gold:**
```sql
CREATE OR REPLACE TABLE gold.daily_metrics AS
SELECT 
    date,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users
FROM silver.events
GROUP BY date
```

</details>

## Gotcha Questions

<details><summary>What happens if you run collect() on a 1TB DataFrame?</summary>

**Driver crashes with OOM.** `collect()` brings ALL data to the driver's memory.

**Safe alternatives:**
```python
df.limit(100).collect()    # Limit first
df.take(100)               # Same as limit + collect
df.head(10)                # First 10 rows

# For large data, write to storage instead
df.write.parquet("output/")
```

</details>

<details><summary>Why might a Spark job work locally but fail on cluster?</summary>

| Issue | Cause | Fix |
|-------|-------|-----|
| **File not found** | Local path doesn't exist on workers | Use DBFS/S3 |
| **Serialization error** | Non-serializable objects in UDF | Use broadcast variables |
| **Driver OOM** | Collect on big data | Avoid collect |
| **Different Python version** | Driver vs executor mismatch | Match versions |
| **Missing packages** | Library not installed on workers | Use cluster libraries |

</details>

<details><summary>Can you update a DataFrame in Spark?</summary>

**No.** DataFrames are immutable. Transformations return NEW DataFrames.

```python
# This doesn't modify df
df.withColumn("new_col", lit(1))  # Returns new DataFrame, df unchanged

# This captures the new DataFrame
df2 = df.withColumn("new_col", lit(1))
```

For actual updates, use Delta Lake:
```sql
UPDATE my_table SET status = 'inactive' WHERE expired = true
```

</details>

<details><summary>What's the difference between spark.sql.shuffle.partitions and spark.default.parallelism?</summary>

| Setting | Default | Controls |
|---------|---------|----------|
| `spark.sql.shuffle.partitions` | 200 | Partitions after SQL/DataFrame shuffle |
| `spark.default.parallelism` | Total cores | RDD operations (legacy) |

```python
# For DataFrames, this is what matters:
spark.conf.set("spark.sql.shuffle.partitions", "100")

# Auto-tuning with AQE (recommended):
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
```

</details>

<details><summary>What happens if an executor fails mid-job?</summary>

Spark's fault tolerance kicks in:

1. **Task retry:** Failed tasks rerun on other executors (default 4 retries)
2. **Stage retry:** If all task retries fail, retry entire stage
3. **RDD lineage:** Recompute lost partitions from source
4. **Speculative execution:** Slow tasks re-launched on other nodes

**Settings:**
```python
spark.conf.set("spark.task.maxFailures", "4")
spark.conf.set("spark.speculation", "true")  # Speculative execution
```

</details>

<details><summary>How do you handle schema evolution in Delta Lake?</summary>

**Add columns:**
```sql
ALTER TABLE my_table ADD COLUMN new_col STRING
-- Or with merge schema
df.write.option("mergeSchema", "true").mode("append").saveAsTable("my_table")
```

**Rename columns:**
```sql
ALTER TABLE my_table RENAME COLUMN old_name TO new_name
```

**Change types (with overwrite):**
```sql
ALTER TABLE my_table ALTER COLUMN my_col TYPE BIGINT
```

**Enable auto-merge:**
```python
spark.conf.set("spark.databricks.delta.schema.autoMerge.enabled", "true")
```

</details>

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                 SPARK/DATABRICKS CHEATSHEET                 │
├─────────────────────────────────────────────────────────────┤
│ PERFORMANCE                                                 │
│ • Broadcast small tables: broadcast(df)                     │
│ • Enable AQE: spark.sql.adaptive.enabled = true             │
│ • Reduce shuffle: filter early, broadcast joins             │
│ • Handle skew: salting, AQE skew join                       │
├─────────────────────────────────────────────────────────────┤
│ DELTA LAKE                                                  │
│ • OPTIMIZE: Compact small files                             │
│ • VACUUM: Clean old files (breaks time travel)              │
│ • Z-ORDER: Co-locate data for filter columns                │
│ • Time travel: VERSION AS OF n, TIMESTAMP AS OF             │
├─────────────────────────────────────────────────────────────┤
│ DEBUGGING                                                   │
│ • Spark UI: Check stages, tasks, shuffle                    │
│ • df.explain(): See query plan                              │
│ • Slow task = data skew                                     │
│ • Shuffle spill = need more memory                          │
├─────────────────────────────────────────────────────────────┤
│ COMMON MISTAKES                                             │
│ • collect() on big data → Driver OOM                        │
│ • UDFs → Breaks Catalyst optimization                       │
│ • Too many/few partitions → Bad parallelism                 │
│ • Missing broadcast → Expensive shuffle join                │
└─────────────────────────────────────────────────────────────┘
```

## Deep dives: memory, OOM, joins, caching and plans

<details><summary>[senior] How is executor memory laid out?</summary>

Heap = 300 MB reserved + unified memory (`spark.memory.fraction` 0.6 of the rest, shared by execution and storage, with `storageFraction` 0.5 protected for cache) + user memory (the remaining 0.4). Outside the heap the container also needs `memoryOverhead` (max 384 MB or 10%) for native buffers, metaspace and Python workers (unless `pyspark.memory` is set), plus any off-heap pool. YARN/Kubernetes enforce the total.

</details>

<details><summary>[senior] Driver OOM vs executor OOM: causes and fixes?</summary>

Driver: `collect()`/`toPandas()`, broadcasting a big table (it's collected on the driver first), huge plans or millions of partitions. Remove the collect, fix stats/hints, simplify. Executor: skewed or oversized partitions, unbounded per-key aggregates, UDF memory. Fix skew, add partitions, use fewer cores per executor; if the container is killed, raise overhead for PySpark.

</details>

<details><summary>[senior] "Container killed by YARN for exceeding memory limits": what is it?</summary>

The total container (heap + off-heap + overhead) exceeded its limit. It's usually non-heap memory: Python workers, Arrow batches, native/NIO buffers. Raise `memoryOverhead` or set `spark.executor.pyspark.memory`, shrink Arrow batches, use fewer cores per executor, and avoid Python UDFs.

</details>

<details><summary>[core] What does high GC time indicate?</summary>

Memory pressure from too many live objects: too many concurrent tasks per heap, deserialized caches, or object-heavy code (RDDs, typed lambdas). If only a few tasks show it, suspect skew. Fix with more memory per task, DataFrames and serialized/columnar caches, and G1GC tuning.

</details>

<details><summary>[senior] The five physical join strategies and when each is used?</summary>

Broadcast hash join (small side broadcast, no shuffle of the big side); shuffle hash join (both shuffled, per-partition hash table, no sort); sort-merge join (both shuffled and sorted, robust default for large-large); broadcast nested loop join (non-equi, one side small); Cartesian product (no condition). Equality keys are required for the hash and sort-based strategies.

</details>

<details><summary>[senior] Join hint priority?</summary>

BROADCAST > MERGE > SHUFFLE_HASH > SHUFFLE_REPLICATE_NL. Hints invalid for the join type (e.g. broadcasting the preserved side of an outer join) are ignored with a warning.

</details>

<details><summary>[senior] Why can't Spark broadcast the left side of a LEFT JOIN?</summary>

The left side is preserved: every left row must appear even without a match, which requires seeing all right rows for it. Only the non-preserved (right) side can be the broadcast/build side; a full outer join can't use broadcast hash join at all.

</details>

<details><summary>[senior] How do you optimise a range (BETWEEN) join?</summary>

Add an equality on a coarse bucket (e.g. user + hour, exploding intervals into the buckets they span), join on that, then apply the exact range filter. This turns a nested loop into a hash/sort join. On Databricks the RANGE_JOIN hint does the binning internally.

</details>

<details><summary>[senior] What is a runtime Bloom filter join?</summary>

Since Spark 3.3: when one side is selective, Spark builds a Bloom filter of its join keys and applies it to the other side's scan before the shuffle, cutting shuffle volume for large joins that can't be broadcast.

</details>

<details><summary>[core] Does df.cache() cache immediately?</summary>

No. It's lazy: the first action materialises the partitions it computes (`count()` for all of them, `show()` only for a few). `CACHE TABLE` in SQL is eager by default.

</details>

<details><summary>[senior] How can caching change join strategies?</summary>

A cached DataFrame's statistics use its actual in-memory size, which can be far smaller than the estimate for a filtered scan, so a sort-merge join may become a broadcast join. Hints on the original plan may no longer apply. Check `explain()` after caching.

</details>

<details><summary>[senior] Cache vs checkpoint vs temp view?</summary>

Cache keeps lineage and is recomputed on loss, for reuse within one app. Checkpoint truncates lineage by writing to reliable storage, for very long iterative lineages. A temp view is just a named plan, not a cache. For production reuse across jobs, write an intermediate table.

</details>

<details><summary>[senior] What is Expand in a physical plan?</summary>

It replicates rows once per grouping set. It implements ROLLUP/CUBE/GROUPING SETS and multiple DISTINCT aggregates in one query, and it multiplies the data shuffled. Split distinct counts into separate aggregations or use approximate counting.

</details>

<details><summary>[core] What does Exchange SinglePartition mean?</summary>

All data goes to one partition (one task), e.g. a window without PARTITION BY or a global ordering step. It's a scalability red flag: add a partition key or restructure the computation.

</details>

<details><summary>[senior] How do you quantify skew?</summary>

Compare max vs median task shuffle read/records in the Stages summary (a ratio above 3-5× means skew); compute key frequency distributions (top-k share of rows, max/median count per key) on a sample; check rows per partition with `spark_partition_id()`. Then classify it (key, null, file, layout, or join explosion) before choosing the fix.

</details>

---

## References

- [Databricks Documentation](https://docs.databricks.com/)
- [Delta Lake Documentation](https://docs.delta.io/)
- [Spark: The Definitive Guide](https://www.oreilly.com/library/view/spark-the-definitive/9781491912201/)
- [Learning Spark, 2nd Edition](https://www.oreilly.com/library/view/learning-spark-2nd/9781492050032/)
