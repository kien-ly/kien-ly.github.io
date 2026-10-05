---
title: "Merge Customer Records That Share an Email (Union-Find)"
description: "Entity resolution with a disjoint-set union: group records connected by any shared identifier."
url: "/interview-prep/practice/algorithms/42-accounts-merge/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 42
---

# Merge Customer Records That Share an Email (Union-Find)

**Pattern:** Graphs: BFS, DFS and Union-Find · **Difficulty:** Medium · **Asked at:** Meta, Google, Amazon, Salesforce

**Classic version:** [LeetCode 721](https://leetcode.com/problems/accounts-merge/) · [LeetCode 547](https://leetcode.com/problems/number-of-provinces/)

## Problem

Each record is `[name, email1, email2, ...]`. Two records belong to the same person if they share **any** email (directly or through a chain of records). Merge them and return one entry per person: `[name, *sorted unique emails]`. Sort the result by the first email. Records of one person always carry the same name.

## Examples

```text
merge_accounts([
    ["John", "john@a.com", "john_work@b.com"],
    ["John", "john@a.com", "john00@c.com"],
    ["Mary", "mary@m.com"],
    ["John", "johnny@d.com"],
]) → [["John", "john00@c.com", "john@a.com", "john_work@b.com"],
      ["John", "johnny@d.com"],
      ["Mary", "mary@m.com"]]
```

## Starter code

```python starter
def merge_accounts(records: list[list[str]]) -> list[list[str]]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Treat each email as a node; every record connects its emails. People are the connected components.

</details>

<details><summary>Hint 2</summary>

Union-find: union each email in a record with the record's first email. Then group emails by their root.

</details>

## Where this shows up in data engineering

This is **identity resolution** for a Customer 360: link CRM, web and support records through shared emails, phones or device IDs. In production the matching keys are normalised first (lower-case, strip dots/plus-tags), and the clustering runs as connected components in Spark/GraphFrames or iterative SQL. Also watch for "super-nodes" (a shared support@ email) that would wrongly merge thousands of people.

## Solution

```python solution
def merge_accounts(records):
    parent: dict[str, str] = {}

    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]        # path halving
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    owner = {}
    for name, *emails in records:
        for e in emails:
            owner[e] = name
            union(emails[0], e)

    groups: dict[str, list[str]] = {}
    for e in owner:
        groups.setdefault(find(e), []).append(e)
    merged = [[owner[root], *sorted(es)] for root, es in groups.items()]
    return sorted(merged, key=lambda acc: acc[1])
```

## Tests

Your solution should pass these:

```python tests
recs = [
    ["John", "john@a.com", "john_work@b.com"],
    ["John", "john@a.com", "john00@c.com"],
    ["Mary", "mary@m.com"],
    ["John", "johnny@d.com"],
]
assert merge_accounts(recs) == [
    ["John", "john00@c.com", "john@a.com", "john_work@b.com"],
    ["John", "johnny@d.com"],
    ["Mary", "mary@m.com"],
]
chain = [["A", "a1", "a2"], ["A", "a3", "a4"], ["A", "a2", "a3"]]
assert merge_accounts(chain) == [["A", "a1", "a2", "a3", "a4"]]
assert merge_accounts([["Z", "z@z.com", "z@z.com"]]) == [["Z", "z@z.com"]]
```

## Explanation

**Union-find** maintains disjoint sets with near-constant `find`/`union` (inverse Ackermann with path compression + union by rank; path halving alone is plenty in practice). Union every email in a record with the record's first email; afterwards, emails with the same root belong to one person.

**Complexity:** O(E·α(E)) for unions plus O(E log E) to sort emails, where E is the total number of emails.

**BFS/DFS alternative:** build an adjacency list email → emails and find components; same asymptotics, more memory for the explicit graph.

**Transitive closure is the point:** records 1 and 3 in the chain test share nothing directly; they're linked through record 2. A simple `GROUP BY email` can't find that.

## Follow-up questions

<details><summary>How would you do this for 500 million customer records?</summary>

Normalise keys, then run connected components as a distributed graph job (GraphFrames, or iterative min-label propagation in SQL until no label changes). Guard against super-nodes by excluding identifiers shared by more than N records, and store the resulting cluster_id with match evidence for auditability (see the Customer 360 data modeling case).

</details>
