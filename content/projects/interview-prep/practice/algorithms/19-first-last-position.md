---
title: "First and Last Position of a Value (Lower and Upper Bound)"
description: "Two boundary binary searches, the most reusable binary-search template there is."
url: "/interview-prep/practice/algorithms/19-first-last-position/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 19
---

# First and Last Position of a Value (Lower and Upper Bound)

**Pattern:** Binary Search · **Difficulty:** Medium · **Asked at:** Meta, LinkedIn, Amazon, Uber

**Classic version:** [LeetCode 34](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/) · [LeetCode 35](https://leetcode.com/problems/search-insert-position/)

## Problem

`timestamps` is sorted ascending and may contain duplicates. Implement:

1. `lower_bound(a, x)`: the first index `i` with `a[i] >= x` (or `len(a)` if none). This is also the **insert position** for `x`.
2. `search_range(a, x)`: `[first, last]` indices of `x`, or `[-1, -1]` if absent.

Both in O(log n), without `bisect`.

## Examples

```text
lower_bound([1, 3, 5, 6], 5)            → 2
lower_bound([1, 3, 5, 6], 2)            → 1
lower_bound([1, 3, 5, 6], 7)            → 4
search_range([5, 7, 7, 8, 8, 10], 8)    → [3, 4]
search_range([5, 7, 7, 8, 8, 10], 6)    → [-1, -1]
```

## Starter code

```python starter
def lower_bound(a: list[int], x: int) -> int:
    pass


def search_range(a: list[int], x: int) -> list[int]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Use the half-open template `lo, hi = 0, len(a)`, `while lo < hi`, and shrink towards the first index where the condition `a[mid] >= x` becomes true.

</details>

<details><summary>Hint 2</summary>

The last index of `x` is `lower_bound(a, x + 1) - 1` (for integers), or write an upper-bound search with `a[mid] > x`.

</details>

## Where this shows up in data engineering

Boundary search is how **time-range queries hit sorted data**: finding the first row ≥ `start_ts` and the first row > `end_ts` in a sorted file or index, how Parquet min/max stats and Z-order skipping are used, and how a time-based key-value store answers "value as of time t".

## Solution

```python solution
def lower_bound(a, x):
    lo, hi = 0, len(a)               # answer is in [lo, hi]; hi = len(a) means "not found"
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] >= x:
            hi = mid                 # mid might be the answer; keep it
        else:
            lo = mid + 1             # mid is too small; discard it
    return lo


def search_range(a, x):
    first = lower_bound(a, x)
    if first == len(a) or a[first] != x:
        return [-1, -1]
    # upper bound: first index with a[i] > x
    lo, hi = first, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] > x:
            hi = mid
        else:
            lo = mid + 1
    return [first, lo - 1]
```

## Tests

Your solution should pass these:

```python tests
assert lower_bound([1, 3, 5, 6], 5) == 2
assert lower_bound([1, 3, 5, 6], 2) == 1
assert lower_bound([1, 3, 5, 6], 7) == 4
assert lower_bound([1, 3, 5, 6], 0) == 0
assert lower_bound([], 3) == 0
assert search_range([5, 7, 7, 8, 8, 10], 8) == [3, 4]
assert search_range([5, 7, 7, 8, 8, 10], 6) == [-1, -1]
assert search_range([], 0) == [-1, -1]
assert search_range([2, 2, 2], 2) == [0, 2]
```

## Explanation

**The one template to memorise:** search for the *first index where a monotonic predicate becomes true*. With `lo, hi = 0, len(a)` and `while lo < hi`:
- predicate true at `mid` → `hi = mid` (keep `mid`, it may be the first true),
- false → `lo = mid + 1`.

The loop ends with `lo == hi` = the boundary. No `-1` juggling, no infinite loops (because `mid < hi` always).

**Why lower/upper bound beats "find any match then scan":** with many duplicates the scan is O(n); two boundary searches are always O(log n).

**In Python:** `bisect.bisect_left` and `bisect_right` are exactly these. Use them in real code; write them by hand in the interview when asked.

## Follow-up questions

<details><summary>Count occurrences of x.</summary>

`upper_bound(x) - lower_bound(x)`, O(log n).

</details>

<details><summary>How would you find all events between t1 and t2 in a sorted 2 TB file on object storage?</summary>

Binary search over file offsets (or use a sparse index of every k-th key, like Parquet row-group stats or Kafka's offset/time index) to find the first block ≥ t1, then scan sequentially until > t2. Seeks are expensive, so the sparse index reduces random reads to one or two.

</details>
