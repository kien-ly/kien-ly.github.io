---
title: "SQL Practice Problems"
description: "41 runnable SQL interview problems from easy to hard, each with schema, expected output, solution, explanation and follow-ups."
url: "/interview-prep/practice/sql/"
hiddenInHomeList: true
showToc: true
weight: 0
---

# SQL Practice Problems

Every problem is **runnable**. The schema and solution are executed in SQLite by `scripts/build.py`, which also generates the expected output, so every answer is verified. Use the [web platform](/interview-prep/platform/) to write and auto-check your own queries in the browser.

**How to practise:** read the problem and schema, write your query, compare with the expected output, then read the explanation and the follow-ups (interviewers almost always ask one).

Learn the patterns first: [Window functions](/interview-prep/learn/sql/01-window-functions/) · [Advanced patterns](/interview-prep/learn/sql/02-advanced-patterns/) · [Performance & dialects](/interview-prep/learn/sql/03-performance-and-dialects/)

## Easy

| # | Problem | Topics | Asked at |
|---|---|---|---|
| 01 | [Second (Nth) Highest Salary](/interview-prep/practice/sql/01-nth-highest-salary/) | ranking, subquery, dense-rank | Meta, Amazon, Microsoft |
| 02 | [Keep the Latest Record per Customer](/interview-prep/practice/sql/02-dedup-latest-record/) | deduplication, row-number, window-functions | Databricks, Airbnb, Netflix |
| 03 | [Customers Who Never Ordered](/interview-prep/practice/sql/03-customers-never-ordered/) | anti-join, not-exists, nulls | Amazon, Uber, Meta |
| 04 | [Daily Active Users and Stickiness](/interview-prep/practice/sql/04-daily-active-users/) | aggregation, count-distinct, self-join | Meta, Snap, Spotify |
| 05 | [Running Total of Revenue per Customer](/interview-prep/practice/sql/05-running-total/) | window-functions, running-total, frames | Amazon, Stripe, Shopify |
| 06 | [Category Share of Revenue](/interview-prep/practice/sql/06-percent-of-total/) | window-functions, aggregation, percent-of-total | Amazon, Walmart, Instacart |
| 07 | [Month-over-Month and Year-over-Year Growth](/interview-prep/practice/sql/07-month-over-month-growth/) | lag, window-functions, time-series | Google, Netflix, Airbnb |
| 08 | [First Purchase per Customer](/interview-prep/practice/sql/08-first-order-per-customer/) | row-number, min-by, window-functions | DoorDash, Uber Eats, Shopify |
| 09 | [Days Warmer Than the Previous Day](/interview-prep/practice/sql/09-warmer-than-yesterday/) | lag, self-join, dates | Amazon, Adobe |
| 10 | [Histogram of Orders per Customer](/interview-prep/practice/sql/10-orders-histogram/) | aggregation, left-join, histogram | Meta, Twitter/X, Etsy |

## Medium

| # | Problem | Topics | Asked at |
|---|---|---|---|
| 11 | [7-Day Moving Average of Revenue](/interview-prep/practice/sql/11-seven-day-moving-average/) | moving-average, window-functions, frames | Amazon, Meta, Google, Netflix |
| 12 | [Moving Average with Missing Days](/interview-prep/practice/sql/12-moving-average-missing-days/) | moving-average, range-frame, date-spine | Uber, Airbnb, Stripe |
| 13 | [Top 3 Salaries per Department](/interview-prep/practice/sql/13-top-n-per-group/) | ranking, dense-rank, top-n | Amazon, Meta, Microsoft, Apple |
| 14 | [Users with 3+ Consecutive Login Days](/interview-prep/practice/sql/14-consecutive-login-streak/) | gaps-and-islands, row-number, dates | Meta, Google, LinkedIn, Uber |
| 15 | [Sessionize Clickstream Events](/interview-prep/practice/sql/15-sessionization/) | sessionization, lag, running-sum | Google, Amazon, Spotify, Pinterest |
| 16 | [Ordered Funnel Conversion](/interview-prep/practice/sql/16-funnel-conversion/) | funnel, conditional-aggregation, product-analytics | Meta, Amazon, Booking.com, Shopify |
| 17 | [Month-over-Month User Retention](/interview-prep/practice/sql/17-month-over-month-retention/) | retention, self-join, product-analytics | Meta, Spotify, Netflix, Duolingo |
| 18 | [Cohort Retention Matrix](/interview-prep/practice/sql/18-cohort-retention-matrix/) | cohorts, retention, window-functions | Airbnb, Uber, Robinhood, Duolingo |
| 19 | [Median Order Value per Country](/interview-prep/practice/sql/19-median-per-group/) | median, percentiles, window-functions | Google, Airbnb, Lyft |
| 20 | [New Users per Day and Cumulative User Count](/interview-prep/practice/sql/20-cumulative-new-users/) | running-total, first-seen, date-spine | Meta, Snap, Discord |
| 21 | [Users Who Bought A and Then B Within 7 Days](/interview-prep/practice/sql/21-bought-a-then-b/) | self-join, sequencing, time-bounds | Amazon, Instacart, Walmart |
| 22 | [Pivot Monthly Revenue into Columns](/interview-prep/practice/sql/22-pivot-monthly-revenue/) | pivot, conditional-aggregation, rollup | Microsoft, Salesforce, Oracle |
| 23 | [Friend Request Acceptance Rate by Day](/interview-prep/practice/sql/23-acceptance-rate/) | ratios, left-join, running-total | Meta, LinkedIn |
| 24 | [Apply CDC Events to Get the Current Table State](/interview-prep/practice/sql/24-cdc-latest-state/) | cdc, deduplication, merge-logic | Databricks, Confluent, Netflix, Stripe |
| 25 | [Average Days Between Purchases](/interview-prep/practice/sql/25-repeat-purchase-interval/) | lag, time-between-events, aggregation | Amazon, Starbucks, Chewy |
| 26 | [Last-Touch Marketing Attribution](/interview-prep/practice/sql/26-last-touch-attribution/) | attribution, as-of-join, row-number | Google, Meta, TikTok, Uber |
| 27 | [Rolling 3-Month Revenue per Customer](/interview-prep/practice/sql/27-rolling-3-month-revenue/) | range-frame, rolling-window, time-series | Stripe, Shopify, Adobe |
| 28 | [Customers Driving 80% of Revenue](/interview-prep/practice/sql/28-pareto-customers/) | running-total, pareto, window-functions | Amazon, Salesforce, Uber |

