---
title: "DataFlow — ETL Pipeline Tool"
date: 2026-01-10
draft: false
tags: ["python", "data-engineering", "airflow", "postgresql", "etl"]
categories: ["Data Engineering"]
description: "Công cụ ETL pipeline tự động hóa việc extract, transform và load dữ liệu từ nhiều nguồn khác nhau."
links:
  - name: "GitHub"
    url: "https://github.com/username/dataflow"
  - name: "Docs"
    url: "https://dataflow.example.com/docs"
---

## Tổng quan

**DataFlow** là một framework ETL pipeline viết bằng Python, cho phép định nghĩa pipeline dưới dạng YAML và chạy tự động theo lịch với Apache Airflow.

## Tính năng

- 📥 **Multi-source extract** — CSV, JSON, REST API, SQL databases
- 🔄 **Transform engine** — xử lý, làm sạch và chuẩn hóa dữ liệu
- 📤 **Flexible load** — PostgreSQL, BigQuery, S3, Elasticsearch
- ⏰ **Scheduling** — tích hợp Airflow DAG tự động
- 📧 **Alerting** — thông báo Slack/email khi pipeline fail

## Ví dụ config

```yaml
pipeline:
  name: "daily-sales-report"
  schedule: "0 8 * * *"
  
  extract:
    source: postgresql
    query: "SELECT * FROM sales WHERE date = '{{ ds }}'"
  
  transform:
    - type: filter_nulls
    - type: aggregate
      group_by: ["region", "product"]
      
  load:
    destination: bigquery
    table: "analytics.daily_sales"
```

## Impact

- Tự động hóa **15+ pipeline** thủ công trước đây
- Tiết kiệm **~20 giờ/tuần** công việc manual
