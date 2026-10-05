---
title: "Longest Substring Without Repeating Characters"
description: "Variable-size sliding window with a last-seen index map: find the longest run with no repeated character."
url: "/interview-prep/practice/algorithms/01-longest-unique-substring/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 1
---

# Longest Substring Without Repeating Characters

**Pattern:** Sliding Window · **Difficulty:** Medium · **Asked at:** Amazon, Meta, Google, Bloomberg

**Classic version:** [LeetCode 3](https://leetcode.com/problems/longest-substring-without-repeating-characters/)

## Problem

Given a string `s`, return the length of the longest contiguous substring that contains no repeated character.

## Examples

```text
longest_unique("abcabcbb")  → 3    # "abc"
longest_unique("bbbbb")     → 1
longest_unique("pwwkew")    → 3    # "wke" ("pwke" is not contiguous)
longest_unique("")          → 0
```

## Constraints

- `0 ≤ len(s) ≤ 10⁵`; any characters (letters, digits, symbols, spaces).
- Target: O(n) time.

## Starter code

```python starter
def longest_unique(s: str) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Keep a window `s[left:right+1]` that never contains a duplicate. Grow it one character at a time on the right.

</details>

<details><summary>Hint 2</summary>

Store the last index where you saw each character. When `s[right]` was seen inside the window, jump `left` to one past that index: no need to shrink one step at a time.

</details>

## Where this shows up in data engineering

The same window shape answers "longest session without a repeated page", "longest run of distinct device IDs" or "max distinct events in a window" in stream processing. Interviewers like it because the jump-the-left-pointer trick separates people who memorised the template from people who understand the invariant.

## Solution

```python solution
def longest_unique(s: str) -> int:
    last_seen = {}
    left = best = 0
    for right, ch in enumerate(s):
        # only a repeat *inside* the current window forces the left edge to move
        if last_seen.get(ch, -1) >= left:
            left = last_seen[ch] + 1
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best
```

## Tests

Your solution should pass these:

```python tests
assert longest_unique("abcabcbb") == 3
assert longest_unique("bbbbb") == 1
assert longest_unique("pwwkew") == 3
assert longest_unique("") == 0
assert longest_unique(" ") == 1
assert longest_unique("abba") == 2
assert longest_unique("dvdf") == 3
```

## Explanation

**Invariant:** `s[left:right+1]` has no duplicates. Each step adds `s[right]`; if that character already occurs inside the window, every window starting at or before its previous position is invalid, so `left` jumps straight past it.

**The classic bug:** `"abba"`. When the second `a` arrives, its last index (0) is *left of* the window (which already starts at 2 after the second `b`). Jumping to `0 + 1` would move the window backwards. The `>= left` check (or `left = max(left, last+1)`) prevents it.

**Complexity:** O(n) time, O(min(n, alphabet)) space.

**Alternative:** a set plus a `while` loop that removes `s[left]` until the duplicate is gone. Same O(n) (each character enters and leaves once), easier to adapt to "at most k repeats".

## Follow-up questions

<details><summary>Return the substring itself, not just its length.</summary>

Track `best_start` whenever `best` improves and return `s[best_start:best_start+best]`.

</details>

<details><summary>Allow each character at most twice.</summary>

Use a `Counter` for the window and a `while counts[ch] > 2:` shrink loop. The jump trick no longer applies because one occurrence leaving doesn't fix the window on its own.

</details>

<details><summary>The input is an unbounded stream of events. How do you report the current longest unique run?</summary>

Keep `last_seen` and `left` as state, emitting `right - left + 1` per event. State grows with the number of distinct keys; bound it with a TTL (drop keys whose last index is left of the window) so memory tracks the window, not the stream.

</details>
