---
title: "Order Pipeline Tasks in a DAG (Topological Sort)"
description: "Compute a valid execution order for dependent tasks, detect cycles, and group tasks into parallel stages."
url: "/interview-prep/practice/python/15-dag-task-order/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 15
---

# Order Pipeline Tasks in a DAG (Topological Sort)

**Difficulty:** Medium · **Topics:** graphs, topological-sort, orchestration · **Asked at:** Airbnb, Astronomer, Databricks, Uber

## Problem

`deps` maps each task to the list of tasks it depends on. Return a list of **stages**: each stage is a sorted list of tasks whose dependencies are all in earlier stages (so each stage can run in parallel). If there's a cycle, raise `ValueError("cycle")`. Tasks that appear only as dependencies are tasks too.

## Examples

```text
deps = {"silver": ["bronze"], "gold": ["silver", "dim"], "dim": ["bronze"], "bronze": []}
→ [["bronze"], ["dim", "silver"], ["gold"]]
```

## Starter code

```python starter
def stages(deps: dict[str, list[str]]) -> list[list[str]]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Kahn's algorithm: repeatedly take all nodes with in-degree 0 as one stage.

</details>

<details><summary>Hint 2</summary>

If nodes remain but none has in-degree 0, there is a cycle.

</details>

## Solution

```python solution
from collections import defaultdict

def stages(deps: dict[str, list[str]]) -> list[list[str]]:
    nodes = set(deps) | {d for ds in deps.values() for d in ds}
    indeg = {n: 0 for n in nodes}
    children = defaultdict(list)
    for task, ds in deps.items():
        for d in set(ds):
            indeg[task] += 1
            children[d].append(task)
    ready = sorted(n for n in nodes if indeg[n] == 0)
    result, done = [], 0
    while ready:
        result.append(ready)
        done += len(ready)
        nxt = []
        for n in ready:
            for c in children[n]:
                indeg[c] -= 1
                if indeg[c] == 0:
                    nxt.append(c)
        ready = sorted(nxt)
    if done != len(nodes):
        raise ValueError("cycle")
    return result
```

## Tests

Your solution should pass these:

```python tests
deps = {"silver": ["bronze"], "gold": ["silver", "dim"], "dim": ["bronze"], "bronze": []}
assert stages(deps) == [["bronze"], ["dim", "silver"], ["gold"]]
assert stages({"b": ["a"]}) == [["a"], ["b"]]
assert stages({}) == []
try:
    stages({"a": ["b"], "b": ["c"], "c": ["a"]})
    assert False
except ValueError as e:
    assert str(e) == "cycle"
```

## Explanation

O(V + E). Level-by-level Kahn's algorithm gives **maximum parallelism stages**: exactly how an orchestrator (Airflow scheduler, dbt) decides what can run concurrently. `set(ds)` guards against duplicate dependency entries inflating in-degrees. The same algorithm orders dbt models and finds downstream tables to backfill (run it on the reversed graph from a node).

## Follow-up questions

<details><summary>How would you compute the critical path (minimum total runtime) given task durations?</summary>

Process in topological order, `finish[t] = duration[t] + max(finish[d] for d in deps[t])`; the max finish is the minimum makespan with unlimited parallelism; backtrack the argmax to get the critical path.

</details>
