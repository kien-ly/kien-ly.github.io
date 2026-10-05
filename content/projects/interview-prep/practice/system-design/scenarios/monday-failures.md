---
title: "Debugging Pipeline Failures That Only Happen on Mondays"
description: "A structured debugging walkthrough for an intermittent pipeline failure."
url: "/interview-prep/practice/system-design/scenarios/monday-failures/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 23
---

# Debugging Pipeline Failures on Mondays Only

**Difficulty:** Medium  
**Topics:** Debugging, System Design, Operational Excellence  
**Company Tags:** Any Company with Data Pipelines

## Problem Statement

A production data pipeline that has been running successfully for 6 months suddenly starts failing every Monday morning. It runs fine Tuesday through Sunday.

**Your task:** Walk through your debugging approach. What would you check? How would you identify the root cause?

## Context

The pipeline:
- Runs daily at 6 AM
- Processes sales data from the previous day
- Takes about 2 hours normally
- Started failing 3 weeks ago (Mondays only)
- Error: OOM (Out of Memory) in Spark executors

## Hints

<details>
<summary>Hint 1: Pattern Recognition</summary>
Monday = after weekend. What's different about weekend data?
</details>

<details>
<summary>Hint 2: Data Volume</summary>
Mondays process Saturday + Sunday data. But wait - it's supposed to be daily...
</details>

<details>
<summary>Hint 3: Recent Changes</summary>
"Worked for 6 months, broke 3 weeks ago" - what changed? Code? Data? Infrastructure?
</details>

## Solution

<details>
<summary>Click to reveal solution</summary>

### Debugging Framework: The 5 Whys + Timeline

**Step 1: Establish the Facts**

```
Questions to answer:
1. When exactly did it start failing? (3 weeks ago)
2. What's the error? (OOM)
3. What changed around that time? (Need to investigate)
4. Is the failure consistent? (Yes, every Monday)
5. Does the pipeline recover on its own? (No, needs manual restart)
```

**Step 2: Pattern Analysis**

```
Week Pattern:
┌────┬────┬────┬────┬────┬────┬────┐
│Mon │Tue │Wed │Thu │Fri │Sat │Sun │
├────┼────┼────┼────┼────┼────┼────┤
│ ❌ │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │
└────┴────┴────┴────┴────┴────┴────┘

Monday specifics:
- Processes Sunday's data
- OR does it process weekend backlog?
- Weekend = different traffic patterns?
```

**Step 3: Check Data Volume**

```sql
-- Compare data volume by day of week
SELECT 
    DAYOFWEEK(event_date) as dow,
    DAYNAME(event_date) as day_name,
    COUNT(*) as record_count,
    SUM(data_size_bytes) / 1e9 as data_size_gb
FROM source_table
WHERE event_date >= '2024-01-01'
GROUP BY 1, 2
ORDER BY 1;

-- Results might show:
-- dow | day_name  | record_count | data_size_gb
-- ----|-----------|--------------|-------------
--   1 | Sunday    | 5,000,000    | 12.5
--   2 | Monday    | 8,000,000    | 20.0  ← Spike!
--   3 | Tuesday   | 7,500,000    | 18.5
```

**Step 4: Check for Backlog Processing**

```sql
-- Is Monday processing more than one day?
SELECT 
    run_date,
    MIN(event_date) as earliest_event,
    MAX(event_date) as latest_event,
    DATEDIFF(MAX(event_date), MIN(event_date)) + 1 as days_processed
FROM pipeline_audit_log
WHERE run_date >= '2024-01-01'
ORDER BY run_date DESC
LIMIT 30;

-- Found: Monday runs process Sat + Sun + Mon data!
```

**Step 5: Find the Root Cause**

```
Timeline investigation:
├── 6 months ago: Pipeline deployed, worked fine
├── 3 weeks ago: Started failing Mondays
│   └── What changed?
│       ├── Code changes? Check git log
│       ├── Infrastructure changes? Check DevOps tickets
│       ├── Data volume increase? Check metrics
│       └── Upstream changes? Check dependencies
```

**The Root Cause (example scenarios):**

**Scenario A: Backlog Bug**

```python
# Bug introduced 3 weeks ago:
# Old code (correct):
process_date = execution_date - timedelta(days=1)

# New code (buggy):
process_date = get_last_business_day(execution_date)
# On Monday, this returns Friday, causing Sat/Sun/Mon to accumulate!
```

**Scenario B: Data Growth + Weekend Spike**

```
3 weeks ago: Marketing launched weekend promotions
Weekend traffic increased 3x
Monday jobs now process 3x more data
Memory wasn't scaled accordingly
```

**Scenario C: Infrastructure Change**

```
3 weeks ago: Cloud cost optimization
Spot instances replaced on-demand for weekend jobs
Monday jobs: on-demand (but undersized)
Cluster config wasn't updated for larger weekend data
```

**Step 6: Resolution Approach**

```python
# Fix depends on root cause:

# If backlog bug:
# Revert the date logic change

# If data growth:
# Scale resources based on day of week
spark_config = {
    "monday": {"executor_memory": "16g", "num_executors": 20},
    "other": {"executor_memory": "8g", "num_executors": 10}
}

# If infrastructure:
# Update cluster config, add auto-scaling
```

### General Debugging Checklist for "It Used to Work"

```
1. TIMELINE
   □ When exactly did it break?
   □ What changed around that time?
   □ Code deployments?
   □ Infrastructure changes?
   □ Upstream data source changes?

2. PATTERN
   □ Time-based (specific hour/day/month)?
   □ Data-based (specific partition/source)?
   □ Load-based (volume threshold)?

3. DATA
   □ Volume changes?
   □ Schema changes?
   □ Data quality issues?
   □ New edge cases?

4. RESOURCES
   □ Memory/CPU utilization before failure?
   □ Cluster sizing changes?
   □ Quota or limit changes?

5. DEPENDENCIES
   □ Upstream system changes?
   □ Library/package updates?
   □ API changes?
```

### Prevention

```yaml
# Monitoring to catch this earlier:
alerts:
  - name: data_volume_anomaly
    condition: daily_volume > 2 * rolling_7_day_avg
    action: warn_before_next_run

  - name: processing_time_increase
    condition: run_time > 1.5 * historical_avg
    action: alert_team

  - name: monday_health_check
    schedule: "0 5 * * 1"  # 5 AM every Monday
    check: verify_weekend_data_ready
```

</details>

## Follow-up Questions

1. **How do you prevent this in the future?** Monitoring, alerts on anomalies
2. **How do you handle the backlog?** Reprocess missed data, validate results
3. **How do you communicate to stakeholders?** Incident report, SLA impact

## What Interviewers Look For

1. **Structured approach:** Not random guessing
2. **Timeline analysis:** First question should be "what changed?"
3. **Pattern recognition:** Day-of-week = weekend-related
4. **Root cause focus:** Don't just fix symptoms
5. **Prevention mindset:** How to avoid next time
