---
title: "Bài 1.2: Nhận Diện Các Dấu Hiệu Cảnh Báo Đỏ (Red Flags)"
description: "Bộ quy tắc thực chiến giúp phát hiện tin nhắn, email và đường link lừa đảo chỉ trong vài giây."
url: "/projects/anti-scam/section-1/02-nhan-dien-red-flags/"
weight: 2
showToc: true
TocOpen: true
---

# Bài 1.2: Nhận Diện Các Dấu Hiệu Cảnh Báo Đỏ (Red Flags)

> **Mục tiêu:** Nắm vững bảng kiểm tra (checklist) các dấu hiệu bất thường trong giao tiếp mạng để phản xạ nhận biết lừa đảo tức thì.

---

## 1. Bảng kiểm tra Dấu hiệu Đỏ (Red Flags Checklist)

| Dấu hiệu | Biểu hiện cụ thể | Mức độ rủi ro |
|---|---|---|
| **Thời gian gấp gáp** | *"Khẩn cấp", "Chỉ còn 5 phút", "Hủy trong 24h"* | Rất cao |
| **Tên miền mập mờ** | Chứa đuôi lạ (`.xyz`, `.top`, `.cfd`), sai chính tả | Cực kỳ nguy hiểm |
| **Đòi hỏi thông tin nhạy cảm** | Yêu cầu nhập mật khẩu, mã OTP, số thẻ ngân hàng, CCCD | Tuyệt đối tránh |
| **Lời hứa phi thực tế** | *"Việc nhẹ lương 500k/ngày", "Nạp 1 được 10"* | Lừa đảo chắc chắn |
| **Lỗi chính tả & dịch thuật** | Văn phong ngô nghê, câu cú lủng củng | Đáng ngờ |

---

## 2. Kỹ thuật mạo danh tên miền (Typosquatting)

Kẻ xấu đăng ký những tên miền có bề ngoài gần như giống hệt các thương hiệu nổi tiếng để đánh lừa mắt thường của người dùng:

- `g00gle.com` thay vì `google.com` (dùng số 0 thay cho chữ O).
- `vietcombank-login.xyz` thay vì `vietcombank.com.vn`.
- `facebook-security-verify.top` thay vì `facebook.com`.

> [!WARNING]
> Ký hiệu **ổ khóa xanh (HTTPS)** trên thanh địa chỉ chỉ chứng minh đường truyền dữ liệu được mã hóa bảo mật, **KHÔNG CHỨNG MINH** website đó là uy tín hay an toàn. Kẻ lừa đảo hoàn toàn có thể cài chứng chỉ HTTPS miễn phí cho trang web lừa đảo của chúng!

---

## 3. Cách tra cứu độ an toàn của đường link
Trước khi nhấp vào một liên kết đáng ngờ:
1. Sao chép địa chỉ liên kết (không nhấp trực tiếp).
2. Dán vào công cụ kiểm tra của Dự án Chống Lừa Đảo: [chongluadao.vn](https://chongluadao.vn).
3. Tra cứu tại Cổng cảnh báo an toàn thông tin quốc gia: [canhbao.ncsc.gov.vn](https://canhbao.ncsc.gov.vn).
