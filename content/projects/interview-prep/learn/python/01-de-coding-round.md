---
title: "The Data Engineering Coding Round"
description: "What DE coding interviews test, the Python toolkit to know cold, the eight problem patterns that recur, and how to write production-quality answers."
url: "/interview-prep/learn/python/01-de-coding-round/"
hiddenInHomeList: true
showToc: true
weight: 1
---

# The Data Engineering Coding Round

> DE coding rounds are rarely about dynamic programming puzzles. They test whether you can **process records correctly and efficiently**: parse, group, dedupe, merge, window, schedule, and stream data with clean, testable Python.

---

## 1. What to expect

| Format | Typical prompt | What they grade |
|---|---|---|
| LeetCode-style (45 min) | Merge intervals, top-K, LRU cache, sliding window | Correctness, complexity, edge cases |
| Data manipulation (45–60 min) | "Given these log lines / JSON records, compute…" | Parsing robustness, grouping logic, clean code |
| Mini-pipeline / take-home | "Build an ingestion step that dedupes, validates and writes Parquet" | Structure, tests, idempotency, error handling |
| PySpark/pandas live | "Compute 7-day rolling revenue per user in PySpark" | API fluency, understanding of shuffles |

**Difficulty calibration:** mostly LeetCode easy/medium with a data flavour. Hard algorithmic DP is rare; streaming, hashing and heap problems are common.

---

## 2. The Python toolkit to know cold

```python
from collections import Counter, defaultdict, deque, OrderedDict, namedtuple
from itertools import groupby, islice, chain, accumulate, pairwise   # pairwise: 3.10+
from heapq import heappush, heappop, heapify, nlargest, nsmallest, merge
from bisect import bisect_left, bisect_right, insort
from functools import lru_cache, reduce, wraps
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
import json, csv, re
```

| Need | Tool | Complexity |
|---|---|---|
| Count things | `Counter(iterable)`, `.most_common(k)` | O(n), O(n log k) |
| Group into lists | `defaultdict(list)` | O(n) |
| Sliding window / queue | `deque(maxlen=k)`, `popleft()` | O(1) per op |
| Top-K / K-way merge / scheduling | `heapq` (min-heap; negate for max) | O(log n) per op |
| Sorted lookups / as-of search | `bisect` | O(log n) |
| Ordered recency (LRU) | `OrderedDict.move_to_end`, `popitem(last=False)` | O(1) |
| Lazy streams | generators (`yield`), `itertools` | O(1) memory |
| Group consecutive equal keys | `itertools.groupby` (**input must be sorted by key**) | O(n) |

### Gotchas that cost offers
- `groupby` groups **consecutive** items only; sort first.
- Mutable default arguments (`def f(x, acc=[])`) are shared between calls.
- `datetime` naive vs aware: never compare them; normalise to UTC.
- Floating-point money: use integers (cents) or `Decimal`.
- `sorted()` is stable; use it for multi-key sorts (sort by secondary key first, or use a tuple key).
- Dict iteration order is insertion order (3.7+), but **don't rely on it for correctness** in interviews unless stated.

---

## 3. The eight recurring patterns (with DE framing)

| # | Pattern | DE framing | Practice |
|---|---|---|---|
| 1 | **Hash map counting / grouping** | Aggregate logs, dedupe records, join two datasets in memory | [01](/interview-prep/practice/python/01-word-frequency-top-k/), [03](/interview-prep/practice/python/03-dedupe-keep-latest/), [06](/interview-prep/practice/python/06-group-by-aggregate/) |
| 2 | **Sorting + sweep / merge intervals** | Merge sessions, subscription coverage, peak concurrency | [08](/interview-prep/practice/python/08-merge-intervals/), [09](/interview-prep/practice/python/09-peak-concurrency/) |
| 3 | **Sliding window** | Rate limiting, moving averages, sessionization | [11](/interview-prep/practice/python/11-sessionize-events/), [12](/interview-prep/practice/python/12-moving-average-stream/), [16](/interview-prep/practice/python/16-rate-limiter/) |
| 4 | **Heap** | Top-K, K-way merge of sorted files, running median, scheduling | [10](/interview-prep/practice/python/10-k-way-merge/), [19](/interview-prep/practice/python/19-running-median/), [27](/interview-prep/practice/python/27-external-sort/) |
| 5 | **Binary search on sorted data** | As-of joins, point-in-time lookups | [14](/interview-prep/practice/python/14-time-based-kv-store/) |
| 6 | **Graphs / topological sort** | DAG scheduling, dependency resolution, lineage | [15](/interview-prep/practice/python/15-dag-task-order/) |
| 7 | **Streaming / generators** | Process files bigger than memory, batching, retries | [05](/interview-prep/practice/python/05-merge-sorted-streams/), [22](/interview-prep/practice/python/22-chunked-batches/), [23](/interview-prep/practice/python/23-retry-with-backoff/) |
| 8 | **Probabilistic / systems structures** | Sampling, dedup at scale, sharding | [24](/interview-prep/practice/python/24-reservoir-sampling/), [25](/interview-prep/practice/python/25-consistent-hashing/), [26](/interview-prep/practice/python/26-bloom-filter/) |

---

## 4. How to answer (the 5-step loop)

1. **Clarify the data**: size (fits in memory?), sortedness, duplicates, nulls/malformed rows, time zones, ties.
2. **State the approach and complexity before coding**: "Sort by start then sweep: O(n log n) time, O(n) space."
3. **Write clean code**: small functions, type hints, descriptive names, no premature cleverness.
4. **Test out loud**: happy path, empty input, single element, ties, boundary values, malformed input.
5. **Discuss scale**: "If the file is 500 GB, I'd stream it with a generator / do an external sort / push it to Spark with `groupBy` + window."

### What "production-quality" looks like in an interview

```python
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, Iterator

@dataclass(frozen=True)
class Event:
    user_id: str
    ts: datetime
    kind: str

def parse_events(lines: Iterable[str]) -> Iterator[Event]:
    """Parse 'user_id,iso_ts,kind' lines; skip malformed lines but count them."""
    for line_no, line in enumerate(lines, 1):
        try:
            user_id, ts, kind = line.rstrip("\n").split(",")
            yield Event(user_id, datetime.fromisoformat(ts), kind)
        except ValueError:
            # In production: log + send to a dead-letter file with line_no
            continue
```
Typed records, a generator (constant memory), explicit handling of bad input. That's the signal they want.

---

## 5. pandas and PySpark equivalents (often asked as follow-ups)

| Task | pure Python | pandas | PySpark |
|---|---|---|---|
| Group & sum | `defaultdict(int)` | `df.groupby("k")["v"].sum()` | `df.groupBy("k").agg(F.sum("v"))` |
| Dedup keep latest | dict keyed by id with max ts | `df.sort_values("ts").drop_duplicates("id", keep="last")` | `row_number()` over window, filter 1 |
| Rolling mean | `deque` | `s.rolling(7).mean()` | `F.avg().over(w.rowsBetween(-6, 0))` |
| As-of join | `bisect` | `pd.merge_asof` | window + filter, or range join |
| Explode list column | loop | `df.explode("items")` | `F.explode("items")` |
| Top-K per group | heap per group | `df.groupby("g").head(k)` after sort | `row_number()` ≤ k |

**Scale talking point:** pure Python dicts are fine up to a few GB of keys; beyond that, the same logic becomes a `groupBy` (shuffle by key) in Spark. Explaining that mapping is a strong senior signal.
