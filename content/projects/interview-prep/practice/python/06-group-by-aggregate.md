---
title: "Implement GROUP BY with Multiple Aggregates"
description: "Aggregate records by key computing count, sum, average, min and max in one pass without pandas."
url: "/interview-prep/practice/python/06-group-by-aggregate/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 6
---

# Implement GROUP BY with Multiple Aggregates

**Difficulty:** Easy · **Topics:** hash-map, aggregation, one-pass · **Asked at:** Amazon, Meta, Shopify

## Problem

Given order records `{"country": str, "amount": float}`, return a dict mapping each country to `{"count", "sum", "avg", "min", "max"}` with `avg` and `sum` rounded to 2 decimals. Records with a missing or `None` amount are skipped but still **not counted**. Compute everything in **one pass**.

## Starter code

```python starter
def group_stats(records: list[dict]) -> dict:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Accumulate count, sum, min, max per key; compute avg at the end.

</details>

## Solution

```python solution
def group_stats(records: list[dict]) -> dict:
    acc: dict = {}
    for r in records:
        amt = r.get("amount")
        if amt is None:
            continue
        s = acc.setdefault(r["country"], {"count": 0, "sum": 0.0, "min": amt, "max": amt})
        s["count"] += 1
        s["sum"] += amt
        s["min"] = min(s["min"], amt)
        s["max"] = max(s["max"], amt)
    return {k: {"count": v["count"], "sum": round(v["sum"], 2), "avg": round(v["sum"] / v["count"], 2),
                "min": v["min"], "max": v["max"]} for k, v in acc.items()}
```

## Tests

Your solution should pass these:

```python tests
recs = [{"country": "DE", "amount": 10.0}, {"country": "FR", "amount": 5.5}, {"country": "DE", "amount": 30.0},
        {"country": "DE", "amount": None}, {"country": "FR"}, {"country": "DE", "amount": 20.0}]
out = group_stats(recs)
assert out["DE"] == {"count": 3, "sum": 60.0, "avg": 20.0, "min": 10.0, "max": 30.0}
assert out["FR"] == {"count": 1, "sum": 5.5, "avg": 5.5, "min": 5.5, "max": 5.5}
assert group_stats([]) == {}
```

## Explanation

These aggregates are **decomposable**: partial (count, sum, min, max) from different workers can be merged, which is why Spark can do map-side partial aggregation before the shuffle. Average is *not* directly mergeable (an average of averages is wrong), but (sum, count) is. Median and distinct count aren't decomposable this way, so they need sketches or a full shuffle.

## Follow-up questions

<details><summary>How would you add a running variance?</summary>

Welford's online algorithm keeps (count, mean, M2) and updates in O(1) per record with good numerical stability; partial states are mergeable (Chan's parallel formula).

</details>
