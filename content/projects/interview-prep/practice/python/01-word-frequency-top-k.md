---
title: "Top-K Most Frequent Search Terms"
description: "Count terms in a stream of queries and return the K most frequent, with deterministic tie-breaking."
url: "/interview-prep/practice/python/01-word-frequency-top-k/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 1
---

# Top-K Most Frequent Search Terms

**Difficulty:** Easy · **Topics:** hash-map, heap, counting · **Asked at:** Google, Amazon, Bloomberg

## Problem

Given a list of raw search queries, normalise each term (lowercase, strip surrounding whitespace, ignore empty strings) and return the `k` most frequent terms as `(term, count)` tuples, sorted by count descending and then alphabetically for ties.

## Examples

```text
top_k_terms(["Spark", "kafka ", "spark", "", "Delta", "KAFKA", "spark"], 2)
→ [("spark", 3), ("kafka", 2)]
```

## Constraints

- Up to 10⁷ queries; vocabulary may be large.
- `k` ≥ 1; if fewer than `k` distinct terms exist, return all.

## Starter code

```python starter
def top_k_terms(queries: list[str], k: int) -> list[tuple[str, int]]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

`collections.Counter` does the counting.

</details>

<details><summary>Hint 2</summary>

`heapq.nsmallest(k, items, key=lambda x: (-count, term))` gives O(n log k) with correct tie-breaking.

</details>

## Solution

```python solution
from collections import Counter
import heapq

def top_k_terms(queries: list[str], k: int) -> list[tuple[str, int]]:
    counts = Counter(t for t in (q.strip().lower() for q in queries) if t)
    return heapq.nsmallest(k, counts.items(), key=lambda kv: (-kv[1], kv[0]))
```

## Tests

Your solution should pass these:

```python tests
assert top_k_terms(["Spark", "kafka ", "spark", "", "Delta", "KAFKA", "spark"], 2) == [("spark", 3), ("kafka", 2)]
assert top_k_terms(["b", "a", "c", "b", "a"], 2) == [("a", 2), ("b", 2)]
assert top_k_terms([], 3) == []
assert top_k_terms(["x"], 5) == [("x", 1)]
```

## Explanation

Counting is O(n). Selecting top-k with a heap is O(m log k) for m distinct terms, better than sorting all terms (O(m log m)) when k ≪ m. `Counter.most_common(k)` also uses a heap but breaks ties by insertion order, which isn't what the spec asks.

## Follow-up questions

<details><summary>The query log is 2 TB and doesn’t fit in memory. What now?</summary>

Map-reduce: partition by hash(term) so each worker counts a disjoint subset (fits in memory), compute local top-k per partition, then merge the small lists. That’s exactly Spark `groupBy(term).count()` + `orderBy(desc).limit(k)`. For a real-time stream: Count-Min Sketch + heap (heavy hitters).

</details>
