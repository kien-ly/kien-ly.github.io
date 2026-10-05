---
title: "Handle Extreme Data Skew with Salting"
description: "Salting and two-phase aggregation for keys holding most of the data."
url: "/interview-prep/practice/spark/extreme-skew/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 4
---

# Handle Data Skew with Salting

**Difficulty:** Hard  
**Topics:** Data Skew, Salting, Join Optimization  
**Company Tags:** Meta, Airbnb, Pinterest

## Problem Statement

You have an extreme data skew situation where:
- `user_events` table has 1 billion rows
- 0.1% of users (power users) generate 60% of all events
- `users` table has 10 million rows
- The power users have so many events that even broadcast join fails (users table is 15GB)

```sql
-- This query causes OOM errors
SELECT 
    u.user_id,
    u.country,
    COUNT(*) as event_count,
    COUNT(DISTINCT e.event_type) as unique_events
FROM user_events e
JOIN users u ON e.user_id = u.user_id
WHERE e.event_date >= '2024-01-01'
GROUP BY u.user_id, u.country;
```

**Your task:** Implement salting to distribute the skewed keys across partitions.

## Setup

```sql
-- Check the skew
SELECT 
    user_id,
    COUNT(*) as cnt
FROM interview.salting.user_events
GROUP BY user_id
ORDER BY cnt DESC
LIMIT 20;

-- Power users have 10M+ events each!
```

## Constraints

- Cannot use broadcast (users table is 15GB)
- AQE skew handling is disabled for this problem
- Solution must complete in under 60 seconds
- Must produce correct results

## Hints

<details>
<summary>Hint 1</summary>
Salting works by adding a random suffix to the join key (e.g., "user_123" becomes "user_123_7"), spreading heavy keys across partitions.
</details>

<details>
<summary>Hint 2</summary>
If you salt the large table with N buckets, you need to replicate each row in the small table N times with each suffix.
</details>

<details>
<summary>Hint 3</summary>
Use `explode(sequence(0, N-1))` to generate the replicated rows.
</details>

## Solution

<details>
<summary>Click to reveal solution</summary>

```sql
-- Step 1: Define salt factor (more buckets = better distribution but more data)
SET salt_buckets = 20;

-- Step 2: Salt the large table with random suffix
WITH salted_events AS (
    SELECT 
        e.*,
        CONCAT(user_id, '_', CAST(FLOOR(RAND() * 20) AS INT)) as salted_user_id
    FROM user_events e
    WHERE e.event_date >= '2024-01-01'
),

-- Step 3: Explode the small table to match all possible salts
exploded_users AS (
    SELECT 
        u.*,
        CONCAT(user_id, '_', CAST(salt AS INT)) as salted_user_id
    FROM users u
    CROSS JOIN (SELECT explode(sequence(0, 19)) as salt) salts
)

-- Step 4: Join on salted key
SELECT 
    u.user_id,
    u.country,
    COUNT(*) as event_count,
    COUNT(DISTINCT e.event_type) as unique_events
FROM salted_events e
JOIN exploded_users u ON e.salted_user_id = u.salted_user_id
GROUP BY u.user_id, u.country;
```

**How it works:**

1. **Salt the large table:** Each event gets assigned to one of 20 buckets randomly
2. **Explode the small table:** Each user row is duplicated 20 times, once per bucket
3. **Join on salted key:** Now the heavy keys are spread across 20 partitions instead of 1

**Trade-offs:**
- Memory: Small table grows 20x (but distributed, not on one executor)
- Shuffle: Reduced because heavy keys are distributed
- CPU: Slightly more work, but parallelized

**When NOT to use salting:**
- If broadcast join works, use that instead (simpler)
- If AQE is enabled, let it handle skew automatically
- For moderate skew, AQE's skew join optimization is sufficient

</details>

## What Interviewers Look For

1. **Understanding the problem:** Can you explain WHY this causes OOM?
2. **Trade-off analysis:** When to use salting vs broadcast vs AQE?
3. **Implementation correctness:** Many candidates forget to explode the small table
4. **Choosing salt factor:** How do you decide 10 vs 20 vs 100 buckets?
