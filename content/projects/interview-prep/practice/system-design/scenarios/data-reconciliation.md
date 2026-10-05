---
title: "Data Reconciliation Between Conflicting Sources"
description: "Two dashboards disagree on the same metric. Design a reconciliation layer and resolution strategy."
url: "/interview-prep/practice/system-design/scenarios/data-reconciliation/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 21
---

# Data Reconciliation Between Conflicting Sources

**Difficulty:** Medium  
**Topics:** System Design, Data Quality, Conflict Resolution  
**Company Tags:** Uber, Airbnb, Stripe, Any Multi-source Dashboard

## Problem Statement

Two data sources feed the same executive dashboard:
- **Source A:** Updates every hour (batch ETL from data warehouse)
- **Source B:** Updates every 15 minutes (real-time aggregation from Kafka)

The data sometimes contradicts each other (e.g., Source A says revenue is $1.2M, Source B says $1.15M). Executives are confused and losing trust in the data.

**Design a reconciliation system that:**
1. Detects discrepancies automatically
2. Determines which source is "correct" (or closest to truth)
3. Presents a unified view to users
4. Provides transparency about data freshness and confidence

## Clarifying Questions

Before designing, consider:
- What causes the discrepancy? (timing, logic, data loss?)
- Which source is "source of truth"?
- What's the acceptable variance threshold?
- Do stakeholders need to see both values or just one?

## Hints

<details>
<summary>Hint 1: Root Cause Analysis</summary>
Discrepancies usually come from: (1) timing differences, (2) different business logic, (3) data pipeline bugs, or (4) source system delays.
</details>

<details>
<summary>Hint 2: Reconciliation Patterns</summary>
Options: Last-write-wins, source priority, weighted average, human review queue.
</details>

<details>
<summary>Hint 3: Transparency</summary>
Show confidence scores, data freshness, and variance to users instead of hiding the complexity.
</details>

## Solution

<details>
<summary>Click to reveal solution</summary>

### Step 1: Understand the Discrepancy Sources

```
Timeline of a typical day:
─────────────────────────────────────────────────────────────────
00:00                                                         24:00
  │                                                              │
  ├── Batch ETL runs (captures 00:00 snapshot)                   │
  │   └── Data available at 01:30                                │
  │                                                              │
  │    ├─ Streaming updates every 15 min ─────────────────────▶  │
  │                                                              │
  │         At 01:00, streaming has 01:00 data                   │
  │         At 01:00, batch still has 00:00 data                 │
  │                                                              │
  │         DISCREPANCY: 1 hour of data difference!              │
```

**Common causes:**
1. **Timing:** Batch is stale, streaming is fresh
2. **Logic:** Different aggregation rules (gross vs net revenue)
3. **Bugs:** Pipeline errors, duplicate processing
4. **Source delays:** Late-arriving events not in batch yet

### Step 2: Design the Reconciliation Layer

