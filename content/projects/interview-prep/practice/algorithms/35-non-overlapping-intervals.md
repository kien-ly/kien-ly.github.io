---
title: "Fewest Removals to Make Intervals Non-Overlapping"
description: "Greedy by earliest end time (activity selection): keep the interval that frees up soonest."
url: "/interview-prep/practice/algorithms/35-non-overlapping-intervals/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 35
---

# Fewest Removals to Make Intervals Non-Overlapping

**Pattern:** Merge Intervals · **Difficulty:** Medium · **Asked at:** Meta, Amazon, Google

**Classic version:** [LeetCode 435](https://leetcode.com/problems/non-overlapping-intervals/) · [LeetCode 452](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/)

## Problem

Given `[start, end)` intervals (touching is fine), return the minimum number to remove so the rest don't overlap.

## Examples

```text
min_removals([[1, 2], [2, 3], [3, 4], [1, 3]]) → 1
min_removals([[1, 2], [1, 2], [1, 2]])         → 2
min_removals([[1, 2], [2, 3]])                 → 0
```

## Starter code

```python starter
def min_removals(intervals: list[list[int]]) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Equivalent: keep the maximum number of non-overlapping intervals, then removals = total − kept.

</details>

<details><summary>Hint 2</summary>

Sort by **end**. Always keep the interval that ends first among those compatible with what you've kept.

</details>

## Where this shows up in data engineering

Activity selection is how you **schedule the most jobs on a single exclusive resource** (one writer per table, one maintenance window per cluster) and how you de-conflict overlapping validity windows by dropping the fewest records.

## Solution

```python solution
def min_removals(intervals):
    kept, last_end = 0, float("-inf")
    for start, end in sorted(intervals, key=lambda iv: iv[1]):
        if start >= last_end:          # compatible with everything kept so far
            kept += 1
            last_end = end
    return len(intervals) - kept
```

## Tests

Your solution should pass these:

```python tests
assert min_removals([[1, 2], [2, 3], [3, 4], [1, 3]]) == 1
assert min_removals([[1, 2], [1, 2], [1, 2]]) == 2
assert min_removals([[1, 2], [2, 3]]) == 0
assert min_removals([]) == 0
assert min_removals([[1, 100], [11, 22], [1, 11], [2, 12]]) == 2
```

## Explanation

**Why earliest end wins (exchange argument):** take any optimal set and its first interval. Swapping it for the interval with the globally earliest end can't create a conflict (it ends no later), so an optimal solution exists that starts with the earliest-ending interval. Repeat on what remains.

**Common mistake:** sorting by start and keeping the first: one long early interval would block many short ones.

**Complexity:** O(n log n) for the sort, O(1) extra.

## Follow-up questions

<details><summary>Each interval has a weight (value); maximise the total kept weight.</summary>

Weighted interval scheduling is DP: sort by end, `dp[i] = max(dp[i-1], w[i] + dp[p(i)])` where `p(i)` is the last interval ending ≤ start[i], found by binary search. O(n log n).

</details>
