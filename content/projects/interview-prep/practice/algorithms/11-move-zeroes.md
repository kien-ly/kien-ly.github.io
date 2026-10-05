---
title: "Move Zeroes and Remove Element (Stable Partition)"
description: "Same-direction pointers for stable in-place partitioning: push zeroes to the end, or drop every occurrence of a value."
url: "/interview-prep/practice/algorithms/11-move-zeroes/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 11
---

# Move Zeroes and Remove Element (Stable Partition)

**Pattern:** Two Pointers (Same Direction) · **Difficulty:** Easy · **Asked at:** Meta, Bloomberg, Apple

**Classic version:** [LeetCode 283](https://leetcode.com/problems/move-zeroes/) · [LeetCode 27](https://leetcode.com/problems/remove-element/)

## Problem

1. `move_zeroes(nums)`: move all `0`s to the end **in place**, keeping the relative order of non-zero elements. Return nothing.
2. `remove_value(nums, val)`: remove every occurrence of `val` in place and return the new length `n`; `nums[:n]` must keep the remaining elements in their original order.

## Examples

```text
nums = [0, 1, 0, 3, 12]; move_zeroes(nums)       → nums == [1, 3, 12, 0, 0]
nums = [3, 2, 2, 3];     remove_value(nums, 3)   → 2, nums[:2] == [2, 2]
```

## Starter code

```python starter
def move_zeroes(nums: list[int]) -> None:
    pass


def remove_value(nums: list[int], val: int) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Both are the same loop: a `write` pointer for kept elements and a `read` pointer over everything.

</details>

<details><summary>Hint 2</summary>

For move_zeroes, swapping `nums[write]` and `nums[read]` (instead of overwriting) leaves the zeroes at the end automatically.

</details>

## Where this shows up in data engineering

Stable partitioning is the in-memory core of **filter pushdown** and of splitting a batch into valid/quarantine rows while keeping order (important when order encodes event time).

## Solution

```python solution
def move_zeroes(nums: list[int]) -> None:
    write = 0
    for read in range(len(nums)):
        if nums[read] != 0:
            nums[write], nums[read] = nums[read], nums[write]
            write += 1


def remove_value(nums: list[int], val: int) -> int:
    write = 0
    for x in nums:
        if x != val:
            nums[write] = x
            write += 1
    return write
```

## Tests

Your solution should pass these:

```python tests
a = [0, 1, 0, 3, 12]
move_zeroes(a)
assert a == [1, 3, 12, 0, 0]
b = [0]
move_zeroes(b)
assert b == [0]
c = [1, 2, 3]
move_zeroes(c)
assert c == [1, 2, 3]
d = [3, 2, 2, 3]
assert remove_value(d, 3) == 2 and d[:2] == [2, 2]
e = [0, 1, 2, 2, 3, 0, 4, 2]
assert remove_value(e, 2) == 5 and e[:5] == [0, 1, 3, 0, 4]
```

## Explanation

**One template, two uses:** `nums[:write]` holds the kept elements in order. Overwriting is enough when the tail doesn't matter (`remove_value`); swapping keeps every element, so the rejected ones collect at the end (`move_zeroes`).

**Complexity:** O(n) time, O(1) space. Minimum writes: the swap version does a swap even when `write == read`; guard with `if write != read` if writes are expensive (e.g. flash storage).

**Unstable alternative:** when order doesn't matter, swap the rejected element with the last element and shrink the array. Fewer writes when rejects are rare.

## Follow-up questions

<details><summary>Partition into three groups in one pass (e.g. negative, zero, positive).</summary>

Dutch national flag: pointers `lo`, `mid`, `hi`; swap negatives to `lo`, positives to `hi`, advance `mid` over zeroes. One pass, O(1) space, but not stable.

</details>
