---
title: "Data Modeling Cheatsheet"
description: "Star schema, snowflake, Data Vault, SCD types and modeling trade-offs at a glance."
url: "/interview-prep/learn/data-modeling/90-cheatsheet/"
hiddenInHomeList: true
showToc: true
weight: 90
---

# Data Modeling Concepts

> Quick reference for dimensional modeling, Data Vault, and SCD patterns.

---

## Star Schema

The most common pattern for analytics/BI.

```
                    ┌──────────────┐
                    │   dim_date   │
                    └──────┬───────┘
                           │
┌──────────────┐    ┌──────┴───────┐    ┌──────────────┐
│  dim_store   │◄───│  fact_sales  │───►│ dim_product  │
└──────────────┘    └──────┬───────┘    └──────────────┘
                           │
                    ┌──────┴───────┐
                    │ dim_customer │
                    └──────────────┘
```

### Fact Table
- Contains measures (amounts, counts, quantities)
- Foreign keys to dimensions
- Grain: one row per [transaction/event/snapshot]
- Usually the largest table

### Dimension Table
- Descriptive attributes
- Relatively small (denormalized)
- Changes tracked via SCD patterns

### When to Use
- Known, stable reporting requirements
- BI/Dashboard workloads
- Query performance matters

---

## Snowflake Schema

Star schema with normalized dimensions.

```
dim_product → dim_category → dim_department
```

### When to Use
- Storage is constrained
- Need to avoid update anomalies
- Okay with more complex queries

### Trade-off
More joins = slower queries, but less storage and easier updates.

---

## Data Vault 2.0

Enterprise pattern for auditability and flexibility.

### Components

| Component | Purpose | Example |
|-----------|---------|---------|
| **Hub** | Business keys | `hub_customer(customer_bk, load_ts)` |
| **Link** | Relationships | `link_order_customer(order_hk, customer_hk)` |
| **Satellite** | Attributes over time | `sat_customer(customer_hk, name, address, load_ts, end_ts)` |

### When to Use
- Multiple source systems
- Full audit trail required
- Regulatory/compliance needs
- Enterprise data warehouse

### Trade-off
Most flexible but worst query performance. Usually build star schemas on top for BI.

---

## One Big Table (OBT)

Fully denormalized single table.

```sql
CREATE TABLE obt_user_features AS
SELECT
    u.*,
    o.total_orders,
    o.total_spent,
    o.avg_order_value,
    p.favorite_category,
    p.last_purchase_date
FROM users u
LEFT JOIN order_agg o ON u.user_id = o.user_id
LEFT JOIN product_agg p ON u.user_id = p.user_id;
```

### When to Use
- ML feature tables
- Single-purpose analytics
- Read performance is critical

### Trade-off
Fastest reads but highest storage and update complexity.

---

## Slowly Changing Dimensions (SCD)

How to track changes in dimension attributes.

### SCD Type 1: Overwrite

```sql
-- Before
| customer_id | name  | city    |
| 1           | Alice | NYC     |

-- After UPDATE
| customer_id | name  | city    |
| 1           | Alice | Boston  |  -- NYC is gone
```

**Use when:** History doesn't matter (corrections, typos).

### SCD Type 2: Add Row with Dates

```sql
| customer_id | name  | city   | valid_from | valid_to   | is_current |
| 1           | Alice | NYC    | 2020-01-01 | 2024-01-14 | false      |
| 1           | Alice | Boston | 2024-01-15 | 9999-12-31 | true       |
```

**Implementation (Delta MERGE):**

```sql
MERGE INTO dim_customer t
USING staged_customers s
ON t.customer_id = s.customer_id AND t.is_current = true

-- Close out old record
WHEN MATCHED AND t.hash != s.hash THEN
  UPDATE SET
    is_current = false,
    valid_to = current_date() - 1

-- Insert new current record (in separate statement)
INSERT INTO dim_customer
SELECT 
    customer_id,
    name,
    city,
    current_date() as valid_from,
    '9999-12-31' as valid_to,
    true as is_current
FROM staged_customers s
WHERE EXISTS (
    SELECT 1 FROM dim_customer t 
    WHERE t.customer_id = s.customer_id 
    AND t.is_current = false 
    AND t.valid_to = current_date() - 1
);
```

**Use when:** Full history required (compliance, analytics).

### SCD Type 3: Add Previous Column

```sql
| customer_id | name  | current_city | previous_city |
| 1           | Alice | Boston       | NYC           |
```

**Use when:** Only need one previous value.

### SCD Type 4: Separate History Table

```sql
-- Current table (fast lookups)
dim_customer_current: | customer_id | name | city |

-- History table (full audit)
dim_customer_history: | customer_id | name | city | valid_from | valid_to |
```

**Use when:** Need both fast current lookups and full history.

---

## Fact Table Types

### Transaction Fact
One row per event/transaction.
```sql
fact_orders: order_id, customer_id, product_id, quantity, amount, order_date
```

### Periodic Snapshot Fact
One row per entity per period.
```sql
fact_inventory_daily: product_id, warehouse_id, date, quantity_on_hand, quantity_sold
```

### Accumulating Snapshot Fact
One row per process, updated as milestones occur.
```sql
fact_order_fulfillment: order_id, order_date, ship_date, deliver_date, return_date
```

---

## Grain

The grain defines what one row represents. **Always define grain first.**

| Grain | Example |
|-------|---------|
| One row per order | `fact_orders` |
| One row per order line | `fact_order_lines` |
| One row per customer per day | `fact_customer_daily` |
| One row per product per warehouse per day | `fact_inventory_snapshot` |

**Common mistake:** Mixing grains in one table (e.g., order-level and line-level facts together).

---

## References

- [Kimball Group: Dimensional Modeling Techniques](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/)
- [Data Vault 2.0 Book](https://www.amazon.com/Building-Scalable-Data-Warehouse-Vault/dp/0128025107)
- [Delta Lake SCD Type 2](https://docs.databricks.com/en/delta/merge.html)
