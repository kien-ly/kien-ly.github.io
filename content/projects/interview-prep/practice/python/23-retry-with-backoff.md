---
title: "Retry Decorator with Exponential Backoff and Jitter"
description: "Build a reusable retry decorator for flaky API calls with capped exponential backoff, jitter and retryable exception types."
url: "/interview-prep/practice/python/23-retry-with-backoff/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 23
---

# Retry Decorator with Exponential Backoff and Jitter

**Difficulty:** Medium · **Topics:** decorators, reliability, error-handling · **Asked at:** Stripe, AWS, Netflix, Airbnb

## Problem

Implement `retry(max_attempts, base_delay, max_delay, retry_on, sleep, rand)`, a decorator factory. The wrapped function is called up to `max_attempts` times. After failure number `k` (1-based) with an exception in `retry_on`, sleep for `min(max_delay, base_delay * 2**(k-1)) * rand()` ("full jitter"; `rand()` returns a value in [0, 1]). Non-retryable exceptions propagate immediately. After the last attempt, re-raise the last exception. `sleep` and `rand` are injectable for testing.

## Starter code

```python starter
import random, time

def retry(max_attempts=5, base_delay=0.5, max_delay=30.0, retry_on=(Exception,),
          sleep=time.sleep, rand=random.random):
    pass
```

## Hints

<details><summary>Hint 1</summary>

A decorator factory returns a decorator, which returns a wrapper. Use functools.wraps.

</details>

<details><summary>Hint 2</summary>

Don't sleep after the final attempt.

</details>

## Solution

```python solution
import functools, random, time

def retry(max_attempts=5, base_delay=0.5, max_delay=30.0, retry_on=(Exception,),
          sleep=time.sleep, rand=random.random):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_attempts + 1):
                try:
                    return fn(*args, **kwargs)
                except retry_on:
                    if attempt == max_attempts:
                        raise
                    sleep(min(max_delay, base_delay * 2 ** (attempt - 1)) * rand())
        return wrapper
    return decorator
```

## Tests

Your solution should pass these:

```python tests
sleeps = []
calls = {"n": 0}

@retry(max_attempts=4, base_delay=1, max_delay=3, retry_on=(TimeoutError,), sleep=sleeps.append, rand=lambda: 1.0)
def flaky():
    calls["n"] += 1
    if calls["n"] < 4:
        raise TimeoutError("slow")
    return "ok"

assert flaky() == "ok" and sleeps == [1, 2, 3] and flaky.__name__ == "flaky"

@retry(max_attempts=3, retry_on=(TimeoutError,), sleep=lambda s: None)
def bad_input():
    raise ValueError("permanent")
try:
    bad_input(); assert False
except ValueError:
    pass

attempts = []
@retry(max_attempts=2, retry_on=(ConnectionError,), sleep=lambda s: None)
def always_down():
    attempts.append(1)
    raise ConnectionError("down")
try:
    always_down(); assert False
except ConnectionError:
    assert len(attempts) == 2
```

## Explanation

- **Exponential backoff** spaces retries out so a struggling service can recover; **cap** it so waits stay bounded.
- **Jitter** prevents thousands of clients from retrying in lockstep (thundering herd).
- Retry only **transient** errors (timeouts, 429/503). Retrying a 400 or a bug is wasted time and can duplicate side effects.
- Retries + non-idempotent operations = duplicates. Pair retries with **idempotency keys** on writes.
- Injecting `sleep`/`rand` makes the decorator unit-testable without real waiting: a good habit to show.
