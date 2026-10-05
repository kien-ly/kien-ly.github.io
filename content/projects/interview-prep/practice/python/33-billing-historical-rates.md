---
title: "Usage Billing With Historical (Effective-Dated) Rates"
description: "Price usage events with the rate effective at each event's time using sorted effective dates and binary search: an SCD2 lookup in code."
url: "/interview-prep/practice/python/33-billing-historical-rates/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 33
---

# Usage Billing With Historical (Effective-Dated) Rates

**Pattern:** Practical modeling · **Difficulty:** Medium · **Asked at:** Rippling, Stripe, AWS, Snowflake

## Problem

`rates` maps a product to a list of `(effective_from, price_per_unit)` changes (unsorted). A rate applies from its `effective_from` (inclusive) until the next change. Usage events are `(product, ts, units)`.

Implement `bill(rates, events)` returning a dict `product → total_cost`, rounded to 2 decimals. If an event happens before the product's first rate, or the product has no rates, raise `ValueError` naming the product and timestamp. Events can be in any order.

## Examples

```text
rates  = {"compute": [(0, 0.10), (100, 0.08)], "storage": [(0, 0.02)]}
events = [("compute", 50, 10), ("compute", 100, 10), ("storage", 7, 100)]
bill(rates, events) → {"compute": 1.8, "storage": 2.0}
```

## Starter code

```python starter
def bill(rates: dict[str, list[tuple[int, float]]], events: list[tuple[str, int, int]]) -> dict[str, float]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Sort each product's rate changes by `effective_from` once.

</details>

<details><summary>Hint 2</summary>

For an event at `ts`, the applicable rate is the last change with `effective_from <= ts`: `bisect_right(starts, ts) - 1`.

</details>

## Where this shows up in data engineering

This is a **point-in-time (as-of) join**: pricing events against an SCD2/effective-dated table. In SQL you'd join `ON e.ts >= r.valid_from AND e.ts < r.valid_to`; in Spark/pandas you'd use an as-of join (`merge_asof`). Getting the boundary right (inclusive start, exclusive end) and failing loudly on unpriced usage are what interviewers look for, because silent zero-pricing is a revenue leak.

## Solution

```python solution
from bisect import bisect_right


def bill(rates, events):
    table = {}
    for product, changes in rates.items():
        changes = sorted(changes)
        table[product] = ([s for s, _ in changes], [p for _, p in changes])
    totals: dict[str, float] = {}
    for product, ts, units in events:
        if product not in table or not table[product][0]:
            raise ValueError(f"no rates for {product} at {ts}")
        starts, prices = table[product]
        i = bisect_right(starts, ts) - 1          # last change with effective_from <= ts
        if i < 0:
            raise ValueError(f"no rate effective for {product} at {ts}")
        totals[product] = totals.get(product, 0.0) + units * prices[i]
    return {p: round(v, 2) for p, v in totals.items()}
```

## Tests

Your solution should pass these:

```python tests
rates = {"compute": [(100, 0.08), (0, 0.10)], "storage": [(0, 0.02)]}
events = [("compute", 50, 10), ("compute", 100, 10), ("storage", 7, 100)]
assert bill(rates, events) == {"compute": 1.8, "storage": 2.0}
assert bill(rates, [("compute", 99, 1), ("compute", 1000, 1)]) == {"compute": 0.18}
assert bill(rates, []) == {}
try:
    bill({"gpu": [(10, 2.5)]}, [("gpu", 5, 1)])
    ok = False
except ValueError as e:
    ok = "gpu" in str(e) and "5" in str(e)
assert ok
try:
    bill({}, [("x", 1, 1)])
    ok = False
except ValueError:
    ok = True
assert ok
```

## Explanation

**Pre-processing:** sort each product's changes once (O(R log R)), split into parallel `starts` and `prices` lists for `bisect`.

**Lookup:** `bisect_right(starts, ts) - 1` finds the last start `≤ ts`, which makes the start inclusive (an event exactly at a change uses the new price). O(log R) per event.

**Validation:** raising on unpriced usage turns a silent revenue bug into a visible failure; in a pipeline you'd route such events to a quarantine table and alert instead of failing the whole batch.

**Money:** floats are used here for simplicity; production billing uses `Decimal` or integer minor units (cents, micro-dollars) to avoid rounding drift across millions of events.

## Follow-up questions

<details><summary>Do the same in SQL for 10 billion usage rows.</summary>

Store rates as SCD2 (`valid_from`, `valid_to` = next `valid_from` or '9999-12-31' via `LEAD`). Join `usage u JOIN rates r ON u.product = r.product AND u.ts >= r.valid_from AND u.ts < r.valid_to`. Range joins are expensive; in Spark use a range-join hint/bin-packing optimisation or bucket by product and day.

</details>

<details><summary>Rates are also per customer tier, and tiers change over time.</summary>

Two as-of lookups: the customer's tier at `ts` (SCD2 on customer) then the rate for (product, tier) at `ts`. Keep both as effective-dated tables; never overwrite history, because invoices must be reproducible.

</details>
