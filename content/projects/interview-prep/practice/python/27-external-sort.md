---
title: "Sort Data Larger Than Memory (External Merge Sort)"
description: "Sort a stream that doesn't fit in memory by sorting chunks into runs and k-way merging them."
url: "/interview-prep/practice/python/27-external-sort/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 27
---

# Sort Data Larger Than Memory (External Merge Sort)

**Difficulty:** Hard · **Topics:** external-sort, heap, generators · **Asked at:** Google, Snowflake, Oracle, Databricks

## Problem

Implement `external_sort(stream, max_in_memory)` that yields all items of `stream` in sorted order while holding at most `max_in_memory` items in memory during the run-creation phase. Simulate "disk" with `tempfile.TemporaryFile` (write one item per line as text; items are strings without newlines). Return a generator.

## Starter code

```python starter
import heapq, tempfile
from typing import Iterable, Iterator

def external_sort(stream: Iterable[str], max_in_memory: int) -> Iterator[str]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Phase 1: read chunks of max_in_memory, sort each, write each to its own temp file (a sorted run).

</details>

<details><summary>Hint 2</summary>

Phase 2: k-way merge the runs with `heapq.merge` over line iterators, stripping newlines.

</details>

## Solution

```python solution
import heapq, tempfile
from itertools import islice
from typing import Iterable, Iterator

def external_sort(stream: Iterable[str], max_in_memory: int) -> Iterator[str]:
    it = iter(stream)
    runs = []
    while chunk := list(islice(it, max_in_memory)):
        chunk.sort()
        f = tempfile.TemporaryFile("w+")
        f.writelines(x + "\n" for x in chunk)
        f.seek(0)
        runs.append(f)
    try:
        for line in heapq.merge(*runs):
            yield line.rstrip("\n")
    finally:
        for f in runs:
            f.close()
```

## Tests

Your solution should pass these:

```python tests
import random
rng = random.Random(3)
data = [f"{rng.randint(0, 10**6):07d}" for _ in range(5000)]
assert list(external_sort(data, 300)) == sorted(data)
assert list(external_sort([], 10)) == []
assert list(external_sort(["b", "a"], 1)) == ["a", "b"]
```

## Explanation

Phase 1 creates ⌈N/M⌉ sorted runs; phase 2 merges them in O(N log runs). If there are too many runs to open at once, merge in multiple passes (merge 100 runs at a time). This is how databases sort beyond memory (the "spill to disk" you see in Spark UI during sort-merge joins and sorts), and why spill makes jobs slow: every spilled byte is written and read again.
