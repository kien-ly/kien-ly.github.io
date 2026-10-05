---
title: "Point-in-Time Lookup (As-Of Join)"
description: "Store versioned values per key and look up the value valid at a given timestamp with binary search."
url: "/interview-prep/practice/python/14-time-based-kv-store/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 14
---

# Point-in-Time Lookup (As-Of Join)

**Difficulty:** Medium · **Topics:** binary-search, as-of-join, versioning · **Asked at:** Google, Stripe, Two Sigma, Databricks

## Problem

Implement `VersionedStore` with `set(key, value, ts)` and `get(key, ts)` returning the value with the **largest timestamp ≤ ts**, or `None`. Timestamps for a key can arrive **out of order**. Then implement `as_of_join(events, store)` that enriches each `(key, ts)` event with the value valid at that time.

## Starter code

```python starter
class VersionedStore:
    def __init__(self):
        pass

    def set(self, key, value, ts: int) -> None:
        pass

    def get(self, key, ts: int):
        pass

def as_of_join(events, store):
    pass
```

## Hints

<details><summary>Hint 1</summary>

Keep per key two parallel sorted lists (timestamps, values); `bisect.insort` handles out-of-order inserts.

</details>

<details><summary>Hint 2</summary>

`bisect_right(timestamps, ts) - 1` is the index of the last timestamp ≤ ts.

</details>

## Solution

```python solution
import bisect
from collections import defaultdict

class VersionedStore:
    def __init__(self):
        self.ts = defaultdict(list)
        self.vals = defaultdict(list)

    def set(self, key, value, ts: int) -> None:
        i = bisect.bisect_right(self.ts[key], ts)
        self.ts[key].insert(i, ts)
        self.vals[key].insert(i, value)

    def get(self, key, ts: int):
        i = bisect.bisect_right(self.ts.get(key, []), ts) - 1
        return self.vals[key][i] if i >= 0 else None

def as_of_join(events, store):
    return [(k, t, store.get(k, t)) for k, t in events]
```

## Tests

Your solution should pass these:

```python tests
s = VersionedStore()
s.set("EURUSD", 1.08, 100)
s.set("EURUSD", 1.10, 300)
s.set("EURUSD", 1.09, 200)        # out of order
assert s.get("EURUSD", 99) is None
assert s.get("EURUSD", 100) == 1.08
assert s.get("EURUSD", 250) == 1.09
assert s.get("EURUSD", 10_000) == 1.10
assert s.get("GBPUSD", 500) is None
assert as_of_join([("EURUSD", 150), ("EURUSD", 300)], s) == [("EURUSD", 150, 1.08), ("EURUSD", 300, 1.10)]
```

## Explanation

`get` is O(log n); `set` is O(n) in the worst case because of list insertion (O(log n) if timestamps arrive in order, the common case). This is exactly the **point-in-time join** used for FX rates on transactions and for feature stores (feature value as of label time, without leakage). pandas `merge_asof` and SQL `ASOF JOIN` do the same at scale with sorted merges instead of per-row binary search.
