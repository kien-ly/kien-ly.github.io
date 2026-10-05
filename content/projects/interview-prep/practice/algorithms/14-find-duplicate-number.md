---
title: "Find the Duplicate Number Without Modifying the Array"
description: "Treat values as next-pointers and use Floyd to find the cycle entry: O(n) time, O(1) space, read-only."
url: "/interview-prep/practice/algorithms/14-find-duplicate-number/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 14
---

# Find the Duplicate Number Without Modifying the Array

**Pattern:** Fast & Slow Pointers (Floyd's Cycle Detection) · **Difficulty:** Medium · **Asked at:** Amazon, Microsoft, Google

**Classic version:** [LeetCode 287](https://leetcode.com/problems/find-the-duplicate-number/)

## Problem

`nums` has `n + 1` integers, each in the range `[1, n]`, so at least one value repeats. Exactly one value is repeated (possibly more than twice). Return it **without modifying `nums`** and using O(1) extra space.

## Examples

```text
find_duplicate([1, 3, 4, 2, 2]) → 2
find_duplicate([3, 1, 3, 4, 2]) → 3
find_duplicate([2, 2, 2, 2, 2]) → 2
```

## Starter code

```python starter
def find_duplicate(nums: list[int]) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Read `i → nums[i]` as a linked list starting at index 0. Index 0 is never a target (values are ≥ 1), so the walk can't loop back to the start. Some index is pointed to twice: that's a cycle entry.

</details>

<details><summary>Hint 2</summary>

The duplicated value is exactly the node where the cycle begins. Reuse the two phases from Linked List Cycle II.

</details>

## Where this shows up in data engineering

A favourite for testing whether you can **map an unfamiliar problem onto a known algorithm**. Also a good place to discuss constraints: with a mutable array you'd mark visited indices by negating values; with memory you'd use a set; and with read-only, O(1) memory, Floyd.

## Solution

```python solution
def find_duplicate(nums: list[int]) -> int:
    slow = fast = nums[0]
    while True:                         # phase 1: meet inside the cycle
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast:
            break
    p = nums[0]                         # phase 2: walk to the cycle entry
    while p != slow:
        p, slow = nums[p], nums[slow]
    return p
```

## Tests

Your solution should pass these:

```python tests
assert find_duplicate([1, 3, 4, 2, 2]) == 2
assert find_duplicate([3, 1, 3, 4, 2]) == 3
assert find_duplicate([2, 2, 2, 2, 2]) == 2
assert find_duplicate([1, 1]) == 1
a = [1, 4, 4, 2, 4]
assert find_duplicate(a) == 4 and a == [1, 4, 4, 2, 4]
```

## Explanation

**The mapping:** nodes are indices `0..n`, edges are `i → nums[i]`. Values are in `[1, n]`, so the walk from 0 stays inside `1..n` forever and must cycle. The duplicated value `d` has two incoming edges (from two indices holding `d`): one from the tail leading into the cycle and one from inside it, so `d` is the cycle's entry node.

**Then Floyd's two phases** find the entry. O(n) time, O(1) space, read-only.

**Other approaches and why they're excluded:** sorting (modifies or copies), set (O(n) memory), sum formula (fails when the value repeats more than twice), and binary search on the value range counting `≤ mid` (O(n log n), read-only, O(1); a good second answer).

## Follow-up questions

<details><summary>Give the binary-search-on-answer solution.</summary>

For `mid` in `[1, n]`, count elements `≤ mid`. If the count > mid, the duplicate is in `[1, mid]` (pigeonhole), else in `[mid+1, n]`. O(n log n) time, O(1) space, read-only.

</details>
