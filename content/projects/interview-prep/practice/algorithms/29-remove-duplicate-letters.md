---
title: "Smallest Subsequence With Each Letter Once"
description: "Greedy monotonic stack with 'can I pop it? (it appears again later)' checks."
url: "/interview-prep/practice/algorithms/29-remove-duplicate-letters/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 29
---

# Smallest Subsequence With Each Letter Once

**Pattern:** Monotonic Stack · **Difficulty:** Hard · **Asked at:** Google, Amazon, ByteDance

**Classic version:** [LeetCode 316](https://leetcode.com/problems/remove-duplicate-letters/) · [LeetCode 402](https://leetcode.com/problems/remove-k-digits/)

## Problem

Remove duplicate letters from `s` so every distinct letter appears **exactly once**, and the result is the lexicographically smallest among all such subsequences (relative order from `s` must be preserved).

## Examples

```text
smallest_unique_subsequence("bcabc")    → "abc"
smallest_unique_subsequence("cbacdcbc") → "acdb"
```

## Starter code

```python starter
def smallest_unique_subsequence(s: str) -> str:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Build the answer on a stack. Before pushing `c`, pop larger letters from the top **if they occur again later** (you can re-add them then).

</details>

<details><summary>Hint 2</summary>

Precompute the last index of each letter, and skip letters already in the stack.

</details>

## Where this shows up in data engineering

Greedy-with-lookahead on a stack is the shape of "produce the smallest/cheapest valid sequence while preserving order", e.g. choosing which duplicate events to keep so the output is canonical and minimal. It's also a strong signal problem: you must prove why popping is safe.

## Solution

```python solution
def smallest_unique_subsequence(s: str) -> str:
    last = {c: i for i, c in enumerate(s)}
    stack, in_stack = [], set()
    for i, c in enumerate(s):
        if c in in_stack:
            continue
        # a bigger letter on top can go if it appears again later
        while stack and stack[-1] > c and last[stack[-1]] > i:
            in_stack.discard(stack.pop())
        stack.append(c)
        in_stack.add(c)
    return "".join(stack)
```

## Tests

Your solution should pass these:

```python tests
assert smallest_unique_subsequence("bcabc") == "abc"
assert smallest_unique_subsequence("cbacdcbc") == "acdb"
assert smallest_unique_subsequence("a") == "a"
assert smallest_unique_subsequence("abacb") == "abc"
assert smallest_unique_subsequence("ecbacba") == "eacb"
```

## Explanation

**Greedy argument:** if the stack top `t` is greater than `c` and `t` appears later, placing `c` before `t` gives a smaller string and loses nothing (we can still place `t` later). If `t` never appears again, it must stay.

**Skipping letters already placed** is safe: the earlier placement is at least as good since everything after it is still free to be arranged.

**Complexity:** O(n) time (each letter pushed/popped at most once), O(alphabet) space.

## Follow-up questions

<details><summary>Remove k digits from a number to make it as small as possible.</summary>

Same stack: pop larger digits while k > 0, then trim from the end if k remains, strip leading zeros. O(n).

</details>
