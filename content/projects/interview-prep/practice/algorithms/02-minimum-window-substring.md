---
title: "Minimum Window Containing All Required Characters"
description: "Shrinkable sliding window with a 'missing' counter: smallest substring of s that covers every character of t (with multiplicity)."
url: "/interview-prep/practice/algorithms/02-minimum-window-substring/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 2
---

# Minimum Window Containing All Required Characters

**Pattern:** Sliding Window · **Difficulty:** Hard · **Asked at:** Meta, Amazon, Uber, LinkedIn

**Classic version:** [LeetCode 76](https://leetcode.com/problems/minimum-window-substring/)

## Problem

Given strings `s` and `t`, return the shortest contiguous substring of `s` that contains every character of `t`, **including duplicates** (if `t` has two `a`s the window needs two `a`s). Return `""` if no such window exists. If several windows tie for shortest, return the leftmost.

## Examples

```text
min_window("ADOBECODEBANC", "ABC") → "BANC"
min_window("a", "a")               → "a"
min_window("a", "aa")              → ""
```

## Constraints

- `1 ≤ len(s), len(t) ≤ 10⁵`, case-sensitive.
- Target: O(len(s) + len(t)).

## Starter code

```python starter
def min_window(s: str, t: str) -> str:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Expand right until the window covers `t`, then shrink from the left while it still covers `t`, recording the best window during the shrink.

</details>

<details><summary>Hint 2</summary>

Don't re-check the whole counter for coverage each step. Keep `missing` = how many required characters are still not covered; it only changes when a count crosses zero.

</details>

## Where this shows up in data engineering

"Smallest time window in which all required event types occurred" (e.g. the shortest span that contains a login, a payment and a confirmation) is this problem over event logs. It also tests the key streaming idea: maintain an aggregate incrementally instead of recomputing it.

## Solution

```python solution
from collections import Counter

def min_window(s: str, t: str) -> str:
    need = Counter(t)
    missing = len(t)                 # required chars not yet covered, with multiplicity
    left = 0
    best = (float("inf"), 0, 0)      # (length, start, end)
    for right, ch in enumerate(s):
        if need[ch] > 0:
            missing -= 1
        need[ch] -= 1                # negative = surplus inside the window
        if missing == 0:
            # shrink while the leftmost char is surplus
            while need[s[left]] < 0:
                need[s[left]] += 1
                left += 1
            if right - left + 1 < best[0]:
                best = (right - left + 1, left, right + 1)
            # give up the leftmost required char to look for the next window
            need[s[left]] += 1
            missing += 1
            left += 1
    return s[best[1]:best[2]] if best[0] != float("inf") else ""
```

## Tests

Your solution should pass these:

```python tests
assert min_window("ADOBECODEBANC", "ABC") == "BANC"
assert min_window("a", "a") == "a"
assert min_window("a", "aa") == ""
assert min_window("aa", "aa") == "aa"
assert min_window("ab", "b") == "b"
assert min_window("bba", "ab") == "ba"
assert min_window("cabwefgewcwaefgcf", "cae") == "cwae"
```

## Explanation

**State:** `need[c]` = how many more `c` the window still needs (negative = surplus). `missing` = sum of the positive parts, so "window covers t" is just `missing == 0`, O(1) instead of comparing two counters.

**Loop:** extend `right`; once covered, drop surplus characters from the left (they can't be needed), record the window, then deliberately drop one required character so the search continues for a shorter window further right.

**Complexity:** O(|s| + |t|) time: each index enters and leaves the window once. O(alphabet) space.

**Pitfalls:** forgetting multiplicity (using a set for `t`), comparing full counters on every step (O(|s|·alphabet)), and off-by-one when slicing the answer.

## Follow-up questions

<details><summary>s is huge and t has very few distinct characters. Can you speed it up?</summary>

Pre-filter `s` to the positions whose character is in `t` (a list of `(index, char)`), then run the same window over that shorter list. It helps when relevant characters are sparse.

</details>

<details><summary>Find the shortest window containing all event types in a log of (timestamp, type) tuples.</summary>

Same algorithm with timestamps: the window length is `ts[right] - ts[left]` instead of an index difference. Sort by timestamp first if the log isn't ordered.

</details>
