---
title: "Find All Anagram Positions"
description: "Fixed-size sliding window with a rolling character count: every start index where a permutation of p appears in s."
url: "/interview-prep/practice/algorithms/05-find-all-anagrams/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 5
---

# Find All Anagram Positions

**Pattern:** Sliding Window · **Difficulty:** Medium · **Asked at:** Amazon, Meta, Microsoft

**Classic version:** [LeetCode 438](https://leetcode.com/problems/find-all-anagrams-in-a-string/)

## Problem

Given strings `s` and `p`, return every start index `i` such that `s[i:i+len(p)]` is an anagram (a rearrangement) of `p`, in increasing order.

## Examples

```text
anagram_starts("cbaebabacd", "abc") → [0, 6]
anagram_starts("abab", "ab")        → [0, 1, 2]
```

## Constraints

- `1 ≤ len(s), len(p) ≤ 3·10⁴`, lowercase letters.
- Target: O(len(s)) (with a 26-letter alphabet).

## Starter code

```python starter
def anagram_starts(s: str, p: str) -> list[int]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

The window size is fixed at `len(p)`. Each step adds one character on the right and removes one on the left.

</details>

<details><summary>Hint 2</summary>

Track how many letters currently have matching counts (`matches`), updating it only for the two letters that changed. Then the check is O(1).

</details>

## Where this shows up in data engineering

Fixed windows are everywhere in streaming: tumbling and sliding aggregations, "same multiset of events in each 5-minute window", detecting a known sequence of operations regardless of order. The rolling-count technique is how stream processors update window aggregates incrementally.

## Solution

```python solution
def anagram_starts(s: str, p: str) -> list[int]:
    m = len(p)
    if m > len(s):
        return []
    need = [0] * 26
    have = [0] * 26
    for ch in p:
        need[ord(ch) - 97] += 1
    res = []
    for i, ch in enumerate(s):
        have[ord(ch) - 97] += 1
        if i >= m:                       # drop the char that left the window
            have[ord(s[i - m]) - 97] -= 1
        if have == need:                 # 26 comparisons: O(1) for a fixed alphabet
            res.append(i - m + 1)
    return res
```

## Tests

Your solution should pass these:

```python tests
assert anagram_starts("cbaebabacd", "abc") == [0, 6]
assert anagram_starts("abab", "ab") == [0, 1, 2]
assert anagram_starts("a", "ab") == []
assert anagram_starts("aaaa", "aa") == [0, 1, 2]
assert anagram_starts("xyz", "abc") == []
```

## Explanation

**Fixed window:** add `s[i]`, remove `s[i - m]` once the window is full, compare counts. With 26 letters the comparison is constant time, so the whole thing is O(26·n) = O(n).

**Faster constant:** keep `matches` = number of letters whose counts are equal. When a count changes, adjust `matches` for that letter only (`+1` if it just became equal, `-1` if it just stopped being equal). The window is an anagram when `matches == 26`.

**Pitfall:** sorting each window (`sorted(s[i:i+m]) == sorted(p)`) is O(n·m log m): fine as a first answer, but say you'd optimise it.

## Follow-up questions

<details><summary>Unicode input with an unbounded alphabet?</summary>

Use dict counters and the `matches` technique keyed by character. Each step touches two keys, so it stays O(n).

</details>

<details><summary>Return only whether any anagram exists (permutation in string).</summary>

Same loop, return `True` on the first match. (LeetCode 567.)

</details>
