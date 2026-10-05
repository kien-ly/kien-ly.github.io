---
title: "K Closest Points to the Origin (Nearest Depots)"
description: "Bounded max-heap keyed on squared distance with deterministic tie-breaking."
url: "/interview-prep/practice/algorithms/24-k-closest-points/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 24
---

# K Closest Points to the Origin (Nearest Depots)

**Pattern:** Heap (Top-K and Greedy Merging) · **Difficulty:** Medium · **Asked at:** Amazon, Meta, Uber, DoorDash

**Classic version:** [LeetCode 973](https://leetcode.com/problems/k-closest-points-to-origin/)

## Problem

Given points `(x, y)` (e.g. delivery depots relative to a customer at the origin), return the `k` closest by Euclidean distance, sorted by distance ascending; break ties by `x`, then `y`.

## Examples

```text
k_closest([(1, 3), (-2, 2)], 1)          → [(-2, 2)]
k_closest([(3, 3), (5, -1), (-2, 4)], 2) → [(3, 3), (-2, 4)]
```

## Starter code

```python starter
def k_closest(points: list[tuple[int, int]], k: int) -> list[tuple[int, int]]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Compare squared distances `x² + y²`: no `sqrt` needed, no floating-point error.

</details>

<details><summary>Hint 2</summary>

Keep a **max**-heap of size k (push negated keys in Python). When a closer point arrives, evict the farthest.

</details>

## Where this shows up in data engineering

Nearest-neighbour selection is everywhere: closest drivers in ride-hailing, nearest warehouses, and the top-k step of **vector search** in RAG systems (an ANN index finds candidates, then an exact top-k heap ranks them). Avoiding `sqrt` is the same idea as comparing squared L2 or using inner product in vector DBs.

## Solution

```python solution
import heapq


def k_closest(points, k):
    heap = []                                    # max-heap via negated keys
    for x, y in points:
        key = (-(x * x + y * y), -x, -y)         # farthest (and largest tie-breakers) at the root
        if len(heap) < k:
            heapq.heappush(heap, (key, (x, y)))
        elif key > heap[0][0]:                   # closer than the current farthest
            heapq.heapreplace(heap, (key, (x, y)))
    return [p for _, p in sorted(heap, key=lambda e: (-e[0][0], -e[0][1], -e[0][2]))]
```

## Tests

Your solution should pass these:

```python tests
assert k_closest([(1, 3), (-2, 2)], 1) == [(-2, 2)]
assert k_closest([(3, 3), (5, -1), (-2, 4)], 2) == [(3, 3), (-2, 4)]
assert k_closest([(0, 1), (1, 0), (0, -1), (-1, 0)], 2) == [(-1, 0), (0, -1)]
assert k_closest([(2, 2)], 1) == [(2, 2)]
assert k_closest([(1, 1), (2, 2), (3, 3)], 3) == [(1, 1), (2, 2), (3, 3)]
```

## Explanation

**Bounded max-heap:** the root is the farthest of the k kept points; any closer newcomer replaces it. O(n log k) time, O(k) space, streaming-friendly.

**Tie-breaking:** encoding `(distance, x, y)` into the heap key makes the result deterministic, which matters for reproducible tests and pipelines (non-deterministic top-k is a classic source of flaky reports).

**Alternatives:** sort all points, O(n log n); quickselect on squared distance, O(n) average but returns the k in arbitrary order (sort them after: O(k log k)).

## Follow-up questions

<details><summary>Millions of depots, many queries per second. What changes?</summary>

Precompute a spatial index (geohash/H3 cells, k-d tree, or R-tree): look up the query's cell and its neighbours to get candidates, then run the exact heap over the candidates only. That's how geo services and ANN vector indexes avoid scanning everything.

</details>
