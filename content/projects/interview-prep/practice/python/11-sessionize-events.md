---
title: "Sessionize User Events"
description: "Group time-ordered events into sessions per user with an inactivity timeout and compute session summaries."
url: "/interview-prep/practice/python/11-sessionize-events/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 11
---

# Sessionize User Events

**Difficulty:** Medium · **Topics:** sliding-window, grouping, sessionization · **Asked at:** Google, Spotify, Pinterest, Amplitude

## Problem

Events are `(user_id, ts)` with `ts` in seconds, **not** sorted. A session ends when the gap to the user's next event is **greater than** `timeout` seconds. Return a list of `(user_id, session_start, session_end, n_events)` sorted by user_id then start.

## Starter code

```python starter
def sessionize(events: list[tuple[str, int]], timeout: int = 1800) -> list[tuple[str, int, int, int]]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Sort by (user, ts). Walk once, opening a new session when the user changes or the gap exceeds the timeout.

</details>

## Solution

```python solution
def sessionize(events, timeout=1800):
    out = []
    cur = None   # [user, start, end, count]
    for user, ts in sorted(events):
        if cur and user == cur[0] and ts - cur[2] <= timeout:
            cur[2] = ts
            cur[3] += 1
        else:
            if cur:
                out.append(tuple(cur))
            cur = [user, ts, ts, 1]
    if cur:
        out.append(tuple(cur))
    return out
```

## Tests

Your solution should pass these:

```python tests
ev = [("u1", 0), ("u1", 1700), ("u2", 50), ("u1", 3500), ("u1", 5400), ("u2", 1900), ("u2", 1850)]
assert sessionize(ev) == [("u1", 0, 3500, 3), ("u1", 5400, 5400, 1), ("u2", 50, 1900, 3)]
assert sessionize([], 10) == []
assert sessionize([("a", 0), ("a", 10), ("a", 21)], timeout=10) == [("a", 0, 10, 2), ("a", 21, 21, 1)]
```

## Explanation

O(n log n) because of the sort; O(n) if events are already grouped and ordered (as in a Spark window partition). Boundaries: a gap equal to the timeout stays in the session (`<=`). Ask which the business wants.

## Follow-up questions

<details><summary>Events arrive as an unbounded stream, out of order by up to 5 minutes. How do you emit sessions?</summary>

Per-user state (open session start/end) plus event-time timers: close a session when the watermark passes `last_event + timeout`. Out-of-order events within the watermark can extend or merge sessions. This is what Flink session windows and Spark `session_window` do.

</details>
