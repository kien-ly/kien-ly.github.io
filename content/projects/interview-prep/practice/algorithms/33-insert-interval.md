---
title: "Insert an Interval Into a Sorted Schedule"
description: "Three-phase linear scan: copy intervals before, merge the overlapping ones, copy the rest."
url: "/interview-prep/practice/algorithms/33-insert-interval/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 33
---

# Insert an Interval Into a Sorted Schedule

**Pattern:** Merge Intervals · **Difficulty:** Medium · **Asked at:** Google, LinkedIn, Meta

**Classic version:** [LeetCode 57](https://leetcode.com/problems/insert-interval/) · [LeetCode 56](https://leetcode.com/problems/merge-intervals/)

## Problem

`schedule` is a list of non-overlapping `[start, end]` intervals sorted by start (e.g. maintenance windows). Insert `new` and return the schedule, still sorted and non-overlapping, merging where necessary. Intervals that touch (`end == start`) are merged.

## Examples

```text
insert_interval([[1, 3], [6, 9]], [2, 5])                       → [[1, 5], [6, 9]]
insert_interval([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]) → [[1, 2], [3, 10], [12, 16]]
```

## Starter code

```python starter
def insert_interval(schedule: list[list[int]], new: list[int]) -> list[list[int]]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Everything ending before `new` starts is untouched; everything starting after `new` ends is untouched.

</details>

<details><summary>Hint 2</summary>

In between, all intervals overlap `new`: grow `new` to cover them (min start, max end).

</details>

## Where this shows up in data engineering

Maintaining sorted, non-overlapping ranges is how **SCD2 validity windows**, partition/offset ranges in ingestion checkpoints, and reserved time slots are updated incrementally. Re-sorting everything on each insert is the naive answer; the linear merge is the production one.

## Solution

```python solution
def insert_interval(schedule, new):
    res, i, n = [], 0, len(schedule)
    start, end = new
    while i < n and schedule[i][1] < start:          # entirely before
        res.append(schedule[i])
        i += 1
    while i < n and schedule[i][0] <= end:           # overlapping: absorb
        start = min(start, schedule[i][0])
        end = max(end, schedule[i][1])
        i += 1
    res.append([start, end])
    res.extend(schedule[i:])                         # entirely after
    return res
```

## Tests

Your solution should pass these:

```python tests
assert insert_interval([[1, 3], [6, 9]], [2, 5]) == [[1, 5], [6, 9]]
assert insert_interval([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]) == [[1, 2], [3, 10], [12, 16]]
assert insert_interval([], [5, 7]) == [[5, 7]]
assert insert_interval([[1, 5]], [6, 8]) == [[1, 5], [6, 8]]
assert insert_interval([[1, 5]], [5, 7]) == [[1, 7]]
assert insert_interval([[3, 5]], [1, 2]) == [[1, 2], [3, 5]]
```

## Explanation

**Three phases** over the already-sorted input: copy, merge, copy. O(n) time, versus O(n log n) for appending and re-running a full merge.

**Overlap test:** with sorted input, interval `[a, b]` overlaps `[start, end]` when `a <= end` and `b >= start`; phase 1 handles the `b < start` case, so phase 2 only checks `a <= end`. Changing `<` to `<=` (and vice versa) is how you switch between "touching intervals merge" and "touching intervals stay separate". Clarify that with the interviewer.

**Finding the start in O(log n)** with binary search is possible, but the output is O(n) anyway.

## Follow-up questions

<details><summary>The schedule has millions of intervals and receives frequent inserts. Data structure?</summary>

A balanced BST / sorted container keyed by start (e.g. `sortedcontainers.SortedList`), or an interval tree. Find neighbours in O(log n), merge locally, so each insert is O(log n + merged).

</details>
