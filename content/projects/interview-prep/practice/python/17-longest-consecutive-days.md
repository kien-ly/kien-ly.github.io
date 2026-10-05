---
title: "Longest Streak of Consecutive Days (O(n))"
description: "Find the longest run of consecutive integers (day numbers) in an unsorted list in linear time using a set."
url: "/interview-prep/practice/python/17-longest-consecutive-days/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 17
---

# Longest Streak of Consecutive Days (O(n))

**Difficulty:** Medium · **Topics:** hash-set, streaks, arrays · **Asked at:** Google, Duolingo, Meta

## Problem

Given an unsorted list of integers representing active day numbers (duplicates possible), return the length of the longest run of consecutive days. Must be O(n) on average (no sorting).

## Starter code

```python starter
def longest_streak(days: list[int]) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Put everything in a set. Only start counting from a day whose predecessor is absent.

</details>

## Solution

```python solution
def longest_streak(days: list[int]) -> int:
    s = set(days)
    best = 0
    for d in s:
        if d - 1 not in s:          # d starts a streak
            n = 1
            while d + n in s:
                n += 1
            best = max(best, n)
    return best
```

## Tests

Your solution should pass these:

```python tests
assert longest_streak([100, 4, 200, 1, 3, 2]) == 4
assert longest_streak([0, 3, 7, 2, 5, 8, 4, 6, 0, 1]) == 9
assert longest_streak([]) == 0
assert longest_streak([5, 5, 5]) == 1
```

## Explanation

Each element is visited at most twice (once in the outer loop, once while extending a streak from its start) → O(n). Sorting would be O(n log n) and is a fine first answer; mention the set trick as the optimisation. The SQL equivalent is the date − row_number gaps-and-islands pattern.
