---
title: "Subarray Sum Divisible by k (Prefix Sums + Remainders)"
description: "Prefix sums modulo k with first-seen indices: detect a contiguous run of length ≥ 2 whose total is a multiple of k."
url: "/interview-prep/practice/algorithms/17-continuous-subarray-sum/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 17
---

# Subarray Sum Divisible by k (Prefix Sums + Remainders)

**Pattern:** Prefix Sum · **Difficulty:** Medium · **Asked at:** Meta, Amazon, Yahoo

**Classic version:** [LeetCode 523](https://leetcode.com/problems/continuous-subarray-sum/) · [LeetCode 560](https://leetcode.com/problems/subarray-sum-equals-k/)

## Problem

Given non-negative integers `nums` and a positive integer `k`, return `True` if there is a contiguous subarray of **length at least 2** whose sum is a multiple of `k` (0 counts as a multiple).

## Examples

```text
has_multiple_run([23, 2, 4, 6, 7], 6)   → True    # [2, 4]
has_multiple_run([23, 2, 6, 4, 7], 13)  → False
has_multiple_run([5, 0, 0, 0], 3)       → True    # [0, 0]
```

## Starter code

```python starter
def has_multiple_run(nums: list[int], k: int) -> bool:
    pass
```

## Hints

<details><summary>Hint 1</summary>

`sum(i..j) = P[j+1] - P[i]`. It's divisible by k exactly when `P[j+1] % k == P[i] % k`.

</details>

<details><summary>Hint 2</summary>

Store the **first** index where each remainder appeared (seed remainder 0 at index -1). A repeat at distance ≥ 2 means a valid run.

</details>

## Where this shows up in data engineering

"Equal remainders imply a divisible difference" is the trick behind **detecting batches that balance** (debits = credits within a period), and the general shape "prefix state + hash map of first occurrence" solves "longest period where X equals Y", "longest balanced run" and "subarray sum equals k" (see the Python track's subarray-sum problem).

## Solution

```python solution
def has_multiple_run(nums: list[int], k: int) -> bool:
    first = {0: -1}               # remainder -> first index where the prefix had it
    running = 0
    for i, x in enumerate(nums):
        running = (running + x) % k
        if running in first:
            if i - first[running] >= 2:
                return True
        else:
            first[running] = i    # keep the earliest index: it gives the longest run
    return False
```

## Tests

Your solution should pass these:

```python tests
assert has_multiple_run([23, 2, 4, 6, 7], 6) is True
assert has_multiple_run([23, 2, 6, 4, 6], 6) is True
assert has_multiple_run([23, 2, 6, 4, 7], 13) is False
assert has_multiple_run([5, 0, 0, 0], 3) is True
assert has_multiple_run([1, 0], 2) is False
assert has_multiple_run([0], 1) is False
assert has_multiple_run([1, 2, 12], 6) is False
```

## Explanation

**Key identity:** `(P[j+1] - P[i]) % k == 0 ⇔ P[j+1] % k == P[i] % k`. So we only need to know whether a remainder has been seen before, and where.

**Details that trip people up:**
- Seed `{0: -1}` so a prefix that is itself divisible (starting at index 0) is found.
- Store the **first** occurrence only. Overwriting it would shorten runs and miss the length ≥ 2 requirement (`[5, 0, 0, 0]`).
- Length ≥ 2 means `i - first ≥ 2`.

**Complexity:** O(n) time, O(min(n, k)) space.

## Follow-up questions

<details><summary>Count the subarrays whose sum is divisible by k.</summary>

Count remainders: for each prefix remainder r, add `count[r]` (previous prefixes with the same remainder) to the answer, then increment `count[r]`. In Python `%` is already non-negative for negative numbers; in Java/C++ normalise with `((x % k) + k) % k`.

</details>

<details><summary>Find the longest subarray with equal numbers of 0s and 1s.</summary>

Map 0 → -1, keep a running sum, store the first index of each sum; the longest distance between equal sums is the answer. Same template.

</details>
