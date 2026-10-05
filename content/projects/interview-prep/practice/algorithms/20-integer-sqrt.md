---
title: "Integer Square Root (Binary Search on the Answer)"
description: "Search the answer space instead of an array: the largest r with r*r ≤ x."
url: "/interview-prep/practice/algorithms/20-integer-sqrt/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 20
---

# Integer Square Root (Binary Search on the Answer)

**Pattern:** Binary Search · **Difficulty:** Easy · **Asked at:** Amazon, Apple, Bloomberg

**Classic version:** [LeetCode 69](https://leetcode.com/problems/sqrtx/)

## Problem

Return the floor of the square root of a non-negative integer `x`, the largest integer `r` with `r * r <= x`, without `math.sqrt`, `isqrt` or `** 0.5`.

## Examples

```text
int_sqrt(8)  → 2
int_sqrt(16) → 4
int_sqrt(0)  → 0
```

## Starter code

```python starter
def int_sqrt(x: int) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

The predicate `r * r > x` is false, false, …, then true forever: monotonic. Find the first true and subtract 1.

</details>

## Where this shows up in data engineering

**Binary search on the answer** is the pattern behind capacity planning questions: "the smallest cluster size that finishes the backfill by morning", "the minimum throughput that keeps lag under 5 minutes". Whenever "is X enough?" is monotonic in X, you can binary search X.

## Solution

```python solution
def int_sqrt(x: int) -> int:
    lo, hi = 0, x + 1                # first r with r*r > x lies in [0, x+1]
    while lo < hi:
        mid = (lo + hi) // 2
        if mid * mid > x:
            hi = mid
        else:
            lo = mid + 1
    return lo - 1
```

## Tests

Your solution should pass these:

```python tests
assert int_sqrt(8) == 2
assert int_sqrt(16) == 4
assert int_sqrt(0) == 0
assert int_sqrt(1) == 1
assert int_sqrt(2) == 1
assert int_sqrt(2147395599) == 46339
assert int_sqrt(10**18) == 10**9
```

## Explanation

**Reframe:** we aren't searching an array; we're searching integers `0..x+1` for the first `r` where `r² > x`. The answer is one less.

**Complexity:** O(log x) iterations. Python ints don't overflow; in Java/C++ use `mid <= x / mid` instead of `mid * mid <= x`.

**Newton's method** converges faster (`r = (r + x // r) // 2`) and is worth mentioning, but binary search is the expected answer because it generalises.

## Follow-up questions

<details><summary>Return the square root to 6 decimal places.</summary>

Binary search on floats for a fixed number of iterations (e.g. 60), or until `hi - lo < 1e-7`. Each iteration halves the interval.

</details>
