---
title: "Deduplicate Records Keeping the Latest Version"
description: "Collapse CDC-style records to the latest version per key using a version column and a deterministic tie-breaker."
url: "/interview-prep/practice/python/03-dedupe-keep-latest/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 3
---

# Deduplicate Records Keeping the Latest Version

**Difficulty:** Easy · **Topics:** hash-map, deduplication, cdc · **Asked at:** Netflix, Airbnb, Confluent

## Problem

Each record is a dict with `id`, `updated_at` (ISO string) and `seq` (ingestion sequence number), plus arbitrary other fields. Return one record per `id`, the one with the greatest `updated_at`; break ties with the greatest `seq`. If the winning record has `"deleted": True`, drop that id entirely. Return results sorted by `id`.

## Starter code

```python starter
def dedupe_latest(records: list[dict]) -> list[dict]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

One pass with a dict `best[id]`; compare tuples `(updated_at, seq)`.

</details>

<details><summary>Hint 2</summary>

ISO-8601 strings in the same format and timezone compare correctly as strings.

</details>

## Solution

```python solution
def dedupe_latest(records: list[dict]) -> list[dict]:
    best: dict = {}
    for r in records:
        key = (r["updated_at"], r["seq"])
        cur = best.get(r["id"])
        if cur is None or key > (cur["updated_at"], cur["seq"]):
            best[r["id"]] = r
    return [best[i] for i in sorted(best) if not best[i].get("deleted")]
```

## Tests

Your solution should pass these:

```python tests
recs = [
    {"id": 2, "updated_at": "2026-01-01T10:00:00", "seq": 1, "v": "a"},
    {"id": 1, "updated_at": "2026-01-02T09:00:00", "seq": 2, "v": "b"},
    {"id": 2, "updated_at": "2026-01-03T10:00:00", "seq": 3, "v": "c"},
    {"id": 1, "updated_at": "2026-01-02T09:00:00", "seq": 4, "v": "d"},
    {"id": 3, "updated_at": "2026-01-01T00:00:00", "seq": 5, "v": "e"},
    {"id": 3, "updated_at": "2026-01-05T00:00:00", "seq": 6, "deleted": True},
    {"id": 2, "updated_at": "2026-01-02T10:00:00", "seq": 7, "v": "late"},
]
out = dedupe_latest(recs)
assert [r["v"] for r in out] == ["d", "c"]
assert [r["id"] for r in out] == [1, 2]
assert dedupe_latest([]) == []
```

## Explanation

O(n) time, O(unique ids) memory. Record `seq 7` arrives late with an older `updated_at` and must **not** overwrite the newer version: this is the out-of-order problem that `MERGE ... WHEN MATCHED AND s.updated_at > t.updated_at` solves in a lakehouse. Deletes are applied after choosing the winner, so a delete followed by a newer re-insert correctly resurrects the row.
