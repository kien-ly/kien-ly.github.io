---
title: "Python Coding Practice for Data Engineers"
description: "34 problems with a data engineering flavour, each with starter code, a tested solution and follow-ups."
url: "/interview-prep/practice/python/"
hiddenInHomeList: true
showToc: true
weight: 0
---

# Python Coding Practice for Data Engineers

Every solution is executed against its tests by `scripts/build.py`. Run them yourself in the browser with the [web platform](/interview-prep/platform/) (Pyodide), or locally: copy the starter, implement, paste the tests.

Read first: [The data engineering coding round](/interview-prep/learn/python/01-de-coding-round/) · [Algorithm patterns](/interview-prep/learn/python/02-algorithm-patterns/) · Classic DSA problems by pattern: [Algorithms track](/interview-prep/practice/algorithms/)

## Easy

| # | Problem | Topics |
|---|---|---|
| 01 | [Top-K Most Frequent Search Terms](/interview-prep/practice/python/01-word-frequency-top-k/) | hash-map, heap, counting |
| 02 | [Flatten Nested JSON Records](/interview-prep/practice/python/02-flatten-nested-json/) | recursion, json, schema |
| 03 | [Deduplicate Records Keeping the Latest Version](/interview-prep/practice/python/03-dedupe-keep-latest/) | hash-map, deduplication, cdc |
| 04 | [Parse Web Server Logs into Hourly Status Counts](/interview-prep/practice/python/04-parse-access-logs/) | parsing, regex, aggregation |
| 05 | [Merge Two Sorted Event Streams Lazily](/interview-prep/practice/python/05-merge-sorted-streams/) | generators, two-pointers, streaming |
| 06 | [Implement GROUP BY with Multiple Aggregates](/interview-prep/practice/python/06-group-by-aggregate/) | hash-map, aggregation, one-pass |
| 07 | [Validate Records Against a Schema](/interview-prep/practice/python/07-validate-records/) | validation, data-quality, schema |
| 22 | [Batch a Stream into Fixed-Size Chunks](/interview-prep/practice/python/22-chunked-batches/) | generators, itertools, streaming |

## Medium

| # | Problem | Topics |
|---|---|---|
| 08 | [Merge Overlapping Time Intervals](/interview-prep/practice/python/08-merge-intervals/) | intervals, sorting, sweep |
| 09 | [Peak Concurrent Sessions (Meeting Rooms II)](/interview-prep/practice/python/09-peak-concurrency/) | intervals, heap, sweep-line |
| 10 | [K-Way Merge of Sorted Partition Files](/interview-prep/practice/python/10-k-way-merge/) | heap, merge, streaming |
| 11 | [Sessionize User Events](/interview-prep/practice/python/11-sessionize-events/) | sliding-window, grouping, sessionization |
| 12 | [Moving Average from a Data Stream](/interview-prep/practice/python/12-moving-average-stream/) | sliding-window, deque, design |
| 13 | [LRU Cache for Dimension Lookups](/interview-prep/practice/python/13-lru-cache/) | design, hash-map, linked-list |
| 14 | [Point-in-Time Lookup (As-Of Join)](/interview-prep/practice/python/14-time-based-kv-store/) | binary-search, as-of-join, versioning |
| 15 | [Order Pipeline Tasks in a DAG (Topological Sort)](/interview-prep/practice/python/15-dag-task-order/) | graphs, topological-sort, orchestration |
| 16 | [Sliding-Window Rate Limiter for an Ingestion API](/interview-prep/practice/python/16-rate-limiter/) | sliding-window, deque, design |
| 17 | [Longest Streak of Consecutive Days (O(n))](/interview-prep/practice/python/17-longest-consecutive-days/) | hash-set, streaks, arrays |
| 18 | [Count Time Windows with Exact Revenue Target](/interview-prep/practice/python/18-subarray-sum-target/) | prefix-sum, hash-map, arrays |
| 19 | [Running Median of a Latency Stream](/interview-prep/practice/python/19-running-median/) | heap, streaming, percentiles |
| 20 | [Infer a Schema from JSON Records](/interview-prep/practice/python/20-schema-inference/) | schema, json, type-system |
| 21 | [Apply a Daily Snapshot to an SCD Type 2 Dimension](/interview-prep/practice/python/21-scd2-merge/) | scd2, data-modeling, merge |
| 23 | [Retry Decorator with Exponential Backoff and Jitter](/interview-prep/practice/python/23-retry-with-backoff/) | decorators, reliability, error-handling |
| 28 | [Metrics Decorator: Count Calls, Failures and Latency](/interview-prep/practice/python/28-timed-metrics-decorator/) | decorators, closures, observability |
| 29 | [Config-Driven Connector Framework (ABC + Registry)](/interview-prep/practice/python/29-connector-registry/) | oop, abc, decorators, design |
| 30 | [Atomic Partition Writer (Context Manager)](/interview-prep/practice/python/30-atomic-writer-context-manager/) | context-managers, idempotency, oop |
| 31 | [Paginated API Reader With Rate Limits (Generator)](/interview-prep/practice/python/31-paginated-api-generator/) | generators, pagination, retries |
| 33 | [Usage Billing With Historical (Effective-Dated) Rates](/interview-prep/practice/python/33-billing-historical-rates/) | binary-search, scd2, billing |
| 34 | [Render Parent/Child Records as an Indented Tree](/interview-prep/practice/python/34-render-task-tree/) | trees, dfs, hierarchies |

## Hard

| # | Problem | Topics |
|---|---|---|
| 24 | [Uniform Sample from a Stream of Unknown Length](/interview-prep/practice/python/24-reservoir-sampling/) | sampling, streaming, probability |
| 25 | [Consistent Hashing Ring for Sharding](/interview-prep/practice/python/25-consistent-hashing/) | hashing, distributed-systems, bisect |
| 26 | [Bloom Filter for Streaming Deduplication](/interview-prep/practice/python/26-bloom-filter/) | probabilistic, hashing, deduplication |
| 27 | [Sort Data Larger Than Memory (External Merge Sort)](/interview-prep/practice/python/27-external-sort/) | external-sort, heap, generators |
| 32 | [Usage Credit Ledger With Expiring Grants](/interview-prep/practice/python/32-credit-ledger-expiring-grants/) | heap, ledger, design |
