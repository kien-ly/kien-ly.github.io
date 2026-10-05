---
title: "Balance Point of a Partition (Pivot Index)"
description: "One prefix sum and the total: find the first index where the left sum equals the right sum."
url: "/interview-prep/practice/algorithms/18-pivot-index/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 18
---

# Balance Point of a Partition (Pivot Index)

**Pattern:** Prefix Sum · **Difficulty:** Easy · **Asked at:** Amazon, Coupang, Expedia

**Classic version:** [LeetCode 724](https://leetcode.com/problems/find-pivot-index/)

## Problem

`loads[i]` is the number of rows in shard `i`. Return the **leftmost** index `p` such that the sum of loads strictly left of `p` equals the sum strictly right of `p`, or `-1` if none exists.

## Examples

```text
pivot_index([1, 7, 3, 6, 5, 6]) → 3    # 1+7+3 = 11 = 5+6
pivot_index([1, 2, 3])          → -1
pivot_index([2, 1, -1])         → 0    # left sum 0 = right sum 0
```

## Starter code

```python starter
def pivot_index(loads: list[int]) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Right sum = total − left sum − loads[p]. You only need the running left sum and the total.

</details>

## Where this shows up in data engineering

Choosing a split point that balances work is the essence of **range partitioning** (finding split keys so each Spark/DB partition holds similar data volume). Real systems use sampled quantiles, but the prefix-sum reasoning is the same.

## Solution

```python solution
def pivot_index(loads: list[int]) -> int:
    total = sum(loads)
    left = 0
    for i, x in enumerate(loads):
        if left == total - left - x:
            return i
        left += x
    return -1
```

## Tests

Your solution should pass these:

```python tests
assert pivot_index([1, 7, 3, 6, 5, 6]) == 3
assert pivot_index([1, 2, 3]) == -1
assert pivot_index([2, 1, -1]) == 0
assert pivot_index([0]) == 0
assert pivot_index([-1, -1, 0, 1, 1, 0]) == 5
```

## Explanation

**One pass after the total:** check `left == total - left - x` *before* adding `x` to `left`. O(n) time, O(1) space.

**Edge cases:** index 0 has left sum 0; the last index has right sum 0; negative values mean there can be several pivots, so return the first.

## Follow-up questions

<details><summary>Split an array into k contiguous partitions minimising the largest partition sum.</summary>

Binary search on the answer: for a candidate cap, greedily count partitions needed (O(n)); find the smallest cap that needs ≤ k. O(n log(sum)). See the shipping-capacity problem in this track.

</details>
