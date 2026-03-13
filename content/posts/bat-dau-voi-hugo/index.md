---
title: "Bắt đầu với Hugo: Tạo Blog cá nhân trong 30 phút"
date: 2026-03-13
draft: false
tags: ["hugo", "web", "tutorial"]
categories: ["Tutorial"]
description: "Hướng dẫn nhanh thiết lập Hugo blog với GitHub Pages, từ cài đặt đến deploy."
cover:
  image: ""
  alt: "Hugo Blog"
  relative: false
---

## Hugo là gì?

Hugo là một **Static Site Generator** viết bằng Go — nhanh nhất thế giới hiện tại. Bạn viết nội dung bằng Markdown, Hugo compile ra HTML tĩnh.

Ưu điểm:
- ⚡ Build cực nhanh (hàng trăm trang trong < 1s)
- 🔒 Bảo mật tuyệt đối (không có database, không có server-side)
- 💸 Hoàn toàn miễn phí khi host trên GitHub Pages

## Cài đặt

```bash
# macOS
brew install hugo

# Kiểm tra
hugo version
```

## Tạo site mới

```bash
hugo new site my-blog
cd my-blog
git init
```

## Thêm theme

```bash
git submodule add --depth=1 \
  https://github.com/adityatelange/hugo-PaperMod.git \
  themes/PaperMod
```

## Viết bài đầu tiên

```bash
hugo new posts/bai-viet-dau-tien.md
```

Mở file vừa tạo và viết nội dung bằng Markdown!

## Chạy local

```bash
hugo server -D
```

Mở `http://localhost:1313` để xem kết quả 🎉

## Deploy lên GitHub Pages

Tạo file `.github/workflows/deploy.yml` và push code lên GitHub. GitHub Actions sẽ tự động build và deploy cho bạn!

---

*Bài tiếp theo: Tùy chỉnh theme và thêm các tính năng nâng cao.*
