---
title: "Org Chart: All Reports Under Each Manager"
description: "Recursive CTE over a parent-child hierarchy: depth, path and total headcount under every manager."
url: "/interview-prep/practice/sql/33-org-hierarchy/"
hiddenInHomeList: true
showToc: true
difficulty: "hard"
weight: 33
---

# Org Chart: All Reports Under Each Manager

**Difficulty:** Hard · **Topics:** recursive-cte, hierarchy, graphs · **Asked at:** Microsoft, Workday, Google, SAP

## Problem

Using `employees(id, name, manager_id)`, return for every employee: `name`, `depth` (CEO = 0), `path` of names from the CEO (separated by ` > `) and `total_reports`: the number of people **directly or indirectly** reporting to them. Order by path.

## Schema and sample data

```sql schema
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, manager_id INTEGER);
INSERT INTO employees VALUES
(1,'Ada',NULL),(2,'Ben',1),(3,'Cy',1),(4,'Di',2),(5,'Ed',2),(6,'Flo',4),(7,'Gus',3);
```

## Expected output

<!-- expected:start -->
| name | depth | path | total_reports |
|---|---|---|---|
| Ada | 0 | Ada | 6 |
| Ben | 1 | Ada > Ben | 3 |
| Di | 2 | Ada > Ben > Di | 1 |
| Flo | 3 | Ada > Ben > Di > Flo | 0 |
| Ed | 2 | Ada > Ben > Ed | 0 |
| Cy | 1 | Ada > Cy | 1 |
| Gus | 2 | Ada > Cy > Gus | 0 |
<!-- expected:end -->

## Hints

<details><summary>Hint 1</summary>

Recursive CTE #1 walks top-down to build depth and path.

</details>

<details><summary>Hint 2</summary>

Recursive CTE #2 (or the same one) enumerates every (ancestor, descendant) pair; count descendants per ancestor.

</details>

## Solution

```sql solution
WITH RECURSIVE tree(id, name, depth, path) AS (
  SELECT id, name, 0, name FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, t.depth + 1, t.path || ' > ' || e.name
  FROM employees e JOIN tree t ON e.manager_id = t.id
), pairs(ancestor, descendant) AS (
  SELECT manager_id, id FROM employees WHERE manager_id IS NOT NULL
  UNION ALL
  SELECT p.ancestor, e.id FROM pairs p JOIN employees e ON e.manager_id = p.descendant
)
SELECT t.name, t.depth, t.path,
       (SELECT COUNT(*) FROM pairs p WHERE p.ancestor = t.id) AS total_reports
FROM tree t
ORDER BY t.path;
```

## Explanation

- The anchor member selects roots; the recursive member joins children to rows found so far; recursion stops when no new rows appear.
- `pairs` is the **transitive closure** (all ancestor–descendant pairs). Materialising it as a table is a common modelling trick (a "closure table" or "bridge table") that makes hierarchy queries simple joins.
- Guard against cycles in dirty data with a depth limit (`WHERE depth < 20`) or by checking the path doesn't already contain the id.

## Follow-up questions

<details><summary>Spark doesn't support recursive CTEs (before 4.x). Alternatives?</summary>

Iterative self-joins in PySpark until no new rows (fine for shallow hierarchies), GraphFrames for graph algorithms, or flatten the hierarchy in the source/ETL into a closure table.

</details>
