---
title: "Shortest Burst Reaching a Throughput Target"
description: "Sliding window over positive numbers: the shortest contiguous run whose sum reaches a target."
url: "/interview-prep/practice/algorithms/03-minimum-size-subarray-sum/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 3
---

# Shortest Burst Reaching a Throughput Target

**Pattern:** Sliding Window · **Difficulty:** Medium · **Asked at:** Meta, Amazon, Goldman Sachs

**Classic version:** [LeetCode 209](https://leetcode.com/problems/minimum-size-subarray-sum/)

## Problem

`records[i]` is the number of records a pipeline processed in second `i` (all values are **positive**). Return the length of the shortest run of consecutive seconds whose total is **at least** `target`, or `0` if no run reaches it.

## Examples

```text
shortest_burst([2, 3, 1, 2, 4, 3], 7)  → 2    # [4, 3]
shortest_burst([1, 4, 4], 4)           → 1
shortest_burst([1, 1, 1, 1], 11)       → 0
```

## Constraints

- `1 ≤ len(records) ≤ 10⁵`, `1 ≤ records[i] ≤ 10⁴`, `1 ≤ target ≤ 10⁹`.
- Target: O(n).

## Starter code

```python starter
def shortest_burst(records: list[int], target: int) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Because every value is positive, adding to the window only increases the sum and removing only decreases it. That monotonicity is what makes the window valid.

</details>

<details><summary>Hint 2</summary>

Grow right; while the sum is ≥ target, record the length and shrink from the left.

</details>

## Where this shows up in data engineering

Capacity questions ("how quickly can we hit 1M rows?", "smallest window in which the error budget was exceeded") are this pattern. The follow-up about negative numbers is the real test: it checks whether you know *why* the window works.

## Solution

```python solution
def shortest_burst(records: list[int], target: int) -> int:
    left = total = 0
    best = float("inf")
    for right, x in enumerate(records):
        total += x
        while total >= target:
            best = min(best, right - left + 1)
            total -= records[left]
            left += 1
    return 0 if best == float("inf") else best
```

## Tests

Your solution should pass these:

```python tests
assert shortest_burst([2, 3, 1, 2, 4, 3], 7) == 2
assert shortest_burst([1, 4, 4], 4) == 1
assert shortest_burst([1, 1, 1, 1], 11) == 0
assert shortest_burst([5], 5) == 1
assert shortest_burst([1, 2, 3, 4, 5], 15) == 5
assert shortest_burst([1, 2, 3, 4, 5], 11) == 3
```

## Explanation

**Why it works:** with positive values, if `records[left:right+1]` reaches the target, any longer window starting at `left` also does, so we never need to revisit a `left` once we've moved past it. Both pointers only move forward → O(n).

**Complexity:** O(n) time, O(1) space.

**If values can be negative** (e.g. net flow, corrections), shrinking might *increase* the sum, so the window breaks. Use prefix sums with a monotonic deque (O(n)) or prefix sums with binary search over a sorted structure (O(n log n)).

## Follow-up questions

<details><summary>Values can be negative. What changes?</summary>

The sliding window is no longer valid. Compute prefix sums `P`; for each `j`, find the largest `i < j` with `P[j] - P[i] ≥ target`. Keep a deque of indices with increasing `P`; pop from the front while the condition holds (record length) and from the back while `P[back] ≥ P[j]`. O(n). (Classic: LeetCode 862.)

</details>

<details><summary>Return all minimal-length windows, not just the length.</summary>

Keep `best` and a list; append `(left, right)` when the length equals `best`, reset when strictly smaller.

</details>
