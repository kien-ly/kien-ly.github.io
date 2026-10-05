---
title: "Config-Driven Connector Framework (ABC + Registry)"
description: "Design a small OOP framework: an abstract Source, a decorator-based registry, a factory from config and an incremental read with checkpoints."
url: "/interview-prep/practice/python/29-connector-registry/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 29
---

# Config-Driven Connector Framework (ABC + Registry)

**Pattern:** OOP design · **Difficulty:** Medium · **Asked at:** Fivetran, Airbyte, Databricks, Netflix

## Problem

Build a mini ingestion framework:

1. `Source`, an abstract base class with abstract methods `read(since)` (yields record dicts with an `updated_at` int field, only records with `updated_at > since`, or all if `since is None`) and `name()`.
2. `register(type_name)`, a class decorator that stores the class in the module-level dict `REGISTRY` under `type_name` and returns the class unchanged. Registering the same name twice raises `ValueError`.
3. `build(config)`, which creates a source from `{"type": ..., "options": {...}}` using `REGISTRY`; an unknown type raises `KeyError` with a helpful message.
4. `@register("memory") class MemorySource(Source)`: takes `rows` (a list of dicts) in its constructor; `name()` returns `"memory"`.
5. `run_incremental(source, state)`: reads with `since = state.get(source.name())`, returns the list of records read, and stores the max `updated_at` seen back into `state[source.name()]` (unchanged if nothing was read).

Instantiating `Source` directly (or a subclass missing a method) must raise `TypeError`.

## Starter code

```python starter
from abc import ABC, abstractmethod
from typing import Iterator

REGISTRY: dict[str, type] = {}


class Source(ABC):
    pass


def register(type_name: str):
    pass


def build(config: dict) -> Source:
    pass


class MemorySource(Source):   # remember to register it as "memory"
    pass


def run_incremental(source: Source, state: dict) -> list[dict]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

`@abstractmethod` on both methods makes `Source()` raise `TypeError` automatically.

</details>

<details><summary>Hint 2</summary>

The registry decorator is a function returning a function that stores `cls` and returns it.

</details>

<details><summary>Hint 3</summary>

The state dict is the checkpoint store: only advance it when records were actually read.

</details>

## Where this shows up in data engineering

This is the skeleton of Airbyte/Singer/Fivetran-style connectors and of most in-house "config-driven ingestion frameworks": a uniform interface, plugins registered by name, YAML config choosing the plugin, and a **cursor/checkpoint** so each run only reads new data. Interviewers use it to judge OOP design, not syntax.

## Solution

```python solution
from abc import ABC, abstractmethod
from typing import Iterator

REGISTRY: dict[str, type] = {}


class Source(ABC):
    @abstractmethod
    def read(self, since: int | None) -> Iterator[dict]: ...

    @abstractmethod
    def name(self) -> str: ...


def register(type_name: str):
    def decorator(cls):
        if type_name in REGISTRY:
            raise ValueError(f"source type {type_name!r} already registered")
        REGISTRY[type_name] = cls
        return cls
    return decorator


def build(config: dict) -> Source:
    kind = config["type"]
    if kind not in REGISTRY:
        raise KeyError(f"unknown source type {kind!r}; known: {sorted(REGISTRY)}")
    return REGISTRY[kind](/interview-prep/practice/python/**config.get("options", {}/))


@register("memory")
class MemorySource(Source):
    def __init__(self, rows: list[dict]):
        self.rows = rows

    def read(self, since):
        for r in self.rows:
            if since is None or r["updated_at"] > since:
                yield r

    def name(self):
        return "memory"


def run_incremental(source: Source, state: dict) -> list[dict]:
    since = state.get(source.name())
    records = list(source.read(since))
    if records:
        state[source.name()] = max(r["updated_at"] for r in records)
    return records
```

## Tests

Your solution should pass these:

```python tests
try:
    Source()
    ok = False
except TypeError:
    ok = True
assert ok

class Broken(Source):
    def name(self):
        return "broken"
try:
    Broken()
    ok = False
except TypeError:
    ok = True
assert ok

assert REGISTRY["memory"] is MemorySource
try:
    register("memory")(MemorySource)
    ok = False
except ValueError:
    ok = True
assert ok

src = build({"type": "memory", "options": {"rows": [
    {"id": 1, "updated_at": 10}, {"id": 2, "updated_at": 20}, {"id": 3, "updated_at": 15}]}})
state = {}
assert [r["id"] for r in run_incremental(src, state)] == [1, 2, 3]
assert state == {"memory": 20}
assert run_incremental(src, state) == [] and state == {"memory": 20}
src.rows.append({"id": 4, "updated_at": 25})
assert [r["id"] for r in run_incremental(src, state)] == [4] and state["memory"] == 25

try:
    build({"type": "nope"})
    ok = False
except KeyError as e:
    ok = "nope" in str(e)
assert ok
```

## Explanation

**ABC enforcement:** with both methods abstract, Python refuses to instantiate `Source` or any subclass that doesn't implement both, so mistakes surface at construction, not at 3 a.m. when `read` is first called.

**Registry decorator:** returns the class unchanged (so it's still usable directly) and fails loudly on duplicate names, which prevents a plugin silently replacing another.

**Factory:** config chooses the class; `**options` maps YAML keys to constructor parameters. The error message lists known types, which saves the on-call engineer a trip to the source code.

**Incremental contract:** the checkpoint only advances after records are successfully read. In production you'd advance it only after the **sink commit** succeeds (otherwise a crash between read and write loses data), and use `>=` plus dedup on keys if multiple records can share the same `updated_at`.

## Follow-up questions

<details><summary>Two records can have the same updated_at, and the job may crash mid-batch. How do you avoid losing or duplicating data?</summary>

Read with `>= checkpoint` (re-reading the boundary), make the sink idempotent (merge on primary key), and advance the checkpoint only after the sink commit. Better still, use a compound cursor `(updated_at, id)` so the boundary is unique.

</details>

<details><summary>How would you test every connector consistently?</summary>

A shared contract test suite (parametrised over all registered types) that checks: `read(None)` returns all, `read(checkpoint)` returns only newer records, records have the required fields, and repeated runs are idempotent.

</details>
