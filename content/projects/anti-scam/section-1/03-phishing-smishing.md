---
title: "Bài 1.3: Nhận Diện Chiêu Trò Giả Mạo (Phishing & Smishing)"
description: "Bóc trần kỹ thuật tấn công câu cá qua liên kết web và trạm phát sóng BTS giả mạo tin nhắn ngân hàng."
url: "/projects/anti-scam/section-1/03-phishing-smishing/"
weight: 103
showToc: true
TocOpen: true
---

# Bài 1.3: Nhận Diện Chiêu Trò Giả Mạo (Phishing & Smishing)

> **Mục tiêu:** Phân biệt Phishing, Smishing và nắm rõ thủ đoạn dùng trạm BTS giả mạo để không bao giờ bị sập bẫy tin nhắn lừa đảo.

---

## 1. Phishing (Tấn công câu cá) hoạt động như thế nào?

```mermaid
sequenceDiagram
    participant Attacker as Kẻ Lừa Đảo
    participant Victim as Nạn Nhân
    participant Server as Web Giả Mạo (Phishing)
    participant RealBank as Ngân Hàng / MXH Thật

    Attacker->>Victim: Gửi SMS/Email bẫy: "Tài khoản bị khóa, click link"
    Victim->>Server: Nhấp link, nhập Tài khoản & Mật khẩu
    Server->>Attacker: Bắn tài khoản & mật khẩu về Telegram bot
    Attacker->>RealBank: Đăng nhập tài khoản của nạn nhân
    RealBank->>Victim: Gửi mã OTP xác nhận giao dịch
    Server->>Victim: Hiển thị form: "Nhập mã OTP để xác nhận bảo mật"
    Victim->>Server: Nhập mã OTP
    Server->>Attacker: Bắn OTP cho kẻ lừa đảo
    Attacker->>RealBank: Nhập OTP & Cướp sạch tiền / tài khoản
```

---

## 2. Smishing & Hiểm họa từ Trạm BTS giả mạo

### Trạm BTS giả là gì?
- Kẻ gian mang theo thiết bị phát sóng di động giả mạo (Fake BTS) di chuyển bằng ba lô, xe máy hoặc ô tô.
- Thiết bị này phát công suất mạnh đè sóng của nhà mạng chính thức (Viettel, VinaPhone, MobiFone), ép điện thoại của người dân gần đó kết nối vào trạm giả.
- Khi đã kết nối, kẻ gian gửi hàng loạt SMS chèn thẳng vào luồng tin nhắn chính thức của ngân hàng (Brandname Vietcombank, Techcombank, MB, Viettel...).

> [!IMPORTANT]
> **Quy tắc bất di bất dịch:**
> Dù tin nhắn SMS nằm chung luồng với tin nhắn thật của ngân hàng từ trước đến nay, **TUYỆT ĐỐI KHÔNG BAO GIỜ** nhấp vào link kèm trong SMS. Ngân hàng tại Việt Nam hiện đã ngừng toàn bộ việc đính kèm liên kết web vào tin nhắn SMS thông báo.
