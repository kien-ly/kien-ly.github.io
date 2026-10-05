---
title: "Subsets and Combination Sum (Backtracking)"
description: "The choose/explore/un-choose template: enumerate all subsets, then all combinations that hit a target."
url: "/interview-prep/practice/algorithms/46-subsets-and-combination-sum/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 46
---

# Subsets and Combination Sum (Backtracking)

**Pattern:** Backtracking and Tries · **Difficulty:** Medium · **Asked at:** Meta, Amazon, Uber, Airbnb

**Classic version:** [LeetCode 78](https://leetcode.com/problems/subsets/) · [LeetCode 39](https://leetcode.com/problems/combination-sum/)

## Problem

1. `subsets(items)`: all subsets of distinct `items`, each subset in input order, the whole list sorted (use `sorted()`).
2. `combination_sum(candidates, target)`: all unique combinations of positive `candidates` (each usable unlimited times) summing to `target`. Each combination ascending, the list sorted.

## Examples

```text
subsets([1, 2, 3])               → [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
combination_sum([2, 3, 6, 7], 7) → [[2, 2, 3], [7]]
```

## Starter code

```python starter
def subsets(items: list[int]) -> list[list[int]]:
    pass


def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Recursive helper `go(start, path)`: record or check `path`, then for each index `i ≥ start`, append, recurse, pop.

</details>

<details><summary>Hint 2</summary>

For combination sum, recurse with `i` (not `i+1`) to allow reuse, and stop early once the remaining target is negative (sort candidates to break out of the loop).

</details>

## Where this shows up in data engineering

Enumerating combinations shows up in **test-case generation** (all combinations of feature flags or schema variants), choosing which partitions to backfill under a budget, and query planning (join-order enumeration is backtracking with pruning). Always discuss the exponential output size and how pruning keeps it tractable.

## Solution

```python solution
def subsets(items):
    res, path = [], []

    def go(start):
        res.append(path[:])                  # every node of the tree is a subset
        for i in range(start, len(items)):
            path.append(items[i])            # choose
            go(i + 1)                        # explore
            path.pop()                       # un-choose
    go(0)
    return sorted(res)


def combination_sum(candidates, target):
    cands = sorted(set(candidates))
    res, path = [], []

    def go(start, remaining):
        if remaining == 0:
            res.append(path[:])
            return
        for i in range(start, len(cands)):
            c = cands[i]
            if c > remaining:                # sorted: no later candidate fits either
                break
            path.append(c)
            go(i, remaining - c)             # i, not i+1: reuse allowed
            path.pop()
    go(0, target)
    return sorted(res)
```

## Tests

Your solution should pass these:

```python tests
assert subsets([1, 2, 3]) == [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
assert subsets([]) == [[]]
assert len(subsets(list(range(10)))) == 1024
assert combination_sum([2, 3, 6, 7], 7) == [[2, 2, 3], [7]]
assert combination_sum([2, 3, 5], 8) == [[2, 2, 2, 2], [2, 3, 3], [3, 5]]
assert combination_sum([2], 1) == []
```

## Explanation

**Template:** choose → explore → un-choose, with `start` to avoid revisiting earlier elements (which is what prevents duplicate *combinations*). Copy `path[:]` when recording: appending `path` itself would store a reference that later changes.

**Complexity:** subsets O(n · 2ⁿ) (there are 2ⁿ subsets of average size n/2). Combination sum is exponential in `target / min(candidates)`; sorting + `break` prunes branches early.

**Iterative subsets:** `res = [[]]; for x in items: res += [s + [x] for s in res]`, or bitmasks `0..2ⁿ-1`.

## Follow-up questions

<details><summary>Candidates contain duplicates and each can be used once (Combination Sum II).</summary>

Sort, recurse with `i + 1`, and skip `i > start and cands[i] == cands[i-1]` to avoid duplicate combinations.

</details>
