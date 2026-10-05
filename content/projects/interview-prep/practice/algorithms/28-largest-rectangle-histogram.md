---
title: "Largest Rectangle in a Histogram"
description: "Increasing monotonic stack: each bar is popped when its maximal width becomes known."
url: "/interview-prep/practice/algorithms/28-largest-rectangle-histogram/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 28
---

# Largest Rectangle in a Histogram

**Pattern:** Monotonic Stack · **Difficulty:** Hard · **Asked at:** Amazon, Google, Microsoft

**Classic version:** [LeetCode 84](https://leetcode.com/problems/largest-rectangle-in-histogram/) · [LeetCode 85](https://leetcode.com/problems/maximal-rectangle/)

## Problem

`heights[i]` is the height of a histogram bar of width 1. Return the area of the largest rectangle that fits entirely under the histogram.

## Examples

```text
largest_rectangle([2, 1, 5, 6, 2, 3]) → 10   # bars 5 and 6, height 5, width 2
largest_rectangle([2, 4])             → 4
```

## Starter code

```python starter
def largest_rectangle(heights: list[int]) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

For bar `i` as the shortest bar of the rectangle, the rectangle extends to the nearest shorter bar on each side.

</details>

<details><summary>Hint 2</summary>

Keep an increasing stack of indices. When a shorter bar arrives, the popped bar's right limit is the current index and its left limit is the new stack top.

</details>

<details><summary>Hint 3</summary>

Append a sentinel bar of height 0 to flush the stack at the end.

</details>

## Where this shows up in data engineering

A classic "hard" that tests whether you truly understand monotonic stacks rather than pattern-matching. The 2D extension (largest all-ones rectangle in a matrix) builds a histogram per row: the same "reduce a 2D problem to repeated 1D" move used in grid/heatmap aggregations.

## Solution

```python solution
def largest_rectangle(heights: list[int]) -> int:
    stack = []                                   # indices of bars with increasing heights
    best = 0
    for i, h in enumerate(heights + [0]):        # sentinel flushes everything
        while stack and heights[stack[-1]] > h:
            top = stack.pop()
            left = stack[-1] if stack else -1    # nearest shorter bar on the left
            width = i - left - 1                 # i is the nearest shorter bar on the right
            best = max(best, heights[top] * width)
        stack.append(i)
    return best
```

## Tests

Your solution should pass these:

```python tests
assert largest_rectangle([2, 1, 5, 6, 2, 3]) == 10
assert largest_rectangle([2, 4]) == 4
assert largest_rectangle([]) == 0
assert largest_rectangle([5]) == 5
assert largest_rectangle([1, 1, 1, 1]) == 4
assert largest_rectangle([6, 2, 5, 4, 5, 1, 6]) == 12
assert largest_rectangle([4, 2, 0, 3, 2, 5]) == 6
```

## Explanation

**Reframe:** the optimal rectangle has some bar as its shortest; for that bar, the rectangle spans between the nearest strictly shorter bars on each side. So we need "previous smaller" and "next smaller" for every bar, which is exactly what an increasing stack produces.

**Mechanics:** when `h` arrives and is shorter than the stack top, the top's next-smaller is `i`, and its previous-smaller is whatever lies below it in the stack. Compute its area and pop. The sentinel `0` at the end pops everything left.

**Complexity:** O(n) time, O(n) space; each index is pushed and popped once.

## Follow-up questions

<details><summary>Largest rectangle of 1s in a binary matrix?</summary>

For each row, compute `heights[c]` = consecutive 1s ending at this row in column c, then run `largest_rectangle` on that row. O(R·C).

</details>
