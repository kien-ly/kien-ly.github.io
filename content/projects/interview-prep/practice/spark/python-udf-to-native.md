---
title: "Rewrite Slow Python UDFs With Native Functions and Pandas UDFs"
description: "Replace row-by-row Python UDFs with built-in expressions, higher-order array functions and a vectorised pandas UDF, and explain the serialization and optimizer reasons behind the speed-up."
url: "/interview-prep/practice/spark/python-udf-to-native/"
hiddenInHomeList: true
showToc: true
difficulty: "medium"
weight: 8
---

# Rewrite Slow Python UDFs With Native Functions and Pandas UDFs

**Difficulty:** Medium · **Topics:** PySpark UDFs, Arrow, higher-order functions · **Asked at:** Databricks, Meta, Spotify, Lyft

## Scenario

A cleaning step over 2 billion customer events takes 50 minutes; the rest of the pipeline takes 8. It uses three Python UDFs:

```python
from pyspark.sql import functions as F, types as T
import re, math

@F.udf(T.StringType())
def clean_phone(p):
    if p is None:
        return None
    digits = re.sub(r"\D", "", p)
    return "+" + digits if len(digits) >= 10 else None

@F.udf(T.ArrayType(T.StringType()))
def normalise_tags(tags):
    return sorted({t.strip().lower() for t in tags if t and t.strip()}) if tags else []

@F.udf(T.DoubleType())
def risk_score(amount, age_days):
    # proprietary formula from the data science team
    return float(1 / (1 + math.exp(-(0.002 * amount - 0.01 * age_days))))

out = (events
    .withColumn("phone", clean_phone("phone_raw"))
    .withColumn("tags", normalise_tags("tags_raw"))
    .withColumn("risk", risk_score("amount", "account_age_days")))
```

## Your task

1. Explain why these UDFs are slow (be specific about what happens per row).
2. Rewrite each one, preferring native Spark functions, and use a pandas UDF only where it's justified.
3. How would you prove the rewrite is equivalent and faster?

## Hints

<details><summary>Hint 1</summary>

`regexp_replace`, `length`, `when` and `concat` cover the phone logic. Arrays have higher-order functions: `transform`, `filter`, `array_distinct`, `array_sort`.

</details>

<details><summary>Hint 2</summary>

The risk formula is plain arithmetic: Spark has `exp`. If it were really complex NumPy code, which UDF type would you pick?

</details>

## Solution

**1. Why they're slow.** For every row and every UDF, the executor JVM serializes the input columns (pickle), sends them to a Python worker process, the interpreter runs the function, and the result is pickled back and deserialized. That's 6 billion round trips through the interpreter here. Also:
- The UDFs are **black boxes to Catalyst**: no codegen for those expressions, no predicate pushdown through them, and the plan shows `BatchEvalPython` nodes that break whole-stage code generation.
- Python workers use memory **outside the JVM heap** (overhead), adding container-kill risk.

**2. Rewrites.**

```python
digits = F.regexp_replace("phone_raw", r"\D", "")
phone = F.when(F.length(digits) >= 10, F.concat(F.lit("+"), digits))          # NULL input → NULL output

tags = F.array_sort(F.array_distinct(
    F.filter(F.transform(F.coalesce("tags_raw", F.array().cast("array<string>")), lambda t: F.lower(F.trim(t))),
             lambda t: t.isNotNull() & (t != ""))))

risk = 1 / (1 + F.exp(-(F.lit(0.002) * F.col("amount") - F.lit(0.01) * F.col("account_age_days"))))

out = (events
    .withColumn("phone", phone)
    .withColumn("tags", tags)
    .withColumn("risk", risk))
```

All three are now **native JVM expressions**, so they're code-generated, Photon-compatible on Databricks, and never leave the JVM. (`F.filter` and `F.transform` with Python lambdas build Spark SQL lambda expressions; the lambda is **not** executed in Python.)

**When a pandas UDF is justified:** if the data science formula really needed NumPy/SciPy (e.g. a fitted model's `predict`, a complex spline), use a vectorised pandas UDF so data moves in **Arrow batches** and the maths runs vectorised:

```python
import pandas as pd
import numpy as np

@F.pandas_udf("double")
def risk_score_vec(amount: pd.Series, age_days: pd.Series) -> pd.Series:
    return 1 / (1 + np.exp(-(0.002 * amount - 0.01 * age_days)))
```

Ranking: **built-in > pandas UDF (Arrow, vectorised) > Arrow-optimised Python UDF > classic Python UDF.**

**3. Proving it.**
- **Equivalence:** run old and new versions on a representative sample (including NULLs, empty arrays, short phone numbers, whitespace tags) and compare with `exceptAll` in both directions (or `assertDataFrameEqual` in Spark 3.5+). For floats, compare with a tolerance (`abs(a - b) < 1e-9`).
- **Performance:** compare the plans (no `BatchEvalPython`, codegen stages `*(n)` covering the projections) and the stage durations in the UI on the full data. Expect the 50-minute step to drop to a few minutes.

**Edge-case notes worth mentioning:** the original `clean_phone` returns `None` for short numbers; `when` without `otherwise` does the same. The original `normalise_tags` returns `[]` for NULL input; `coalesce(tags_raw, array())` (cast to `array<string>`) preserves that. Matching these details is what "equivalent" means.

## What interviewers look for

- A precise explanation of the JVM ↔ Python serialization path and the optimizer impact (not just "UDFs are slow").
- Fluency with native functions, including **higher-order array functions**.
- Knowing when a pandas UDF is the right tool and why Arrow helps.
- A rigorous equivalence test that covers NULL and edge semantics.
