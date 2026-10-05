---
title: "Happy Number (Cycle Detection on a Function)"
description: "Apply Floyd's algorithm to the sequence x → sum of squared digits instead of a linked list."
url: "/interview-prep/practice/algorithms/13-happy-number/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 13
---

# Happy Number (Cycle Detection on a Function)

**Pattern:** Fast & Slow Pointers (Floyd's Cycle Detection) · **Difficulty:** Easy · **Asked at:** Google, Uber, Airbnb

**Classic version:** [LeetCode 202](https://leetcode.com/problems/happy-number/)

## Problem

Starting from a positive integer `n`, repeatedly replace it with the sum of the squares of its digits. `n` is **happy** if the process reaches `1`; otherwise the sequence loops forever in a cycle that doesn't contain 1. Return whether `n` is happy, using O(1) extra memory.

## Examples

```text
is_happy(19) → True    # 1²+9²=82 → 68 → 100 → 1
is_happy(2)  → False   # 2 → 4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4 → …
```

## Starter code

```python starter
def is_happy(n: int) -> bool:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Any function `f` on a finite set, iterated, eventually cycles. Treat `x → f(x)` like `node → node.next`.

</details>

<details><summary>Hint 2</summary>

Run slow = f(slow), fast = f(f(fast)) until they meet; the number is happy if the meeting point is 1.

</details>

## Where this shows up in data engineering

The general lesson, **"iterating a deterministic function must eventually cycle; detect it without storing history"**, applies to retry/state machines, ID-reassignment chains, and validating that iterative jobs converge.

## Solution

```python solution
def is_happy(n: int) -> bool:
    def step(x: int) -> int:
        total = 0
        while x:
            x, d = divmod(x, 10)
            total += d * d
        return total

    slow, fast = n, step(n)
    while fast != 1 and slow != fast:
        slow = step(slow)
        fast = step(step(fast))
    return fast == 1
```

## Tests

Your solution should pass these:

```python tests
assert is_happy(19) is True
assert is_happy(2) is False
assert is_happy(1) is True
assert is_happy(7) is True
assert is_happy(4) is False
assert is_happy(100) is True
```

## Explanation

**Why it terminates:** for any number with `d` digits, the next value is at most `81·d`, so values quickly drop below a few hundred and stay there. A finite set means the sequence must repeat: either it reaches 1 (which maps to itself) or it falls into the unhappy cycle `4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4`.

**Floyd here:** identical to the linked-list version with `next` replaced by `step`. O(log n) per step, O(1) memory. A `seen` set is the simpler O(k)-memory answer.

## Follow-up questions

<details><summary>Why is a hard-coded 'if 4 in sequence' check valid but unconvincing in an interview?</summary>

It relies on knowing every unhappy number enters the 4-cycle (true for base 10), but it hides the reasoning. Lead with the general cycle-detection argument, then mention the shortcut as an observation.

</details>
