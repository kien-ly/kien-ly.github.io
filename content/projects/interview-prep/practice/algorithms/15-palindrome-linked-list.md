---
title: "Palindrome Linked List in O(1) Space"
description: "Find the middle with fast/slow pointers, reverse the second half, compare, then restore the list."
url: "/interview-prep/practice/algorithms/15-palindrome-linked-list/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 15
---

# Palindrome Linked List in O(1) Space

**Pattern:** Fast & Slow Pointers (Floyd's Cycle Detection) · **Difficulty:** Easy · **Asked at:** Meta, Amazon, Microsoft

**Classic version:** [LeetCode 234](https://leetcode.com/problems/palindrome-linked-list/)

## Problem

Return `True` if the values of a singly linked list read the same forwards and backwards. Use O(1) extra space, and **leave the list unchanged** when you return (callers may reuse it).

## Examples

```text
1 → 2 → 2 → 1   → True
1 → 2           → False
```

## Starter code

```python starter
class ListNode:
    def __init__(self, val, next=None):
        self.val, self.next = val, next


def is_palindrome_list(head: ListNode | None) -> bool:
    pass
```

## Hints

<details><summary>Hint 1</summary>

When `fast` (2 steps) reaches the end, `slow` (1 step) is at the middle.

</details>

<details><summary>Hint 2</summary>

Reverse the list from the middle, compare the two halves node by node, then reverse the second half back.

</details>

## Where this shows up in data engineering

Finding the middle in one pass with two speeds is the same idea as **sampling the median position of a stream you can only read once** with two cursors, and list reversal is an interview staple for pointer hygiene.

## Solution

```python solution
class ListNode:
    def __init__(self, val, next=None):
        self.val, self.next = val, next


def is_palindrome_list(head):
    def reverse(node):
        prev = None
        while node:
            node.next, prev, node = prev, node, node.next
        return prev

    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    tail = reverse(slow)                 # second half, reversed
    ok, a, b = True, head, tail
    while b:
        if a.val != b.val:
            ok = False
            break
        a, b = a.next, b.next
    reverse(tail)                        # restore the original list
    return ok
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


def values(h):
    out = []
    while h:
        out.append(h.val)
        h = h.next
    return out

h, _ = build([1, 2, 2, 1])
assert is_palindrome_list(h) is True and values(h) == [1, 2, 2, 1]
h, _ = build([1, 2])
assert is_palindrome_list(h) is False and values(h) == [1, 2]
h, _ = build([1, 2, 3, 2, 1])
assert is_palindrome_list(h) is True and values(h) == [1, 2, 3, 2, 1]
h, _ = build([7])
assert is_palindrome_list(h) is True
assert is_palindrome_list(None) is True
```

## Explanation

**Steps:** (1) fast/slow to the middle, (2) reverse from `slow`, (3) compare head-half with reversed tail-half (the tail is equal or one shorter, so loop on `b`), (4) reverse again to restore.

**Odd lengths:** the middle node ends up as the last node of both halves' traversal; comparing it with itself is harmless.

**Complexity:** O(n) time, O(1) space. Copying values to a list and checking `vals == vals[::-1]` is O(n) space: fine first answer.

**Pointer hygiene:** the tuple assignment `node.next, prev, node = prev, node, node.next` evaluates the right side first, so it's safe. Interviewers watch for lost references here.

## Follow-up questions

<details><summary>Why restore the list?</summary>

Mutating an input that callers still hold is a side effect; in production code (or concurrent readers) it's a bug. State the trade-off explicitly: O(1) space costs temporary mutation.

</details>
