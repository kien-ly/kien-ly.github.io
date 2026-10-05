---
title: "K-Way Merge of Sorted Partition Files"
description: "Merge k sorted iterators into one sorted stream with a heap, as in external sort and log compaction."
url: "/interview-prep/practice/python/10-k-way-merge/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 10
---

# K-Way Merge of Sorted Partition Files

**Difficulty:** Medium · **Topics:** heap, merge, streaming · **Asked at:** Google, Snowflake, Databricks

## Problem

Implement `k_way_merge(iterators)` as a generator yielding all values from `k` individually sorted iterators in global sorted order, using O(k) memory. Don't use `heapq.merge` (implement it).

## Starter code

```python starter
from typing import Iterable, Iterator

def k_way_merge(iterators: list[Iterable]) -> Iterator:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Heap entries: (value, source_index). The index breaks ties and avoids comparing iterators.

</details>

## Solution

```python solution
import heapq
from typing import Iterable, Iterator

def k_way_merge(iterators: list[Iterable]) -> Iterator:
    its = [iter(x) for x in iterators]
    heap = []
    for i, it in enumerate(its):
        first = next(it, None)
        if first is not None:
            heap.append((first, i))
    heapq.heapify(heap)
    while heap:
        value, i = heapq.heappop(heap)
        yield value
        nxt = next(its[i], None)
        if nxt is not None:
            heapq.heappush(heap, (nxt, i))
```

## Tests

Your solution should pass these:

```python tests
assert list(k_way_merge([[1, 4, 9], [2, 3, 10], [], [0, 11]])) == [0, 1, 2, 3, 4, 9, 10, 11]
assert list(k_way_merge([])) == []
assert list(k_way_merge([[5, 5], [5]])) == [5, 5, 5]
import heapq, random
random.seed(7)
parts = [sorted(random.sample(range(1000), 50)) for _ in range(8)]
assert list(k_way_merge(parts)) == list(heapq.merge(*parts))
```

## Explanation

O(N log k) for N total items: each item enters and leaves a heap of size ≤ k once. This is the merge phase of **external sort** and of LSM-tree compaction (RocksDB, Cassandra), and how sort-merge joins combine sorted runs. Note that this version uses `None` as the end marker, so it can't merge streams containing `None`; a sentinel object fixes that.
