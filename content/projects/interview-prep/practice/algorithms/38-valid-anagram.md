---
title: "Valid Anagram and Group Anagrams"
description: "Character counting for one pair; a canonical key (sorted string or count tuple) to group many strings."
url: "/interview-prep/practice/algorithms/38-valid-anagram/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 38
---

# Valid Anagram and Group Anagrams

**Pattern:** Hashing, Stacks and Bit Tricks (Must-Know Classics) · **Difficulty:** Easy · **Asked at:** Amazon, Bloomberg, Uber, Meta

**Classic version:** [LeetCode 242](https://leetcode.com/problems/valid-anagram/) · [LeetCode 49](https://leetcode.com/problems/group-anagrams/)

## Problem

1. `is_anagram(s, t)`: `True` if `t` is a rearrangement of `s`.
2. `group_anagrams(words)`: group the words that are anagrams of each other. Return the groups with each group's words in input order, and groups ordered by the first appearance of their first word.

## Examples

```text
is_anagram("anagram", "nagaram") → True
is_anagram("rat", "car")         → False
group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"])
    → [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]
```

## Starter code

```python starter
def is_anagram(s: str, t: str) -> bool:
    pass


def group_anagrams(words: list[str]) -> list[list[str]]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Two strings are anagrams iff their character counts are equal.

</details>

<details><summary>Hint 2</summary>

Grouping: map each word to a canonical key that's identical for all its anagrams, e.g. `''.join(sorted(word))`. A dict preserves insertion order.

</details>

## Where this shows up in data engineering

Grouping by a **canonical key** is the essence of deduplication and entity resolution: normalise (lower-case, strip punctuation, sort tokens) so variants collide on one key, then `GROUP BY` it. "Blocking keys" in record linkage are exactly this.

## Solution

```python solution
from collections import Counter


def is_anagram(s: str, t: str) -> bool:
    return len(s) == len(t) and Counter(s) == Counter(t)


def group_anagrams(words: list[str]) -> list[list[str]]:
    groups: dict[str, list[str]] = {}
    for w in words:
        groups.setdefault("".join(sorted(w)), []).append(w)
    return list(groups.values())
```

## Tests

Your solution should pass these:

```python tests
assert is_anagram("anagram", "nagaram") is True
assert is_anagram("rat", "car") is False
assert is_anagram("a", "ab") is False
assert is_anagram("", "") is True
assert group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]) == [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]
assert group_anagrams([""]) == [[""]]
assert group_anagrams(["a"]) == [["a"]]
assert group_anagrams(["ab", "ba", "abc", "cab", "b"]) == [["ab", "ba"], ["abc", "cab"], ["b"]]
```

## Explanation

**Anagram check:** equal counts. `Counter` is O(n); sorting both strings is O(n log n). With a known small alphabet a 26-int array is fastest.

**Grouping key choices:**
- sorted string: O(k log k) per word, simple;
- count tuple (26 ints): O(k) per word, better for long words.

Total O(n · k log k) or O(n · k). Python dicts keep insertion order, which gives the required deterministic output order for free.

## Follow-up questions

<details><summary>Group 500 million product titles that are 'the same' up to word order and case.</summary>

Canonical key = lower-cased, punctuation-stripped, sorted tokens; `groupBy(key)` in Spark. For near-duplicates (typos), use MinHash/LSH blocking first, then a similarity check within each block.

</details>
