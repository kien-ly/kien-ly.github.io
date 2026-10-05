---
title: "Merge Two Sorted Event Streams Lazily"
description: "Merge two time-ordered iterators into one ordered stream with constant memory using generators."
url: "/interview-prep/practice/python/05-merge-sorted-streams/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 5
---

# Merge Two Sorted Event Streams Lazily

**Difficulty:** Easy · **Topics:** generators, two-pointers, streaming · **Asked at:** Kafka/Confluent, Netflix, Jane Street

## Problem

Two iterators yield `(timestamp, payload)` tuples, each already sorted by timestamp. Write a **generator** `merge_streams(a, b)` that yields all items in timestamp order, taking from `a` first when timestamps are equal. It must work on infinite or very large iterators (don't call `list()` on inputs).

## Starter code

```python starter
from typing import Iterator, Iterable

def merge_streams(a: Iterable, b: Iterable) -> Iterator:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Keep one "current" item from each iterator; use a sentinel for exhaustion.

</details>

<details><summary>Hint 2</summary>

`next(it, sentinel)` avoids try/except StopIteration.

</details>

## Solution

```python solution
from typing import Iterator, Iterable

_END = object()

def merge_streams(a: Iterable, b: Iterable) -> Iterator:
    ia, ib = iter(a), iter(b)
    x, y = next(ia, _END), next(ib, _END)
    while x is not _END and y is not _END:
        if x[0] <= y[0]:
            yield x
            x = next(ia, _END)
        else:
            yield y
            y = next(ib, _END)
    while x is not _END:
        yield x
        x = next(ia, _END)
    while y is not _END:
        yield y
        y = next(ib, _END)
```

## Tests

Your solution should pass these:

```python tests
import itertools
a = [(1, "a1"), (3, "a3"), (3, "a3b"), (7, "a7")]
b = [(2, "b2"), (3, "b3"), (10, "b10")]
assert list(merge_streams(a, b)) == [(1, "a1"), (2, "b2"), (3, "a3"), (3, "a3b"), (3, "b3"), (7, "a7"), (10, "b10")]
assert list(merge_streams([], b)) == b
inf = ((i * 2, "even") for i in itertools.count())
assert list(itertools.islice(merge_streams(inf, [(1, "odd")]), 4)) == [(0, "even"), (1, "odd"), (2, "even"), (4, "even")]
```

## Explanation

O(n + m) time, O(1) memory. The tie rule (take from `a` first) makes the merge **stable**, which matters when merging partitions of an ordered log. For k streams use a heap (`heapq.merge`), as in problem 10.
