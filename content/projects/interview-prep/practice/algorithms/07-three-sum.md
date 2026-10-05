---
title: "3Sum: All Unique Triplets Summing to Zero"
description: "Sort, fix one element, then run two pointers on the rest, skipping duplicates at every level."
url: "/interview-prep/practice/algorithms/07-three-sum/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 7
---

# 3Sum: All Unique Triplets Summing to Zero

**Pattern:** Two Pointers (Opposite Ends) · **Difficulty:** Medium · **Asked at:** Meta, Amazon, Microsoft, Adobe

**Classic version:** [LeetCode 15](https://leetcode.com/problems/3sum/)

## Problem

Return all **unique** triplets `[a, b, c]` from `nums` (distinct indices) with `a + b + c == 0`. Each triplet must be sorted ascending, and the list of triplets sorted ascending. No duplicate triplets.

## Examples

```text
three_sum([-1, 0, 1, 2, -1, -4]) → [[-1, -1, 2], [-1, 0, 1]]
three_sum([0, 1, 1])             → []
three_sum([0, 0, 0, 0])          → [[0, 0, 0]]
```

## Constraints

- `3 ≤ len(nums) ≤ 3000`.
- Target: O(n²) time, no set-of-tuples deduplication.

## Starter code

```python starter
def three_sum(nums: list[int]) -> list[list[int]]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Sort. For each index `i`, you need a pair in `nums[i+1:]` that sums to `-nums[i]`: two-sum on a sorted array.

</details>

<details><summary>Hint 2</summary>

Duplicates: skip `i` when `nums[i] == nums[i-1]`; after finding a triplet, move `lo` and `hi` past equal values.

</details>

## Where this shows up in data engineering

Reconciliation problems ("three ledger entries that net to zero") and the general "reduce k-sum to (k-1)-sum" idea. The real interview signal is **deduplication without a set**, which mirrors producing distinct results without a final `DISTINCT` pass.

## Solution

```python solution
def three_sum(nums: list[int]) -> list[list[int]]:
    nums = sorted(nums)
    n, res = len(nums), []
    for i in range(n - 2):
        if nums[i] > 0:                       # smallest value positive: no more zero sums
            break
        if i > 0 and nums[i] == nums[i - 1]:  # same anchor = same triplets
            continue
        lo, hi = i + 1, n - 1
        while lo < hi:
            s = nums[i] + nums[lo] + nums[hi]
            if s < 0:
                lo += 1
            elif s > 0:
                hi -= 1
            else:
                res.append([nums[i], nums[lo], nums[hi]])
                lo += 1
                hi -= 1
                while lo < hi and nums[lo] == nums[lo - 1]:
                    lo += 1
                while lo < hi and nums[hi] == nums[hi + 1]:
                    hi -= 1
    return res
```

## Tests

Your solution should pass these:

```python tests
assert three_sum([-1, 0, 1, 2, -1, -4]) == [[-1, -1, 2], [-1, 0, 1]]
assert three_sum([0, 1, 1]) == []
assert three_sum([0, 0, 0, 0]) == [[0, 0, 0]]
assert three_sum([-2, 0, 1, 1, 2]) == [[-2, 0, 2], [-2, 1, 1]]
assert three_sum([3, -2, 1, 0]) == []
```

## Explanation

**Reduction:** sorting (O(n log n)) makes each inner search a sorted two-sum (O(n)), so O(n²) overall, which is optimal in practice for 3Sum.

**Deduplication, three places:**
1. Skip an anchor equal to the previous anchor: it would produce the same triplets.
2. After a match, advance `lo` past equal values, and
3. retreat `hi` past equal values.

Because the array is sorted and triplets are emitted in anchor order then `lo` order, the output is already sorted.

**Early exit:** once `nums[i] > 0`, all three numbers are positive, so stop.

**Complexity:** O(n²) time, O(1) extra space beyond the output (O(n) if you count the sorted copy).

## Follow-up questions

<details><summary>Generalise to k-sum.</summary>

Recursive: for k > 2, fix one element (skipping duplicates) and recurse with k-1 on the suffix; the base case is sorted two-sum. O(n^(k-1)).

</details>

<details><summary>3Sum closest: return the sum closest to a target.</summary>

Same loop; track the best `|s - target|` and move pointers by the sign of `s - target`. Return early on an exact match.

</details>
