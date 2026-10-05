---
title: "Fewest Coins and Number of Ways (Unbounded Knapsack)"
description: "Bottom-up DP twice: minimum items to reach a total, and how many combinations reach it."
url: "/interview-prep/practice/algorithms/43-coin-change/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 43
---

# Fewest Coins and Number of Ways (Unbounded Knapsack)

**Pattern:** Dynamic Programming · **Difficulty:** Medium · **Asked at:** Amazon, Google, Goldman Sachs, Stripe

**Classic version:** [LeetCode 322](https://leetcode.com/problems/coin-change/) · [LeetCode 518](https://leetcode.com/problems/coin-change-ii/)

## Problem

With unlimited coins of the given denominations:

1. `min_coins(coins, amount)`: the fewest coins summing to `amount`, or `-1` if impossible.
2. `count_ways(coins, amount)`: the number of distinct **combinations** (order doesn't matter) summing to `amount`.

## Examples

```text
min_coins([1, 2, 5], 11) → 3     # 5 + 5 + 1
min_coins([2], 3)        → -1
count_ways([1, 2, 5], 5) → 4     # 5, 2+2+1, 2+1+1+1, 1×5
```

## Starter code

```python starter
def min_coins(coins: list[int], amount: int) -> int:
    pass


def count_ways(coins: list[int], amount: int) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

`best[a]` = fewest coins for amount `a` = `1 + min(best[a - c])` over coins `c ≤ a`.

</details>

<details><summary>Hint 2</summary>

Counting combinations: loop over coins in the **outer** loop and amounts in the inner loop, so each combination is counted once regardless of order.

</details>

## Where this shows up in data engineering

DP's real value in DE interviews is the **state-design conversation**: "what do I need to remember to extend a solution?" The same thinking drives incremental aggregation (yesterday's state + today's delta) and cost-optimal batching decisions. Greedy fails here for denominations like `[1, 3, 4]` with amount 6. Mention it.

## Solution

```python solution
def min_coins(coins, amount):
    INF = amount + 1                       # more coins than could ever be needed
    best = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and best[a - c] + 1 < best[a]:
                best[a] = best[a - c] + 1
    return best[amount] if best[amount] != INF else -1


def count_ways(coins, amount):
    ways = [1] + [0] * amount              # one way to make 0: take nothing
    for c in coins:                        # coins outer => combinations, not permutations
        for a in range(c, amount + 1):
            ways[a] += ways[a - c]
    return ways[amount]
```

## Tests

Your solution should pass these:

```python tests
assert min_coins([1, 2, 5], 11) == 3
assert min_coins([2], 3) == -1
assert min_coins([1], 0) == 0
assert min_coins([1, 3, 4], 6) == 2
assert min_coins([186, 419, 83, 408], 6249) == 20
assert count_ways([1, 2, 5], 5) == 4
assert count_ways([2], 3) == 0
assert count_ways([10], 10) == 1
assert count_ways([1, 2, 3], 4) == 4
```

## Explanation

**Min coins:** `best[a]` depends only on smaller amounts, so fill 0..amount in order. O(amount × coins) time, O(amount) space. Greedy ("take the largest coin") is wrong in general: `[1, 3, 4]`, 6 → greedy 4+1+1 (3 coins) vs optimal 3+3 (2).

**Counting combinations:** with coins in the outer loop, each combination is built in a fixed coin order, so `1+2` and `2+1` are the same. Swapping the loops counts **permutations** (ordered sequences) instead, a classic follow-up.

**Top-down alternative:** recursion with `functools.lru_cache` is often quicker to write and fine for amounts in the thousands; mention the recursion-depth limit for larger ones.

## Follow-up questions

<details><summary>Return the actual coins used for the minimum.</summary>

Store `choice[a] = c` when `best[a]` improves, then walk back from `amount`: append `choice[a]`, `a -= choice[a]`.

</details>

<details><summary>What does swapping the loops in count_ways compute?</summary>

The number of ordered sequences (permutations), e.g. for `[1,2]`, 3 → `1+1+1, 1+2, 2+1` = 3 instead of 2.

</details>
