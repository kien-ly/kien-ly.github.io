---
title: "Maximum Product Subarray"
description: "Kadane with two states: track both the max and min product ending here, because a negative flips them."
url: "/interview-prep/practice/algorithms/31-max-product-subarray/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 31
---

# Maximum Product Subarray

**Pattern:** Kadane's Algorithm (Best Subarray) · **Difficulty:** Medium · **Asked at:** Amazon, LinkedIn, Google

**Classic version:** [LeetCode 152](https://leetcode.com/problems/maximum-product-subarray/)

## Problem

Return the largest product of any non-empty contiguous subarray of integers (which may include zeros and negatives). The answer fits in a 64-bit integer.

## Examples

```text
max_product([2, 3, -2, 4])   → 6
max_product([-2, 0, -1])     → 0
max_product([-2, 3, -4])     → 24
```

## Starter code

```python starter
def max_product(nums: list[int]) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Multiplying by a negative turns the smallest product into the largest. Keep both the max and min product of a subarray ending at the current index.

</details>

<details><summary>Hint 2</summary>

At each `x`, the new max is the largest of `x`, `x * old_max`, `x * old_min` (similarly for the min).

</details>

## Where this shows up in data engineering

Compounding: products of growth factors (daily retention multipliers, cumulative conversion through funnel stages) behave like this. Using logarithms turns products into sums, and the sign handling is the part interviewers want to see.

## Solution

```python solution
def max_product(nums: list[int]) -> int:
    hi = lo = best = nums[0]
    for x in nums[1:]:
        candidates = (x, x * hi, x * lo)
        hi, lo = max(candidates), min(candidates)
        best = max(best, hi)
    return best
```

## Tests

Your solution should pass these:

```python tests
assert max_product([2, 3, -2, 4]) == 6
assert max_product([-2, 0, -1]) == 0
assert max_product([-2, 3, -4]) == 24
assert max_product([-2]) == -2
assert max_product([0, 2]) == 2
assert max_product([-1, -2, -3, 0]) == 6
```

## Explanation

**Two-state Kadane:** `hi`/`lo` = max/min product of a subarray ending here. A negative `x` swaps their roles, a zero resets both to 0 (and `x` alone restarts the run after it). Computing both from the *old* values (via the tuple) avoids the classic bug of updating `hi` and then using the new `hi` for `lo`.

**Complexity:** O(n) time, O(1) space.

**Alternative:** split on zeros; in each zero-free segment the answer is the max of prefix and suffix products (an even count of negatives uses the whole segment). Same complexity, different reasoning, good to mention.

## Follow-up questions

<details><summary>Why doesn't plain Kadane work?</summary>

Kadane relies on 'a smaller running value is never useful later'. With products, a very negative running product can become the largest after one more negative, so you must keep the minimum too.

</details>
