---
title: "Maximum Subarray Sum, Including the Circular Case"
description: "Kadane's algorithm, plus the max(total − minSubarray) trick for wrap-around arrays."
url: "/interview-prep/practice/algorithms/30-max-subarray/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 30
---

# Maximum Subarray Sum, Including the Circular Case

**Pattern:** Kadane's Algorithm (Best Subarray) · **Difficulty:** Medium · **Asked at:** Amazon, Microsoft, LinkedIn, Apple

**Classic version:** [LeetCode 53](https://leetcode.com/problems/maximum-subarray/) · [LeetCode 918](https://leetcode.com/problems/maximum-sum-circular-subarray/)

## Problem

1. `max_subarray(nums)`: the largest sum of any non-empty contiguous subarray.
2. `max_subarray_circular(nums)`: the same, but the array is circular (a subarray may wrap from the end to the start; each element is used at most once).

## Examples

```text
max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]) → 6     # [4, -1, 2, 1]
max_subarray([-3, -1, -2])                    → -1
max_subarray_circular([5, -3, 5])             → 10    # [5, 5] wrapping
max_subarray_circular([-3, -2, -3])           → -2
```

## Starter code

```python starter
def max_subarray(nums: list[int]) -> int:
    pass


def max_subarray_circular(nums: list[int]) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

At each index, the best subarray ending here either extends the best one ending at the previous index or starts fresh: `cur = max(x, cur + x)`.

</details>

<details><summary>Hint 2</summary>

A wrapping subarray is the whole array minus a non-wrapping middle chunk. Maximising it = total − (minimum subarray). Watch the all-negative case.

</details>

## Where this shows up in data engineering

"Best contiguous period" questions: the most profitable stretch of days, the longest/largest run of positive net flow, the worst drawdown (minimum subarray). The circular version models **daily cycles** (a period can span midnight). Kadane is also a gentle introduction to DP state design: what must you remember about the past?

## Solution

```python solution
def max_subarray(nums):
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)          # extend or restart
        best = max(best, cur)
    return best


def max_subarray_circular(nums):
    total = 0
    cur_max = cur_min = 0
    best_max, best_min = nums[0], nums[0]
    for x in nums:
        cur_max = max(x, cur_max + x)
        best_max = max(best_max, cur_max)
        cur_min = min(x, cur_min + x)
        best_min = min(best_min, cur_min)
        total += x
    # all negative: the "wrap" would be empty, which isn't allowed
    return best_max if best_max < 0 else max(best_max, total - best_min)
```

## Tests

Your solution should pass these:

```python tests
assert max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6
assert max_subarray([1]) == 1
assert max_subarray([5, 4, -1, 7, 8]) == 23
assert max_subarray([-3, -1, -2]) == -1
assert max_subarray_circular([1, -2, 3, -2]) == 3
assert max_subarray_circular([5, -3, 5]) == 10
assert max_subarray_circular([-3, -2, -3]) == -2
assert max_subarray_circular([3, -1, 2, -1]) == 4
```

## Explanation

**Kadane as DP:** `cur` = best sum of a subarray *ending at* the current index. Either extend the previous best (`cur + x`) or start over (`x`); a negative running sum never helps the future. The answer is the max `cur` seen. O(n) time, O(1) space.

**Circular:** an optimal subarray either doesn't wrap (plain Kadane) or wraps, in which case the excluded part is a contiguous middle subarray, and to maximise what's kept you minimise what's excluded: `total - min_subarray`.

**The trap:** if every number is negative, `total - min_subarray` is 0 (an empty selection), which is invalid. Return the plain maximum then.

**Returning the indices:** record `start` when you restart (`x > cur + x`) and update `(best_start, end)` when `best` improves.

## Follow-up questions

<details><summary>Return the start and end index of the best subarray.</summary>

Track a candidate start that resets to `i` whenever `x > cur + x`; when `best` improves, save `(start, i)`. Ties: decide whether you want the earliest or shortest and document it.

</details>

<details><summary>Maximum drawdown of a cumulative P&L series?</summary>

Track the running peak; drawdown at each point = peak − value; answer = max drawdown. Equivalent to the minimum subarray of the daily changes.

</details>
