---
title: "Moving Average from a Data Stream"
description: "A class that maintains a fixed-size sliding window and returns the moving average in O(1) per value."
url: "/interview-prep/practice/python/12-moving-average-stream/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 12
---

# Moving Average from a Data Stream

**Difficulty:** Medium · **Topics:** sliding-window, deque, design · **Asked at:** Google, Two Sigma, Robinhood

## Problem

Implement `MovingAverage(size)` with `next(value) -> float` returning the average of the last `size` values (or of all values if fewer). Each call must be O(1).

## Starter code

```python starter
class MovingAverage:
    def __init__(self, size: int):
        pass

    def next(self, value: float) -> float:
        pass
```

## Hints

<details><summary>Hint 1</summary>

A deque plus a running sum: add the new value, subtract the evicted one.

</details>

## Solution

```python solution
from collections import deque

class MovingAverage:
    def __init__(self, size: int):
        if size <= 0:
            raise ValueError("size must be positive")
        self.size = size
        self.window = deque()
        self.total = 0.0

    def next(self, value: float) -> float:
        self.window.append(value)
        self.total += value
        if len(self.window) > self.size:
            self.total -= self.window.popleft()
        return self.total / len(self.window)
```

## Tests

Your solution should pass these:

```python tests
m = MovingAverage(3)
assert m.next(1) == 1.0
assert m.next(10) == 5.5
assert abs(m.next(3) - 14 / 3) < 1e-9
assert m.next(5) == 6.0
try:
    MovingAverage(0)
    assert False, "should raise"
except ValueError:
    pass
```

## Explanation

O(1) time per value and O(size) memory. With floats, a long-running sum accumulates rounding error. Mention periodic recomputation or `math.fsum`/Kahan summation for long-lived streams. A time-based window (last 5 minutes) uses the same deque but evicts by timestamp instead of count.
