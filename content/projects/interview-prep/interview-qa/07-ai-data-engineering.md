---
title: "AI Data Engineering Interview Questions"
description: "RAG pipelines, embeddings, vector search, evaluation, feature stores, LLM observability and agentic systems from a data engineering perspective."
url: "/interview-prep/interview-qa/07-ai-data-engineering/"
hiddenInHomeList: true
showToc: true
weight: 7
---

# AI Data Engineering Interview Questions

> For "AI data engineer" or "data engineer, AI platform" roles. Learn the concepts in learn/architecture/09-ai-data-architecture.md.

Tags: **[core]** = expected at every level · **[senior]** = expected at senior/staff level.

## RAG and retrieval

<details><summary>[core] What is RAG and why use it instead of fine-tuning?</summary>

Retrieval-Augmented Generation retrieves relevant documents at query time and passes them to the LLM as context. It keeps knowledge fresh without retraining, gives citations, respects permissions per user, and is cheaper to update. Fine-tuning changes behaviour/style, not up-to-date knowledge.

</details>

<details><summary>[core] How do you choose a chunk size?</summary>

Balance context completeness against precision: 300–800 tokens with 10–20% overlap as a start; structure-aware splitting (headings, code blocks, tables). Then tune on a retrieval eval set (recall@k), not intuition.

</details>

<details><summary>[senior] Why hybrid search (BM25 + vectors)?</summary>

Dense embeddings capture semantics but miss exact tokens (IDs, error codes, names); BM25 nails exact terms. Combining (e.g. reciprocal rank fusion) improves recall across query types.

</details>

<details><summary>[senior] How do you enforce document permissions in RAG?</summary>

Ingest ACLs as chunk metadata, sync permission changes quickly, and pre-filter retrieval by the user's principals. Never rely on the LLM to hide content; audit what was retrieved for whom.

</details>

<details><summary>[senior] How do you keep a vector index fresh and consistent?</summary>

Incremental ingestion with content hashing (skip unchanged), deterministic chunk ids for idempotent upserts, delete propagation, a source-of-truth chunks table (Delta) from which the index is synced/rebuilt, and freshness monitoring.

</details>

<details><summary>[senior] What happens when you change the embedding model?</summary>

Vectors from different models aren't comparable, so re-embed everything into a new index version in parallel, evaluate, then switch an alias (blue/green). Track model version per vector.

</details>

<details><summary>[senior] HNSW vs IVF indexes?</summary>

HNSW: graph-based, high recall and speed, memory-hungry, incremental inserts. IVF(-PQ): cluster-based, less memory (with product quantisation), needs training, typically lower recall. Quantisation (int8/binary) trades a little recall for 4–32× memory savings.

</details>

## Evaluation and observability

<details><summary>[core] How do you evaluate a RAG system?</summary>

Retrieval: recall@k / MRR / nDCG on a golden set of questions with relevant chunks. Generation: faithfulness/groundedness and answer relevance (LLM-as-judge calibrated with human labels). System: latency, cost, refusal rate. Business: user feedback, deflection.

</details>

<details><summary>[senior] What would you log for every LLM request?</summary>

request/trace id, app, user (pseudonymised), model + version, prompt version, input/output/cached tokens, cost, latency, retrieved chunk ids + scores, tool calls, status/errors, user feedback, eval scores. This becomes a fact table for cost, quality and regression analysis.

</details>

<details><summary>[senior] How do you make LLM-as-judge reliable?</summary>

Versioned judge prompts/models, calibration against human labels (agreement metrics), checks for known biases (length, position, self-preference), pairwise comparisons for A/B decisions, and spot checks.

</details>

<details><summary>[senior] How do you prevent regressions when changing prompts or models?</summary>

Treat prompts/configs as code; run an offline eval suite in CI on golden datasets; canary/shadow in production comparing metrics with confidence intervals; rollback on regression.

</details>

## ML data foundations

<details><summary>[core] What is a feature store?</summary>

A system to define, compute, store and serve ML features consistently: offline store (history for training, point-in-time joins), online store (low-latency latest values for inference), registry (definitions, owners, lineage).

</details>

<details><summary>[senior] What is point-in-time correctness and why does it matter?</summary>

Training examples must use feature values as known at the label's timestamp. Joining current values leaks future information, inflating offline metrics and failing in production. Use AS-OF joins or logged features.

</details>

<details><summary>[senior] What is training/serving skew?</summary>

Different feature computations (or data) at training vs inference time causing different values. Prevent with single feature definitions materialised to both stores, feature logging at serving time, and distribution monitoring.

</details>

## Agents and LLM pipelines

<details><summary>[senior] How would you design an LLM-based SQL migration pipeline?</summary>

Inventory and classify SQL; deterministic transpiler first; LLM agent for the long tail with retrieval of similar solved examples; compile checks; result-set equivalence validation against the legacy system; repair loop with error feedback; human review queue for low confidence; every fix feeds the knowledge base; metrics on auto-validation rate and human hours per object.

</details>

<details><summary>[senior] What data engineering concerns arise with agents that run SQL?</summary>

Least-privilege identities (agent acts as the user), governed tables with good metadata (descriptions, semantic layer) for grounding, query cost/time limits, read-only by default, audit logging of generated queries, validation of results, and evaluation on a benchmark of questions.

</details>

<details><summary>[senior] How do you control cost in LLM-heavy pipelines?</summary>

Cache (prompt/semantic caching), batch requests, route to smaller models when possible, trim context (better retrieval, fewer chunks), cap agent steps/tokens, sample expensive evaluations, monitor cost per request per app with budgets and alerts.

</details>
