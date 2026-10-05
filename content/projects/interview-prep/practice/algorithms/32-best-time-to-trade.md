---
title: "Best Time to Buy and Sell (One Trade and Unlimited Trades)"
description: "Running minimum (Kadane on price differences) for one trade; sum of positive deltas for unlimited trades."
url: "/interview-prep/practice/algorithms/32-best-time-to-trade/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 32
---

# Best Time to Buy and Sell (One Trade and Unlimited Trades)

**Pattern:** Kadane's Algorithm (Best Subarray) · **Difficulty:** Easy · **Asked at:** Amazon, Meta, Bloomberg, Goldman Sachs

**Classic version:** [LeetCode 121](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) · [LeetCode 122](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/)

## Problem

`prices[i]` is the price on day `i`.

1. `max_profit_one(prices)`: best profit from one buy followed by one later sell (0 if no profit is possible).
2. `max_profit_many(prices)`: best profit with unlimited transactions, holding at most one unit at a time.

## Examples

```text
max_profit_one([7, 1, 5, 3, 6, 4])  → 5    # buy 1, sell 6
max_profit_one([7, 6, 4, 3, 1])     → 0
max_profit_many([7, 1, 5, 3, 6, 4]) → 7    # (5-1) + (6-3)
```

## Starter code

```python starter
def max_profit_one(prices: list[int]) -> int:
    pass


def max_profit_many(prices: list[int]) -> int:
    pass
```

## Hints

<details><summary>Hint 1</summary>

One trade: scanning left to right, the best sell today pairs with the cheapest price seen so far.

</details>

<details><summary>Hint 2</summary>

Unlimited trades: every rising day-over-day step can be captured; the sum of positive differences is optimal.

</details>

## Where this shows up in data engineering

The one-trade version is "largest increase between an earlier and a later reading" (biggest jump in a metric, largest delay between events), which in SQL is `value - MIN(value) OVER (ORDER BY day ROWS UNBOUNDED PRECEDING)`. A favourite warm-up that's often extended live (cooldowns, fees, k transactions) to test DP state design.

## Solution

```python solution
def max_profit_one(prices):
    best, low = 0, float("inf")
    for p in prices:
        low = min(low, p)                  # cheapest buy so far
        best = max(best, p - low)          # sell today
    return best


def max_profit_many(prices):
    return sum(max(0, b - a) for a, b in zip(prices, prices[1:]))
```

## Tests

Your solution should pass these:

```python tests
assert max_profit_one([7, 1, 5, 3, 6, 4]) == 5
assert max_profit_one([7, 6, 4, 3, 1]) == 0
assert max_profit_one([1]) == 0
assert max_profit_one([2, 4, 1]) == 2
assert max_profit_many([7, 1, 5, 3, 6, 4]) == 7
assert max_profit_many([1, 2, 3, 4, 5]) == 4
assert max_profit_many([7, 6, 4, 3, 1]) == 0
```

## Explanation

**One trade:** maintain the running minimum; each day's best is `price - min_so_far`. Equivalently, Kadane over the daily differences. O(n), O(1).

**Unlimited trades:** any multi-day rise `a → b` equals the sum of its daily rises, so capturing every positive step is as good as any set of trades, and never worse. O(n).

**Extensions as DP:** with a fee or cooldown, keep two states per day, `hold` (best profit while holding) and `cash` (best while not holding): `cash = max(cash, hold + p - fee)`, `hold = max(hold, cash_prev - p)`. With at most k trades, keep `hold[j]` and `cash[j]` for `j = 1..k`.

## Follow-up questions

<details><summary>Add a transaction fee per sale.</summary>

State machine DP: `cash = max(cash, hold + p - fee)`, `hold = max(hold, cash - p)` (use the previous `cash` for `hold`). O(n).

</details>

<details><summary>At most two transactions?</summary>

Four states: `buy1 = max(buy1, -p)`, `sell1 = max(sell1, buy1 + p)`, `buy2 = max(buy2, sell1 - p)`, `sell2 = max(sell2, buy2 + p)`. Answer `sell2`.

</details>
