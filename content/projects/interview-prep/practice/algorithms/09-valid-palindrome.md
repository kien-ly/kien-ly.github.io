---
title: "Valid Palindrome After Normalisation (and With One Deletion)"
description: "Converging pointers that skip non-alphanumerics, plus the 'delete at most one character' variant."
url: "/interview-prep/practice/algorithms/09-valid-palindrome/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 9
---

# Valid Palindrome After Normalisation (and With One Deletion)

**Pattern:** Two Pointers (Opposite Ends) · **Difficulty:** Easy · **Asked at:** Meta, Microsoft, Amazon

**Classic version:** [LeetCode 125](https://leetcode.com/problems/valid-palindrome/) · [LeetCode 680](https://leetcode.com/problems/valid-palindrome-ii/)

## Problem

1. `is_palindrome(s)`: return `True` if `s` reads the same forwards and backwards after lower-casing and ignoring every non-alphanumeric character.
2. `almost_palindrome(s)`: return `True` if `s` (compared exactly, no normalisation) is a palindrome after deleting **at most one** character.

Do both in O(n) time and O(1) extra space (no building a cleaned copy).

## Examples

```text
is_palindrome("A man, a plan, a canal: Panama") → True
is_palindrome("race a car")                     → False
almost_palindrome("abca")                       → True   # delete 'b' or 'c'
almost_palindrome("abc")                        → False
```

## Starter code

```python starter
def is_palindrome(s: str) -> bool:
    pass


def almost_palindrome(s: str) -> bool:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Move `lo` right past non-alphanumerics and `hi` left past them, then compare lower-cased characters.

</details>

<details><summary>Hint 2</summary>

For the deletion variant: at the first mismatch you only have two options, skip `s[lo]` or skip `s[hi]`. Check whether either remaining slice is a palindrome.

</details>

## Where this shows up in data engineering

Normalise-then-compare is the core of entity matching and data cleaning (keys that differ only in case and punctuation). The deletion variant is a gentle introduction to edit-distance thinking used in fuzzy matching.

## Solution

```python solution
def is_palindrome(s: str) -> bool:
    lo, hi = 0, len(s) - 1
    while lo < hi:
        if not s[lo].isalnum():
            lo += 1
        elif not s[hi].isalnum():
            hi -= 1
        else:
            if s[lo].lower() != s[hi].lower():
                return False
            lo += 1
            hi -= 1
    return True


def almost_palindrome(s: str) -> bool:
    def is_pal(i: int, j: int) -> bool:
        while i < j:
            if s[i] != s[j]:
                return False
            i += 1
            j -= 1
        return True

    lo, hi = 0, len(s) - 1
    while lo < hi:
        if s[lo] != s[hi]:
            # one deletion allowed: drop the left char or the right char
            return is_pal(lo + 1, hi) or is_pal(lo, hi - 1)
        lo += 1
        hi -= 1
    return True
```

## Tests

Your solution should pass these:

```python tests
assert is_palindrome("A man, a plan, a canal: Panama") is True
assert is_palindrome("race a car") is False
assert is_palindrome(" ") is True
assert is_palindrome("0P") is False
assert almost_palindrome("abca") is True
assert almost_palindrome("aba") is True
assert almost_palindrome("abc") is False
assert almost_palindrome("deeee") is True
assert almost_palindrome("cbbcc") is True
```

## Explanation

**Part 1:** two pointers skip junk independently and compare case-insensitively. O(n) time, O(1) space. Building `''.join(c.lower() for c in s if c.isalnum())` and comparing with its reverse is O(n) space: acceptable but mention the trade-off.

**Part 2:** everything before the first mismatch already matches, so the only decision is which side to delete. Each check is O(n) and it runs at most twice, so O(n) total. The greedy "delete whichever looks right" is wrong: `"cbbcc"` needs the right-hand deletion even though the left looks plausible, so check **both**.

## Follow-up questions

<details><summary>Allow up to k deletions.</summary>

The two-branch trick becomes exponential. Use DP: the minimum deletions to make `s` a palindrome is `len(s) - LPS(s)` (longest palindromic subsequence), O(n²). Return `≤ k`.

</details>
