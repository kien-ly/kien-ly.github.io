---
title: "Paginated API Reader With Rate Limits (Generator)"
description: "Stream records from a cursor-paginated API lazily, retrying throttled pages, without loading everything into memory."
url: "/interview-prep/practice/python/31-paginated-api-generator/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 31
---

# Paginated API Reader With Rate Limits (Generator)

**Pattern:** Generators · **Difficulty:** Medium · **Asked at:** Stripe, Shopify, Fivetran

## Problem

`fetch(cursor)` returns a dict `{"items": [...], "next": cursor_or_None}` for one page (`cursor=None` is the first page). It may raise `Throttled` (a provided exception class) when rate-limited.

Implement `iter_records(fetch, max_retries=3, sleep=lambda s: None)`, a **generator** that:
- yields every item from every page, in order, fetching the next page only when the consumer needs more items (lazily);
- on `Throttled`, retries the same cursor up to `max_retries` times, calling `sleep(2 ** attempt)` for attempt = 0, 1, 2, …; if it still fails, the exception propagates;
- stops when `next` is `None`.

## Starter code

```python starter
class Throttled(Exception):
    pass


def iter_records(fetch, max_retries: int = 3, sleep=lambda s: None):
    pass
```

## Hints

<details><summary>Hint 1</summary>

Loop: fetch the page for `cursor` (with a retry loop), `yield from page['items']`, then move to `page['next']`.

</details>

<details><summary>Hint 2</summary>

Because it's a generator, nothing is fetched until the first `next()`, and the second page isn't fetched until the first page's items are consumed.

</details>

## Where this shows up in data engineering

Almost every SaaS ingestion job (Stripe, Salesforce, HubSpot, GitHub APIs) is a paginated, rate-limited reader. A generator keeps memory flat, lets the caller batch writes, and makes resumption easy if you also expose the current cursor as a checkpoint.

## Solution

```python solution
class Throttled(Exception):
    pass


def iter_records(fetch, max_retries=3, sleep=lambda s: None):
    cursor = None
    while True:
        for attempt in range(max_retries + 1):
            try:
                page = fetch(cursor)
                break
            except Throttled:
                if attempt == max_retries:
                    raise
                sleep(2 ** attempt)
        yield from page["items"]
        cursor = page["next"]
        if cursor is None:
            return
```

## Tests

Your solution should pass these:

```python tests
pages = {None: {"items": [1, 2], "next": "c2"}, "c2": {"items": [3], "next": "c3"}, "c3": {"items": [4, 5], "next": None}}
calls = []
def fetch(cursor):
    calls.append(cursor)
    return pages[cursor]

gen = iter_records(fetch)
assert calls == []                         # lazy: nothing fetched yet
assert next(gen) == 1 and calls == [None]
assert next(gen) == 2 and calls == [None]  # second page not fetched until needed
assert list(gen) == [3, 4, 5] and calls == [None, "c2", "c3"]

failures = {"c2": 2}
slept = []
def flaky(cursor):
    if failures.get(cursor, 0) > 0:
        failures[cursor] -= 1
        raise Throttled()
    return pages[cursor]
assert list(iter_records(flaky, max_retries=3, sleep=slept.append)) == [1, 2, 3, 4, 5]
assert slept == [1, 2]

def always(cursor):
    raise Throttled()
try:
    list(iter_records(always, max_retries=2, sleep=lambda s: None))
    ok = False
except Throttled:
    ok = True
assert ok

assert list(iter_records(lambda c: {"items": [], "next": None})) == []
```

## Explanation

**Laziness for free:** code in a generator runs only when the consumer asks for the next item, so pages are fetched on demand and memory holds one page at a time.

**Retry loop placement:** retry around the *fetch of one cursor*, so a throttle on page 50 doesn't restart from page 1. `for … else`-style control with `break` keeps it compact; the final attempt re-raises.

**Backoff:** `2 ** attempt` seconds (1, 2, 4…). In production add jitter, honour the API's `Retry-After` header, and cap the delay.

**Resumability:** expose the cursor (e.g. yield `(cursor, item)` or keep it on an object) so a crashed job can restart from the last committed page instead of the beginning.

## Follow-up questions

<details><summary>How would you parallelise ingestion from a cursor-paginated API?</summary>

Cursor pagination is inherently sequential. Parallelise across independent partitions instead: different endpoints/accounts, or time-sliced queries (`created_at` ranges) each paginated separately, bounded by the API's rate limit with a shared token bucket.

</details>
