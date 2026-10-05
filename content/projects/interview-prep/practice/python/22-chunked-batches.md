---
title: "Batch a Stream into Fixed-Size Chunks"
description: "A generator that groups any iterable into lists of size n for bulk API writes, without loading everything into memory."
url: "/interview-prep/practice/python/22-chunked-batches/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 22
---

# Batch a Stream into Fixed-Size Chunks

**Difficulty:** Easy · **Topics:** generators, itertools, streaming · **Asked at:** Stripe, Twilio, Shopify

## Problem

Write `chunked(iterable, n)` yielding lists of up to `n` items, preserving order; the last chunk may be smaller. Raise `ValueError` for `n < 1`. It must work on generators and infinite iterators.

## Starter code

```python starter
from typing import Iterable, Iterator

def chunked(iterable: Iterable, n: int) -> Iterator[list]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

`itertools.islice(it, n)` takes the next n items from a shared iterator.

</details>

## Solution

```python solution
from itertools import islice
from typing import Iterable, Iterator

def chunked(iterable: Iterable, n: int) -> Iterator[list]:
    if n < 1:
        raise ValueError("n must be >= 1")
    it = iter(iterable)
    while batch := list(islice(it, n)):
        yield batch
```

## Tests

Your solution should pass these:

```python tests
import itertools
assert list(chunked(range(7), 3)) == [[0, 1, 2], [3, 4, 5], [6]]
assert list(chunked([], 3)) == []
assert next(chunked(itertools.count(), 2)) == [0, 1]
gen = (x * x for x in range(5))
assert list(chunked(gen, 5)) == [[0, 1, 4, 9, 16]]
try:
    list(chunked([1], 0))
    assert False
except ValueError:
    pass
```

## Explanation

Batching is everywhere in DE: bulk inserts, API calls with max batch sizes, embedding requests, Kafka producer batches. Note the eager `ValueError`: because `chunked` is a generator, the check only runs on first iteration. To fail at call time, split into a regular function that validates and returns an inner generator. Python 3.12 has `itertools.batched`.
