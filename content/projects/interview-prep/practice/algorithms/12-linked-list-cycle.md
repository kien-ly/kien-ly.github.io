---
title: "Detect a Cycle and Find Where It Starts"
description: "Floyd's tortoise and hare: detect a cycle in O(1) space, then find the entry node with the two-phase trick."
url: "/interview-prep/practice/algorithms/12-linked-list-cycle/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 12
---

# Detect a Cycle and Find Where It Starts

**Pattern:** Fast & Slow Pointers (Floyd's Cycle Detection) · **Difficulty:** Medium · **Asked at:** Amazon, Microsoft, Bloomberg, Goldman Sachs

**Classic version:** [LeetCode 141](https://leetcode.com/problems/linked-list-cycle/) · [LeetCode 142](https://leetcode.com/problems/linked-list-cycle-ii/)

## Problem

A singly linked list may loop back on itself. Implement:

1. `has_cycle(head)`: return `True` if the list contains a cycle.
2. `cycle_start(head)`: return the node where the cycle begins, or `None` if there is no cycle.

Use O(1) extra memory (no visited set). The `ListNode` class is provided in the starter.

## Examples

```text
3 → 2 → 0 → -4 ┐        has_cycle → True, cycle_start → node "2"
    ↑──────────┘
1 → 2 → None             has_cycle → False, cycle_start → None
```

## Starter code

```python starter
class ListNode:
    def __init__(self, val, next=None):
        self.val, self.next = val, next


def has_cycle(head: ListNode | None) -> bool:
    pass


def cycle_start(head: ListNode | None) -> ListNode | None:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Move `slow` one step and `fast` two steps. If there's a cycle they must meet inside it; if not, `fast` reaches `None`.

</details>

<details><summary>Hint 2</summary>

After they meet, put one pointer back at `head` and move both one step at a time. They meet again exactly at the cycle's first node.

</details>

## Where this shows up in data engineering

Cycle detection appears as **circular dependencies in a DAG of jobs or tables**, redirect loops in URL resolution, reference loops in lineage graphs, and "does following parent_id ever loop" checks on hierarchical data. For graphs you'd use DFS colours or Kahn's algorithm; Floyd shines when each node has exactly one successor (a functional graph), with zero extra memory.

## Solution

```python solution
class ListNode:
    def __init__(self, val, next=None):
        self.val, self.next = val, next


def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            return True
    return False


def cycle_start(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            # phase 2: distance head→start equals distance meeting point→start (mod cycle length)
            p = head
            while p is not slow:
                p, slow = p.next, slow.next
            return p
    return None
```

## Tests

Your solution should pass these:

```python tests
class ListNode:
    def __init__(self, val, next=None):
        self.val, self.next = val, next

def build(values, cycle_at=-1):
    """Linked list from values; tail links to node `cycle_at` (-1 = no cycle)."""
    nodes = [ListNode(v) for v in values]
    for a, b in zip(nodes, nodes[1:]):
        a.next = b
    if nodes and cycle_at >= 0:
        nodes[-1].next = nodes[cycle_at]
    return (nodes[0] if nodes else None), nodes


h, nodes = build([3, 2, 0, -4], cycle_at=1)
assert has_cycle(h) is True
assert cycle_start(h) is nodes[1]
h, nodes = build([1, 2], cycle_at=0)
assert cycle_start(h) is nodes[0]
h, nodes = build([1], cycle_at=-1)
assert has_cycle(h) is False and cycle_start(h) is None
assert has_cycle(None) is False
h, nodes = build(list(range(10)), cycle_at=7)
assert cycle_start(h) is nodes[7]
```

## Explanation

**Phase 1, detection:** inside a cycle of length `C`, the gap between fast and slow shrinks by 1 every step, so they meet within `C` steps of `slow` entering the cycle. Without a cycle, `fast` hits `None` first. O(n) time, O(1) space.

**Phase 2, the entry point.** Let `a` = distance from head to the cycle start, and `b` = distance from the start to the meeting point. When they meet, slow has walked `a + b` and fast `2(a + b)`; fast's extra `a + b` is a whole number of loops: `a + b = kC`. So `a = kC - b`: walking `a` steps from the meeting point lands exactly on the start. Hence a pointer from `head` and one from the meeting point, both at speed 1, meet at the start.

**Visited-set alternative:** O(n) memory, trivially correct, and the right choice when memory isn't a concern. Say so, then offer Floyd as the O(1) upgrade.

**Use `is`, not `==`:** compare node identity; values can repeat.

## Follow-up questions

<details><summary>Return the cycle length.</summary>

After the meeting, keep `fast` still and move `slow` until it returns, counting steps.

</details>

<details><summary>Your orchestrator has 5,000 jobs with arbitrary dependencies. How do you detect a cycle?</summary>

Kahn's algorithm: repeatedly remove nodes with in-degree 0; if nodes remain, they're in or downstream of a cycle. Or DFS with white/grey/black colouring, where a back edge to a grey node is a cycle (and the DFS stack gives the cycle path to report). O(V + E).

</details>
