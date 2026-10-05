---
title: "Find the Missing ID (Sum, XOR and Their Trade-Offs)"
description: "Arithmetic-series sum or XOR cancellation to find the one missing value in 0..n in O(1) space."
url: "/interview-prep/practice/algorithms/36-missing-number/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 36
---

# Find the Missing ID (Sum, XOR and Their Trade-Offs)

**Pattern:** Hashing, Stacks and Bit Tricks (Must-Know Classics) · **Difficulty:** Easy · **Asked at:** Amazon, Microsoft, Apple

**Classic version:** [LeetCode 268](https://leetcode.com/problems/missing-number/)

## Problem

A batch should contain every sequence number from `0` to `n` exactly once, but one is missing. `ids` holds the `n` numbers received, in any order. Return the missing one in O(n) time and O(1) extra space.

## Examples

```text
missing_id([3, 0, 1])                    → 2
missing_id([0, 1])                       → 2
missing_id([9, 6, 4, 2, 3, 5, 7, 0, 1])  → 8
```

## Starter code

```python starter
def missing_id(ids: list[int]) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

The sum of 0..n is `n(n+1)/2`. What's left after subtracting the received sum?

</details>

<details><summary>Hint 2</summary>

XOR alternative: `x ^ x = 0`, so XOR-ing all indices 0..n with all values leaves only the missing one.

</details>

## Where this shows up in data engineering

**Gap detection in sequence numbers** is a real data quality check: missing Kafka offsets, dropped CDC log sequence numbers, missing daily partitions. At scale you'd use `LAG()` to find gaps (several may be missing), but the O(1)-memory sum/XOR checksum idea is exactly how reconciliation jobs compare counts and checksums between source and target without moving the data.

## Solution

```python solution
def missing_id(ids: list[int]) -> int:
    n = len(ids)
    missing = n                      # start with n, then XOR every index and value
    for i, x in enumerate(ids):
        missing ^= i ^ x
    return missing
```

## Tests

Your solution should pass these:

```python tests
assert missing_id([3, 0, 1]) == 2
assert missing_id([0, 1]) == 2
assert missing_id([9, 6, 4, 2, 3, 5, 7, 0, 1]) == 8
assert missing_id([1]) == 0
assert missing_id([0]) == 1
```

## Explanation

**Sum:** `n(n+1)/2 - sum(ids)`. One line, O(n), O(1). In fixed-width languages the sum can overflow; Python ints can't.

**XOR:** every present value cancels with its matching index; the missing value has no partner and survives. No overflow risk, same complexity.

**Set difference / sorting:** O(n) space or O(n log n) time. Fine as first answers.

**Two numbers missing?** Sum and sum of squares give two equations; or XOR everything to get `a ^ b`, split numbers by any set bit of that, and XOR each group.

## Follow-up questions

<details><summary>Several IDs may be missing from a table of 2 billion events. SQL?</summary>

`SELECT id + 1 AS gap_start, next_id - 1 AS gap_end FROM (SELECT id, LEAD(id) OVER (ORDER BY id) AS next_id FROM t) WHERE next_id > id + 1`. Partition by producer/partition id to keep it parallel.

</details>
