---
title: "Edit Distance for Fuzzy Matching"
description: "Classic 2D DP (Levenshtein) with a rolling row, plus a threshold check used in record linkage."
url: "/interview-prep/practice/algorithms/44-edit-distance/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 44
---

# Edit Distance for Fuzzy Matching

**Pattern:** Dynamic Programming · **Difficulty:** Hard · **Asked at:** Google, Amazon, Microsoft, Salesforce

**Classic version:** [LeetCode 72](https://leetcode.com/problems/edit-distance/) · [LeetCode 1143](https://leetcode.com/problems/longest-common-subsequence/)

## Problem

1. `edit_distance(a, b)`: the minimum number of single-character insertions, deletions or substitutions to turn `a` into `b`.
2. `is_close_match(a, b, max_edits)`: `True` if the case-insensitive edit distance is ≤ `max_edits`. It must return quickly when the lengths alone already differ by more than `max_edits`.

## Examples

```text
edit_distance("horse", "ros")              → 3
edit_distance("intention", "execution")    → 5
is_close_match("Jonathan", "jonathon", 1)  → True
is_close_match("Ann", "Annabelle", 2)      → False
```

## Starter code

```python starter
def edit_distance(a: str, b: str) -> int:
    pass


def is_close_match(a: str, b: str, max_edits: int) -> bool:
    pass
```

## Hints

<details><summary>Hint 1</summary>

`dp[i][j]` = distance between `a[:i]` and `b[:j]`. If `a[i-1] == b[j-1]` it equals `dp[i-1][j-1]`; otherwise 1 + the min of delete, insert and substitute.

</details>

<details><summary>Hint 2</summary>

Each row only depends on the previous row: keep two rows (O(min(n, m)) memory).

</details>

## Where this shows up in data engineering

Edit distance powers **fuzzy matching in entity resolution** (names, addresses, company names), typo-tolerant joins and data quality checks. In production you never compare all pairs (n² is impossible at scale): first **block** candidates by a cheap key (same postcode, same first letter, phonetic code), then compute distances within blocks, with the length-difference short-circuit.

## Solution

```python solution
def edit_distance(a: str, b: str) -> int:
    if len(a) < len(b):
        a, b = b, a                        # keep the rolling row short
    prev = list(range(len(b) + 1))         # distance from "" to b[:j]
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1):
            if ca == cb:
                cur[j] = prev[j - 1]
            else:
                cur[j] = 1 + min(prev[j],      # delete ca
                                 cur[j - 1],   # insert cb
                                 prev[j - 1])  # substitute
        prev = cur
    return prev[-1]


def is_close_match(a: str, b: str, max_edits: int) -> bool:
    if abs(len(a) - len(b)) > max_edits:   # lower bound on the distance: skip the DP
        return False
    return edit_distance(a.lower(), b.lower()) <= max_edits
```

## Tests

Your solution should pass these:

```python tests
assert edit_distance("horse", "ros") == 3
assert edit_distance("intention", "execution") == 5
assert edit_distance("", "abc") == 3
assert edit_distance("same", "same") == 0
assert edit_distance("kitten", "sitting") == 3
assert is_close_match("Jonathan", "jonathon", 1) is True
assert is_close_match("Ann", "Annabelle", 2) is False
assert is_close_match("Smith", "Smyth", 1) is True
assert is_close_match("abc", "xyz", 2) is False
```

## Explanation

**Recurrence:** compare the last characters. Equal → no cost. Different → the best of deleting from `a`, inserting into `a`, or substituting, each +1. Base cases: transforming to/from the empty string costs its length.

**Complexity:** O(n·m) time; the rolling row brings memory down to O(min(n, m)).

**Banded optimisation:** with a threshold k you only need cells with `|i - j| ≤ k` → O(k · n). The length check is the cheapest version of that pruning.

**Related DPs:** longest common subsequence (same table, max instead of min), and Damerau–Levenshtein, which also counts a swap of adjacent characters as one edit (better for typos).

## Follow-up questions

<details><summary>Match 10M new customer names against 100M existing ones by fuzzy name.</summary>

Blocking: normalise, then generate candidate pairs only within blocks (phonetic code + postcode, or MinHash/LSH on character n-grams). Compute banded edit distance or Jaro-Winkler within blocks, score with several features, and send borderline scores to manual review. Never all-pairs.

</details>
