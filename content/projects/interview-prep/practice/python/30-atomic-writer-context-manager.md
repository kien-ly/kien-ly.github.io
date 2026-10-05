---
title: "Atomic Partition Writer (Context Manager)"
description: "Implement a context manager that stages writes and only publishes them on success, rolling back on any exception."
url: "/interview-prep/practice/python/30-atomic-writer-context-manager/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 30
---

# Atomic Partition Writer (Context Manager)

**Pattern:** Context managers · **Difficulty:** Medium · **Asked at:** Databricks, Snowflake, Uber

## Problem

A key-value "warehouse" is represented by a dict `store` mapping partition names to lists of rows. Implement the class `AtomicPartitionWriter(store, partition)` used as:

```python
with AtomicPartitionWriter(store, "dt=2024-05-01") as w:
    w.write({"id": 1})
    w.write({"id": 2})
```

Requirements:
- Rows written inside the block are **staged**; readers of `store` see nothing new until the block exits successfully.
- On success, the partition is **replaced** (not appended) with the staged rows, atomically (one assignment).
- If the block raises, `store` is unchanged and the exception propagates.
- Writing after the block has exited raises `RuntimeError`.
- `__enter__` returns the writer; the writer exposes `committed` (bool).

## Starter code

```python starter
class AtomicPartitionWriter:
    def __init__(self, store: dict, partition: str):
        pass

    def __enter__(self):
        pass

    def write(self, row: dict) -> None:
        pass

    def __exit__(self, exc_type, exc, tb):
        pass
```

## Hints

<details><summary>Hint 1</summary>

Stage rows in a private list. Track whether the writer is open.

</details>

<details><summary>Hint 2</summary>

`__exit__` gets `exc_type=None` on success. Commit with one assignment `store[partition] = staged`. Return `False` so exceptions propagate.

</details>

## Where this shows up in data engineering

This is the shape of **idempotent, atomic partition overwrites**: write to a staging location (temp path, staging table, uncommitted Delta transaction), then publish in one atomic step (rename, `INSERT OVERWRITE`, a Delta commit). Readers never see half-written data, and re-running the job produces the same result.

## Solution

```python solution
class AtomicPartitionWriter:
    def __init__(self, store, partition):
        self.store = store
        self.partition = partition
        self._staged = []
        self._open = False
        self.committed = False

    def __enter__(self):
        self._open = True
        return self

    def write(self, row):
        if not self._open:
            raise RuntimeError("writer is closed")
        self._staged.append(dict(row))          # copy: later caller mutations can't leak in

    def __exit__(self, exc_type, exc, tb):
        self._open = False
        if exc_type is None:
            self.store[self.partition] = self._staged     # single atomic publish
            self.committed = True
        else:
            self._staged = []                             # discard staged data
        return False                                      # never swallow exceptions
```

## Tests

Your solution should pass these:

```python tests
store = {"dt=2024-04-30": [{"id": 0}], "dt=2024-05-01": [{"id": 99}]}
with AtomicPartitionWriter(store, "dt=2024-05-01") as w:
    w.write({"id": 1})
    w.write({"id": 2})
    assert store["dt=2024-05-01"] == [{"id": 99}]      # not visible yet
assert store["dt=2024-05-01"] == [{"id": 1}, {"id": 2}] and w.committed
assert store["dt=2024-04-30"] == [{"id": 0}]

before = {k: list(v) for k, v in store.items()}
try:
    with AtomicPartitionWriter(store, "dt=2024-05-01") as w2:
        w2.write({"id": 3})
        raise ValueError("boom")
except ValueError:
    pass
assert store == before and not w2.committed

try:
    w.write({"id": 4})
    ok = False
except RuntimeError:
    ok = True
assert ok

row = {"id": 5}
with AtomicPartitionWriter(store, "dt=2024-05-02") as w3:
    w3.write(row)
row["id"] = 999
assert store["dt=2024-05-02"] == [{"id": 5}]
```

## Explanation

**Protocol:** `__enter__` opens and returns the writer; `__exit__(exc_type, exc, tb)` receives the exception (if any). Returning `False`/`None` propagates it; returning `True` would swallow it, which is almost never what a pipeline wants.

**Atomicity:** readers either see the old list or the new list, never a partially filled one, because the publish is a single reference assignment.

**Replace, not append:** re-running the same partition gives the same result: idempotency.

**Defensive copy:** copying each row prevents a caller mutating its dict after writing from changing staged or published data.

**Real-world equivalents:** Spark `mode("overwrite")` with dynamic partition overwrite, Delta's `replaceWhere`, writing to `_tmp/` then renaming (atomic on HDFS, not on S3, which is why table formats exist), and DB `BEGIN … COMMIT`.

## Follow-up questions

<details><summary>Why isn't 'write to a temp folder then rename' atomic on S3?</summary>

S3 has no atomic rename for prefixes; a 'rename' is copy-then-delete per object, so readers can see partial results and failures leave debris. Table formats (Delta/Iceberg/Hudi) make the commit a single atomic metadata operation instead.

</details>
