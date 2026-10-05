---
title: "Bloom Filter for Streaming Deduplication"
description: "Implement a Bloom filter with k hash functions and reason about false-positive rates and sizing."
url: "/interview-prep/practice/python/26-bloom-filter/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 26
---

# Bloom Filter for Streaming Deduplication

**Difficulty:** Hard · **Topics:** probabilistic, hashing, deduplication · **Asked at:** Google, Meta, Cloudflare, Databricks

## Problem

Implement `BloomFilter(capacity, error_rate)` with `add(item)` and `__contains__(item)`. Size it optimally: `m = ceil(-n·ln(p) / (ln 2)²)` bits and `k = round((m/n)·ln 2)` hash functions. Derive the k hashes with double hashing from one SHA-256 digest: `h_i = (h1 + i·h2) mod m`. Store bits in a `bytearray`.

## Starter code

```python starter
import hashlib, math

class BloomFilter:
    def __init__(self, capacity: int, error_rate: float = 0.01):
        pass

    def add(self, item: str) -> None:
        pass

    def __contains__(self, item: str) -> bool:
        pass
```

## Hints

<details><summary>Hint 1</summary>

Split the 32-byte digest into two 64-bit integers for h1 and h2.

</details>

<details><summary>Hint 2</summary>

Bit i lives in byte i // 8 at position i % 8.

</details>

## Solution

```python solution
import hashlib, math

class BloomFilter:
    def __init__(self, capacity: int, error_rate: float = 0.01):
        self.m = math.ceil(-capacity * math.log(error_rate) / (math.log(2) ** 2))
        self.k = max(1, round(self.m / capacity * math.log(2)))
        self.bits = bytearray((self.m + 7) // 8)

    def _positions(self, item: str):
        d = hashlib.sha256(item.encode()).digest()
        h1 = int.from_bytes(d[:8], "big")
        h2 = int.from_bytes(d[8:16], "big") | 1
        return ((h1 + i * h2) % self.m for i in range(self.k))

    def add(self, item: str) -> None:
        for p in self._positions(item):
            self.bits[p // 8] |= 1 << (p % 8)

    def __contains__(self, item: str) -> bool:
        return all(self.bits[p // 8] & (1 << (p % 8)) for p in self._positions(item))
```

## Tests

Your solution should pass these:

```python tests
bf = BloomFilter(10_000, 0.01)
assert bf.m == 95851 and bf.k == 7
for i in range(10_000):
    bf.add(f"event-{i}")
assert all(f"event-{i}" in bf for i in range(10_000))          # no false negatives, ever
fp = sum(f"other-{i}" in bf for i in range(20_000)) / 20_000
assert fp < 0.02, fp                                             # close to the 1% target
```

## Explanation

~9.6 bits per item for 1% false positives, versus storing the ids themselves (tens of bytes each). A Bloom filter answers "definitely not seen" or "probably seen":
- **Streaming dedup:** if not in filter → new event (fast path); if "probably seen" → check the exact store, or accept rare drops where that's allowed (never for billing!).
- **Join pre-filtering:** Spark/Databricks build runtime Bloom filters on the small side of a join to skip rows/files of the big side.
- Parquet supports per-column Bloom filters for point lookups.
Limitations: no deletes (use counting Bloom filters or cuckoo filters), and the FP rate rises past capacity, so rotate filters per time window.
