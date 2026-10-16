import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const contentMdPath = path.resolve(root, '.idea/pj/anti-scam/content.md');
const contentMd = fs.readFileSync(contentMdPath, 'utf8');

const frontmatter = `---
title: "Kỹ Năng Phòng Chống Lừa Đảo Trực Tuyến Cho Thanh Thiếu Niên"
date: 2026-10-16
draft: false
url: "/anti-scam/"
tags: ["cybersecurity", "anti-scam", "education", "teen-safety", "ai-deepfake"]
categories: ["Security"]
description: "Khóa học và cẩm nang trang bị kỹ năng nhận diện, phòng vệ trước các bẫy lừa đảo mạng xã hội, game online, AI deepfake, tuyển dụng và tài chính trực tuyến."
showToc: true
TocOpen: true
---

> 📱 **ỨNG DỤNG HỌC & LÀM BÀI TEST TRẮC NGHIỆM TƯƠNG TÁC:**  
> [**👉 Nhấp vào đây để mở Giao diện học tương tác và làm bài Quiz 20 câu mở khóa từng Section (/anti-scam/)**](/anti-scam/index.html)

---

`;

const fullDoc = frontmatter + contentMd;
const destPath = path.resolve(root, 'content/anti-scam/index.md');
fs.writeFileSync(destPath, fullDoc, 'utf8');
console.log('Successfully generated content/anti-scam/index.md');
