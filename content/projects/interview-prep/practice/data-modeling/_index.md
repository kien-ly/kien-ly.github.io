---
title: "Data Modeling Case Studies"
description: "Ten interview-style modeling cases with business questions, grains, ER diagrams, design decisions, SQL checks and rubrics."
url: "/interview-prep/practice/data-modeling/"
hiddenInHomeList: true
showToc: true
weight: 0
---

# Data Modeling Case Studies

Each case follows the [modeling interview script](/interview-prep/learn/data-modeling/01-modeling-process/): business questions → processes → grains → ERD → design decisions → validate with SQL → trade-offs → follow-ups → **rubric**.

**How to practise:** read only the prompt and business questions, spend 30–40 minutes drawing your model (grain first!), then compare.

| # | Case | Difficulty | Key concepts |
|---|---|---|---|
| 1 | [Ride-hailing marketplace](/interview-prep/practice/data-modeling/01-ride-hailing/) | Medium | Accumulating snapshot, role-playing geo/date, payments vs trips |
| 2 | [E-commerce orders, returns, inventory](/interview-prep/practice/data-modeling/02-ecommerce-orders/) | Medium | Line vs order grain, allocation, semi-additive snapshots, factless coverage |
| 3 | [Video streaming](/interview-prep/practice/data-modeling/03-video-streaming/) | Medium | Heartbeats → sessions, title hierarchy, subscription snapshots |
| 4 | [Social network](/interview-prep/practice/data-modeling/04-social-network/) | Hard | Symmetric edges, engagement ratios, impressions at scale |
| 5 | [Music streaming & royalties](/interview-prep/practice/data-modeling/05-music-streaming/) | Hard | Bridge tables, allocation factors, non-additive uniques |
| 6 | [Accommodation bookings](/interview-prep/practice/data-modeling/06-accommodation-bookings/) | Hard | Booking vs stay date, nightly grain, occupancy denominators |
| 7 | [Banking accounts & balances](/interview-prep/practice/data-modeling/07-banking-accounts/) | Medium | Balance snapshots, ADB, joint-account bridge, as-of reporting |
| 8 | [SaaS subscriptions & MRR](/interview-prep/practice/data-modeling/08-saas-subscriptions/) | Medium | MRR normalisation, movements, NRR cohorts |
| 9 | [Food delivery lifecycle](/interview-prep/practice/data-modeling/09-food-delivery/) | Medium | Milestones, header/line/sub-line, batching |
| 10 | [Customer 360 with Data Vault](/interview-prep/practice/data-modeling/10-customer-360-data-vault/) | Hard | Hubs/links/satellites, identity resolution, survivorship |

Concepts: [Modeling process](/interview-prep/learn/data-modeling/01-modeling-process/) · [Dimensional modeling](/interview-prep/learn/data-modeling/02-dimensional-modeling/) · [SCD types](/interview-prep/learn/data-modeling/03-slowly-changing-dimensions/) · [Modern modeling](/interview-prep/learn/data-modeling/04-modern-modeling/)
