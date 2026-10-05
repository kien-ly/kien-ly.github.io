---
title: "Running Median of a Latency Stream"
description: "Maintain the median of a stream in O(log n) per value with two heaps."
url: "/interview-prep/practice/python/19-running-median/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 19
---

# Running Median of a Latency Stream

**Difficulty:** Medium · **Topics:** heap, streaming, percentiles · **Asked at:** Google, Datadog, Amazon, Citadel

## Problem

Implement `RunningMedian` with `add(x)` and `median() -> float`. For an even count return the mean of the two middle values. `median()` on an empty structure raises `ValueError`.

## Starter code

```python starter
class RunningMedian:
    def __init__(self):
        pass

    def add(self, x: float) -> None:
        pass

    def median(self) -> float:
        pass
```

## Hints

<details><summary>Hint 1</summary>

A max-heap for the lower half (store negatives) and a min-heap for the upper half; keep sizes balanced within 1.

</details>

## Solution

```python solution
import heapq

class RunningMedian:
    def __init__(self):
        self.lo = []   # max-heap via negatives
        self.hi = []   # min-heap

    def add(self, x: float) -> None:
        heapq.heappush(self.lo, -x)
        heapq.heappush(self.hi, -heapq.heappop(self.lo))     # move largest of lo to hi
        if len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def median(self) -> float:
        if not self.lo:
            raise ValueError("empty")
        if len(self.lo) > len(self.hi):
            return float(-self.lo[0])
        return (-self.lo[0] + self.hi[0]) / 2
```

## Tests

Your solution should pass these:

```python tests
rm = RunningMedian()
out = []
for x in [5, 15, 1, 3, 8, 7, 9, 10]:
    rm.add(x)
    out.append(rm.median())
assert out == [5.0, 10.0, 5.0, 4.0, 5.0, 6.0, 7.0, 7.5]
try:
    RunningMedian().median()
    assert False
except ValueError:
    pass
```

## Explanation

O(log n) per add, O(1) per median, O(n) memory. That memory is the catch: for p95/p99 over billions of values in monitoring you use **approximate sketches** (t-digest, KLL, DDSketch) with bounded memory and mergeability across hosts and time windows.
