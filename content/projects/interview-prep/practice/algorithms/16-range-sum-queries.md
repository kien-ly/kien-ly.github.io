---
title: "Range Sum Queries in 1D and 2D (Precompute Once, Answer in O(1))"
description: "Prefix sums and 2D summed-area tables: answer any range-sum query in constant time after linear preprocessing."
url: "/interview-prep/practice/algorithms/16-range-sum-queries/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 16
---

# Range Sum Queries in 1D and 2D (Precompute Once, Answer in O(1))

**Pattern:** Prefix Sum · **Difficulty:** Medium · **Asked at:** Meta, Google, Amazon

**Classic version:** [LeetCode 303](https://leetcode.com/problems/range-sum-query-immutable/) · [LeetCode 304](https://leetcode.com/problems/range-sum-query-2d-immutable/)

## Problem

Implement two classes. Both receive data once and then answer many queries.

1. `RangeSum(nums)` with `query(i, j)` → sum of `nums[i..j]` inclusive.
2. `GridSum(grid)` with `query(r1, c1, r2, c2)` → sum of the rectangle with top-left `(r1, c1)` and bottom-right `(r2, c2)` inclusive.

Each query must be O(1).

## Examples

```text
rs = RangeSum([-2, 0, 3, -5, 2, -1])
rs.query(0, 2) → 1     rs.query(2, 5) → -1     rs.query(0, 5) → -3

gs = GridSum([[3, 0, 1], [5, 6, 3], [1, 2, 0]])
gs.query(1, 1, 2, 2) → 11    # 6 + 3 + 2 + 0
```

## Starter code

```python starter
class RangeSum:
    def __init__(self, nums: list[int]):
        pass

    def query(self, i: int, j: int) -> int:
        pass


class GridSum:
    def __init__(self, grid: list[list[int]]):
        pass

    def query(self, r1: int, c1: int, r2: int, c2: int) -> int:
        pass
```

## Hints

<details><summary>Hint 1</summary>

Store `P[k]` = sum of the first `k` elements (`P[0] = 0`). Then `sum(i..j) = P[j+1] - P[i]`.

</details>

<details><summary>Hint 2</summary>

In 2D, `S[r][c]` = sum of the rectangle from `(0,0)` to `(r-1,c-1)`. A query is inclusion–exclusion of four corners.

</details>

## Where this shows up in data engineering

This is **pre-aggregation**: cumulative sums are why a `SUM() OVER (ORDER BY day)` running total answers any date-range total by subtraction, why OLAP cubes and materialised rollups exist, and how image/heatmap tools compute region totals instantly. The 2D version is the "summed-area table" behind fast dashboard tiles over (time × region) grids.

## Solution

```python solution
class RangeSum:
    def __init__(self, nums):
        self.prefix = [0]
        for x in nums:
            self.prefix.append(self.prefix[-1] + x)

    def query(self, i, j):
        return self.prefix[j + 1] - self.prefix[i]


class GridSum:
    def __init__(self, grid):
        rows, cols = len(grid), len(grid[0]) if grid else 0
        # S has a padding row/column of zeros so corner cases need no ifs
        self.S = [[0] * (cols + 1) for _ in range(rows + 1)]
        for r in range(rows):
            for c in range(cols):
                self.S[r + 1][c + 1] = grid[r][c] + self.S[r][c + 1] + self.S[r + 1][c] - self.S[r][c]

    def query(self, r1, c1, r2, c2):
        S = self.S
        return S[r2 + 1][c2 + 1] - S[r1][c2 + 1] - S[r2 + 1][c1] + S[r1][c1]
```

## Tests

Your solution should pass these:

```python tests
rs = RangeSum([-2, 0, 3, -5, 2, -1])
assert rs.query(0, 2) == 1
assert rs.query(2, 5) == -1
assert rs.query(0, 5) == -3
assert rs.query(3, 3) == -5
gs = GridSum([[3, 0, 1, 4, 2], [5, 6, 3, 2, 1], [1, 2, 0, 1, 5], [4, 1, 0, 1, 7], [1, 0, 3, 0, 5]])
assert gs.query(2, 1, 4, 3) == 8
assert gs.query(1, 1, 2, 2) == 11
assert gs.query(1, 2, 2, 4) == 12
assert gs.query(0, 0, 0, 0) == 3
```

## Explanation

**1D:** O(n) build, O(1) query, O(n) space. The leading zero means `query(0, j)` needs no special case.

**2D inclusion–exclusion:** the rectangle `(r1,c1)–(r2,c2)` = everything up to `(r2,c2)` − the strip above `r1` − the strip left of `c1` + the top-left block (subtracted twice). Build uses the same identity in reverse. O(R·C) build, O(1) query.

**When it breaks:** updates. Changing one element invalidates O(n) prefix entries. With frequent updates use a **Fenwick tree** (binary indexed tree) or segment tree: O(log n) update and query.

## Follow-up questions

<details><summary>Values change frequently (1:1 ratio of updates to queries). What now?</summary>

A Fenwick tree gives O(log n) point update and O(log n) prefix sum in ~10 lines; a segment tree also supports range updates with lazy propagation. Pure prefix sums would make each update O(n).

</details>

<details><summary>How does this relate to how you'd serve 'total sales between any two dates' on a dashboard?</summary>

Store a daily cumulative total table; any range total is two lookups and a subtraction. It's the same reason an append-only running total is cheap to maintain: today's cumulative = yesterday's + today's sum.

</details>
