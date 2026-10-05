---
title: "Usage Credit Ledger With Expiring Grants"
description: "Model credits granted with expiry dates and consumed oldest-expiring-first; answer balance-at-time queries correctly."
url: "/interview-prep/practice/python/32-credit-ledger-expiring-grants/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 32
---

# Usage Credit Ledger With Expiring Grants

**Pattern:** Practical modeling · **Difficulty:** Hard · **Asked at:** OpenAI, Stripe, Snowflake, Databricks

## Problem

Implement `CreditLedger` for a usage-billed platform. Times are integers (e.g. epoch days). Events arrive in non-decreasing time order.

- `grant(t, amount, expires_at)`: add `amount` credits at time `t`, usable at times `< expires_at`.
- `consume(t, amount)`: spend credits at time `t`, always from the **grant that expires soonest** first (ties: earliest granted). Expired grants can't be used. If the available balance is insufficient, consume nothing and return `False`; otherwise return `True`.
- `balance(t)`: credits available at time `t` (unexpired, unconsumed).

## Examples

```text
L = CreditLedger()
L.grant(0, 100, expires_at=30)
L.grant(5, 50, expires_at=10)
L.consume(6, 60)   → True     # 50 from the grant expiring at 10, then 10 from the other
L.balance(6)       → 90
L.balance(30)      → 0        # first grant expired at 30
```

## Starter code

```python starter
class CreditLedger:
    def __init__(self):
        pass

    def grant(self, t: int, amount: int, expires_at: int) -> None:
        pass

    def consume(self, t: int, amount: int) -> bool:
        pass

    def balance(self, t: int) -> int:
        pass
```

## Hints

<details><summary>Hint 1</summary>

Keep remaining grants in a min-heap keyed by `(expires_at, grant_seq)`.

</details>

<details><summary>Hint 2</summary>

Before using the heap at time `t`, pop grants with `expires_at <= t`; they're expired forever because time only moves forward.

</details>

<details><summary>Hint 3</summary>

Check `balance(t) >= amount` before consuming so a failed consume changes nothing.

</details>

## Where this shows up in data engineering

Prepaid credits, promotional grants and commit-based contracts are a real billing-pipeline problem. The interview tests whether you **model state precisely** (expiry boundaries, consumption order, atomic failure) before writing code. The same rules have to be reproducible in SQL for finance reconciliation, which is why deterministic tie-breaking matters.

## Solution

```python solution
import heapq
import itertools


class CreditLedger:
    def __init__(self):
        self._heap = []                      # [expires_at, seq, remaining]
        self._seq = itertools.count()

    def _expire(self, t):
        while self._heap and self._heap[0][0] <= t:
            heapq.heappop(self._heap)

    def grant(self, t, amount, expires_at):
        if amount > 0 and expires_at > t:
            heapq.heappush(self._heap, [expires_at, next(self._seq), amount])

    def balance(self, t):
        self._expire(t)
        return sum(g[2] for g in self._heap)

    def consume(self, t, amount):
        if self.balance(t) < amount:         # all-or-nothing
            return False
        while amount > 0:
            g = self._heap[0]                # soonest-expiring grant
            take = min(amount, g[2])
            g[2] -= take
            amount -= take
            if g[2] == 0:
                heapq.heappop(self._heap)
        return True
```

## Tests

Your solution should pass these:

```python tests
L = CreditLedger()
L.grant(0, 100, expires_at=30)
L.grant(5, 50, expires_at=10)
assert L.consume(6, 60) is True
assert L.balance(6) == 90
assert L.balance(29) == 90
assert L.balance(30) == 0

M = CreditLedger()
M.grant(0, 10, expires_at=5)
assert M.consume(1, 11) is False and M.balance(1) == 10     # all-or-nothing
assert M.consume(5, 1) is False                              # expired exactly at 5
M.grant(6, 5, expires_at=20)
M.grant(6, 5, expires_at=20)
assert M.consume(7, 7) is True and M.balance(7) == 3

N = CreditLedger()
N.grant(0, 30, expires_at=100)
N.grant(0, 20, expires_at=50)
assert N.consume(10, 25) is True
assert N.balance(49) == 25
assert N.balance(50) == 25                                   # the 20-credit grant was fully used first
```

## Explanation

**State:** a min-heap of grants ordered by expiry (then grant sequence for deterministic ties) with mutable remaining amounts.

**Expiry is lazy and permanent:** because events are time-ordered, a grant that is expired at time `t` is expired at every later time, so popping it is safe. Each grant is pushed and popped once → O(log n) amortised per grant.

**Atomic failure:** checking the balance first means a failed consume leaves no partial deductions, which is critical for billing correctness.

**Complexity:** `grant` O(log n); `consume` O(k log n) for k grants touched; `balance` is O(n) here (keep a running total updated on grant/consume/expire to make it O(1) amortised).

**Boundary semantics:** "usable at times `< expires_at`" means expiry at exactly `expires_at`. State this in the interview and test it; off-by-one expiry bugs are real revenue bugs.

## Follow-up questions

<details><summary>Events can arrive out of order (late usage records). What changes?</summary>

Lazy permanent expiry is no longer valid. Store the ledger as an append-only event log and recompute balances deterministically by replaying events sorted by event time (or recompute from the last checkpoint before the late event). This is the event-sourcing approach billing systems use for corrections.

</details>

<details><summary>How would you represent this in a warehouse for finance?</summary>

Tables `grants(grant_id, customer, amount, granted_at, expires_at)` and `consumption(event_id, customer, amount, at)`, plus a derived `allocations(event_id, grant_id, amount)` produced by the allocation job, so every consumed credit is traceable to a grant, and expiries are reportable as breakage revenue.

</details>
