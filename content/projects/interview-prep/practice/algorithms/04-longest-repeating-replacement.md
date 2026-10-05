---
title: "Longest Uniform Run With at Most k Replacements"
description: "Sliding window with a max-frequency trick: longest substring that can become one repeated character with at most k edits."
url: "/interview-prep/practice/algorithms/04-longest-repeating-replacement/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 4
---

# Longest Uniform Run With at Most k Replacements

**Pattern:** Sliding Window · **Difficulty:** Medium · **Asked at:** Google, Amazon, Uber

**Classic version:** [LeetCode 424](https://leetcode.com/problems/longest-repeating-character-replacement/)

## Problem

Given a string `s` of uppercase letters and an integer `k`, you may replace at most `k` characters with any letter. Return the length of the longest substring that can be made of a single repeated letter.

## Examples

```text
longest_uniform("ABAB", 2)     → 4    # replace both A's (or both B's)
longest_uniform("AABABBA", 1)  → 4    # "AABA" → "AAAA"
```

## Constraints

- `1 ≤ len(s) ≤ 10⁵`, `0 ≤ k ≤ len(s)`.

## Starter code

```python starter
def longest_uniform(s: str, k: int) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

A window is fixable when `window_length - count_of_most_common_letter ≤ k`.

</details>

<details><summary>Hint 2</summary>

You don't need to decrease `max_freq` when shrinking. A stale (too high) `max_freq` can only keep the window at its current size; it can never produce a wrong *larger* answer.

</details>

## Where this shows up in data engineering

Think of "longest stretch of a sensor reading the same state if we tolerate k glitches" or "longest run of a dominant category allowing k exceptions". Same window, different labels.

## Solution

```python solution
from collections import Counter

def longest_uniform(s: str, k: int) -> int:
    counts = Counter()
    left = max_freq = best = 0
    for right, ch in enumerate(s):
        counts[ch] += 1
        max_freq = max(max_freq, counts[ch])
        # too many chars to replace: slide (not shrink) the window by one
        if (right - left + 1) - max_freq > k:
            counts[s[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best
```

## Tests

Your solution should pass these:

```python tests
assert longest_uniform("ABAB", 2) == 4
assert longest_uniform("AABABBA", 1) == 4
assert longest_uniform("A", 0) == 1
assert longest_uniform("ABCDE", 0) == 1
assert longest_uniform("AAAA", 2) == 4
assert longest_uniform("ABBB", 0) == 3
assert longest_uniform("BAAAB", 2) == 5
```

## Explanation

**Validity test:** `length - max_freq` = characters that are *not* the dominant letter = edits needed. Valid when ≤ k.

**The subtle trick:** when the window becomes invalid we move `left` by exactly one, so the window *slides* at its best size so far instead of shrinking. `max_freq` may be stale (higher than the true max after removals), but the answer only grows when a real `max_freq` beats the old one, so the result stays correct.

**Complexity:** O(n) time, O(26) space. Recomputing `max(counts.values())` each step is also fine (O(26n)) and easier to explain if you're unsure about the stale-max argument.

## Follow-up questions

<details><summary>Explain why not decreasing max_freq is safe.</summary>

The answer is `max over time of window size`. The window only grows when `max_freq` increases to a value that makes a larger window valid. A stale `max_freq` only stops the window from shrinking below the best size already found, never reports a larger invalid window as the answer.

</details>

<details><summary>Lower-case and digits too, arbitrary alphabet?</summary>

Same algorithm with a dict counter; complexity stays O(n).

</details>
