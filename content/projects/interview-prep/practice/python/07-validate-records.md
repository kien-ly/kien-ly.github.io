---
title: "Validate Records Against a Schema"
description: "Check records for required fields, types and allowed values, returning valid rows and per-row error reasons (a mini data contract)."
url: "/interview-prep/practice/python/07-validate-records/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 7
---

# Validate Records Against a Schema

**Difficulty:** Easy · **Topics:** validation, data-quality, schema · **Asked at:** Stripe, Airbnb, Monte Carlo

## Problem

A schema maps field → spec: `{"type": type, "required": bool, "allowed": set (optional), "min": number (optional)}`. Write `validate(records, schema)` returning `(valid, rejected)` where `rejected` is a list of `(index, [error strings])`. Error formats: `"missing:<field>"`, `"type:<field>"`, `"allowed:<field>"`, `"min:<field>"`. `bool` must **not** be accepted as `int`. Unknown extra fields are allowed.

## Starter code

```python starter
def validate(records: list[dict], schema: dict) -> tuple[list[dict], list[tuple[int, list[str]]]]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

`isinstance(True, int)` is True in Python; check `type(v) is bool` explicitly.

</details>

<details><summary>Hint 2</summary>

Collect all errors for a row instead of stopping at the first. Users fix data faster that way.

</details>

## Solution

```python solution
def validate(records, schema):
    valid, rejected = [], []
    for i, rec in enumerate(records):
        errors = []
        for field, spec in schema.items():
            if field not in rec or rec[field] is None:
                if spec.get("required"):
                    errors.append(f"missing:{field}")
                continue
            v = rec[field]
            t = spec["type"]
            if (type(v) is bool and t is not bool) or not isinstance(v, t):
                errors.append(f"type:{field}")
                continue
            if "allowed" in spec and v not in spec["allowed"]:
                errors.append(f"allowed:{field}")
            if "min" in spec and v < spec["min"]:
                errors.append(f"min:{field}")
        if errors:
            rejected.append((i, errors))
        else:
            valid.append(rec)
    return valid, rejected
```

## Tests

Your solution should pass these:

```python tests
schema = {
    "order_id": {"type": str, "required": True},
    "amount": {"type": (int, float), "required": True, "min": 0},
    "currency": {"type": str, "required": True, "allowed": {"EUR", "USD"}},
    "coupon": {"type": str, "required": False},
}
recs = [
    {"order_id": "o1", "amount": 10, "currency": "EUR"},
    {"order_id": "o2", "amount": -5, "currency": "GBP"},
    {"amount": True, "currency": "USD", "coupon": 3},
    {"order_id": "o4", "amount": 2.5, "currency": "USD", "extra": 1},
]
valid, rejected = validate(recs, schema)
assert [r["order_id"] for r in valid] == ["o1", "o4"]
assert rejected == [(1, ["min:amount", "allowed:currency"]), (2, ["missing:order_id", "type:amount", "type:coupon"])]
```

## Explanation

This is the core of a data-quality gate: route invalid rows to a **quarantine** with reasons rather than failing the whole batch or silently dropping data. The `bool`-is-an-`int` trap is classic Python. In production you'd use pydantic, Great Expectations, or Delta/DLT expectations, but interviewers want to see the reasoning.
