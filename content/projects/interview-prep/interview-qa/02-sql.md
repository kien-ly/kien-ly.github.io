---
title: "SQL Interview Questions"
description: "Conceptual SQL questions asked in data engineering loops: joins, NULLs, window functions, performance and correctness traps."
url: "/interview-prep/interview-qa/02-sql/"
hiddenInHomeList: true
showToc: true
weight: 2
---

# SQL Interview Questions

> Conceptual questions that accompany SQL coding rounds. For hands-on problems see practice/sql.

Tags: **[core]** = expected at every level · **[senior]** = expected at senior/staff level.

## Joins and set logic

<details><summary>[core] Explain INNER, LEFT, RIGHT, FULL OUTER, CROSS, SEMI and ANTI joins.</summary>

- **INNER**: rows with matches on both sides.
- **LEFT/RIGHT**: all rows of one side, NULLs where no match.
- **FULL OUTER**: all rows of both, NULL-padded.
- **CROSS**: cartesian product.
- **SEMI** (`EXISTS`/`IN`): rows of the left side that have a match, **without** duplicating them.
- **ANTI** (`NOT EXISTS`): left rows with no match.

</details>

<details><summary>[core] A LEFT JOIN returned fewer rows than the left table had. How is that possible?</summary>

It can't return *fewer* by itself. Usually a filter on the right table's columns in `WHERE` (e.g. `WHERE r.status = 'x'`) removes NULL-extended rows, effectively turning it into an inner join. Move the condition into `ON`. (It can return *more* rows when the right side has duplicate keys.)

</details>

<details><summary>[core] Why can a join produce more rows than either input?</summary>

Duplicate keys: an m-to-n match produces m×n rows (fan-out). Classic cause of inflated SUMs. Check key uniqueness on the side you expect to be unique, aggregate before joining, or use a semi-join.

</details>

<details><summary>[core] UNION vs UNION ALL?</summary>

UNION removes duplicates (requires a sort/hash + shuffle in distributed engines); UNION ALL just concatenates. Default to UNION ALL unless you need dedup.

</details>

<details><summary>[senior] Why is NOT IN with a subquery dangerous?</summary>

If the subquery returns any NULL, `x NOT IN (...)` is never TRUE (comparison with NULL is UNKNOWN), so the query returns zero rows. Use `NOT EXISTS` or filter NULLs.

</details>

## NULLs and types

<details><summary>[core] How do NULLs behave in comparisons, aggregates and GROUP BY?</summary>

Comparisons with NULL are UNKNOWN (`NULL = NULL` is not TRUE; use `IS NULL` / `IS NOT DISTINCT FROM` / `<=>`). Aggregates ignore NULLs (except `COUNT(*)`). GROUP BY puts all NULLs in one group. `AVG` over a column with NULLs divides by the non-NULL count.

</details>

<details><summary>[core] COUNT(*) vs COUNT(col) vs COUNT(DISTINCT col)?</summary>

`COUNT(*)` counts rows; `COUNT(col)` counts non-NULL values; `COUNT(DISTINCT col)` counts distinct non-NULL values (expensive at scale → `approx_count_distinct`).

</details>

<details><summary>[senior] Why might SUM(price * qty) differ between two engines for the same data?</summary>

Type semantics: integer overflow, integer vs decimal division, float rounding, decimal precision/scale rules, implicit casts. Use DECIMAL for money, explicit casts, and test results across engines during migrations.

</details>

## Aggregation and windows

<details><summary>[core] WHERE vs HAVING vs QUALIFY?</summary>

WHERE filters rows before aggregation; HAVING filters groups after aggregation; QUALIFY filters on window function results after they're computed (Snowflake, BigQuery, Databricks, DuckDB). Elsewhere wrap in a subquery.

</details>

<details><summary>[core] ROW_NUMBER vs RANK vs DENSE_RANK?</summary>

For 100, 90, 90, 80: ROW_NUMBER 1,2,3,4 (arbitrary among ties); RANK 1,2,2,4 (gaps); DENSE_RANK 1,2,2,3 (no gaps). Use ROW_NUMBER for dedup (with a tie-breaker), DENSE_RANK for "Nth highest value".

</details>

