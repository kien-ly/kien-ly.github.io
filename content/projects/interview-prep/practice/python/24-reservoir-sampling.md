---
title: "Uniform Sample from a Stream of Unknown Length"
description: "Reservoir sampling (Algorithm R): keep a uniform random sample of k items from a stream in O(k) memory."
url: "/interview-prep/practice/python/24-reservoir-sampling/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 24
---

# Uniform Sample from a Stream of Unknown Length

**Difficulty:** Hard · **Topics:** sampling, streaming, probability · **Asked at:** Google, Meta, LinkedIn, Netflix

## Problem

Implement `reservoir_sample(stream, k, rng)` returning a list of `k` items chosen **uniformly at random** from an iterable of unknown length (all items if fewer than k), using O(k) memory. Use `rng.randint(a, b)` (inclusive) for randomness so results are reproducible with a seeded `random.Random`.

## Starter code

```python starter
import random

def reservoir_sample(stream, k: int, rng: random.Random) -> list:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Fill the reservoir with the first k items.

</details>

<details><summary>Hint 2</summary>

For item i (0-based, i ≥ k), pick j = randint(0, i); if j < k replace reservoir[j].

</details>

## Solution

```python solution
import random

def reservoir_sample(stream, k: int, rng: random.Random) -> list:
    reservoir = []
    for i, item in enumerate(stream):
        if i < k:
            reservoir.append(item)
        else:
            j = rng.randint(0, i)
            if j < k:
                reservoir[j] = item
    return reservoir
```

## Tests

Your solution should pass these:

```python tests
import random
from collections import Counter
assert reservoir_sample(range(3), 5, random.Random(1)) == [0, 1, 2]
s = reservoir_sample(range(1000), 10, random.Random(42))
assert len(s) == 10 and len(set(s)) == 10 and all(0 <= x < 1000 for x in s)
# uniformity check: each of 10 items should be picked ~ 3/10 of the time
rng = random.Random(0)
counts = Counter(x for _ in range(20000) for x in reservoir_sample(range(10), 3, rng))
assert all(abs(c / 20000 - 0.3) < 0.02 for c in counts.values()), counts
```

## Explanation

**Why it's uniform:** item i is kept with probability k/(i+1) when it arrives; it then survives each later arrival j with probability 1 − 1/(j+1), and the product telescopes to exactly k/n for every item. O(n) time, O(k) memory, one pass. Uses: sampling records for data profiling, debugging, ML training subsets from unbounded logs. Distributed version: sample per partition with random keys and keep the global top-k smallest keys (weighted variants exist).
