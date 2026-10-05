---
title: "Cheapest Way to Merge Sorted Files"
description: "Greedy with a min-heap (Huffman-style): always merge the two smallest files to minimise total I/O."
url: "/interview-prep/practice/algorithms/25-merge-files-min-cost/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 25
---

# Cheapest Way to Merge Sorted Files

**Pattern:** Heap (Top-K and Greedy Merging) · **Difficulty:** Medium · **Asked at:** Databricks, Snowflake, Confluent

**Classic version:** [LeetCode 1167](https://leetcode.com/problems/minimum-cost-to-connect-sticks/)

## Problem

A compaction job must merge `n` sorted files into one. Merging two files of sizes `a` and `b` costs `a + b` (every byte is read and written once) and produces a file of size `a + b`. Files can be merged in any order. Return the minimum total cost to end with a single file. One file or none costs 0.

## Examples

```text
min_merge_cost([2, 4, 3])      → 14   # (2+3)=5, then (4+5)=9 → 5+9
min_merge_cost([1, 8, 3, 5])   → 30
min_merge_cost([5])            → 0
```

## Starter code

```python starter
def min_merge_cost(sizes: list[int]) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Bytes in files merged early are rewritten again in every later merge. Which files should be merged first?

</details>

<details><summary>Hint 2</summary>

Repeatedly pop the two smallest from a min-heap, add their sum to the cost, and push the merged size back.

</details>

## Where this shows up in data engineering

This is the cost model behind **LSM-tree compaction** (RocksDB, Cassandra, HBase) and small-file compaction in lakehouses: rewriting big files repeatedly is what makes compaction expensive. Size-tiered compaction merges similar-sized small files first for exactly this reason. The optimal-merge-pattern argument is also how Huffman coding builds its tree.

## Solution

```python solution
import heapq


def min_merge_cost(sizes: list[int]) -> int:
    heap = list(sizes)
    heapq.heapify(heap)                  # O(n)
    cost = 0
    while len(heap) > 1:
        a = heapq.heappop(heap)
        b = heapq.heappop(heap)
        cost += a + b
        heapq.heappush(heap, a + b)
    return cost
```

## Tests

Your solution should pass these:

```python tests
assert min_merge_cost([2, 4, 3]) == 14
assert min_merge_cost([1, 8, 3, 5]) == 30
assert min_merge_cost([5]) == 0
assert min_merge_cost([]) == 0
assert min_merge_cost([1, 1, 1, 1]) == 8
assert min_merge_cost([10, 20, 30]) == 90
```

## Explanation

**Why greedy is optimal:** draw the merges as a binary tree; each original file's bytes are paid once per level above it, so total cost = Σ size × depth. To minimise it, the smallest files should be deepest, so merge the two smallest first. (This is exactly Huffman's exchange argument.)

**Complexity:** O(n log n): `n - 1` merges, each O(log n) heap work.

**K-way merges:** if a merge can combine up to `k` files at once (cost = their total), pad with zero-size files so `(n - 1) % (k - 1) == 0`, then always merge the k smallest.

## Follow-up questions

<details><summary>Real compaction merges up to 10 files at a time. Adapt.</summary>

Generalised Huffman: pad with zero-size dummies until `(n-1) % (k-1) == 0`, then repeatedly pop the k smallest, merge, and push the result.

</details>

<details><summary>Why don't production systems always do this exact greedy?</summary>

They also care about read amplification (how many files a query must open), write amplification, space amplification and keeping compactions small and incremental. Leveled vs size-tiered compaction trade these off; the greedy only minimises total bytes rewritten.

</details>
