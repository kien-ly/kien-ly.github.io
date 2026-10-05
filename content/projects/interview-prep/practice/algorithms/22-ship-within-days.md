---
title: "Minimum Throughput to Finish a Backfill on Time"
description: "Binary search on the answer with a greedy feasibility check: smallest daily capacity that ships ordered batches within D days."
url: "/interview-prep/practice/algorithms/22-ship-within-days/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 22
---

# Minimum Throughput to Finish a Backfill on Time

**Pattern:** Binary Search · **Difficulty:** Medium · **Asked at:** Amazon, Google, Databricks

**Classic version:** [LeetCode 1011](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/) · [LeetCode 410](https://leetcode.com/problems/split-array-largest-sum/)

## Problem

A backfill consists of partitions that must be processed **in order**; `sizes[i]` is the size of partition `i` in GB. Each day the cluster processes consecutive partitions up to a daily capacity `C` GB (a partition can't be split across days). Return the minimum integer `C` that finishes all partitions within `days` days.

## Examples

```text
min_capacity([1,2,3,4,5,6,7,8,9,10], 5) → 15   # [1-5] [6,7] [8] [9] [10]
min_capacity([3, 2, 2, 4, 1, 4], 3)     → 6
min_capacity([1, 2, 3, 1, 1], 4)        → 3
```

## Constraints

- `1 ≤ days ≤ len(sizes) ≤ 5·10⁴`, `1 ≤ sizes[i] ≤ 500`.

## Starter code

```python starter
def min_capacity(sizes: list[int], days: int) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Given a capacity `C`, a greedy pass tells you how many days it needs: keep adding partitions to today until the next one doesn't fit.

</details>

<details><summary>Hint 2</summary>

Days needed only goes down as `C` goes up, so binary search `C` in `[max(sizes), sum(sizes)]`.

</details>

## Where this shows up in data engineering

This is literally capacity planning: *"what's the smallest cluster/throughput that completes this ordered backfill by the deadline?"* The same shape answers "minimum Kafka consumer throughput to drain the lag within an hour" and "the smallest file-size target that keeps the number of output files ≤ N".

## Solution

```python solution
def min_capacity(sizes: list[int], days: int) -> int:
    def days_needed(cap: int) -> int:
        used, load = 1, 0
        for s in sizes:
            if load + s > cap:          # start a new day
                used += 1
                load = 0
            load += s
        return used

    lo, hi = max(sizes), sum(sizes)     # below max(sizes) a partition never fits
    while lo < hi:
        mid = (lo + hi) // 2
        if days_needed(mid) <= days:
            hi = mid                    # feasible: try smaller
        else:
            lo = mid + 1
    return lo
```

## Tests

Your solution should pass these:

```python tests
assert min_capacity([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5) == 15
assert min_capacity([3, 2, 2, 4, 1, 4], 3) == 6
assert min_capacity([1, 2, 3, 1, 1], 4) == 3
assert min_capacity([10], 1) == 10
assert min_capacity([1, 1, 1, 1], 4) == 1
assert min_capacity([7, 2, 5, 10, 8], 2) == 18
```

## Explanation

**Two ideas combined:**
1. *Feasibility is greedy:* packing each day as full as possible never needs more days than any other packing (exchange argument). O(n) per check.
2. *Feasibility is monotonic in C:* if C works, C+1 works. So binary search for the first feasible C.

**Bounds:** `lo = max(sizes)` (the largest partition must fit in a day), `hi = sum(sizes)` (one day does everything).

**Complexity:** O(n · log(sum − max)).

**Recognising the pattern:** the question asks for "the minimum X such that something is possible", and checking a given X is easy. That combination almost always means binary search on the answer.

## Follow-up questions

<details><summary>Partitions can be processed in any order. Is it still easy?</summary>

No. It becomes bin packing (NP-hard). Use heuristics like first-fit decreasing (sort descending, put each item in the first day it fits), which is within ~11/9 of optimal, and say why ordering mattered.

</details>

<details><summary>Each day also has a fixed startup overhead of o GB-equivalent. Adjust.</summary>

In the feasibility check, a day's usable capacity becomes `C - o` (and the lower bound becomes `max(sizes) + o`). The binary search is unchanged.

</details>
