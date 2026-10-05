---
title: "Autocomplete With a Trie (Top Suggestions by Frequency)"
description: "Prefix tree with per-node top-k caching: insert search terms and return the best suggestions for a prefix."
url: "/interview-prep/practice/algorithms/47-autocomplete-trie/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 47
---

# Autocomplete With a Trie (Top Suggestions by Frequency)

**Pattern:** Backtracking and Tries · **Difficulty:** Medium · **Asked at:** Google, Amazon, LinkedIn, Uber

**Classic version:** [LeetCode 208](https://leetcode.com/problems/implement-trie-prefix-tree/) · [LeetCode 1268](https://leetcode.com/problems/search-suggestions-system/)

## Problem

Implement `Autocomplete`:

- `add(term, count=1)`: record that `term` was searched `count` more times.
- `suggest(prefix, k=3)`: return up to `k` terms starting with `prefix`, by total count descending, ties alphabetical.
- `starts_with(prefix)`: `True` if any stored term starts with `prefix`.

## Examples

```text
ac = Autocomplete()
ac.add("spark", 5); ac.add("spanner", 2); ac.add("sparql", 5); ac.add("snowflake", 9)
ac.suggest("sp")   → ["spark", "sparql", "spanner"]
ac.suggest("s", 2) → ["snowflake", "spark"]
ac.suggest("x")    → []
```

## Starter code

```python starter
class Autocomplete:
    def __init__(self):
        pass

    def add(self, term: str, count: int = 1) -> None:
        pass

    def suggest(self, prefix: str, k: int = 3) -> list[str]:
        pass

    def starts_with(self, prefix: str) -> bool:
        pass
```

## Hints

<details><summary>Hint 1</summary>

Each trie node maps a character to a child node. Walk the prefix; if you fall off, there are no matches.

</details>

<details><summary>Hint 2</summary>

From the prefix node, collect every term below it and pick the best k (or cache the top terms at each node during `add` to make `suggest` O(prefix length)).

</details>

## Where this shows up in data engineering

Search suggestions are a classic **system design + data pipeline** question: the trie (or a precomputed prefix → top-k table) is rebuilt from aggregated query logs by a batch/stream job and served from memory. Interviewers often move from this coding question straight into "how do you update counts from a 100k QPS query stream?"

## Solution

```python solution
import heapq


class _Node:
    __slots__ = ("children", "count")

    def __init__(self):
        self.children = {}
        self.count = 0                         # > 0 means a term ends here


class Autocomplete:
    def __init__(self):
        self.root = _Node()

    def _walk(self, prefix):
        node = self.root
        for ch in prefix:
            node = node.children.get(ch)
            if node is None:
                return None
        return node

    def add(self, term, count=1):
        node = self.root
        for ch in term:
            node = node.children.setdefault(ch, _Node())
        node.count += count

    def suggest(self, prefix, k=3):
        start = self._walk(prefix)
        if start is None:
            return []
        found, stack = [], [(start, prefix)]
        while stack:                          # iterative DFS over the subtree
            node, word = stack.pop()
            if node.count:
                found.append((-node.count, word))
            for ch, child in node.children.items():
                stack.append((child, word + ch))
        return [w for _, w in heapq.nsmallest(k, found)]

    def starts_with(self, prefix):
        return self._walk(prefix) is not None
```

## Tests

Your solution should pass these:

```python tests
ac = Autocomplete()
ac.add("spark", 5); ac.add("spanner", 2); ac.add("sparql", 5); ac.add("snowflake", 9)
assert ac.suggest("sp") == ["spark", "sparql", "spanner"]
assert ac.suggest("s", 2) == ["snowflake", "spark"]
assert ac.suggest("x") == []
assert ac.starts_with("snow") is True and ac.starts_with("snowy") is False
ac.add("spanner", 10)
assert ac.suggest("spa", 1) == ["spanner"]
ac.add("sp")
assert ac.suggest("sp", 5) == ["spanner", "spark", "sparql", "sp"]
```

## Explanation

**Trie basics:** a path from the root spells a prefix; a node with `count > 0` ends a stored term. `add` and prefix lookup are O(L) for a term of length L.

**Suggest:** walk to the prefix node, collect terms in its subtree, then take the best k with a heap. O(L + subtree size · log k). Fine for moderate data.

**Production version:** cache the top-k terms at every node (updated on insert, or rebuilt offline), so `suggest` is O(L) with no subtree scan. Trade-off: more memory and more work per update. Large systems rebuild the cache periodically from aggregated logs and accept slightly stale suggestions.

**Alternatives:** a sorted list of terms plus binary search for the prefix range (simple, cache-friendly); a key-value store mapping `prefix → top-k`, precomputed in batch.

## Follow-up questions

<details><summary>Design the pipeline that keeps suggestions fresh from billions of searches per day.</summary>

Stream query logs to Kafka; aggregate counts per term with decay (e.g. hourly windows, exponentially weighted) in Flink/Spark; periodically build prefix → top-k tables (only for prefixes up to ~20 chars, and only terms above a threshold); push the snapshot to serving nodes that hold it in memory. Filter spam and unsafe terms before publishing.

</details>
