---
title: "Two Sum: Unsorted (Hash Map) and Sorted (Two Pointers)"
description: "The same question solved two ways: a one-pass hash map for unsorted input and converging pointers for sorted input."
url: "/interview-prep/practice/algorithms/06-two-sum/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 6
---

# Two Sum: Unsorted (Hash Map) and Sorted (Two Pointers)

**Pattern:** Two Pointers (Opposite Ends) · **Difficulty:** Easy · **Asked at:** Google, Amazon, Meta, Apple

**Classic version:** [LeetCode 1](https://leetcode.com/problems/two-sum/) · [LeetCode 167](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/)

## Problem

Implement two functions:

1. `two_sum(nums, target)`: `nums` is **unsorted**. Return the indices `[i, j]` (`i < j`) of the two numbers that add up to `target`. Exactly one answer exists; you may not use the same element twice.
2. `two_sum_sorted(nums, target)`: `nums` is sorted ascending. Return the indices `[i, j]` (`i < j`) of the pair, using **O(1) extra space**.

## Examples

```text
two_sum([2, 7, 11, 15], 9)        → [0, 1]
two_sum([3, 2, 4], 6)             → [1, 2]
two_sum_sorted([2, 7, 11, 15], 9) → [0, 1]
two_sum_sorted([-3, 0, 4, 9], 6)  → [0, 3]
```

## Constraints

- `2 ≤ len(nums) ≤ 10⁵`, values and target fit in 32-bit integers.
- Both functions: O(n) time.

## Starter code

```python starter
def two_sum(nums: list[int], target: int) -> list[int]:
    pass


def two_sum_sorted(nums: list[int], target: int) -> list[int]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Unsorted: for each `x`, the partner you need is `target - x`. Have you already seen it? A dict of value → index answers that in O(1).

</details>

<details><summary>Hint 2</summary>

Sorted: start with the smallest and largest. If their sum is too small, only moving the left pointer right can increase it; if too large, move the right pointer left.

</details>

## Where this shows up in data engineering

"Find matching debit/credit pairs that net to zero", "pair a request with its response", "find two files whose sizes fill a batch exactly". The hash-map version is a **hash join** in miniature (build a table on one side, probe with the other); the sorted version is a **merge join**. Saying that out loud in an interview signals you connect algorithms to query engines.

## Solution

```python solution
def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}                          # value -> index (the "build side")
    for j, x in enumerate(nums):
        i = seen.get(target - x)       # "probe"
        if i is not None:
            return [i, j]
        seen[x] = j
    return []


def two_sum_sorted(nums: list[int], target: int) -> list[int]:
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        s = nums[lo] + nums[hi]
        if s == target:
            return [lo, hi]
        if s < target:
            lo += 1                    # need a bigger sum
        else:
            hi -= 1                    # need a smaller sum
    return []
```

## Tests

Your solution should pass these:

```python tests
assert two_sum([2, 7, 11, 15], 9) == [0, 1]
assert two_sum([3, 2, 4], 6) == [1, 2]
assert two_sum([3, 3], 6) == [0, 1]
assert two_sum([-1, -2, -3, -4, -5], -8) == [2, 4]
assert two_sum_sorted([2, 7, 11, 15], 9) == [0, 1]
assert two_sum_sorted([-3, 0, 4, 9], 6) == [0, 3]
assert two_sum_sorted([1, 2, 3, 4, 4, 9, 56, 90], 8) == [3, 4]
```

## Explanation

**Unsorted, hash map:** one pass; check for the complement *before* inserting the current value, which handles duplicates like `[3, 3]` and prevents using one element twice. O(n) time, O(n) space.

**Sorted, two pointers, and why it's correct:** suppose `nums[lo] + nums[hi] < target`. Pairing `nums[lo]` with anything left of `hi` gives an even smaller sum, so `lo` can't be in any solution with the remaining candidates: discard it (`lo += 1`). The symmetric argument discards `hi` when the sum is too large. Each step eliminates one candidate, so it finishes in O(n) with O(1) space.

**Trade-off to mention:** sorting the unsorted array first costs O(n log n) and loses the original indices (you'd sort `(value, index)` pairs). The hash map is the better default unless memory is tight.

## Follow-up questions

<details><summary>The data doesn't fit in memory (billions of transactions). How do you find pairs summing to zero?</summary>

Partition by key so complements land on the same worker: e.g. bucket by `abs(amount)`, so `x` and `-x` share a partition. Then run the hash-map approach per partition. That's exactly how a distributed hash join works (shuffle both sides by the join key).

</details>

<details><summary>Return all unique pairs, not one.</summary>

Sorted version: on a match, record it, then move both pointers past duplicates of the current values. Hash version: count values with a Counter and handle `x == target - x` (needs count ≥ 2).

</details>
