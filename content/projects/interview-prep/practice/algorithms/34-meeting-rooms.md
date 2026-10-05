---
title: "Meeting Rooms: Any Conflict? How Many Rooms?"
description: "Sort by start for conflicts; a min-heap of end times (or a sweep over +1/-1 events) for the number of rooms."
url: "/interview-prep/practice/algorithms/34-meeting-rooms/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 34
---

# Meeting Rooms: Any Conflict? How Many Rooms?

**Pattern:** Merge Intervals · **Difficulty:** Medium · **Asked at:** Meta, Google, Amazon, Uber

**Classic version:** [LeetCode 252](https://leetcode.com/problems/meeting-rooms/) · [LeetCode 253](https://leetcode.com/problems/meeting-rooms-ii/)

## Problem

Meetings are `[start, end)` half-open intervals (a meeting ending at 10 doesn't conflict with one starting at 10).

1. `can_attend_all(meetings)`: `True` if no two meetings overlap.
2. `min_rooms(meetings)`: the minimum number of rooms needed to host all of them.

## Examples

```text
can_attend_all([[0, 30], [5, 10], [15, 20]]) → False
can_attend_all([[7, 10], [2, 4]])            → True
min_rooms([[0, 30], [5, 10], [15, 20]])      → 2
min_rooms([[1, 5], [5, 10]])                 → 1
```

## Starter code

```python starter
def can_attend_all(meetings: list[list[int]]) -> bool:
    pass


def min_rooms(meetings: list[list[int]]) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Sort by start; a conflict exists if some meeting starts before the previous one ends.

</details>

<details><summary>Hint 2</summary>

Rooms: process meetings by start time, keeping a min-heap of end times of rooms in use. If the earliest-ending room is free (`end <= start`), reuse it.

</details>

## Where this shows up in data engineering

"Peak concurrency" is the same question: maximum simultaneous sessions, concurrent jobs on a cluster, open connections. In SQL it's a sweep: `UNION ALL` of `+1` at start and `-1` at end, then a running `SUM() OVER (ORDER BY ts, delta)`. That's why this problem appears in both coding and SQL rounds.

## Solution

```python solution
import heapq


def can_attend_all(meetings):
    meetings = sorted(meetings)
    return all(prev[1] <= cur[0] for prev, cur in zip(meetings, meetings[1:]))


def min_rooms(meetings):
    ends = []                                  # min-heap of end times of occupied rooms
    for start, end in sorted(meetings):
        if ends and ends[0] <= start:          # earliest room is free again
            heapq.heapreplace(ends, end)
        else:
            heapq.heappush(ends, end)
    return len(ends)
```

## Tests

Your solution should pass these:

```python tests
assert can_attend_all([[0, 30], [5, 10], [15, 20]]) is False
assert can_attend_all([[7, 10], [2, 4]]) is True
assert can_attend_all([]) is True
assert can_attend_all([[1, 5], [5, 10]]) is True
assert min_rooms([[0, 30], [5, 10], [15, 20]]) == 2
assert min_rooms([[7, 10], [2, 4]]) == 1
assert min_rooms([[1, 5], [5, 10]]) == 1
assert min_rooms([[1, 10], [2, 7], [3, 19], [8, 12], [10, 20], [11, 30]]) == 4
assert min_rooms([]) == 0
```

## Explanation

**Conflicts:** after sorting by start, only adjacent pairs need checking. O(n log n).

**Rooms with a heap:** the heap size is the number of rooms in use; reusing the room that frees up earliest is optimal (greedy). O(n log n).

**Sweep-line alternative:** sort all starts and all ends separately; walk both with two pointers, `+1` on a start, `-1` when an end ≤ the next start. The running maximum is the answer. Process ends before starts at equal times to honour the half-open convention.

**Same answer, three framings:** heap of end times, sweep of events, and SQL running sum. Being able to switch between them is a strong signal.

## Follow-up questions

<details><summary>Return which room each meeting gets.</summary>

Keep `(end, room_id)` in the heap; when reusing, pop the room id and assign it; when allocating, use `len(heap)` as the new id.

</details>

<details><summary>Compute peak concurrent sessions per hour from 5 billion session records.</summary>

Explode each session into `+1/-1` events (or into per-minute buckets if sessions are short), aggregate deltas by timestamp, then a running sum ordered by time within each hour, taking the max. In Spark, partition by day to keep the running sum parallel; carry the open-session count across partition boundaries.

</details>
