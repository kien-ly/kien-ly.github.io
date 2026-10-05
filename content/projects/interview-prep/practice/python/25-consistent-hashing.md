---
title: "Consistent Hashing Ring for Sharding"
description: "Map keys to nodes with virtual nodes so adding or removing a node moves only about 1/N of keys."
url: "/interview-prep/practice/python/25-consistent-hashing/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 25
---

# Consistent Hashing Ring for Sharding

**Difficulty:** Hard · **Topics:** hashing, distributed-systems, bisect · **Asked at:** Amazon, Uber, Discord, Cloudflare

## Problem

Implement `HashRing(nodes, vnodes=100)` with `add(node)`, `remove(node)` and `get(key) -> node`. Each node is placed on the ring at `vnodes` positions (hash of `f"{node}#{i}"`); a key belongs to the first position clockwise from `hash(key)`. Use a stable hash (e.g. MD5 → int), not Python's randomised `hash()`.

## Starter code

```python starter
class HashRing:
    def __init__(self, nodes: list[str], vnodes: int = 100):
        pass

    def add(self, node: str) -> None:
        pass

    def remove(self, node: str) -> None:
        pass

    def get(self, key: str) -> str:
        pass
```

## Hints

<details><summary>Hint 1</summary>

Keep a sorted list of positions and a dict position → node; `bisect` finds the successor; wrap around at the end.

</details>

## Solution

```python solution
import bisect, hashlib

def _h(s: str) -> int:
    return int(hashlib.md5(s.encode()).hexdigest(), 16)

class HashRing:
    def __init__(self, nodes: list[str], vnodes: int = 100):
        self.vnodes = vnodes
        self.ring: list[int] = []
        self.owner: dict[int, str] = {}
        for n in nodes:
            self.add(n)

    def add(self, node: str) -> None:
        for i in range(self.vnodes):
            p = _h(f"{node}#{i}")
            bisect.insort(self.ring, p)
            self.owner[p] = node

    def remove(self, node: str) -> None:
        for i in range(self.vnodes):
            p = _h(f"{node}#{i}")
            self.ring.pop(bisect.bisect_left(self.ring, p))
            del self.owner[p]

    def get(self, key: str) -> str:
        if not self.ring:
            raise KeyError("empty ring")
        i = bisect.bisect_right(self.ring, _h(key)) % len(self.ring)
        return self.owner[self.ring[i]]
```

## Tests

Your solution should pass these:

```python tests
keys = [f"user-{i}" for i in range(5000)]
ring = HashRing(["a", "b", "c", "d"])
before = {k: ring.get(k) for k in keys}
share = {n: sum(1 for v in before.values() if v == n) / len(keys) for n in "abcd"}
assert all(0.15 < s < 0.35 for s in share.values()), share       # roughly balanced
ring.add("e")
after = {k: ring.get(k) for k in keys}
moved = sum(before[k] != after[k] for k in keys) / len(keys)
assert 0.1 < moved < 0.3, moved                                  # ~1/5 move, not ~4/5
assert all(after[k] == "e" for k in keys if before[k] != after[k])  # keys only move TO the new node
ring.remove("e")
assert {k: ring.get(k) for k in keys} == before
```

## Explanation

With naive `hash(key) % N`, changing N remaps ~all keys (a reshuffle storm). With consistent hashing only keys between the new node's positions and their predecessors move, about 1/N. **Virtual nodes** smooth the distribution and let you weight bigger nodes with more positions. Used by DynamoDB/Cassandra partitioning, CDN routing, cache clusters. Contrast with Kafka, where adding partitions *does* remap keys (`hash % partitions`), which is why you over-provision partitions.
