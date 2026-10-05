---
title: "Parse Web Server Logs into Hourly Status Counts"
description: "Robustly parse access log lines with a regex, skip and count malformed lines, and aggregate by hour and status class."
url: "/interview-prep/practice/python/04-parse-access-logs/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 4
---

# Parse Web Server Logs into Hourly Status Counts

**Difficulty:** Easy · **Topics:** parsing, regex, aggregation · **Asked at:** Cloudflare, Datadog, Amazon

## Problem

Parse log lines in this format:

`203.0.113.9 - - [01/Oct/2026:13:05:22 +0000] "GET /api/orders HTTP/1.1" 200 512`

Return a tuple `(counts, malformed)` where `counts` maps `(hour, status_class)` → number of requests, `hour` is `"2026-10-01T13"` and `status_class` is `"2xx"`, `"4xx"`, etc., and `malformed` is the number of lines that couldn't be parsed.

## Starter code

```python starter
def hourly_status_counts(lines: list[str]) -> tuple[dict, int]:
    pass
```

## Hints

<details><summary>Hint 1</summary>

A compiled regex with named groups: `\[(?P<ts>[^\]]+)\] "(?P<req>[^"]*)" (?P<status>\d{3})`.

</details>

<details><summary>Hint 2</summary>

`datetime.strptime(ts, "%d/%b/%Y:%H:%M:%S %z")`.

</details>

## Solution

```python solution
import re
from collections import Counter
from datetime import datetime, timezone

LINE = re.compile(r'^\S+ \S+ \S+ \[(?P<ts>[^\]]+)\] "(?P<req>[^"]*)" (?P<status>\d{3}) (?P<size>\d+|-)$')

def hourly_status_counts(lines: list[str]) -> tuple[dict, int]:
    counts, malformed = Counter(), 0
    for line in lines:
        m = LINE.match(line.strip())
        if not m:
            malformed += 1
            continue
        try:
            ts = datetime.strptime(m["ts"], "%d/%b/%Y:%H:%M:%S %z").astimezone(timezone.utc)
        except ValueError:
            malformed += 1
            continue
        counts[(ts.strftime("%Y-%m-%dT%H"), m["status"][0] + "xx")] += 1
    return dict(counts), malformed
```

## Tests

Your solution should pass these:

```python tests
logs = [
    '203.0.113.9 - - [01/Oct/2026:13:05:22 +0000] "GET /api/orders HTTP/1.1" 200 512',
    '203.0.113.9 - - [01/Oct/2026:13:59:59 +0000] "POST /api/orders HTTP/1.1" 201 87',
    '198.51.100.4 - - [01/Oct/2026:14:00:01 +0000] "GET /missing HTTP/1.1" 404 -',
    '198.51.100.4 - - [01/Oct/2026:15:30:00 +0200] "GET /x HTTP/1.1" 500 0',
    'garbage line',
    '1.2.3.4 - - [32/Oct/2026:10:00:00 +0000] "GET / HTTP/1.1" 200 1',
]
counts, bad = hourly_status_counts(logs)
assert counts == {("2026-10-01T13", "2xx"): 2, ("2026-10-01T13", "5xx"): 1, ("2026-10-01T14", "4xx"): 1}, counts
assert bad == 2
```

## Explanation

- The `+0200` line (15:30 local) is **13:30 UTC**, so it lands in the 13:00 bucket. Forgetting to normalise time zones is the most common bug in log processing.
- The line with day 32 matches the regex but fails date parsing, so it's counted as malformed instead of crashing the job. In production, write malformed lines to a dead-letter file with the reason, and alert when the malformed rate exceeds a threshold.
- O(n) time, O(buckets) memory, so it streams over files of any size if you pass a file handle instead of a list.
