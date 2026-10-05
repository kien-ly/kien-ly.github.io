---
title: "Kth Largest Element: Heap vs Quickselect"
description: "Size-k min-heap for streams (O(n log k)) and quickselect for arrays (O(n) average), and when to use each."
url: "/interview-prep/practice/algorithms/23-kth-largest/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 23
---

# Kth Largest Element: Heap vs Quickselect

**Pattern:** Heap (Top-K and Greedy Merging) · **Difficulty:** Medium · **Asked at:** Meta, Amazon, LinkedIn, Spotify

**Classic version:** [LeetCode 215](https://leetcode.com/problems/kth-largest-element-in-an-array/) · [LeetCode 703](https://leetcode.com/problems/kth-largest-element-in-a-stream/)

## Problem

1. `kth_largest(nums, k)`: return the k-th largest value in an unsorted list (the k-th in sorted-descending order, duplicates counted).
2. `KthLargestStream(k, initial)`: a class whose `add(x)` inserts a value and returns the current k-th largest of everything seen so far. Assume at least `k` values exist after each `add`.

## Examples

```text
kth_largest([3, 2, 1, 5, 6, 4], 2)          → 5
kth_largest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4) → 4

s = KthLargestStream(3, [4, 5, 8, 2])
s.add(3) → 4    s.add(5) → 5    s.add(10) → 5    s.add(9) → 8
```

## Starter code

```python starter
def kth_largest(nums: list[int], k: int) -> int:
    pass


class KthLargestStream:
    def __init__(self, k: int, initial: list[int]):
        pass

    def add(self, x: int) -> int:
        pass
```

## Hints

<details><summary>Hint 1</summary>

Keep a **min**-heap of the k largest values seen. Its root is the k-th largest. If a new value beats the root, replace the root.

</details>

<details><summary>Hint 2</summary>

For a one-off array, quickselect partitions around a pivot and recurses into one side only: O(n) on average.

</details>

## Where this shows up in data engineering

"Top 10 customers by spend", "p99 latency", "largest 100 files to compact first". In a stream you keep a bounded heap per key (that's what `approx_top_k` and leaderboard services do internally). In batch, Spark's `takeOrdered` keeps a size-k heap per partition and merges them, which is why it beats a full `orderBy().limit()` for small k.

## Solution

```python solution
import heapq
import random


def kth_largest(nums, k):
    # quickselect: find the element that would sit at index n-k in ascending order
    target = len(nums) - k
    a = list(nums)
    lo, hi = 0, len(a) - 1
    while True:
        pivot = a[random.randint(lo, hi)]
        # three-way partition handles duplicates without degrading
        lt = [x for x in a[lo:hi + 1] if x < pivot]
        eq = [x for x in a[lo:hi + 1] if x == pivot]
        gt = [x for x in a[lo:hi + 1] if x > pivot]
        a[lo:hi + 1] = lt + eq + gt
        if target < lo + len(lt):
            hi = lo + len(lt) - 1
        elif target < lo + len(lt) + len(eq):
            return pivot
        else:
            lo = lo + len(lt) + len(eq)


class KthLargestStream:
    def __init__(self, k, initial):
        self.k = k
        self.heap = []                     # min-heap holding the k largest values
        for x in initial:
            self.add(x)

    def add(self, x):
        if len(self.heap) < self.k:
            heapq.heappush(self.heap, x)
        elif x > self.heap[0]:
            heapq.heapreplace(self.heap, x)  # pop root + push in one O(log k) step
        return self.heap[0]
```

## Tests

Your solution should pass these:

```python tests
assert kth_largest([3, 2, 1, 5, 6, 4], 2) == 5
assert kth_largest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4) == 4
assert kth_largest([1], 1) == 1
assert kth_largest([7, 7, 7, 7], 2) == 7
assert kth_largest(list(range(1000)), 1) == 999
s = KthLargestStream(3, [4, 5, 8, 2])
assert [s.add(3), s.add(5), s.add(10), s.add(9), s.add(4)] == [4, 5, 5, 8, 8]
t = KthLargestStream(1, [])
assert [t.add(-3), t.add(-2), t.add(-4)] == [-3, -2, -2]
```

## Explanation

**Heap (stream or array):** a min-heap of size k keeps exactly the k largest seen so far; the smallest of them, the root, is the answer. O(n log k) time, O(k) memory, and it works on unbounded streams. In Python `heapq.nlargest(k, nums)[-1]` does this.

**Quickselect (array only):** partition around a random pivot; only recurse into the side containing index `n-k`. Expected O(n), worst case O(n²) (mitigated by random pivots; median-of-medians guarantees O(n) but is rarely asked). The three-way partition prevents quadratic behaviour on many duplicates.

**Sorting:** O(n log n), fine as a first answer; say why you'd improve it.

**Choosing:** stream or huge n with small k → heap. One-off in-memory array → quickselect. Need the whole ranking anyway → sort.

## Follow-up questions

<details><summary>Find the top 100 products by sales across 1 TB of order files.</summary>

Map: per partition, aggregate sales per product (hash map), then keep a size-100 heap. Reduce: merge the per-partition heaps. If one product can appear in many partitions, aggregate by product first (shuffle by product_id) before the local top-k, otherwise partial sums give wrong rankings.

</details>

<details><summary>Running median instead of k-th largest?</summary>

Two heaps: a max-heap for the lower half and a min-heap for the upper half, rebalanced so sizes differ by ≤ 1. O(log n) per insert (see the Python track's running-median problem).

</details>