## Hard

| # | Problem | Topics | Asked at |
|---|---|---|---|
| 29 | [Longest Activity Streak per User](/interview-prep/practice/sql/29-longest-streak-per-user/) | gaps-and-islands, ranking, dates | Duolingo, Strava, Meta, Google |
| 30 | [Merge Overlapping Subscription Periods](/interview-prep/practice/sql/30-merge-overlapping-intervals/) | intervals, gaps-and-islands, running-max | Netflix, Spotify, Amazon, Apple |
| 31 | [Peak Concurrent Sessions per Day](/interview-prep/practice/sql/31-peak-concurrent-sessions/) | intervals, sweep-line, running-total | Netflix, Zoom, Twitch, AWS |
| 32 | [Build an SCD Type 2 Dimension from Daily Snapshots](/interview-prep/practice/sql/32-scd2-from-snapshots/) | scd2, gaps-and-islands, data-modeling | Databricks, Snowflake, Airbnb, any data warehouse team |
| 33 | [Org Chart: All Reports Under Each Manager](/interview-prep/practice/sql/33-org-hierarchy/) | recursive-cte, hierarchy, graphs | Microsoft, Workday, Google, SAP |
| 34 | [Forward-Fill Missing Sensor Readings](/interview-prep/practice/sql/34-forward-fill-nulls/) | forward-fill, window-functions, time-series | Tesla, Siemens, Bloomberg, Two Sigma |
| 35 | [Classify Users as New, Retained, Resurrected or Churned](/interview-prep/practice/sql/35-user-lifecycle-states/) | growth-accounting, retention, self-join | Meta, Spotify, Snap, Robinhood |
| 36 | [p95 Latency per Endpoint (Nearest-Rank)](/interview-prep/practice/sql/36-p95-latency/) | percentiles, window-functions, observability | Datadog, Google, AWS, Cloudflare |
| 37 | [Trip Cancellation Rate Excluding Banned Users](/interview-prep/practice/sql/37-trip-cancellation-rate/) | joins, ratios, filtering | Uber, Lyft, DoorDash |
| 38 | [Products Frequently Bought Together](/interview-prep/practice/sql/38-market-basket-pairs/) | self-join, market-basket, combinatorics | Amazon, Instacart, Walmart, Target |
| 39 | [Time Spent in Each Ticket Status](/interview-prep/practice/sql/39-time-in-status/) | lead, event-log, durations | Atlassian, ServiceNow, Zendesk, Salesforce |
| 40 | [Exponential Moving Average with a Recursive CTE](/interview-prep/practice/sql/40-exponential-moving-average/) | recursive-cte, moving-average, time-series | Two Sigma, Citadel, Robinhood, Bloomberg |
| 41 | [Remove Near-Duplicate Events Within 5 Seconds](/interview-prep/practice/sql/41-near-duplicate-events/) | deduplication, lag, event-time | Segment, Amplitude, Meta, Snowflake |

## By pattern

| Pattern | Problems |
|---|---|
| Window frames / moving averages | 05, 11, 12, 27, 28, 40 |
| Ranking / dedup / top-N | 01, 02, 08, 13, 24, 29 |
| Gaps & islands / sessionization | 14, 15, 29, 30, 32, 41 |
| Retention / cohorts / growth | 04, 17, 18, 20, 35 |
| Funnels / sequences / attribution | 16, 21, 26 |
| Intervals & time | 09, 25, 30, 31, 39 |
| Recursive CTEs | 12, 20, 33, 35, 40 |
| Data engineering specific (CDC, SCD2, dedup) | 02, 24, 32, 34, 41 |
