---
title: "Open Source: DataFlow v2.0 đã release"
date: 2026-03-01
draft: false
tags: ["open-source", "python", "release", "dataflow"]
categories: ["Release"]
description: "DataFlow v2.0 ra mắt với nhiều tính năng mới: parallel processing, YAML config, và hỗ trợ BigQuery native."
---

Hôm nay tôi chính thức release **DataFlow v2.0** — bản nâng cấp lớn nhất từ trước đến nay! 🎊

## Gì mới trong v2.0?

### ⚡ Parallel Processing
Pipeline giờ có thể chạy song song nhiều bước, giảm thời gian xử lý đến **60%**.

### 📄 YAML-first Config
Toàn bộ config pipeline được viết bằng YAML thuần túy, không cần viết Python code:

```yaml
pipeline:
  name: my-pipeline
  steps:
    - extract: postgresql
    - transform: normalize
    - load: bigquery
```

### 🏢 BigQuery Native Support
Kết nối trực tiếp BigQuery không cần middleware, với streaming insert tích hợp sẵn.

### 🐛 Breaking Changes

> **Chú ý:** v2.0 không tương thích ngược với v1.x. Xem [migration guide](https://github.com/username/dataflow/blob/main/MIGRATION.md) để upgrade.

## Cài đặt

```bash
pip install dataflow-etl==2.0.0
```

## Links

- [📦 PyPI](https://pypi.org/project/dataflow-etl/)
- [📖 Documentation](https://dataflow.example.com/docs/v2)
- [🔄 Changelog](https://github.com/username/dataflow/blob/main/CHANGELOG.md)
