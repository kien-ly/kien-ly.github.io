---
title: "Container With the Most Water"
description: "Converging pointers with a greedy proof: always move the shorter wall."
url: "/interview-prep/practice/algorithms/08-container-most-water/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 8
---

# Container With the Most Water

**Pattern:** Two Pointers (Opposite Ends) · **Difficulty:** Medium · **Asked at:** Amazon, Google, Bloomberg

**Classic version:** [LeetCode 11](https://leetcode.com/problems/container-with-most-water/)

## Problem

`heights[i]` is the height of a vertical wall at position `i`. Choose two walls; together with the x-axis they form a container holding `min(heights[i], heights[j]) * (j - i)` units of water. Return the maximum amount any pair can hold.

## Examples

```text
max_water([1, 8, 6, 2, 5, 4, 8, 3, 7]) → 49   # walls at 1 and 8: min(8, 7) * 7
max_water([1, 1])                      → 1
```

## Constraints

- `2 ≤ len(heights) ≤ 10⁵`, `0 ≤ heights[i] ≤ 10⁴`.
- Target: O(n).

## Starter code

```python starter
def max_water(heights: list[int]) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Start with the widest container (both ends). Width can only shrink from here, so the only way to do better is a taller limiting wall.

</details>

<details><summary>Hint 2</summary>

Move the pointer at the shorter wall. Moving the taller one can never help: the height stays capped by the shorter wall while the width shrinks.

</details>

## Where this shows up in data engineering

The algorithm matters less here than the **proof**. Interviewers use this problem to see whether you can justify a greedy elimination argument, the same reasoning you need to defend partition pruning or skipping files based on min/max statistics.

## Solution

```python solution
def max_water(heights: list[int]) -> int:
    lo, hi = 0, len(heights) - 1
    best = 0
    while lo < hi:
        h = min(heights[lo], heights[hi])
        best = max(best, h * (hi - lo))
        # the shorter wall limits every container that uses it with a closer partner: discard it
        if heights[lo] < heights[hi]:
            lo += 1
        else:
            hi -= 1
    return best
```

## Tests

Your solution should pass these:

```python tests
assert max_water([1, 8, 6, 2, 5, 4, 8, 3, 7]) == 49
assert max_water([1, 1]) == 1
assert max_water([4, 3, 2, 1, 4]) == 16
assert max_water([1, 2, 1]) == 2
assert max_water([0, 0, 0]) == 0
```

## Explanation

**Elimination proof:** say `heights[lo] ≤ heights[hi]`. Every container using `lo` with some `j < hi` has width `< hi - lo` and height `≤ heights[lo]`, so it holds less than the container we just measured. Therefore `lo` is useless for all remaining pairs and can be discarded. Each step discards one wall, so O(n).

**Complexity:** O(n) time, O(1) space versus O(n²) brute force.

**Don't confuse with Trapping Rain Water:** there, every bar holds water above it (sum over positions); here, only two walls matter (max over pairs).

## Follow-up questions

<details><summary>Prove the greedy step formally in one sentence.</summary>

If `h[lo] ≤ h[hi]`, then for every `j` in `(lo, hi)`: `area(lo, j) = min(h[lo], h[j])·(j-lo) ≤ h[lo]·(hi-lo)`, and the right side is `area(lo, hi)`, already considered. So no unexamined pair containing `lo` can be better.

</details>
