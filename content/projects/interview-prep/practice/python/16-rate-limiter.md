---
title: "Sliding-Window Rate Limiter for an Ingestion API"
description: "Allow at most N requests per client per rolling window using per-client deques."
url: "/interview-prep/practice/python/16-rate-limiter/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 16
---

# Sliding-Window Rate Limiter for an Ingestion API

**Difficulty:** Medium · **Topics:** sliding-window, deque, design · **Asked at:** Stripe, Cloudflare, Uber, Amazon

## Problem

Implement `RateLimiter(limit, window_s)` with `allow(client_id, ts) -> bool`. A request is allowed if the client has made fewer than `limit` **allowed** requests in the half-open window `(ts - window_s, ts]`. Rejected requests don't count. Timestamps per client are non-decreasing.

## Starter code

```python starter
class RateLimiter:
    def __init__(self, limit: int, window_s: float):
        pass

    def allow(self, client_id: str, ts: float) -> bool:
        pass
```

## Hints

<details><summary>Hint 1</summary>

Per client keep a deque of allowed timestamps; evict those ≤ ts − window before deciding.

</details>

## Solution

```python solution
from collections import defaultdict, deque

class RateLimiter:
    def __init__(self, limit: int, window_s: float):
        self.limit = limit
        self.window = window_s
        self.hits = defaultdict(deque)

    def allow(self, client_id: str, ts: float) -> bool:
        q = self.hits[client_id]
        while q and q[0] <= ts - self.window:
            q.popleft()
        if len(q) < self.limit:
            q.append(ts)
            return True
        return False
```

## Tests

Your solution should pass these:

```python tests
rl = RateLimiter(limit=3, window_s=10)
assert [rl.allow("a", t) for t in (0, 1, 2, 3)] == [True, True, True, False]
assert rl.allow("b", 3) is True            # independent client
assert rl.allow("a", 9.9) is False
assert rl.allow("a", 10) is True           # ts 0 left the window (0 <= 10 - 10)
assert rl.allow("a", 11) is True
assert rl.allow("a", 11.5) is False
```

## Explanation

Amortised O(1) per request (each timestamp is appended and popped once), O(limit) memory per client. Alternatives: **fixed window counters** (cheap, but allow bursts of 2× at window edges), **token bucket** (smooth rate, O(1) state per client, the usual production choice), and **sliding window counter** (approximate, interpolating two fixed windows). Distributed rate limiting needs shared state (Redis `INCR` + TTL or Lua scripts).
