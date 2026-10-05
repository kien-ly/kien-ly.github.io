---
title: "Trapping Rain Water"
description: "Water above each bar is min(max-left, max-right) − height; solve with two pointers (O(1) space) or a monotonic stack."
url: "/interview-prep/practice/algorithms/27-trapping-rain-water/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 27
---

# Trapping Rain Water

**Pattern:** Monotonic Stack · **Difficulty:** Hard · **Asked at:** Amazon, Google, Goldman Sachs, Meta

**Classic version:** [LeetCode 42](https://leetcode.com/problems/trapping-rain-water/)

## Problem

`heights[i]` is the height of a bar of width 1. After rain, water collects between bars. Return the total units of water trapped.

## Examples

```text
trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) → 6
trap([4, 2, 0, 3, 2, 5])                   → 9
```

## Constraints

- `0 ≤ len(heights) ≤ 2·10⁴`, `0 ≤ heights[i] ≤ 10⁵`.
- Target: O(n) time; bonus O(1) space.

## Starter code

```python starter
def trap(heights: list[int]) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Water above bar `i` = `min(highest bar to its left, highest bar to its right) - heights[i]` (if positive).

</details>

<details><summary>Hint 2</summary>

Two pointers: whichever side has the lower running max is the limiting side. Its water is known now, so move that pointer.

</details>

## Where this shows up in data engineering

Mostly a reasoning test: can you derive the per-position formula, then remove the O(n) precomputed arrays with an argument about which side is binding? That same move, from precomputing to a streaming invariant, is what turns a two-pass batch job into a one-pass stream.

## Solution

```python solution
def trap(heights: list[int]) -> int:
    lo, hi = 0, len(heights) - 1
    left_max = right_max = water = 0
    while lo < hi:
        if heights[lo] < heights[hi]:
            # the right side has a bar at least this tall, so left_max is the binding wall
            left_max = max(left_max, heights[lo])
            water += left_max - heights[lo]
            lo += 1
        else:
            right_max = max(right_max, heights[hi])
            water += right_max - heights[hi]
            hi -= 1
    return water
```

## Tests

Your solution should pass these:

```python tests
assert trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) == 6
assert trap([4, 2, 0, 3, 2, 5]) == 9
assert trap([]) == 0
assert trap([3]) == 0
assert trap([1, 2, 3, 4]) == 0
assert trap([5, 0, 5]) == 5
assert trap([2, 0, 2, 0, 2]) == 4
```

## Explanation

**Formula:** `water[i] = max(0, min(maxL[i], maxR[i]) - h[i])`. Precomputing `maxL` and `maxR` arrays gives an easy O(n) time, O(n) space solution: a great first answer.

**Two pointers, O(1) space:** we always advance the side with the lower bar. Suppose `h[lo] < h[hi]`. Every bar we've moved past on the left came from a step where the left was the lower side, so each was shorter than some bar at or right of the current `hi`; together with `h[lo] < h[hi]` that gives `left_max ≤ (tallest bar at or right of hi) ≤ maxR[lo]`. Hence `min(maxL[lo], maxR[lo]) = left_max` (after including `h[lo]`), so the water above `lo` is already known and `lo` can advance. The right side is symmetric.

**Monotonic stack alternative:** keep a decreasing stack; when a taller bar arrives, pop the "bottom" and add the water bounded by the new bar and the bar below on the stack (layer by layer, horizontally). Also O(n).

**Complexity:** O(n) time, O(1) space.

## Follow-up questions

<details><summary>Explain the stack version in one sentence.</summary>

Each pop of a bar `mid` with a left wall `stack[-1]` and right wall `i` adds `(min(h[left], h[i]) - h[mid]) * (i - left - 1)`, filling water in horizontal layers.

</details>

<details><summary>2D version (a height map grid)?</summary>

Trapping Rain Water II: a min-heap seeded with the border cells, expanded inward (a Dijkstra-like flood fill): water at a cell = max(0, current boundary height − cell height). O(RC log(RC)).

</details>
