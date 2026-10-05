---
title: "Merge Overlapping Time Intervals"
description: "Sort and sweep to merge overlapping or touching intervals, the basis of session and subscription coverage logic."
url: "/interview-prep/practice/python/08-merge-intervals/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 8
---

# Merge Overlapping Time Intervals

**Difficulty:** Medium · **Topics:** intervals, sorting, sweep · **Asked at:** Google, Meta, Netflix, Uber

## Problem

Given a list of `[start, end]` intervals (integers, `start <= end`, unsorted), merge all intervals that **overlap or touch** (`next.start <= current.end`) and return them sorted by start.

## Examples

```text
merge([[8, 10], [1, 3], [2, 6], [15, 18], [6, 7]]) → [[1, 7], [8, 10], [15, 18]]
```

## Starter code

```python starter
def merge(intervals: list[list[int]]) -> list[list[int]]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Sort by start. Then each interval either extends the last merged one or starts a new one.

</details>

## Solution

```python solution
def merge(intervals: list[list[int]]) -> list[list[int]]:
    merged: list[list[int]] = []
    for start, end in sorted(intervals):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged
```

## Tests

Your solution should pass these:

```python tests
assert merge([[8, 10], [1, 3], [2, 6], [15, 18], [6, 7]]) == [[1, 7], [8, 10], [15, 18]]
assert merge([[1, 10], [2, 3], [4, 5]]) == [[1, 10]]
assert merge([[1, 2], [2, 3]]) == [[1, 3]]
assert merge([]) == []
assert merge([[5, 5]]) == [[5, 5]]
```

## Explanation

O(n log n) for the sort, O(n) sweep. The `max()` is the part people forget: `[1, 10]` swallowing `[2, 3]` must keep end 10. Same logic as the SQL version (running max of previous ends).

## Follow-up questions

<details><summary>Intervals arrive as a stream sorted by start. Can you emit merged intervals online?</summary>

Yes: keep only the current merged interval; when a new start exceeds its end, emit it and start a new one. O(1) memory. Without sorted input you need buffering or an interval tree.

</details>
