---
title: "Top 3 Salaries per Department"
description: "Top-N per group with DENSE_RANK, handling ties correctly."
url: "/interview-prep/practice/sql/13-top-n-per-group/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 13
---

# Top 3 Salaries per Department

**Difficulty:** Medium · **Topics:** ranking, dense-rank, top-n · **Asked at:** Amazon, Meta, Microsoft, Apple

## Problem

A "high earner" in a department is an employee whose salary is in the **top three distinct salaries** of that department. Return `department, employee, salary` for all high earners, ordered by department, salary descending, then employee.

## Schema and sample data

```sql schema
CREATE TABLE employees (employee TEXT, department TEXT, salary INTEGER);
INSERT INTO employees VALUES
('Joe','IT',85000),('Henry','Sales',80000),('Sam','Sales',60000),('Max','IT',90000),
('Janet','IT',69000),('Randy','IT',85000),('Will','IT',70000),('Kim','Sales',60000),('Lee','Sales',55000),('Ola','Sales',50000);
```

## Expected output

<!-- expected:start -->
| department | employee | salary |
|---|---|---|
| IT | Max | 90000 |
| IT | Joe | 85000 |
| IT | Randy | 85000 |
| IT | Will | 70000 |
| Sales | Henry | 80000 |
| Sales | Kim | 60000 |
| Sales | Sam | 60000 |
| Sales | Lee | 55000 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

"Top three distinct salaries" means ties share a rank and don't consume extra slots.

</details>

## Solution

```sql solution
SELECT department, employee, salary
FROM (
  SELECT *, DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS r
  FROM employees
)
WHERE r <= 3
ORDER BY department, salary DESC, employee;
```

## Explanation

IT salaries: 90000 (rank 1), 85000 ×2 (rank 2), 70000 (rank 3), 69000 (rank 4), so Max, Joe, Randy and Will qualify: 4 people, 3 distinct salaries. `ROW_NUMBER` would return exactly 3 people and drop one of the 85000 earners arbitrarily; `RANK` would give 70000 rank 4 and drop Will. Always ask what "top 3" means.

## Follow-up questions

<details><summary>How would you do it without window functions?</summary>

Correlated subquery: keep rows where `(SELECT COUNT(DISTINCT e2.salary) FROM employees e2 WHERE e2.department = e.department AND e2.salary > e.salary) < 3`. Correct but O(n²) per department.

</details>
