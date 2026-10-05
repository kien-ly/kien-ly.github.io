---
title: "Data Modeling Interview Questions"
description: "Dimensional modeling, grain, facts, dimensions, SCDs, Data Vault, OBT and modern modeling trade-offs."
url: "/interview-prep/interview-qa/04-data-modeling/"
hiddenInHomeList: true
showToc: true
weight: 4
---

# Data Modeling Interview Questions

> Rapid-fire modeling questions. Pair with the case studies in practice/data-modeling.

Tags: **[core]** = expected at every level · **[senior]** = expected at senior/staff level.

## Fundamentals

<details><summary>[core] What is the grain of a fact table and why declare it first?</summary>

The exact meaning of one row ("one row per order line"). Every fact and dimension must be consistent with it; mixing grains causes double counting. Declaring it first forces clarity and is the most important modeling decision.

</details>

<details><summary>[core] Fact vs dimension?</summary>

Facts are numeric measurements of business events at a declared grain (amount, quantity, duration). Dimensions provide descriptive context to filter and group facts (who, what, where, when).

</details>

<details><summary>[core] Star vs snowflake schema?</summary>

Star: fact + denormalised dimensions, one join hop, simpler and faster for BI. Snowflake: dimensions normalised into sub-dimensions, less redundancy, more joins. Default to star; snowflake only for large shared hierarchies.

</details>

<details><summary>[core] Why use surrogate keys?</summary>

Required for SCD2 (one entity, many versions), decouple from source key changes, integrate multiple sources with clashing IDs, compact joins, and allow unknown members (-1).

</details>

<details><summary>[core] Normalisation vs denormalisation: when each?</summary>

Normalise OLTP for write integrity (no update anomalies). Denormalise OLAP for read simplicity and speed; storage is cheap and history is append-only.

</details>

## Facts

<details><summary>[core] Transaction vs periodic snapshot vs accumulating snapshot facts?</summary>

Transaction: one row per event, insert-only. Periodic snapshot: one row per entity per period (balances, inventory). Accumulating snapshot: one row per process instance updated as milestones occur (order lifecycle).

</details>

<details><summary>[core] Additive, semi-additive, non-additive measures?</summary>

Additive sum across all dimensions (revenue). Semi-additive sum across some but not time (balances, inventory: use period-end or average). Non-additive can't be summed (ratios, unit prices, distinct counts): store components and compute after aggregation.

</details>

<details><summary>[senior] What is a factless fact table? Give two uses.</summary>

A fact table with only keys. Event tracking (attendance, logins) where COUNT(*) is the measure, and coverage (products on promotion per day) enabling "what didn't happen" queries via anti-joins.

</details>

<details><summary>[senior] How do you handle header-level amounts (shipping fee) in a line-level fact?</summary>

Keep an order-grain fact for header amounts and/or allocate them to lines with a documented rule (by value/weight) so line sums reconcile. Never repeat the full header amount on every line.

</details>

## Dimensions

<details><summary>[core] What is a conformed dimension?</summary>

A dimension with identical keys and attribute meanings shared across fact tables (date, customer, product), enabling drill-across analysis and an integrated warehouse (columns of the bus matrix).

</details>

<details><summary>[core] Role-playing dimension?</summary>

One dimension used in multiple roles in the same fact, e.g. dim_date as order date, ship date, delivery date; dim_airport as origin/destination. Implemented with aliases or views.

</details>

<details><summary>[senior] Junk, degenerate, mini and outrigger dimensions: define each.</summary>

Junk: combination of low-cardinality flags in one small dimension. Degenerate: transaction identifier stored on the fact without a dimension table (order_number). Mini: rapidly changing attributes split from a large dimension into a small banded dimension. Outrigger: a dimension referenced by another dimension (use sparingly).

</details>

<details><summary>[senior] How do you model many-to-many relationships (e.g. tracks with multiple artists)?</summary>

A bridge table (track_key, artist_key, allocation_factor). Joining through it multiplies rows, so use the allocation factor for additive metrics (revenue) or present metrics as non-additive across the many side.

</details>

<details><summary>[senior] How do you handle late-arriving dimension members?</summary>

Insert an inferred member (natural key + placeholder attributes, flagged) when the fact arrives, use its surrogate key, and update attributes when the real record arrives. Alternatively map to an unknown member and re-key later (more work).

</details>

<details><summary>[senior] How do you model ragged hierarchies like an org chart?</summary>

Parent-child table plus a closure/bridge table of (ancestor, descendant, depth) for easy roll-ups, or recursive CTEs at query time. Fixed-depth hierarchies are simply flattened into dimension columns.

</details>

## Slowly changing dimensions

<details><summary>[core] SCD types 1, 2 and 3?</summary>

Type 1 overwrites (no history). Type 2 adds a new row with validity dates and a new surrogate key (full history). Type 3 adds a "previous value" column (one level of history).

</details>

<details><summary>[senior] How do you implement SCD2 with a single MERGE?</summary>

Stage changed keys twice: once with the natural key as merge key (to close the current row when the hash differs) and once with a NULL merge key (never matches → inserts the new version). New keys insert via NOT MATCHED; unchanged keys do nothing.

</details>

<details><summary>[senior] What are SCD types 6 and 7 for?</summary>

Both give "as-was" and "as-is" views. Type 6 adds a current-value column (overwritten across all versions) to SCD2 rows. Type 7 stores both the version surrogate key and the durable natural key on facts, joining to the SCD2 dim (as-was) or a current view (as-is).

</details>

<details><summary>[senior] A customer's change arrives with an effective date 3 months in the past. What happens in SCD2?</summary>

You must split an existing version: insert the backdated version, adjust valid_to of the preceding version, and potentially re-key facts that fall in the affected period. It's expensive, so design processes to minimise backdating or accept as-loaded semantics.

</details>

## Modern approaches

<details><summary>[senior] Kimball vs Inmon vs Data Vault?</summary>

Kimball: business-process stars with conformed dims, fast to deliver, analyst-friendly. Inmon: normalised enterprise DWH feeding marts, integrated but slow. Data Vault: hubs/links/satellites, insert-only, auditable, resilient to source change, but needs a dimensional layer for consumption.

</details>

<details><summary>[senior] Is One Big Table a replacement for dimensional modeling?</summary>

No. OBTs are great serving artifacts for BI on columnar engines, but built from a governed star they stay consistent; without a core model they duplicate logic and drift. Dimension changes also force fact-wide rewrites.

</details>

<details><summary>[senior] How do you model an event stream with many event types?</summary>

Typed common columns (event_id, user_id, ts, event_type, session_id) plus a properties map/variant; promote hot properties to typed columns or per-type tables; govern with a tracking plan/schema registry.

</details>

<details><summary>[senior] Where does a semantic layer fit?</summary>

Above gold tables: defines metrics once (measure, aggregation, filters, allowed dimensions) so every BI tool and API computes "revenue" identically. Prevents metric drift across dashboards.

</details>
