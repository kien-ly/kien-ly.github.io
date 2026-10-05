---
title: "Search a Rotated Sorted Array (and Find Its Minimum)"
description: "Binary search when the array is sorted in two pieces: decide which half is sorted, then which half to keep."
url: "/interview-prep/practice/algorithms/21-rotated-sorted-search/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 21
---

# Search a Rotated Sorted Array (and Find Its Minimum)

**Pattern:** Binary Search · **Difficulty:** Medium · **Asked at:** Meta, Amazon, Microsoft, LinkedIn

**Classic version:** [LeetCode 33](https://leetcode.com/problems/search-in-rotated-sorted-array/) · [LeetCode 153](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/)

## Problem

A sorted array of **distinct** integers was rotated at an unknown pivot (e.g. `[0,1,2,4,5,6,7]` → `[4,5,6,7,0,1,2]`). Implement:

1. `find_min(a)`: the smallest element.
2. `search(a, target)`: the index of `target`, or `-1`.

Both in O(log n).

## Examples

```text
find_min([4, 5, 6, 7, 0, 1, 2])   → 0
find_min([11, 13, 15, 17])        → 11
search([4, 5, 6, 7, 0, 1, 2], 0)  → 4
search([4, 5, 6, 7, 0, 1, 2], 3)  → -1
```

## Starter code

```python starter
def find_min(a: list[int]) -> int:
    pass


def search(a: list[int], target: int) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Minimum: compare `a[mid]` with `a[hi]`. If `a[mid] > a[hi]`, the drop (and the minimum) is to the right of mid.

</details>

<details><summary>Hint 2</summary>

Search: at least one half of `[lo, mid]` / `[mid, hi]` is sorted. Check whether the target lies inside the sorted half's range; if so go there, otherwise go to the other half.

</details>

## Where this shows up in data engineering

Rotated sequences show up as **log files or ring buffers that wrapped around**, partitions keyed by a hash ring, or a day's data starting mid-sequence. The skill being tested is keeping binary search's invariant when the data is only *piecewise* sorted.

## Solution

```python solution
def find_min(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] > a[hi]:
            lo = mid + 1          # the drop is right of mid
        else:
            hi = mid              # mid could be the minimum
    return a[lo]


def search(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == target:
            return mid
        if a[lo] <= a[mid]:                      # left half is sorted
            if a[lo] <= target < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                                    # right half is sorted
            if a[mid] < target <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1
```

## Tests

Your solution should pass these:

```python tests
assert find_min([4, 5, 6, 7, 0, 1, 2]) == 0
assert find_min([3, 4, 5, 1, 2]) == 1
assert find_min([11, 13, 15, 17]) == 11
assert find_min([2, 1]) == 1
assert search([4, 5, 6, 7, 0, 1, 2], 0) == 4
assert search([4, 5, 6, 7, 0, 1, 2], 3) == -1
assert search([1], 0) == -1
assert search([1], 1) == 0
assert search([5, 1, 3], 5) == 0
assert search([3, 1], 1) == 1
```

## Explanation

**Minimum:** compare with `a[hi]`, not `a[lo]`. If `a[mid] > a[hi]` the rotation point is strictly right of mid; otherwise `[mid, hi]` is sorted and the minimum is at `mid` or to its left. Converges in O(log n).

**Search:** one of the halves is always sorted (`a[lo] <= a[mid]` tells you which). If the target is within that sorted half's bounds, recurse there; else the other half. Note the `<=` in `a[lo] <= a[mid]`: when `lo == mid` the "left half" is a single element and counts as sorted.

**Alternative:** find the rotation index with `find_min` logic, then run a normal binary search on the correct side. Two passes, still O(log n), easier to get right under pressure.

**With duplicates** (LeetCode 81/154) the worst case becomes O(n): when `a[lo] == a[mid] == a[hi]` you can't tell which side is sorted, so shrink both ends by one.

## Follow-up questions

<details><summary>What changes if duplicates are allowed?</summary>

When `a[mid] == a[hi]` in find_min, you can only do `hi -= 1`. Worst case O(n) (e.g. all equal except one). State it rather than claiming O(log n).

</details>
