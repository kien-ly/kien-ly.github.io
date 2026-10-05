---
title: "Count Time Windows with Exact Revenue Target"
description: "Prefix sums with a hash map to count contiguous periods whose total equals a target, including negative values (refunds)."
url: "/interview-prep/practice/python/18-subarray-sum-target/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 18
---

# Count Time Windows with Exact Revenue Target

**Difficulty:** Medium · **Topics:** prefix-sum, hash-map, arrays · **Asked at:** Meta, Amazon, Bloomberg

## Problem

`net` is a list of daily net revenue values (refunds make some negative). Return how many **contiguous** periods (subarrays) sum exactly to `target`.

## Starter code

```python starter
def count_periods(net: list[int], target: int) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

A subarray (i, j] sums to target iff prefix[j] − prefix[i] = target.

</details>

<details><summary>Hint 2</summary>

Count how many earlier prefixes equal `prefix − target`. Seed the map with {0: 1}.

</details>

## Solution

```python solution
from collections import defaultdict

def count_periods(net: list[int], target: int) -> int:
    seen = defaultdict(int)
    seen[0] = 1
    prefix = count = 0
    for x in net:
        prefix += x
        count += seen[prefix - target]
        seen[prefix] += 1
    return count
```

## Tests

Your solution should pass these:

```python tests
assert count_periods([1, 1, 1], 2) == 2
assert count_periods([3, 4, -7, 1, 3, 3, 1, -4], 7) == 4
assert count_periods([], 0) == 0
assert count_periods([0, 0], 0) == 3
```

## Explanation

O(n) time and space. A sliding window doesn't work here because negative values break the "shrink when too big" invariant, which is why prefix sums + hash map is needed. Prefix sums are also the trick behind fast range totals in cumulative tables (`cum[j] − cum[i]`).
