---
title: "Compact a Sorted Array In Place (Keep at Most k Copies)"
description: "Read/write pointers: remove duplicates from a sorted array in place, keeping at most k copies of each value."
url: "/interview-prep/practice/algorithms/10-dedupe-sorted-in-place/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 10
---

# Compact a Sorted Array In Place (Keep at Most k Copies)

**Pattern:** Two Pointers (Same Direction) · **Difficulty:** Easy · **Asked at:** Meta, Microsoft, Amazon

**Classic version:** [LeetCode 26](https://leetcode.com/problems/remove-duplicates-from-sorted-array/) · [LeetCode 80](https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/)

## Problem

`nums` is sorted ascending. Modify it **in place** so that each distinct value appears at most `k` times, keeping the original relative order, and return the new length `n`. Only `nums[:n]` is checked. Use O(1) extra space.

With `k = 1` this is classic "remove duplicates"; with `k = 2` it's "allow each value twice".

## Examples

```text
nums = [1, 1, 2];                 compact(nums, 1) → 2,  nums[:2] == [1, 2]
nums = [0,0,1,1,1,1,2,3,3];       compact(nums, 2) → 7,  nums[:7] == [0,0,1,1,2,3,3]
```

## Starter code

```python starter
def compact(nums: list[int], k: int) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Keep a `write` pointer: everything before it is the compacted result. A `read` pointer scans every element.

</details>

<details><summary>Hint 2</summary>

Because the array is sorted, `nums[read]` is an allowed copy exactly when `write < k` or `nums[read] != nums[write - k]`.

</details>

## Where this shows up in data engineering

This is the in-memory version of **deduplicating a sorted file or partition in one streaming pass**, which is how sort-based `DISTINCT`, compaction and "keep the last k versions" retention jobs work without a hash table. Mention that it needs O(1) memory regardless of cardinality.

## Solution

```python solution
def compact(nums: list[int], k: int) -> int:
    write = 0
    for x in nums:
        # compare with the element k positions back in the *output*
        if write < k or x != nums[write - k]:
            nums[write] = x
            write += 1
    return write
```

## Tests

Your solution should pass these:

```python tests
a = [1, 1, 2]
assert compact(a, 1) == 2 and a[:2] == [1, 2]
b = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
assert compact(b, 1) == 5 and b[:5] == [0, 1, 2, 3, 4]
c = [0, 0, 1, 1, 1, 1, 2, 3, 3]
assert compact(c, 2) == 7 and c[:7] == [0, 0, 1, 1, 2, 3, 3]
d = []
assert compact(d, 1) == 0
e = [5, 5, 5]
assert compact(e, 3) == 3 and e == [5, 5, 5]
```

## Explanation

**Invariant:** `nums[:write]` is a valid compacted prefix of what has been read so far.

**Why compare with `nums[write - k]`:** in a sorted output, if the element `k` slots back equals `x`, then the last `k` written elements are all `x`, so one more would exceed the limit. Comparing with the *output* (not the input) is what makes it correct for any `k`.

**Complexity:** O(n) time, O(1) space. Each element is read once and written at most once.

## Follow-up questions

<details><summary>The input is not sorted. Keep the first occurrence of each value, O(n).</summary>

Use a `seen` set with the same read/write loop: O(n) time but O(distinct) memory. Or sort first, O(n log n), if memory is the constraint and order doesn't matter.

</details>

<details><summary>Keep the last k versions of each key in a sorted (key, version) log. How does this map?</summary>

Sort by key, version descending, and keep a row when fewer than k rows of the same key have been written. That's `ROW_NUMBER() OVER (PARTITION BY key ORDER BY version DESC) <= k` in SQL.

</details>
