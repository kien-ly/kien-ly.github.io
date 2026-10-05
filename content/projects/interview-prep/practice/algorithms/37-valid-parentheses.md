---
title: "Valid Brackets (and the Minimum Fix)"
description: "Stack matching for bracket validity, plus counting the minimum insertions to fix an unbalanced string."
url: "/interview-prep/practice/algorithms/37-valid-parentheses/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 37
---

# Valid Brackets (and the Minimum Fix)

**Pattern:** Hashing, Stacks and Bit Tricks (Must-Know Classics) · **Difficulty:** Easy · **Asked at:** Amazon, Meta, Google, Bloomberg

**Classic version:** [LeetCode 20](https://leetcode.com/problems/valid-parentheses/) · [LeetCode 921](https://leetcode.com/problems/minimum-add-to-make-parentheses-valid/)

## Problem

1. `is_valid(s)`: `s` contains only `()[]{}`. Return `True` if every bracket is closed by the same type in the correct order.
2. `min_insertions(s)`: `s` contains only `(` and `)`. Return the minimum number of brackets to insert to make it balanced.

## Examples

```text
is_valid("()[]{}")  → True
is_valid("(]")      → False
is_valid("([)]")    → False
is_valid("{[]}")    → True
min_insertions("())")   → 1
min_insertions("(((")   → 3
```

## Starter code

```python starter
def is_valid(s: str) -> bool:
    pass


def min_insertions(s: str) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Push opening brackets. On a closing bracket, the top of the stack must be its partner.

</details>

<details><summary>Hint 2</summary>

With a single bracket type you only need a counter: track open brackets; a `)` with nothing open needs an inserted `(`.

</details>

## Where this shows up in data engineering

Stack-based matching is the core of **parsing**: validating nested JSON before loading, checking SQL/template balance in generated code, and walking nested structures (flattening JSON, building trees from parent/child events). The counter variant shows you know when a full stack is unnecessary.

## Solution

```python solution
def is_valid(s: str) -> bool:
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack                     # leftovers are unclosed openers


def min_insertions(s: str) -> int:
    open_count = inserts = 0
    for ch in s:
        if ch == "(":
            open_count += 1
        elif open_count:
            open_count -= 1
        else:
            inserts += 1                 # unmatched ')': insert a '(' before it
    return inserts + open_count          # close every remaining '('
```

## Tests

Your solution should pass these:

```python tests
assert is_valid("()") is True
assert is_valid("()[]{}") is True
assert is_valid("(]") is False
assert is_valid("([)]") is False
assert is_valid("{[]}") is True
assert is_valid("(") is False
assert is_valid("]") is False
assert is_valid("") is True
assert min_insertions("())") == 1
assert min_insertions("(((") == 3
assert min_insertions("()))((") == 4
assert min_insertions("") == 0
```

## Explanation

**Validity:** the stack holds unmatched openers; each closer must match the most recent one (last opened, first closed). Both an empty-stack closer and leftover openers are failures. O(n) time, O(n) space.

**Minimum insertions:** with one bracket type, the stack only ever holds `(`, so a counter suffices. An unmatched `)` forces an insertion immediately; unmatched `(` at the end each need a `)`. O(n) time, O(1) space.

**Pitfall:** checking only counts (`s.count("(") == s.count(")")`) accepts `")("`.

## Follow-up questions

<details><summary>Longest valid parentheses substring?</summary>

Stack of indices seeded with -1: push on `(`; on `)` pop, and if the stack is empty push the current index as the new base, else the length is `i - stack[-1]`. O(n). (LeetCode 32.)

</details>
