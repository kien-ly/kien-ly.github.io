---
title: "Render Parent/Child Records as an Indented Tree"
description: "Build a tree from flat (id, parent_id) records, detect orphans and cycles, and render it deterministically."
url: "/interview-prep/practice/python/34-render-task-tree/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 34
---

# Render Parent/Child Records as an Indented Tree

**Pattern:** Practical modeling · **Difficulty:** Medium · **Asked at:** Stripe, Atlassian, Asana, Notion

## Problem

Records are dicts `{"id": str, "parent": str | None, "name": str}` in any order. Implement `render_tree(records)` returning a list of lines:

- roots (parent `None`) and children are listed sorted by `name`;
- each line is `"  " * depth + name`;
- a record whose parent id doesn't exist is an **orphan**: render it as a root, with `" (orphan)"` appended to its name;
- if the parent links contain a cycle, raise `ValueError("cycle detected")`.

## Examples

```text
records = [
  {"id": "1", "parent": None, "name": "ingest"},
  {"id": "2", "parent": "1", "name": "orders"},
  {"id": "3", "parent": "1", "name": "customers"},
  {"id": "4", "parent": "3", "name": "dedupe"},
  {"id": "5", "parent": "9", "name": "lost"},
]
render_tree(records) →
["ingest", "  customers", "    dedupe", "  orders", "lost (orphan)"]
```

## Starter code

```python starter
def render_tree(records: list[dict]) -> list[str]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Index children by parent id. Roots are records with no parent or a missing parent.

</details>

<details><summary>Hint 2</summary>

Render with an explicit stack (or recursion) and sort children by name.

</details>

<details><summary>Hint 3</summary>

Cycle check: any record not reached from a root is part of (or hangs off) a cycle.

</details>

## Where this shows up in data engineering

Hierarchies are everywhere in data work: org charts, product categories, account trees in finance, task/sub-task trees, lineage. Turning flat parent/child rows into a tree, and **validating** them (orphans, cycles) before loading, is a common practical round; in SQL the same job is a recursive CTE.

## Solution

```python solution
from collections import defaultdict


def render_tree(records):
    by_id = {r["id"]: r for r in records}
    children = defaultdict(list)
    roots = []
    for r in records:
        p = r["parent"]
        if p is None or p not in by_id:
            roots.append(r)
        else:
            children[p].append(r)

    lines, seen = [], set()
    stack = [(r, 0) for r in sorted(roots, key=lambda r: r["name"], reverse=True)]
    while stack:
        node, depth = stack.pop()
        seen.add(node["id"])
        orphan = node["parent"] is not None and node["parent"] not in by_id
        lines.append("  " * depth + node["name"] + (" (orphan)" if orphan else ""))
        for child in sorted(children[node["id"]], key=lambda r: r["name"], reverse=True):
            stack.append((child, depth + 1))

    if len(seen) != len(records):           # unreachable nodes sit on a cycle
        raise ValueError("cycle detected")
    return lines
```

## Tests

Your solution should pass these:

```python tests
records = [
    {"id": "1", "parent": None, "name": "ingest"},
    {"id": "2", "parent": "1", "name": "orders"},
    {"id": "3", "parent": "1", "name": "customers"},
    {"id": "4", "parent": "3", "name": "dedupe"},
    {"id": "5", "parent": "9", "name": "lost"},
]
assert render_tree(records) == ["ingest", "  customers", "    dedupe", "  orders", "lost (orphan)"]
assert render_tree([]) == []
two_roots = [{"id": "a", "parent": None, "name": "b-root"}, {"id": "b", "parent": None, "name": "a-root"}]
assert render_tree(two_roots) == ["a-root", "b-root"]
cyc = [{"id": "1", "parent": None, "name": "root"}, {"id": "2", "parent": "3", "name": "x"}, {"id": "3", "parent": "2", "name": "y"}]
try:
    render_tree(cyc)
    ok = False
except ValueError as e:
    ok = "cycle" in str(e)
assert ok
deep = [{"id": str(i), "parent": (str(i - 1) if i else None), "name": f"n{i}"} for i in range(3000)]
out = render_tree(deep)
assert len(out) == 3000 and out[-1] == "  " * 2999 + "n2999"
```

## Explanation

**Build:** one pass to index children by parent; roots include true roots and orphans (missing parent).

**Render:** iterative DFS with an explicit stack (the 3,000-deep test would overflow recursion). Children are pushed in reverse-sorted order so they pop in sorted order, giving deterministic output.

**Cycle detection:** nodes in a pure cycle have a parent that exists, so they're never roots and never reached from one. Comparing the visited count with the record count detects that in O(n) without extra graph algorithms.

**Complexity:** O(n log n) for sorting siblings, O(n) otherwise.

## Follow-up questions

<details><summary>Write the SQL to produce each node's depth and full path.</summary>

Recursive CTE: anchor `SELECT id, name, 0 AS depth, name AS path FROM t WHERE parent IS NULL`, recursive part joins children `ON c.parent = p.id` with `depth + 1` and `path || '/' || c.name`. Add a depth limit or a path check to stop runaway recursion on cyclic data.

</details>