<details><summary>[core] What is the default window frame and why does it matter?</summary>

With ORDER BY and no frame: `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. So `SUM() OVER (ORDER BY d)` is a running total, peers (ties) share the same value, and `LAST_VALUE` returns the current row. Specify `ROWS BETWEEN ...` explicitly.

</details>

<details><summary>[senior] ROWS vs RANGE frames for a 7-day moving average?</summary>

ROWS counts physical rows (7 rows ≠ 7 days if days are missing). RANGE with an interval/numeric offset counts values (true calendar window) but averages only existing rows. For missing days as zero, densify with a calendar then use ROWS (or divide a RANGE SUM by 7).

</details>

<details><summary>[senior] How do you compute a running COUNT(DISTINCT) when the engine doesn't support it in windows?</summary>

Mark first occurrences (`ROW_NUMBER() OVER (PARTITION BY user ORDER BY ts) = 1` → 1 else 0) and take a running SUM of that flag. For rolling windows, use a range self-join or HLL sketches.

</details>

<details><summary>[senior] Can you nest aggregates inside window functions?</summary>

Yes: window functions run after GROUP BY, so `SUM(SUM(x)) OVER (PARTITION BY g)` computes group totals over aggregated rows (e.g. percent of total).

</details>

## Performance and engines

<details><summary>[core] What makes a query slow in a columnar/distributed engine?</summary>

Reading too much (no partition pruning/data skipping, SELECT *), shuffles (large joins/aggregations), skewed keys, spilling (insufficient memory), many small files, row-by-row UDFs, and cartesian/nested-loop joins.

</details>

<details><summary>[core] What is predicate pushdown?</summary>

Pushing filters down to the storage/scan layer so fewer rows are read: partition pruning, Parquet row-group min/max skipping, database-side filtering for JDBC sources. Functions on filter columns can prevent it.

</details>

<details><summary>[senior] Broadcast join vs sort-merge join?</summary>

Broadcast ships the small table to every executor and avoids shuffling the big table (fast, needs small side to fit in memory). Sort-merge shuffles and sorts both sides by key (scales to large-large joins). AQE can switch to broadcast at runtime based on actual sizes.

</details>

<details><summary>[senior] How do indexes in OLTP databases compare to data skipping in lakehouses?</summary>

B-tree indexes give point lookups in O(log n) and are maintained on write. Lakehouses rely on file-level statistics (min/max per column), partition pruning, clustering (Z-order/liquid) and optional Bloom filters to skip files. They're good for scans with selective filters, not single-row lookups.

</details>

<details><summary>[senior] A query is correct on 1% sample data but times out on full data. What do you check?</summary>

Join fan-out (duplicate keys exploding rows), skew on hot keys, a cartesian join from a missing condition, non-equi joins becoming nested loops, missing partition filters, and window functions over huge partitions. Check the plan and row counts at each step.

</details>

## Correctness and modeling in SQL

<details><summary>[core] How do you deduplicate rows keeping the latest version?</summary>

`ROW_NUMBER() OVER (PARTITION BY key ORDER BY updated_at DESC, tiebreaker DESC)` and keep `= 1` (or QUALIFY). Not `GROUP BY key` + `MAX()` on each column, which mixes values from different rows.

</details>

<details><summary>[senior] What are the risks of a SELECT DISTINCT used to "fix" duplicates?</summary>

It hides the root cause (usually a fan-out join or bad grain), removes legitimate identical rows, and is expensive. Find why duplicates exist and fix the join/grain.

</details>

<details><summary>[senior] How do you make an incremental SQL load idempotent?</summary>

Overwrite the target partition for the run's logical date (`INSERT OVERWRITE`/`replaceWhere`) or MERGE on a natural key with a version condition (`WHEN MATCHED AND s.updated_at > t.updated_at`). Never plain append in a retriable job; parameterise by logical date instead of `now()`.

</details>

<details><summary>[senior] Explain a gaps-and-islands problem and the standard trick.</summary>

Find runs of consecutive values (login streaks, status periods). For consecutive dates, `date − ROW_NUMBER()` is constant within a run; group by it. For arbitrary rules, flag "new group" with LAG and take a running SUM of the flag.

</details>
