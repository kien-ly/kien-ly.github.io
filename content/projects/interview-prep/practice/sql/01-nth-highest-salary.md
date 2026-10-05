---
title: "Second (Nth) Highest Salary"
description: "Find the second highest distinct salary, returning NULL when it does not exist; generalise to N."
url: "/interview-prep/practice/sql/01-nth-highest-salary/"
hiddenInHomeList: true
showToc: true
difficulty: "easy"
weight: 1
---

# Second (Nth) Highest Salary

**Difficulty:** Easy · **Topics:** ranking, subquery, dense-rank · **Asked at:** Meta, Amazon, Microsoft

## Problem

Return the **second highest distinct salary** from `employees` as `second_highest`. If there is no second highest salary, return `NULL` (one row).

## Schema and sample data

```sql schema
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT, salary INTEGER);
INSERT INTO employees VALUES
(1,'Alice','Eng',120000),(2,'Bob','Eng',120000),(3,'Carol','Eng',95000),
(4,'Dan','Sales',80000),(5,'Eve','Sales',95000),(6,'Frank','HR',70000);
```

## Expected output

<!-- expected:start -->
| second_highest |
|---|
| 95000 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Duplicates matter: 120000 appears twice but is one distinct value.

</details>

<details><summary>Hint 2</summary>

A scalar subquery (or an aggregate) always returns one row, which gives you NULL for free when nothing matches.

</details>

## Solution

```sql solution
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```

**Alternative 1**

```sql alt1
SELECT (SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1) AS second_highest;
```

**Alternative 2**

```sql alt2
SELECT MAX(salary) AS second_highest FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk FROM employees
) WHERE rnk = 2;
```

## Explanation

- `MAX(...)` over an empty set returns `NULL`, which satisfies the "return NULL" requirement without special cases.
- The `DENSE_RANK` version generalises to the **Nth** highest: change `rnk = 2` to `rnk = N`. `RANK` would be wrong with ties (it skips 2 when two people share rank 1).
- Wrapping `LIMIT/OFFSET` in a scalar subquery returns `NULL` instead of zero rows.

## Follow-up questions

<details><summary>How do you return the Nth highest salary per department?</summary>

`DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC)` and filter `= N`. Departments without an Nth salary disappear; left join from the department list if they must appear with NULL.

</details>

<details><summary>What changes if salaries can be NULL?</summary>

`MAX` and ranking ignore/sort NULLs differently by engine; filter `salary IS NOT NULL` explicitly so NULL is never treated as a value.

</details>

## Dialect notes

Spark/Snowflake/BigQuery can use `QUALIFY DENSE_RANK() OVER (ORDER BY salary DESC) = 2` but then return zero rows rather than NULL when missing.
