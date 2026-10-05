---
title: "Infer a Schema from JSON Records"
description: "Infer column types across records with type widening (int to float to string) and nullability, like AutoLoader schema inference."
url: "/interview-prep/practice/python/20-schema-inference/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 20
---

# Infer a Schema from JSON Records

**Difficulty:** Medium · **Topics:** schema, json, type-system · **Asked at:** Databricks, Snowflake, Fivetran

## Problem

Given a list of flat JSON-like dicts, infer `{column: (type_name, nullable)}`:
- types: `"boolean"`, `"long"`, `"double"`, `"string"`
- widening: long + double → double; any mix involving string, or boolean with a number → string
- a column is nullable if it's `None` or **missing** in at least one record
- a column that is only ever `None` is `("string", True)`

## Starter code

```python starter
def infer_schema(records: list[dict]) -> dict[str, tuple[str, bool]]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Map each Python value to a type name (check bool before int!).

</details>

<details><summary>Hint 2</summary>

Define a `widen(a, b)` function and fold it over observed types per column.

</details>

## Solution

```python solution
def _type(v):
    if isinstance(v, bool):
        return "boolean"
    if isinstance(v, int):
        return "long"
    if isinstance(v, float):
        return "double"
    return "string"

def _widen(a, b):
    if a is None:
        return b
    if a == b:
        return a
    if {a, b} == {"long", "double"}:
        return "double"
    return "string"

def infer_schema(records: list[dict]) -> dict[str, tuple[str, bool]]:
    cols = {}
    for r in records:
        for k in r:
            cols.setdefault(k, [None, False])
    for r in records:
        for k, state in cols.items():
            v = r.get(k)
            if v is None:
                state[1] = True
            else:
                state[0] = _widen(state[0], _type(v))
    return {k: (t or "string", nullable) for k, (t, nullable) in cols.items()}
```

## Tests

Your solution should pass these:

```python tests
recs = [
    {"id": 1, "price": 10, "active": True, "note": None},
    {"id": 2, "price": 9.5, "active": False},
    {"id": 3, "price": 7, "active": 1, "code": "A1"},
]
assert infer_schema(recs) == {
    "id": ("long", False),
    "price": ("double", False),
    "active": ("string", False),
    "note": ("string", True),
    "code": ("string", True),
}
assert infer_schema([]) == {}
```

## Explanation

Real systems (Spark JSON reader, AutoLoader, BigQuery autodetect) do the same: sample records, widen types, mark nullability. Production lessons to mention: inference on a **sample** can miss rare types (hence `_rescued_data` columns for unexpected values), and silent widening to string hides upstream bugs. Prefer explicit schemas or contracts for important sources and use inference only for discovery/bronze.
