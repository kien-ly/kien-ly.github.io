---
title: "Peak Concurrent Sessions (Meeting Rooms II)"
description: "Find the maximum number of overlapping intervals with a sweep over start/end events or a min-heap."
url: "/interview-prep/practice/python/09-peak-concurrency/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 9
---

# Peak Concurrent Sessions (Meeting Rooms II)

**Difficulty:** Medium · **Topics:** intervals, heap, sweep-line · **Asked at:** Netflix, Zoom, Amazon, Bloomberg

## Problem

Each session is `(start, end)` with `end` **exclusive** (a session ending at 10 and one starting at 10 don't overlap). Return `(peak, first_time_peak_reached)`. For an empty input return `(0, None)`.

## Starter code

```python starter
def peak_concurrency(sessions: list[tuple[int, int]]) -> tuple[int, int | None]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Turn each session into events (start, +1) and (end, −1); sort with ends before starts at equal times.

</details>

<details><summary>Hint 2</summary>

Alternatively: sort by start and keep a min-heap of end times.

</details>

## Solution

```python solution
def peak_concurrency(sessions):
    events = []
    for s, e in sessions:
        events.append((s, 1))
        events.append((e, -1))
    events.sort(key=lambda x: (x[0], x[1]))   # -1 sorts before +1 at the same time
    cur = peak = 0
    peak_at = None
    for t, delta in events:
        cur += delta
        if cur > peak:
            peak, peak_at = cur, t
    return peak, peak_at
```

## Tests

Your solution should pass these:

```python tests
assert peak_concurrency([(0, 30), (5, 10), (15, 20)]) == (2, 5)
assert peak_concurrency([(1, 10), (10, 20)]) == (1, 1)
assert peak_concurrency([(1, 5), (2, 6), (3, 7), (6, 8)]) == (3, 3)
assert peak_concurrency([]) == (0, None)
```

## Explanation

O(n log n). The sort key `(time, delta)` processes −1 before +1, encoding the exclusive end. The heap alternative (rooms problem) gives the same peak: sort by start, pop ended sessions, push the current end, and track the heap size.
