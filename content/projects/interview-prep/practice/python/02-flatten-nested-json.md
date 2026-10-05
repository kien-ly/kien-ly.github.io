---
title: "Flatten Nested JSON Records"
description: "Flatten nested dicts and lists into dotted column names, as done before loading semi-structured data into tables."
url: "/interview-prep/practice/python/02-flatten-nested-json/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 2
---

# Flatten Nested JSON Records

**Difficulty:** Easy · **Topics:** recursion, json, schema · **Asked at:** Snowflake, Databricks, Stripe

## Problem

Write `flatten(record)` that turns a nested JSON object into a flat dict:
- nested dict keys are joined with `.` (e.g. `user.address.city`)
- list elements use their index (e.g. `items.0.sku`)
- empty dicts/lists become `None` under their own key
- scalars (str, int, float, bool, None) are kept as-is

## Examples

```text
flatten({"id": 1, "user": {"name": "Ana", "tags": ["a", "b"]}, "meta": {}})
→ {"id": 1, "user.name": "Ana", "user.tags.0": "a", "user.tags.1": "b", "meta": None}
```

## Starter code

```python starter
def flatten(record: dict, sep: str = ".") -> dict:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Recursive helper `walk(value, prefix)` that handles dict, list, scalar.

</details>

## Solution

```python solution
def flatten(record: dict, sep: str = ".") -> dict:
    out = {}

    def walk(value, prefix):
        if isinstance(value, dict):
            if not value and prefix:
                out[prefix] = None
            for k, v in value.items():
                walk(v, f"{prefix}{sep}{k}" if prefix else str(k))
        elif isinstance(value, list):
            if not value:
                out[prefix] = None
            for i, v in enumerate(value):
                walk(v, f"{prefix}{sep}{i}")
        else:
            out[prefix] = value

    walk(record, "")
    return out
```

## Tests

Your solution should pass these:

```python tests
assert flatten({"id": 1, "user": {"name": "Ana", "tags": ["a", "b"]}, "meta": {}}) == {
    "id": 1, "user.name": "Ana", "user.tags.0": "a", "user.tags.1": "b", "meta": None}
assert flatten({"a": [{"b": 1}, {"b": 2, "c": []}]}) == {"a.0.b": 1, "a.1.b": 2, "a.1.c": None}
assert flatten({}) == {}
assert flatten({"x": None, "y": False}) == {"x": None, "y": False}
assert flatten({"a": {"b": 1}}, sep="__") == {"a__b": 1}
```

## Explanation

O(total number of leaves). Recursion depth equals nesting depth; for adversarial inputs (depth > 1000) use an explicit stack.

**Design discussion:** indexing list elements into columns (`items.0`, `items.1`) is usually the *wrong* modelling choice for analytics, since column count becomes unbounded. In a lakehouse you'd keep arrays as `ARRAY<STRUCT>` and `explode` them into a child table (one row per item). Mention this trade-off.

## Follow-up questions

<details><summary>How do you handle key collisions, e.g. {"a.b": 1, "a": {"b": 2}}?</summary>

Detect when a key already exists in `out` and raise or suffix it; or escape the separator in keys. Silent overwrites are data loss.

</details>
