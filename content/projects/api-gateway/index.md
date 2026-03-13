---
title: "API Gateway Microservice"
date: 2026-02-20
draft: false
tags: ["golang", "microservices", "docker", "kubernetes", "backend"]
categories: ["Backend"]
description: "API Gateway viết bằng Go, xử lý routing, rate limiting và authentication cho hệ thống microservices."
links:
  - name: "GitHub"
    url: "https://github.com/username/api-gateway"
---

## Tổng quan

Một **API Gateway** được xây dựng từ đầu bằng Go, phục vụ như điểm vào duy nhất cho toàn bộ hệ thống microservices. Xử lý được hơn **10,000 req/s** trên một instance duy nhất.

## Tính năng chính

- 🔀 **Smart routing** — route requests đến đúng service dựa trên path/header
- 🛡️ **Rate limiting** — per-IP và per-user rate limiting với Redis backend
- 🔐 **JWT Authentication** — validate token và forward claims xuống các service
- 📊 **Metrics** — expose Prometheus metrics tích hợp sẵn
- ⚡ **Zero-downtime reload** — reload config mà không restart process

## Tech Stack

- **Language**: Go 1.22
- **Container**: Docker + Kubernetes
- **Cache**: Redis
- **Monitoring**: Prometheus + Grafana

## Kết quả

- Giảm 40% latency trung bình so với solution cũ
- 99.99% uptime trong 6 tháng production
