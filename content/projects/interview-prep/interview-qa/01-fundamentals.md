---
title: "Data Engineering Fundamentals Q&A"
description: "Core data engineering interview questions: concepts, SQL and databases, big data, warehousing, cloud, Python and modeling basics."
url: "/interview-prep/interview-qa/01-fundamentals/"
hiddenInHomeList: true
showToc: true
weight: 1
---

# Data Engineering Fundamentals Q&A

> Breadth questions that open most interviews. Answer each in under a minute, then go one level deeper.

---

## Quick Navigation

- [General Concepts](#general-concepts)
- [SQL & Databases](#sql--databases)
- [Big Data Technologies](#big-data-technologies)
- [Data Warehousing & ETL](#data-warehousing--etl)
- [Cloud Platforms](#cloud-platforms)
- [Python & Spark](#python--spark)
- [Data Modeling](#data-modeling)
- [Stream Processing](#stream-processing)
- [Data Quality & Governance](#data-quality--governance)
- [Scenario-Based Questions](#scenario-based-questions)

---

## General Concepts

<details><summary>What is data engineering?</summary>

**Answer:** The practice of designing, building, and maintaining systems for collecting, storing, and analyzing large data volumes through pipelines and storage optimization.

</details>

<details><summary>What are the main responsibilities of a data engineer?</summary>

- Designing and building data pipelines
- Maintaining data warehouses and lakes
- Ensuring data quality and consistency
- Optimizing storage and query performance
- Collaborating with data scientists and analysts
- Implementing data security measures

</details>

<details><summary>Data engineer vs data scientist - what's the difference?</summary>

| Aspect | Data Engineer | Data Scientist |
|--------|--------------|----------------|
| Focus | Infrastructure, pipelines | Analysis, modeling |
| Skills | SQL, Spark, ETL, Cloud | ML, Statistics, Python |
| Output | Data systems | Insights, predictions |
| Analogy | Plumber | Chef |

</details>

<details><summary>What is a data pipeline?</summary>

**Answer:** A series of processes that move data from sources to destinations, involving extraction, transformation, and loading steps. Can be batch (scheduled) or streaming (real-time).

</details>

<details><summary>What are common challenges in data engineering?</summary>

- Handling large volumes efficiently (scale)
- Ensuring data quality and consistency
- Managing real-time vs batch processing trade-offs
- Integrating diverse data sources
- Maintaining security and compliance
- Handling schema evolution

</details>

## SQL & Databases

<details><summary>What is normalization? Why use it?</summary>

**Answer:** Organizing data to reduce redundancy and improve integrity by breaking tables into smaller, related ones using foreign keys.
- **1NF:** Atomic values, no repeating groups
- **2NF:** 1NF + no partial dependencies
- **3NF:** 2NF + no transitive dependencies

</details>

<details><summary>SQL vs NoSQL - when to use each?</summary>

| Aspect | SQL | NoSQL |
|--------|-----|-------|
| Schema | Fixed, predefined | Flexible, schema-less |
| Scaling | Vertical | Horizontal |
| ACID | Strong | Eventual consistency |
| Use Case | Transactions, reporting | High scale, unstructured |

**Use SQL when:** ACID matters, complex queries, structured data
**Use NoSQL when:** Scale > consistency, schema flexibility, high write throughput

</details>

<details><summary>What is database indexing?</summary>

**Answer:** Creating data structures (B-trees, hash indexes) for faster data retrieval without scanning entire tables.
- **Pros:** Faster reads
- **Cons:** Slower writes, storage overhead
- **Best for:** Frequently queried columns, WHERE/JOIN clauses

</details>

<details><summary>Explain ACID properties.</summary>

- **Atomicity:** All or nothing - transaction completes fully or not at all
- **Consistency:** Database remains valid after transaction
- **Isolation:** Concurrent transactions don't interfere
- **Durability:** Committed changes persist

</details>

<details><summary>What are window functions? Give examples.</summary>

**Answer:** Functions that operate across a set of rows related to the current row.
```sql
-- Running total
SUM(amount) OVER (ORDER BY date)

-- Rank within partition
RANK() OVER (PARTITION BY department ORDER BY salary DESC)

-- Previous row value
LAG(value, 1) OVER (ORDER BY date)
```

</details>

## Big Data Technologies

<details><summary>What is Apache Spark? Why is it popular?</summary>

**Answer:** A fast, in-memory distributed data processing engine supporting batch, streaming, ML, and SQL workloads.
**Why popular:**
- 100x faster than MapReduce (in-memory)
- Unified API for batch + streaming
- Rich ecosystem (MLlib, GraphX, Spark SQL)
- Multiple language support (Python, Scala, Java, R)

</details>

<details><summary>Spark vs Hadoop MapReduce?</summary>

| Aspect | Spark | MapReduce |
|--------|-------|-----------|
| Speed | In-memory, fast | Disk-based, slower |
| Ease | High-level APIs | Low-level, verbose |
| Use Cases | ML, streaming, interactive | Batch only |
| Fault Tolerance | RDD lineage | Replication |

</details>

<details><summary>What is Apache Kafka?</summary>

**Answer:** A distributed streaming platform for publishing/subscribing to record streams with fault-tolerant storage.
**Key concepts:**
- **Topics:** Categories of messages
- **Partitions:** Parallelism within topics
- **Consumer Groups:** Load balancing reads
- **Retention:** Configurable message storage

</details>

<details><summary>What is data partitioning?</summary>

**Answer:** Dividing datasets into smaller parts for better performance and parallelism.
**Types:**
- **Range:** By value ranges (e.g., date)
- **Hash:** By hash of key (even distribution)
- **List:** By categorical values (e.g., region)

</details>

<details><summary>How do you handle data skew in Spark?</summary>

1. **Salting:** Add random prefix to skewed keys
2. **Broadcast join:** For small dimension tables
3. **AQE:** Enable Adaptive Query Execution
4. **Repartition:** Redistribute data evenly
5. **Custom partitioner:** Based on data distribution

</details>

## Data Warehousing & ETL

<details><summary>What is a data warehouse vs data lake?</summary>

| Aspect | Data Warehouse | Data Lake |
|--------|---------------|-----------|
| Data Type | Structured | All types |
| Schema | Schema-on-write | Schema-on-read |
| Users | Business analysts | Data scientists |
| Cost | Higher (storage + compute) | Lower (storage cheap) |
| Query Speed | Fast (optimized) | Varies |

</details>

<details><summary>Explain the ETL process.</summary>

- **Extract:** Retrieve data from source systems (APIs, DBs, files)
- **Transform:** Clean, validate, convert, aggregate, enrich
- **Load:** Insert into target system (warehouse, lake)

**ETL vs ELT:**
- ETL: Transform before loading (traditional)
- ELT: Load raw, transform in target (modern, cloud-native)

</details>

<details><summary>What are Slowly Changing Dimensions (SCD)?</summary>

| Type | Behavior | History? | Use Case |
|------|----------|----------|----------|
| SCD-1 | Overwrite | No | Corrections |
| SCD-2 | New row with dates | Full | Customer history |
| SCD-3 | New column | Limited | Previous value only |
| SCD-4 | Separate history table | Full | Performance + history |

</details>

<details><summary>What is a data mart?</summary>

**Answer:** A subset of a data warehouse focused on a specific business line or department (e.g., sales mart, HR mart). Faster queries, simpler for end users.

</details>

<details><summary>Star schema vs Snowflake schema?</summary>

| Aspect | Star | Snowflake |
|--------|------|-----------|
| Dimensions | Denormalized | Normalized |
| Joins | Fewer | More |
| Query Speed | Faster | Slower |
| Storage | Higher | Lower |
| Maintenance | Easier | More complex |

</details>

## Cloud Platforms

<details><summary>Compare AWS, Azure, GCP data services.</summary>

| Service | AWS | Azure | GCP |
|---------|-----|-------|-----|
| Storage | S3 | Blob Storage | Cloud Storage |
| Warehouse | Redshift | Synapse | BigQuery |
| ETL | Glue | Data Factory | Dataflow |
| Streaming | Kinesis | Event Hubs | Pub/Sub |
| Lake | Lake Formation | Data Lake | BigLake |

</details>

<details><summary>What is Amazon S3?</summary>

**Answer:** Object storage service providing scalable, durable storage.
- **Storage classes:** Standard, IA, Glacier
- **Use cases:** Data lakes, backups, static hosting
- **Key features:** 11 9s durability, versioning, lifecycle policies

</details>

<details><summary>What is Databricks?</summary>

**Answer:** Unified analytics platform built on Spark, offering:
- **Lakehouse:** Combines lake + warehouse
- **Delta Lake:** ACID on data lakes
- **Unity Catalog:** Governance and security
- **MLflow:** ML lifecycle management

</details>

<details><summary>What is serverless computing?</summary>

**Answer:** Cloud execution model where provider manages infrastructure.
**Examples:**
- AWS Lambda, Azure Functions, GCP Cloud Functions
- BigQuery, Athena, Synapse Serverless
**Pros:** No infrastructure management, pay-per-use
**Cons:** Cold starts, execution limits, vendor lock-in

</details>

## Python & Spark

<details><summary>Why is Python popular for data engineering?</summary>

- Easy to learn and read
- Rich data libraries (Pandas, NumPy, PySpark)
- Strong community and ecosystem
- Great for prototyping and production
- API integration capabilities

</details>

<details><summary>What is PySpark?</summary>

**Answer:** Python API for Apache Spark enabling distributed data processing using familiar Python syntax.
```python
from pyspark.sql import SparkSession
spark = SparkSession.builder.appName("example").getOrCreate()
df = spark.read.parquet("data.parquet")
result = df.groupBy("category").agg({"amount": "sum"})
```

</details>

<details><summary>Pandas vs PySpark - when to use each?</summary>

| Aspect | Pandas | PySpark |
|--------|--------|---------|
| Data Size | GB (single machine) | TB/PB (distributed) |
| Processing | In-memory | Lazy evaluation |
| API | DataFrame | DataFrame (similar) |
| Use When | < 10GB, local | > 10GB, cluster |

</details>

<details><summary>What is lazy evaluation in Spark?</summary>

**Answer:** Transformations are not executed immediately; Spark builds a DAG (Directed Acyclic Graph) and only executes when an action is called.
- **Transformations (lazy):** map, filter, select, groupBy
- **Actions (trigger):** count, collect, write, show

</details>

<details><summary>Explain Spark's execution model.</summary>

1. **Driver:** Coordinates execution, holds SparkContext
2. **Executors:** Run tasks on worker nodes
3. **Stages:** Groups of tasks between shuffles
4. **Tasks:** Smallest unit of work (one partition)

</details>

## Data Modeling

<details><summary>What is dimensional modeling?</summary>

**Answer:** Technique for organizing data in warehouses for easy querying, using:
- **Fact tables:** Measures/metrics (sales amount, quantity)
- **Dimension tables:** Context (who, what, when, where)

</details>

<details><summary>What is the grain of a fact table?</summary>

**Answer:** The level of detail in each row. Define grain first, then design around it.
- One row per order
- One row per order line item
- One row per customer per day

</details>

<details><summary>Explain Data Vault 2.0.</summary>

**Answer:** Enterprise modeling pattern with:
- **Hubs:** Business keys (e.g., customer_id)
- **Links:** Relationships between hubs
- **Satellites:** Attributes over time

**Pros:** Flexible, auditable, handles change
**Cons:** Complex queries, needs BI layer on top

</details>

<details><summary>What is a surrogate key?</summary>

**Answer:** System-generated unique identifier (auto-increment, UUID) vs natural key (business key like SSN).
**Why use surrogate?**
- Business keys can change
- Enables SCD tracking
- Better performance (integer vs string)

</details>

## Stream Processing

<details><summary>Batch vs stream processing?</summary>

| Aspect | Batch | Streaming |
|--------|-------|-----------|
| Latency | Hours | Seconds/minutes |
| Complexity | Lower | Higher |
| Use Case | Reports, ML training | Alerts, real-time dashboards |
| Tools | Spark batch, dbt | Kafka, Flink, Spark Streaming |

</details>

<details><summary>What is exactly-once processing?</summary>

**Answer:** Guarantee that each record is processed exactly one time, not lost or duplicated.
**How to achieve:**
- Idempotent writes
- Transactional producers/consumers
- Checkpointing

</details>

<details><summary>Explain watermarks in streaming.</summary>

**Answer:** Mechanism to handle late-arriving data by tracking event-time progress.
```python
df.withWatermark("event_time", "10 minutes")
```
"I've seen all events with timestamp <= watermark. Later events may be dropped."

</details>

<details><summary>Lambda vs Kappa architecture?</summary>

| | Lambda | Kappa |
|-|--------|-------|
| Layers | Batch + Speed + Serving | Streaming only |
| Complexity | Two codebases | One codebase |
| Reprocessing | Batch layer | Replay from log |
| Use Case | When batch ≠ stream logic | When unified logic works |

</details>

## Data Quality & Governance

<details><summary>How do you ensure data quality?</summary>

1. **Validation:** Schema checks, type enforcement
2. **Testing:** Unit tests, integration tests
3. **Profiling:** Statistics, distributions
4. **Monitoring:** Anomaly detection, alerts
5. **Governance:** Ownership, documentation
6. **Tools:** Great Expectations, dbt tests, Soda

</details>

<details><summary>What is data lineage?</summary>

**Answer:** Tracking data flow from source to destination, showing transformations at each step.
**Benefits:**
- Impact analysis (what breaks if source changes?)
- Debugging (where did bad data come from?)
- Compliance (prove data handling for audits)

</details>

<details><summary>What is GDPR and how does it affect data engineering?</summary>

**Answer:** EU regulation on data privacy requiring:
- **Right to deletion:** Must be able to delete user data
- **Data minimization:** Only collect what's needed
- **Consent:** Clear opt-in required
- **Breach notification:** Report within 72 hours

**Engineering impact:** Audit logs, deletion pipelines, encryption

</details>

## Scenario-Based Questions

<details><summary>How would you design a real-time fraud detection system?</summary>

**Key points:**
- Kafka for event ingestion
- Feature store (Redis) for real-time lookups
- ML model for scoring
- Rules engine for known patterns
- Sub-100ms latency requirement
- Exactly-once semantics

</details>

<details><summary>How would you migrate a legacy data warehouse to cloud?</summary>

**Key points:**
- Assess current state, dependencies
- Parallel run both systems
- Validate data match (row counts, checksums)
- Incremental migration (table by table)
- Rollback plan
- Documentation and training

</details>

<details><summary>A pipeline fails every Monday - how do you debug?</summary>

**Key points:**
- Check logs from Monday failures
- Look for patterns (time, data volume, sources)
- Consider: weekend batch jobs, data accumulation
- Monday-specific business events
- Resource contention from other Monday jobs

</details>

<details><summary>How do you handle schema evolution?</summary>

**Key points:**
- Use schema-on-read formats (Parquet, Avro)
- Schema registry (Confluent)
- Backward/forward compatibility
- Versioning and migration scripts
- Default values for new fields

</details>

<details><summary>How do you optimize a slow Spark job?</summary>

**Steps:**
1. Check Spark UI for bottlenecks
2. Look for data skew (one task much longer)
3. Check for shuffle spill (disk I/O)
4. Verify partition pruning
5. Consider broadcast joins for small tables
6. Enable AQE (Adaptive Query Execution)
7. Tune memory/executor settings

</details>

## References

- [DataExpert-io/data-engineer-handbook](https://github.com/DataEngineer-io/data-engineer-handbook) - 42k+ stars
- [danielbeach/data-engineering-practice](https://github.com/danielbeach/data-engineering-practice) - Hands-on exercises
- [GeeksforGeeks Data Engineer Questions](https://www.geeksforgeeks.org/data-engineer-interview-questions/)
- [StrataScratch](https://www.stratascratch.com/) - SQL practice
