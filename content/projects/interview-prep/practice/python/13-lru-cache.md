---
title: "LRU Cache for Dimension Lookups"
description: "Design an O(1) least-recently-used cache, the structure used to cache dimension lookups in streaming enrichment."
url: "/interview-prep/practice/python/13-lru-cache/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 13
---

# LRU Cache for Dimension Lookups

**Difficulty:** Medium · **Topics:** design, hash-map, linked-list · **Asked at:** Amazon, Meta, Microsoft, Uber

## Problem

Implement `LRUCache(capacity)` with `get(key)` (return the value or `None`, and mark it recently used) and `put(key, value)` (insert/update; if over capacity evict the least recently used key). Both O(1). Also track `hits` and `misses` counters.

## Starter code

```python starter
class LRUCache:
    def __init__(self, capacity: int):
        pass

    def get(self, key):
        pass

    def put(self, key, value) -> None:
        pass
```

## Hints

<details><summary>Hint 1</summary>

`OrderedDict` keeps insertion order and supports `move_to_end` and `popitem(last=False)` in O(1).

</details>

<details><summary>Hint 2</summary>

Interviewers may ask for the hash map + doubly linked list version: know how it works.

</details>

## Solution

```python solution
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.data: OrderedDict = OrderedDict()
        self.hits = self.misses = 0

    def get(self, key):
        if key not in self.data:
            self.misses += 1
            return None
        self.hits += 1
        self.data.move_to_end(key)
        return self.data[key]

    def put(self, key, value) -> None:
        if key in self.data:
            self.data.move_to_end(key)
        self.data[key] = value
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)
```

## Tests

Your solution should pass these:

```python tests
c = LRUCache(2)
c.put("a", 1); c.put("b", 2)
assert c.get("a") == 1          # a is now most recent
c.put("c", 3)                   # evicts b
assert c.get("b") is None
c.put("a", 10)                  # update keeps a, refreshes recency
c.put("d", 4)                   # evicts c
assert c.get("c") is None and c.get("a") == 10 and c.get("d") == 4
assert (c.hits, c.misses) == (3, 2)
```

## Explanation

Under the hood: a hash map from key → node in a doubly linked list ordered by recency; move-to-front and evict-from-tail are O(1) pointer updates. In streaming jobs an LRU in front of a slow dimension store (DB, API) cuts lookups dramatically; add a TTL so stale dimension values expire.
