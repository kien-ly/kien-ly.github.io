---
title: "Metrics Decorator: Count Calls, Failures and Latency"
description: "Write a parameterised decorator that records per-function call counts, failures and durations into an injectable registry, preserving metadata."
url: "/interview-prep/practice/python/28-timed-metrics-decorator/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 28
---

# Metrics Decorator: Count Calls, Failures and Latency

**Pattern:** Decorators · **Difficulty:** Medium · **Asked at:** Databricks, Airbnb, Stripe

## Problem

Implement `instrument(registry, name=None, clock=time.perf_counter)`, a decorator factory. Every call to a decorated function must update `registry[metric_name]` (a dict created on first use) with:

- `calls`: number of calls
- `failures`: number of calls that raised
- `total_seconds`: summed duration of all calls (successful or not), measured with `clock`

`metric_name` is `name` if given, otherwise the function's `__name__`. Exceptions must propagate unchanged, return values must pass through, and the decorated function must keep its `__name__` and `__doc__`.

## Examples

```text
reg = {}
@instrument(reg)
def add(a, b):
    "Add two numbers."
    return a + b

add(1, 2)         → 3
reg["add"]        → {"calls": 1, "failures": 0, "total_seconds": ...}
add.__name__      → "add"
```

## Starter code

```python starter
import functools
import time


def instrument(registry: dict, name: str | None = None, clock=time.perf_counter):
    pass
```

## Hints

<details><summary>Hint 1</summary>

Three layers: `instrument(...)` returns `decorator(func)`, which returns `wrapper(*args, **kwargs)`.

</details>

<details><summary>Hint 2</summary>

Use `try/except/finally`: count the failure in `except` (then re-raise with a bare `raise`) and add the duration in `finally`.

</details>

<details><summary>Hint 3</summary>

`functools.wraps(func)` keeps the metadata.

</details>

## Where this shows up in data engineering

Every serious pipeline codebase has something like this: a decorator that emits metrics (StatsD/Prometheus/OpenTelemetry) for each step so dashboards show throughput, error rates and latency per task without touching the business logic. Injecting the registry and the clock is what makes it testable.

## Solution

```python solution
import functools
import time


def instrument(registry, name=None, clock=time.perf_counter):
    def decorator(func):
        metric = name or func.__name__

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            stats = registry.setdefault(metric, {"calls": 0, "failures": 0, "total_seconds": 0.0})
            stats["calls"] += 1
            start = clock()
            try:
                return func(*args, **kwargs)
            except Exception:
                stats["failures"] += 1
                raise                               # propagate unchanged
            finally:
                stats["total_seconds"] += clock() - start
        return wrapper
    return decorator
```

## Tests

Your solution should pass these:

```python tests
import itertools
ticks = itertools.count(0, 0.5)                  # fake clock: 0.0, 0.5, 1.0, ...
fake_clock = lambda: next(ticks)
reg = {}

@instrument(reg, clock=fake_clock)
def add(a, b):
    "Add two numbers."
    return a + b

@instrument(reg, name="loader.load", clock=fake_clock)
def load(x):
    if x < 0:
        raise ValueError("negative")
    return x

assert add(1, 2) == 3
assert add.__name__ == "add" and add.__doc__ == "Add two numbers."
assert reg["add"] == {"calls": 1, "failures": 0, "total_seconds": 0.5}
assert load(5) == 5
try:
    load(-1)
    raised = False
except ValueError as e:
    raised = str(e) == "negative"
assert raised
assert reg["loader.load"]["calls"] == 2 and reg["loader.load"]["failures"] == 1
assert reg["loader.load"]["total_seconds"] == 1.0
```

## Explanation

**Structure:** the factory captures configuration (`registry`, `name`, `clock`), the decorator captures `func` and computes the metric name once, and the wrapper does per-call work. All three are closures.

**Correctness details:**
- The bare `raise` re-raises the *same* exception object with its traceback; `raise e` would also work but adds a frame, and wrapping it in a new exception would change the type callers catch.
- `finally` guarantees the duration is recorded on both paths.
- `setdefault` creates the stats lazily, so a metric only appears once the function has been called.
- Catching `Exception` (not `BaseException`) avoids counting `KeyboardInterrupt` as a pipeline failure.

**Production upgrades:** histograms instead of totals (p50/p95 latency), labels for outcome and table/partition, thread safety (a lock or atomic counters if called from a thread pool), and async support (`inspect.iscoroutinefunction(func)` → an `async def` wrapper).

## Follow-up questions

<details><summary>Make it work for both sync and async functions.</summary>

Check `inspect.iscoroutinefunction(func)`; if true, return an `async def wrapper` that `await`s `func(...)` inside the same try/except/finally. Otherwise return the sync wrapper.

</details>

<details><summary>Your pipeline runs steps in a ThreadPoolExecutor. Is the registry safe?</summary>

No. `stats['calls'] += 1` is a read-modify-write and can lose updates under concurrency. Guard updates with a `threading.Lock` per registry (or per metric), or use a metrics client that handles concurrency.

</details>
