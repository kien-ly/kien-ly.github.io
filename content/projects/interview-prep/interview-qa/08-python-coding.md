---
title: "Python for Data Engineering: Interview Questions"
description: "Python language and ecosystem questions for data engineers: generators, memory, concurrency, typing, testing, pandas and PySpark."
url: "/interview-prep/interview-qa/08-python-coding/"
hiddenInHomeList: true
showToc: true
weight: 8
---

# Python for Data Engineering: Interview Questions

> Conceptual Python questions. Coding problems are in practice/python.

Tags: **[core]** = expected at every level · **[senior]** = expected at senior/staff level.

## Language

<details><summary>[core] List vs tuple vs set vs dict: when each?</summary>

List: ordered, mutable sequence. Tuple: immutable (hashable if contents are), good as dict keys/records. Set: unique members, O(1) membership. Dict: key→value, O(1) lookup, insertion-ordered since 3.7.

</details>

<details><summary>[core] What is a generator and why do data engineers care?</summary>

A function using `yield` that produces values lazily, one at a time. Constant memory for arbitrarily large inputs (stream a 50 GB file line by line), composable pipelines (parse → filter → batch).

</details>

<details><summary>[core] Explain mutable default arguments.</summary>

Defaults are evaluated once at function definition, so `def f(x, acc=[])` shares the same list across calls. Use `acc=None` and create inside.

</details>

<details><summary>[core] Shallow vs deep copy?</summary>

Shallow copy (`list(x)`, `dict.copy()`, `copy.copy`) copies the container but shares nested objects; deep copy (`copy.deepcopy`) recursively copies. Matters when mutating nested records.

</details>

<details><summary>[senior] What are decorators and a real DE use case?</summary>

Functions that wrap other functions to add behaviour. Uses: retries with backoff, timing/metrics, logging, caching (`functools.lru_cache`), input validation. Use `functools.wraps` to preserve metadata.

</details>

<details><summary>[senior] Context managers?</summary>

Objects with `__enter__/__exit__` (or `@contextmanager`) guaranteeing setup/teardown: files, DB connections, locks, temp tables, timing blocks. Ensures cleanup on exceptions.

</details>

## Performance and concurrency

<details><summary>[core] What is the GIL and how does it affect data pipelines?</summary>

The Global Interpreter Lock lets only one thread execute Python bytecode at a time (in CPython builds with the GIL). Threads still help for I/O-bound work (API calls, S3 downloads); CPU-bound work needs multiprocessing, vectorised libraries (NumPy, Arrow, Polars) or distributed engines (Spark).

</details>

<details><summary>[senior] threading vs multiprocessing vs asyncio?</summary>

threading: I/O concurrency with shared memory, GIL-limited for CPU. multiprocessing: true parallel CPU, separate memory, serialisation overhead. asyncio: single-threaded cooperative concurrency for many I/O-bound tasks (thousands of HTTP calls) with low overhead.

</details>

<details><summary>[senior] How do you process a file larger than memory in Python?</summary>

Stream it (iterate lines/chunks, `pandas.read_csv(chunksize=)`, `pyarrow.dataset` batches), aggregate incrementally, use external sort for ordering, or switch to DuckDB/Polars (out-of-core) or Spark.

</details>

<details><summary>[senior] Why are Python UDFs slow in Spark and what are the alternatives?</summary>

Rows are serialised between the JVM and Python worker processes and executed row by row. Use built-in functions (Catalyst-optimised), Pandas UDFs (Arrow, vectorised batches), or Scala/SQL functions.

</details>

## Ecosystem

<details><summary>[core] pandas vs Polars vs DuckDB vs PySpark?</summary>

pandas: ubiquitous, single-threaded, in-memory. Polars: fast multi-threaded DataFrame library (Rust, Arrow), lazy optimisation, larger-than-memory streaming. DuckDB: in-process analytical SQL, extremely fast on local files. PySpark: distributed for data beyond one machine. Use the smallest tool that fits the data.

</details>

<details><summary>[core] What is Apache Arrow?</summary>

A columnar in-memory format standard enabling zero-copy data exchange between systems (pandas ↔ Spark ↔ DuckDB ↔ Polars), vectorised processing, and fast Parquet I/O.

</details>

<details><summary>[senior] How do you test data pipelines in Python?</summary>

pytest unit tests on pure transformation functions with small fixture DataFrames (local Spark session or DuckDB), property-based tests for edge cases, schema/contract tests, integration tests on sampled data, and data diffs between versions. Keep I/O at the edges so logic is testable.

</details>

<details><summary>[senior] How do you structure a production Python data project?</summary>

Package (`src/` layout, pyproject), typed modules for transformations separate from I/O and orchestration, config via env/params, structured logging, tests + linting (ruff, mypy) in CI, dependency pinning, and deployment as wheels/containers.

</details>