```
┌─────────────────────────────────────────────────────────────┐
│                   RECONCILIATION LAYER                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │   Source A   │    │   Source B   │                       │
│  │   (Batch)    │    │  (Streaming) │                       │
│  └──────┬───────┘    └──────┬───────┘                       │
│         │                   │                               │
│         ▼                   ▼                               │
│  ┌─────────────────────────────────────────────┐            │
│  │           Reconciliation Engine             │            │
│  │                                             │            │
│  │  1. Compare values at same timestamp        │            │
│  │  2. Calculate variance                      │            │
│  │  3. Apply resolution rules                  │            │
│  │  4. Generate confidence score               │            │
│  └─────────────────────────────────────────────┘            │
│                         │                                   │
│         ┌───────────────┼───────────────┐                   │
│         ▼               ▼               ▼                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │ Unified  │    │ Variance │    │  Alert   │               │
│  │   View   │    │   Log    │    │  System  │               │
│  └──────────┘    └──────────┘    └──────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Resolution Strategies

```python
class ReconciliationEngine:
    def __init__(self, config):
        self.variance_threshold = config.get("threshold", 0.02)  # 2%
        self.source_priority = config.get("priority", ["batch", "streaming"])
    
    def reconcile(self, metric: str, batch_value: float, 
                  streaming_value: float, batch_ts: datetime, 
                  streaming_ts: datetime) -> ReconciledValue:
        
        variance = abs(batch_value - streaming_value) / max(batch_value, 1)
        
        # Strategy 1: Within threshold - use fresher source
        if variance <= self.variance_threshold:
            return ReconciledValue(
                value=streaming_value if streaming_ts > batch_ts else batch_value,
                confidence="high",
                source="auto_resolved",
                variance=variance
            )
        
        # Strategy 2: Outside threshold - apply rules
        if variance > self.variance_threshold:
            # Check if it's just timing
            if self._is_timing_difference(batch_ts, streaming_ts):
                return ReconciledValue(
                    value=streaming_value,  # Trust streaming for real-time
                    confidence="medium",
                    source="streaming_preferred_timing",
                    variance=variance,
                    note="Batch data may be stale"
                )
            
            # Check for known batch lag periods
            if self._is_batch_lag_window():
                return ReconciledValue(
                    value=streaming_value,
                    confidence="medium",
                    source="streaming_during_batch_lag"
                )
            
            # Unknown discrepancy - flag for review
            return ReconciledValue(
                value=batch_value,  # Default to batch (source of truth)
                confidence="low",
                source="batch_default_needs_review",
                variance=variance,
                alert=True
            )
```

### Step 4: Dashboard Design

Show transparency, not just a single number:

```
┌─────────────────────────────────────────────────────────────┐
│  REVENUE DASHBOARD                    Last updated: 2 min   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Today's Revenue                                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  $1,247,832                                         │    │
│  │  ██████████████████████████████░░░░░  78% of target │    │
│  │                                                     │    │
│  │  ⚡ Real-time (15 min delay)                        │    │
│  │  ✓ High confidence (variance: 0.8%)                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [Show details ▼]                                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Source Comparison:                                 │    │
│  │  • Streaming (15 min ago): $1,247,832              │    │
│  │  • Batch (2 hours ago):    $1,238,456              │    │
│  │  • Variance: 0.8% (within normal range)            │    │
│  │                                                     │    │
│  │  [Why different?] Batch snapshot taken at 10:00 AM │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 5: Monitoring & Alerting

```python
# Alert rules
ALERT_RULES = {
    "high_variance": {
        "condition": lambda v: v.variance > 0.05,
        "severity": "warning",
        "message": "Source variance exceeds 5%"
    },
    "persistent_discrepancy": {
        "condition": lambda v: v.variance > 0.02 and v.duration > "4 hours",
        "severity": "critical",
        "message": "Sustained discrepancy - possible pipeline issue"
    },
    "confidence_drop": {
        "condition": lambda v: v.confidence == "low",
        "severity": "warning",
        "message": "Unable to auto-reconcile - manual review needed"
    }
}
```

### Best Practices

| Aspect | Recommendation |
|--------|----------------|
| Source of truth | Designate one source (usually batch) for auditing |
| Tolerance | Set variance thresholds per metric (revenue: 2%, clicks: 5%) |
| Transparency | Always show freshness and confidence to users |
| Logging | Log all reconciliation decisions for debugging |
| Alerting | Alert on sustained discrepancies, not one-offs |

</details>

## Follow-up Questions

1. **What if stakeholders demand "one number"?** Show primary value but offer drill-down
2. **How do you handle month-end closes?** Lock batch values, stop streaming updates
3. **What about historical discrepancies?** Backfill corrections, maintain audit trail

## What Interviewers Look For

1. **Problem decomposition:** Identify WHY discrepancies happen
2. **User empathy:** Understand that hiding complexity erodes trust
3. **Pragmatism:** Perfect reconciliation is impossible - design for "good enough"
4. **Operational thinking:** Monitoring, alerting, debugging
