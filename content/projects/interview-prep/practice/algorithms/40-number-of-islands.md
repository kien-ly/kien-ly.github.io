---
title: "Count Connected Regions in a Grid (Islands)"
description: "Flood fill with iterative BFS: count 4-directionally connected regions without recursion limits."
url: "/interview-prep/practice/algorithms/40-number-of-islands/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 40
---

# Count Connected Regions in a Grid (Islands)

**Pattern:** Graphs: BFS, DFS and Union-Find · **Difficulty:** Medium · **Asked at:** Amazon, Google, Meta, Microsoft

**Classic version:** [LeetCode 200](https://leetcode.com/problems/number-of-islands/) · [LeetCode 695](https://leetcode.com/problems/max-area-of-island/)

## Problem

`grid` is a list of strings of `'1'` (land) and `'0'` (water). Return `(count, largest)`: the number of islands (groups of land connected horizontally or vertically) and the size of the largest island in cells. Don't modify the input.

## Examples

```text
islands(["11000",
         "11000",
         "00100",
         "00011"]) → (3, 4)
```

## Starter code

```python starter
def islands(grid: list[str]) -> tuple[int, int]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Scan every cell. When you find unvisited land, it starts a new island: explore everything reachable from it and mark it visited.

</details>

<details><summary>Hint 2</summary>

Use an explicit queue (BFS) or stack. Recursive DFS can hit Python's recursion limit on a 1000×1000 grid.

</details>

## Where this shows up in data engineering

Connected components are how you **cluster linked records**: sessions sharing a device, accounts sharing an email, tables connected by lineage. On a grid it's region detection on heatmaps or geo tiles. At scale the same problem is solved with union-find or iterative label propagation (GraphFrames' `connectedComponents`).

## Solution

```python solution
from collections import deque


def islands(grid):
    if not grid:
        return (0, 0)
    rows, cols = len(grid), len(grid[0])
    seen = set()
    count = largest = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "1" or (r, c) in seen:
                continue
            count += 1
            size, q = 0, deque([(r, c)])
            seen.add((r, c))
            while q:
                x, y = q.popleft()
                size += 1
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == "1" and (nx, ny) not in seen:
                        seen.add((nx, ny))          # mark on enqueue, not dequeue
                        q.append((nx, ny))
            largest = max(largest, size)
    return (count, largest)
```

## Tests

Your solution should pass these:

```python tests
assert islands(["11000", "11000", "00100", "00011"]) == (3, 4)
assert islands(["11110", "11010", "11000", "00000"]) == (1, 9)
assert islands(["000"]) == (0, 0)
assert islands([]) == (0, 0)
assert islands(["101", "010", "101"]) == (5, 1)
big = ["1" * 300] * 300
assert islands(big) == (1, 90000)
```

## Explanation

**Algorithm:** each land cell is visited once; BFS from every unvisited land cell labels one component. O(R·C) time and space.

**Mark on enqueue:** adding to `seen` when pushing (not when popping) prevents the same cell being queued many times by different neighbours.

**Why iterative:** a 300×300 all-land grid would recurse 90,000 deep. Python's default limit is 1,000. Interviewers notice this.

**Alternatives:** union-find over land cells (great when land arrives incrementally, as in "number of islands II"); in-place marking (`grid[r][c] = '0'`) saves memory but mutates input, so ask first.

## Follow-up questions

<details><summary>Land cells are added one at a time; report the island count after each addition.</summary>

Union-find: each new land cell starts as its own set (count += 1); union with land neighbours, decrementing the count on each successful union. Near O(1) amortised per addition.

</details>
