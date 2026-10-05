---
title: "Shortest Path Through a Grid With Obstacles"
description: "BFS gives shortest paths in unweighted graphs: minimum steps from top-left to bottom-right."
url: "/interview-prep/practice/algorithms/41-shortest-path-grid/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 41
---

# Shortest Path Through a Grid With Obstacles

**Pattern:** Graphs: BFS, DFS and Union-Find · **Difficulty:** Medium · **Asked at:** Amazon, Meta, Uber, DoorDash

**Classic version:** [LeetCode 1091](https://leetcode.com/problems/shortest-path-in-binary-matrix/) · [LeetCode 127](https://leetcode.com/problems/word-ladder/)

## Problem

`grid` is a list of strings; `'.'` is open and `'#'` is blocked. Moving up/down/left/right costs 1. Return the minimum number of moves from the top-left to the bottom-right cell, or `-1` if unreachable (including when either end is blocked).

## Examples

```text
shortest_path(["..",
               ".."])        → 2
shortest_path([".#.",
               ".#.",
               "..."])       → 4
```

## Starter code

```python starter
def shortest_path(grid: list[str]) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

BFS explores cells in order of distance, so the first time you reach the target is via a shortest path.

</details>

<details><summary>Hint 2</summary>

Store the distance with each queued cell (or process the queue level by level).

</details>

## Where this shows up in data engineering

BFS levels answer "how many hops?": degrees of separation in a user graph, **how far downstream a broken table's impact reaches in lineage** (blast radius by hop count), and the minimum number of transformations between schemas. With weighted edges (cost, latency) switch to Dijkstra.

## Solution

```python solution
from collections import deque


def shortest_path(grid):
    if not grid or grid[0][0] == "#" or grid[-1][-1] == "#":
        return -1
    rows, cols = len(grid), len(grid[0])
    q = deque([(0, 0, 0)])
    seen = {(0, 0)}
    while q:
        r, c, d = q.popleft()
        if (r, c) == (rows - 1, cols - 1):
            return d
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "." and (nr, nc) not in seen:
                seen.add((nr, nc))
                q.append((nr, nc, d + 1))
    return -1
```

## Tests

Your solution should pass these:

```python tests
assert shortest_path(["..", ".."]) == 2
assert shortest_path([".#.", ".#.", "..."]) == 4
assert shortest_path(["."]) == 0
assert shortest_path(["#"]) == -1
assert shortest_path([".#", "#."]) == -1
assert shortest_path(["....", "###.", "....", ".###", "...."]) == 13
```

## Explanation

**Why BFS is shortest:** it processes all cells at distance d before any at distance d+1 (FIFO queue), so the first arrival at the target is optimal. DFS gives *a* path, not the shortest.

**Complexity:** O(R·C) time and space.

**Variants:** 8-directional moves (add diagonals), weighted cells (Dijkstra with a heap), "remove up to k obstacles" (BFS over states `(r, c, k_left)`), and bidirectional BFS to roughly square-root the explored area on large graphs.

## Follow-up questions

<details><summary>Moving into some cells costs more (e.g. congested roads). What changes?</summary>

Dijkstra: a min-heap of `(cost, r, c)`; pop the cheapest, relax neighbours with `cost + weight`. O(E log V). With only 0/1 weights, a deque-based 0-1 BFS is O(V + E).

</details>
