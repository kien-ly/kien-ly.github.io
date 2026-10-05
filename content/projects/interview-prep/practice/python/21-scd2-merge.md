---
title: "Apply a Daily Snapshot to an SCD Type 2 Dimension"
description: "Implement the SCD2 merge in plain Python: close changed rows, insert new versions, handle new and deleted keys."
url: "/interview-prep/practice/python/21-scd2-merge/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 21
---

# Apply a Daily Snapshot to an SCD Type 2 Dimension

**Difficulty:** Medium · **Topics:** scd2, data-modeling, merge · **Asked at:** Databricks, Snowflake, Capgemini, any DWH team

## Problem

`dim` is a list of rows `{"key", "attrs" (dict), "valid_from", "valid_to", "is_current"}` with `valid_to = "9999-12-31"` for current rows. `snapshot` maps key → attrs for date `as_of` (ISO string). Return the new dimension list (sorted by key, valid_from) after applying SCD2:
- changed attrs → close the current row (`valid_to = as_of`, `is_current = False`) and add a new current row from `as_of`
- new keys → add a current row
- keys missing from the snapshot → close the current row (no new row)
- unchanged → leave as is
Don't mutate the input rows.

## Starter code

```python starter
def apply_snapshot(dim: list[dict], snapshot: dict, as_of: str) -> list[dict]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

Index current rows by key. Copy rows before changing them.

</details>

## Solution

```python solution
OPEN = "9999-12-31"

def apply_snapshot(dim: list[dict], snapshot: dict, as_of: str) -> list[dict]:
    out = [dict(r) for r in dim]
    current = {r["key"]: r for r in out if r["is_current"]}
    for key, row in current.items():
        if key not in snapshot:
            row.update(valid_to=as_of, is_current=False)
        elif snapshot[key] != row["attrs"]:
            row.update(valid_to=as_of, is_current=False)
            out.append({"key": key, "attrs": dict(snapshot[key]), "valid_from": as_of, "valid_to": OPEN, "is_current": True})
    for key, attrs in snapshot.items():
        if key not in current:
            out.append({"key": key, "attrs": dict(attrs), "valid_from": as_of, "valid_to": OPEN, "is_current": True})
    return sorted(out, key=lambda r: (r["key"], r["valid_from"]))
```

## Tests

Your solution should pass these:

```python tests
dim = [
    {"key": 1, "attrs": {"tier": "bronze"}, "valid_from": "2026-01-01", "valid_to": "9999-12-31", "is_current": True},
    {"key": 2, "attrs": {"tier": "gold"},   "valid_from": "2026-01-01", "valid_to": "9999-12-31", "is_current": True},
    {"key": 3, "attrs": {"tier": "silver"}, "valid_from": "2026-01-01", "valid_to": "9999-12-31", "is_current": True},
]
snap = {1: {"tier": "silver"}, 2: {"tier": "gold"}, 4: {"tier": "bronze"}}
new = apply_snapshot(dim, snap, "2026-02-01")
assert [(r["key"], r["attrs"]["tier"], r["valid_from"], r["valid_to"], r["is_current"]) for r in new] == [
    (1, "bronze", "2026-01-01", "2026-02-01", False),
    (1, "silver", "2026-02-01", "9999-12-31", True),
    (2, "gold",   "2026-01-01", "9999-12-31", True),
    (3, "silver", "2026-01-01", "2026-02-01", False),
    (4, "bronze", "2026-02-01", "9999-12-31", True),
]
assert dim[0]["is_current"] is True     # input not mutated
```

## Explanation

O(n + m). This is what `MERGE INTO dim USING (staged changes)` does in Delta/Snowflake, or `dbt snapshot`: the classic trick is a staged source that contains each changed key **twice** (once to close the old row, once to insert the new one) so a single MERGE handles both. Idempotency question: running the same snapshot twice must not create duplicate versions. Here the second run sees unchanged attrs and does nothing.
