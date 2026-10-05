---
title: "Longest Increasing Subsequence in O(n log n)"
description: "Patience sorting: maintain the smallest tail for each length and binary-search where each value goes."
url: "/interview-prep/practice/algorithms/45-longest-increasing-subsequence/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 45
---

# Longest Increasing Subsequence in O(n log n)

**Pattern:** Dynamic Programming · **Difficulty:** Medium · **Asked at:** Google, Microsoft, Amazon

**Classic version:** [LeetCode 300](https://leetcode.com/problems/longest-increasing-subsequence/)

## Problem

Return the length of the longest **strictly** increasing subsequence of `nums` (elements in order, not necessarily contiguous). Target O(n log n).

## Examples

```text
lis([10, 9, 2, 5, 3, 7, 101, 18]) → 4    # 2, 3, 7, 18
lis([0, 1, 0, 3, 2, 3])           → 4
lis([7, 7, 7, 7])                 → 1
```

## Starter code

```python starter
def lis(nums: list[int]) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

O(n²) DP: `dp[i]` = longest increasing subsequence ending at `i` = 1 + max `dp[j]` for `j < i` with `nums[j] < nums[i]`.

</details>

<details><summary>Hint 2</summary>

O(n log n): keep `tails[k]` = smallest possible tail of an increasing subsequence of length `k+1`. For each `x`, replace the first tail ≥ `x` (or append).

</details>

## Where this shows up in data engineering

Shows up as "longest run of improving metrics", ordering checks on event sequences (how many events are out of order = n − LIS), and version-history problems. It's also the canonical example of speeding up a DP with binary search, which interviewers love as a follow-up.

## Solution

```python solution
from bisect import bisect_left


def lis(nums: list[int]) -> int:
    tails: list[int] = []
    for x in nums:
        i = bisect_left(tails, x)          # first tail >= x (strictly increasing)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x                   # a smaller tail for length i+1
    return len(tails)
```

## Tests

Your solution should pass these:

```python tests
assert lis([10, 9, 2, 5, 3, 7, 101, 18]) == 4
assert lis([0, 1, 0, 3, 2, 3]) == 4
assert lis([7, 7, 7, 7]) == 1
assert lis([]) == 0
assert lis([1, 2, 3, 4, 5]) == 5
assert lis([5, 4, 3, 2, 1]) == 1
```

## Explanation

**Invariant:** `tails` is sorted, and `tails[k]` is the smallest tail value among all increasing subsequences of length `k+1` seen so far. A smaller tail is always better (it's easier to extend).

**Each new x:** if it's bigger than every tail, it extends the longest subsequence; otherwise it replaces the first tail ≥ x, improving that length's tail. `tails` is *not* an actual subsequence. Only its length is meaningful.

**Complexity:** O(n log n) time, O(n) space. Use `bisect_right` for non-decreasing (allowing equal values).

## Follow-up questions

<details><summary>Return an actual subsequence, not just the length.</summary>

Store for each element the index of its predecessor (the tail at position i-1 when it was placed) and the index stored in each tail slot; walk back from the last tail.

</details>

<details><summary>Events should arrive in increasing sequence order. What's the minimum number to drop to make the stream ordered?</summary>

`n - LIS(sequence_numbers)` (non-decreasing variant if duplicates are allowed).

</details>
