import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

// 1. Read course-data.json
const courseDataPath = path.resolve(root, 'static/anti-scam/course-data.json');
const courseData = JSON.parse(fs.readFileSync(courseDataPath, 'utf8'));

// Giữ nguyên giọng văn chuẩn thân thiện với học sinh, sinh viên, bỏ các icon emoji
courseData.courseTitle = "Khóa Học Kỹ Năng Phòng Chống Lừa Đảo Trực Tuyến Dành Cho Thanh Thiếu Niên";
courseData.sections[0].title = "Nhận Thức Số & Bản Đồ Chiêu Trò Lừa Đảo Trực Tuyến";
courseData.sections[0].shortTitle = "Nhận Thức Số & Dấu Hiệu Đỏ";
courseData.sections[0].icon = "";

courseData.sections[1].title = "Bẫy Mạng Xã Hội, Game Online & Công Nghệ AI Deepfake";
courseData.sections[1].shortTitle = "Bẫy MXH, Game & Deepfake";
courseData.sections[1].icon = "";

courseData.sections[2].title = "Bẫy Tài Chính, Tiền Ảo & Tuyển Dụng Việc Nhẹ Lương Cao Cho Teen";
courseData.sections[2].shortTitle = "Bẫy Tài Chính & Tuyển Dụng Teen";
courseData.sections[2].icon = "";

courseData.sections[3].title = "Kỹ Thuật Phòng Thủ Số & Kịch Bản Ứng Phó Khủng Hoảng";
courseData.sections[3].shortTitle = "Phòng Thủ & Ứng Phó Khẩn Cấp";
courseData.sections[3].icon = "";

fs.writeFileSync(courseDataPath, JSON.stringify(courseData, null, 2), 'utf8');
console.log('Updated course-data.json: kept teen-friendly voice, removed emojis.');

// 2. Base directory for Hugo project anti-scam
const baseDir = path.resolve(root, 'content/projects/anti-scam');
fs.mkdirSync(baseDir, { recursive: true });

// 3. Create _index.md for the Project (Teen-friendly, zero emoji)
const projectIndex = `---
title: "Khóa Học Phòng Chống Lừa Đảo Trực Tuyến Dành Cho Thanh Thiếu Niên"
description: "Trang bị kiến thức và kỹ năng nhận diện, phòng chống các bẫy lừa đảo mạng xã hội, game online, AI deepfake, tuyển dụng và tài chính trực tuyến."
url: "/projects/anti-scam/"
date: 2026-10-16
tags: ["cybersecurity", "anti-scam", "teen-safety", "education", "deepfake", "game-safety"]
categories: ["Security", "Projects"]
showToc: true
TocOpen: true
---

# Khóa Học Phòng Chống Lừa Đảo Trực Tuyến Dành Cho Thanh Thiếu Niên

> **Mục tiêu:** Trang bị kiến thức, kỹ năng nhận diện và phản ứng nhanh trước các bẫy lừa đảo phổ biến trên không gian mạng hiện nay (mạng xã hội, tài chính, game, AI deepfake, tuyển dụng học sinh - sinh viên).

- **Ứng dụng Trắc nghiệm Tương tác:** [Vào Giao diện Luyện tập & Thi Trắc nghiệm Section Mở Khóa](/anti-scam/)
- **Tài liệu Chi tiết:** [Xem giáo trình tổng hợp chi tiết](file:///D:/pj/me/kien-ly.github.io/.idea/pj/anti-scam/detail-content.md)

---

## Lộ trình các Section & Bài học

Khóa học gồm 4 Section chính (Lộ trình từ Cơ bản đến Nâng cao). Học viên phải hoàn thành bài trắc nghiệm (Pass rate: $\\ge 80\\%$ tương đương tối thiểu 16/20 câu đúng) của mỗi Section để mở khóa Section tiếp theo:

### [Section 1: Nhận Thức Số & Dấu Hiệu Đỏ](/projects/anti-scam/section-1/)
- **Bài 1.1:** [Giải mã Tâm lý học Tội phạm Mạng (Social Engineering)](/projects/anti-scam/section-1/01-tam-ly-social-engineering/)
- **Bài 1.2:** [Nhận diện các Dấu hiệu Cảnh báo Đỏ (Red Flags)](/projects/anti-scam/section-1/02-nhan-dien-red-flags/)
- **Bài 1.3:** [Nhận diện Chiêu trò Giả mạo (Phishing & Smishing)](/projects/anti-scam/section-1/03-phishing-smishing/)
- **Bài kiểm tra:** [Trắc nghiệm Đánh giá Năng lực Section 1 (20 câu)](/projects/anti-scam/section-1/quiz/)

### [Section 2: Bẫy Mạng Xã Hội, Game Online & Công Nghệ AI Deepfake](/projects/anti-scam/section-2/)
- **Bài 2.1:** [Cạm bẫy trong Game Online & Thế giới Ảo](/projects/anti-scam/section-2/01-bay-game-online/)
- **Bài 2.2:** [Kỷ nguyên Deepfake AI & Kỹ thuật Lật tẩy Cuộc gọi Video Giả](/projects/anti-scam/section-2/02-deepfake-ai/)
- **Bài 2.3:** [Cạm bẫy Tình cảm & Phòng chống Tống tiền Nhạy cảm (Sextortion)](/projects/anti-scam/section-2/03-sextortion-romance-scam/)
- **Bài kiểm tra:** [Trắc nghiệm Đánh giá Năng lực Section 2 (20 câu)](/projects/anti-scam/section-2/quiz/)

### [Section 3: Lừa Đảo Tài Chính, Tiền Ảo & Tuyển Dụng Teen](/projects/anti-scam/section-3/)
- **Bài 3.1:** [Bẫy Tuyển dụng 'Việc nhẹ Lương cao' & Cộng tác viên Giật đơn hàng](/projects/anti-scam/section-3/01-tuyen-dung-viec-nhe-luong-cao/)
- **Bài 3.2:** [Hiểm họa Cho thuê, Mua bán Tài khoản Ngân hàng & Rủi ro Pháp lý](/projects/anti-scam/section-3/02-cho-thue-tai-khoan-ngan-hang/)
- **Bài 3.3:** [Bẫy App Tín dụng Đen & Đa cấp Tiền ảo Học đường](/projects/anti-scam/section-3/03-tin-dung-den-tien-ao/)
- **Bài kiểm tra:** [Trắc nghiệm Đánh giá Năng lực Section 3 (20 câu)](/projects/anti-scam/section-3/quiz/)

### [Section 4: Kỹ Thuật Phòng Thủ Số & Kịch Bản Ứng Phó Khủng Hoảng](/projects/anti-scam/section-4/)
- **Bài 4.1:** [Thiết lập Pháo đài Bảo mật Cá nhân & 2FA An toàn](/projects/anti-scam/section-4/01-phao-dai-bao-mat-ca-nhan/)
- **Bài 4.2:** [Quy trình 5 Bước Phản ứng Nhanh khi Dính Bẫy Lừa đảo](/projects/anti-scam/section-4/02-quy-trinh-phan-ung-nhanh/)
- **Bài 4.3:** [Danh bạ Khẩn cấp & Công cụ Cứu nạn Số Quốc gia](/projects/anti-scam/section-4/03-danh-ba-khan-cap-cuu-nan-so/)
- **Bài kiểm tra:** [Trắc nghiệm Đánh giá Năng lực Section 4 (20 câu)](/projects/anti-scam/section-4/quiz/)

---

## Quy tắc Vượt qua Khóa học
Học viên hoàn thành bài kiểm tra cuối mỗi Section đạt từ **80% trở lên (16/20 câu)** để mở khóa Section kế tiếp. Bạn có thể sử dụng [Ứng dụng Tương tác](/anti-scam/) để hệ thống tự động ghi nhận và cấp chứng chỉ hoàn thành.
`;

fs.writeFileSync(path.join(baseDir, '_index.md'), projectIndex, 'utf8');

// 4. Teen-friendly lessons, clear and engaging, no emoji clutter
const lessonContents = [
  // SECTION 1
  {
    secId: 1,
    folder: 'section-1',
    secTitle: 'Section 1: Nhận Thức Số & Dấu Hiệu Đỏ',
    secDescription: 'Trang bị nền tảng nhận thức số, giải mã tâm lý học tội phạm mạng và các dấu hiệu cảnh báo đỏ (Red Flags).',
    lessons: [
      {
        slug: '01-tam-ly-social-engineering',
        title: 'Bài 1.1: Giải Mã Tâm Lý Học Tội Phạm Mạng (Social Engineering)',
        description: 'Khám phá cách kẻ lừa đảo khai thác điểm yếu tâm lý của con người thay vì bẻ khóa máy tính.',
        weight: 1,
        content: `
# Bài 1.1: Giải Mã Tâm Lý Học Tội Phạm Mạng (Social Engineering)

> **Mục tiêu:** Hiểu rõ tại sao con người luôn là mắt xích yếu nhất trong chuỗi bảo mật an ninh mạng và cách tội phạm thao túng cảm xúc của thanh thiếu niên.

---

## 1. Bản chất của Social Engineering là gì?
Trong an ninh mạng, **Social Engineering (Kỹ thuật thao túng tâm lý xã hội)** là phương pháp mà kẻ tấn công đánh lừa nạn nhân để họ tự nguyện cung cấp thông tin bí mật, cấp quyền truy cập hoặc tự tay chuyển tiền cho kẻ xấu.

Kẻ gian không cần dùng các dàn siêu máy tính để giải mã mật khẩu phức tạp; chúng chỉ cần nói chuyện, thuyết phục hoặc dọa nạt để bạn **tự giao chìa khóa cho chúng**.

\`\`\`mermaid
flowchart TD
    Attack["Kẻ Tấn Công"] -->|Tác động tâm lý| Mind["Điểm Mù Cảm Xúc"]
    Mind --> Fear["Sợ hãi: Bị dọa bắt bớ, khóa nick"]
    Mind --> Greed["Tham lam: Trúng quà to, đồ game rẻ"]
    Mind --> Curiosity["Tò mò: Clip nóng, link bí mật"]
    Mind --> Urgency["Khẩn cấp: Chỉ còn 3 phút!"]
    Fear & Greed & Curiosity & Urgency --> Action["Nạn nhân tự tay chuyển tiền / nạp OTP"]
\`\`\`

---

## 2. Các đòn bẩy tâm lý phổ biến đánh vào Gen Z

### A. Nỗi sợ hãi & Uy quyền giả mạo (Fear & Authority)
- Giả danh thầy cô, ban giám hiệu: *"Học sinh chưa nộp học phí hoặc vi phạm quy chế thi, click link xác minh ngay nếu không sẽ bị đình chỉ học"*.
- Giả danh công an, tòa án: *"Tài khoản của bạn liên quan đến đường dây rửa tiền xuyên quốc gia, chuyển tiền vào tài khoản tạm giữ để thanh tra"*.
- **Tâm lý nạn nhân:** Học sinh sợ ảnh hưởng học bạ, sợ cha mẹ biết, sợ bị đi tù nên vội vàng làm theo mọi yêu cầu.

### B. Lòng tham & Bẫy quà tặng (Greed & Free Gifts)
- Thông báo trúng thưởng ngẫu nhiên iPhone 16 Pro Max, xe máy SH, chuyến du lịch nước ngoài.
- Yêu cầu: Đóng "phí xuất kho", "thuế trước bạ" 500k - 2 triệu đồng để nhận hàng trị giá hàng chục triệu.

### C. Cảm giác khẩn cấp giả tạo (False Urgency)
- Đếm ngược đồng hồ tích tắc: *"Tài khoản sẽ bị vô hiệu hóa trong 15 phút"*, *"Chỉ còn 3 suất học bổng duy nhất"*.
- **Mục đích:** Khiến não bộ rơi vào trạng thái hoảng loạn và hành động theo bản năng, không kịp bàn bạc hay hỏi ý kiến người khác.

---

## 3. Bài học thực hành & Nguyên tắc phòng vệ
- **Quy tắc 5 giây:** Khi nhận được bất kỳ tin nhắn giật gân nào, hãy dừng lại hít thở sâu 5 giây. Không nhấp link, không chuyển tiền ngay lập tức.
- **Kiểm chứng độc lập:** Gọi điện trực tiếp bằng sóng điện thoại SIM thông thường (không gọi qua app mạng xã hội) cho người gửi để xác minh.
`
      },
      {
        slug: '02-nhan-dien-red-flags',
        title: 'Bài 1.2: Nhận Diện Các Dấu Hiệu Cảnh Báo Đỏ (Red Flags)',
        description: 'Bộ quy tắc thực chiến giúp phát hiện tin nhắn, email và đường link lừa đảo chỉ trong vài giây.',
        weight: 2,
        content: `
# Bài 1.2: Nhận Diện Các Dấu Hiệu Cảnh Báo Đỏ (Red Flags)

> **Mục tiêu:** Nắm vững bảng kiểm tra (checklist) các dấu hiệu bất thường trong giao tiếp mạng để phản xạ nhận biết lừa đảo tức thì.

---

## 1. Bảng kiểm tra Dấu hiệu Đỏ (Red Flags Checklist)

| Dấu hiệu | Biểu hiện cụ thể | Mức độ rủi ro |
|---|---|---|
| **Thời gian gấp gáp** | *"Khẩn cấp", "Chỉ còn 5 phút", "Hủy trong 24h"* | Rất cao |
| **Tên miền mập mờ** | Chứa đuôi lạ (\`.xyz\`, \`.top\`, \`.cfd\`), sai chính tả | Cực kỳ nguy hiểm |
| **Đòi hỏi thông tin nhạy cảm** | Yêu cầu nhập mật khẩu, mã OTP, số thẻ ngân hàng, CCCD | Tuyệt đối tránh |
| **Lời hứa phi thực tế** | *"Việc nhẹ lương 500k/ngày", "Nạp 1 được 10"* | Lừa đảo chắc chắn |
| **Lỗi chính tả & dịch thuật** | Văn phong ngô nghê, câu cú lủng củng | Đáng ngờ |

---

## 2. Kỹ thuật mạo danh tên miền (Typosquatting)

Kẻ xấu đăng ký những tên miền có bề ngoài gần như giống hệt các thương hiệu nổi tiếng để đánh lừa mắt thường của người dùng:

- \`g00gle.com\` thay vì \`google.com\` (dùng số 0 thay cho chữ O).
- \`vietcombank-login.xyz\` thay vì \`vietcombank.com.vn\`.
- \`facebook-security-verify.top\` thay vì \`facebook.com\`.

> [!WARNING]
> Ký hiệu **ổ khóa xanh (HTTPS)** trên thanh địa chỉ chỉ chứng minh đường truyền dữ liệu được mã hóa bảo mật, **KHÔNG CHỨNG MINH** website đó là uy tín hay an toàn. Kẻ lừa đảo hoàn toàn có thể cài chứng chỉ HTTPS miễn phí cho trang web lừa đảo của chúng!

---

## 3. Cách tra cứu độ an toàn của đường link
Trước khi nhấp vào một liên kết đáng ngờ:
1. Sao chép địa chỉ liên kết (không nhấp trực tiếp).
2. Dán vào công cụ kiểm tra của Dự án Chống Lừa Đảo: [chongluadao.vn](https://chongluadao.vn).
3. Tra cứu tại Cổng cảnh báo an toàn thông tin quốc gia: [canhbao.ncsc.gov.vn](https://canhbao.ncsc.gov.vn).
`
      },
      {
        slug: '03-phishing-smishing',
        title: 'Bài 1.3: Nhận Diện Chiêu Trò Giả Mạo (Phishing & Smishing)',
        description: 'Bóc trần kỹ thuật tấn công câu cá qua liên kết web và trạm phát sóng BTS giả mạo tin nhắn ngân hàng.',
        weight: 3,
        content: `
# Bài 1.3: Nhận Diện Chiêu Trò Giả Mạo (Phishing & Smishing)

> **Mục tiêu:** Phân biệt Phishing, Smishing và nắm rõ thủ đoạn dùng trạm BTS giả mạo để không bao giờ bị sập bẫy tin nhắn lừa đảo.

---

## 1. Phishing (Tấn công câu cá) hoạt động như thế nào?

\`\`\`mermaid
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
\`\`\`

---

## 2. Smishing & Hiểm họa từ Trạm BTS giả mạo

### Trạm BTS giả là gì?
- Kẻ gian mang theo thiết bị phát sóng di động giả mạo (Fake BTS) di chuyển bằng ba lô, xe máy hoặc ô tô.
- Thiết bị này phát công suất mạnh đè sóng của nhà mạng chính thức (Viettel, VinaPhone, MobiFone), ép điện thoại của người dân gần đó kết nối vào trạm giả.
- Khi đã kết nối, kẻ gian gửi hàng loạt SMS chèn thẳng vào luồng tin nhắn chính thức của ngân hàng (Brandname Vietcombank, Techcombank, MB, Viettel...).

> [!IMPORTANT]
> **Quy tắc bất di bất dịch:**
> Dù tin nhắn SMS nằm chung luồng với tin nhắn thật của ngân hàng từ trước đến nay, **TUYỆT ĐỐI KHÔNG BAO GIỜ** nhấp vào link kèm trong SMS. Ngân hàng tại Việt Nam hiện đã ngừng toàn bộ việc đính kèm liên kết web vào tin nhắn SMS thông báo.
`
      }
    ]
  },

  // SECTION 2
  {
    secId: 2,
    folder: 'section-2',
    secTitle: 'Section 2: Bẫy Mạng Xã Hội, Game Online & AI Deepfake',
    secDescription: 'Bảo vệ tài khoản game, nhận diện bẫy video/voice clone Deepfake và phòng chống tống tiền nhạy cảm (Sextortion).',
    lessons: [
      {
        slug: '01-bay-game-online',
        title: 'Bài 2.1: Cạm Bẫy Trong Game Online & Thế Giới Ảo',
        description: 'Vạch trần chiêu bài nạp thẻ lậu, tool hack mod skin chứa trojan và bẫy cướp tài khoản Roblox, Liên Quân.',
        weight: 1,
        content: `
# Bài 2.1: Cạm Bẫy Trong Game Online & Thế Giới Ảo

> **Mục tiêu:** Giúp game thủ trẻ tuổi bảo vệ an toàn tài sản ảo, nick game và không trở thành nạn nhân của mã độc Info-stealer.

---

## 1. Bẫy Nạp Thẻ Lậu / Chiết khấu 90%
- Kẻ xấu lập website: \`napgame-giare.com\`, quảng cáo nạp 50k nhận 50.000 quân huy / robux.
- Khi truy cập, web yêu cầu: "Đăng nhập bằng Facebook hoặc Google để nhận quà".
- Khi bạn nhập email và mật khẩu, giao diện hiện thông báo "Lỗi hệ thống, vui lòng thử lại sau 24h". Thực chất, tài khoản Facebook cá nhân của bạn đã bị kẻ gian chiếm quyền đăng nhập.

---

## 2. Phần mềm Hack / Mod Game & Mã Độc Info-stealer
- Các video trên YouTube / TikTok hướng dẫn: *"Tải bản mod menu bất tử, skin súng VIP, link download dưới mô tả"*.
- File tải về thường là file nén \`.zip\` chứa file thực thi \`.exe\` hoặc file script \`.bat\`.
- Khi bạn bấm chạy file:
  - Máy tính không hề có mod game nào được cài đặt.
  - Một tiến trình ngầm (Info-stealer như RedLine, Lumma Stealer) sẽ tự động trích xuất toàn bộ:
    1. Cookie đăng nhập của Chrome/Edge/Cốc Cốc.
    2. Toàn bộ mật khẩu lưu tự động trong trình duyệt.
    3. Mã token ứng dụng Discord, Telegram, Telegram Session.
    4. Khóa bí mật ví tiền ảo (Metamask, Phantom) nếu có.

---

## 3. Lừa đảo Giao dịch Account Game & "Trung gian ma"
- **Kịch bản:** Kẻ mua đề nghị giao dịch qua một "Admin Group uy tín" có 50.000 follow.
- Thực chất, admin đó là tài khoản clone do chính kẻ mua tạo ra hoặc đi thuê lại. Sau khi bạn chuyển nhượng thông tin acc cho trung gian, cả hai nick sẽ chặn bạn ngay tức khắc.
- **Quy tắc an toàn:** Không mua bán acc game trái phép. Nhà phát hành game có quyền khóa vĩnh viễn các tài khoản có hành vi chuyển nhượng thông tin chủ sở hữu.
`
      },
      {
        slug: '02-deepfake-ai',
        title: 'Bài 2.2: Kỷ Nguyên Deepfake AI & Kỹ Thuật Lật Tẩy Cuộc Gọi Video Giả',
        description: 'Giải mã công nghệ AI hoán đổi khuôn mặt và giả giọng nói, cùng các mẹo bẻ gãy cuộc gọi lừa đảo.',
        weight: 2,
        content: `
# Bài 2.2: Kỷ Nguyên Deepfake AI & Kỹ Thuật Lật Tẩy Cuộc Gọi Video Giả

> **Mục tiêu:** Hiểu rõ cách thức hoạt động của Deepfake khuôn mặt và giọng nói, làm chủ phản xạ vạch trần kẻ mạo danh người thân.

---

## 1. Công nghệ Deepfake hoạt động như thế nào?
- **AI Face Swap (Hoán đổi khuôn mặt):** Kẻ gian thu thập hình ảnh của người thân bạn từ Facebook/Instagram công khai, sau đó dùng mô hình học sâu để ghép khuôn mặt đó lên mặt kẻ lừa đảo trong lúc gọi video trực tiếp.
- **AI Voice Cloning (Giả mạo giọng nói):** Chỉ cần một đoạn clip âm thanh từ 3-5 giây trên TikTok hay Reel, công cụ AI có thể đọc bất kỳ văn bản nào bằng chính chất giọng, ngữ điệu và hơi thở của nạn nhân.

\`\`\`mermaid
flowchart LR
    Target["Ảnh/Clip Người Thân trên MXH"] --> Model["Mô hình AI Deepfake"]
    Attacker["Kẻ lừa đảo gọi Video Call"] --> Model
    Model --> FakeVideo["Video Call mạo danh: Giọng nói + Mặt người thân"]
    FakeVideo --> Victim["Nạn nhân: Nhận cuộc gọi xin tiền khẩn cấp"]
\`\`\`

---

## 2. Các dấu hiệu lật tẩy video call Deepfake
1. **Thời lượng cuộc gọi rất ngắn:** Kẻ gian chỉ gọi từ 5 đến 10 giây rồi cố tình tắt máy với lý do: *"Mạng yếu quá", "Sóng bệnh viện chập chờn, nhắn tin số tài khoản nhé"*.
2. **Khuôn mặt có viền mờ nhòe:** Khi người gọi cử động đầu, vùng viền khuôn mặt thường có hiện tượng bóng mờ, nhòe pixel.
3. **Cử động mắt và miệng thiếu tự nhiên:** Mắt ít chớp, hoặc chớp giật cục; khẩu hình môi không khớp chính xác với âm thanh phát ra.

---

## 3. Các mẹo thực chiến bẻ gãy Deepfake tại chỗ
Nếu bạn nhận được cuộc gọi video khẩn cấp từ bạn bè xin tiền:
- **Hành động 1:** Yêu cầu họ giơ bàn tay vẫy qua vẫy lại trước khuôn mặt. Thuật toán AI Deepfake sẽ không xử lý kịp lớp che phủ và làm khuôn mặt bị biến dạng hoặc lộ mặt thật của kẻ gian.
- **Hành động 2:** Yêu cầu quay nghiêng góc đầu 90 độ sang trái hoặc phải.
- **Hành động 3:** Hỏi một câu hỏi bí mật về kỷ niệm riêng tư mà người ngoài không thể biết: *"Hôm nọ đi ăn ốc với nhau ai trả tiền?", "Thầy chủ nhiệm lớp 9 tên gì?"*.
`
      },
      {
        slug: '03-sextortion-romance-scam',
        title: 'Bài 2.3: Cạm Bẫy Tình Cảm & Phòng Chống Tống Tiền Nhạy Cảm (Sextortion)',
        description: 'Bảo vệ thanh thiếu niên trước các bẫy tống tiền hình ảnh nhạy cảm và đường dây lừa tình lừa tiền qua mạng.',
        weight: 3,
        content: `
# Bài 2.3: Cạm Bẫy Tình Cảm & Phòng Chống Tống Tiền Nhạy Cảm (Sextortion)

> **Mục tiêu:** Cảnh báo nguy cơ bị xâm hại hình ảnh nhạy cảm, nắm vững quy trình xử lý khủng hoảng để bảo vệ an toàn tính mạng và tinh thần.

---

## 1. Kịch bản Tống tiền Tình dục (Sextortion) diễn ra thế nào?

1. **Giai đoạn tiếp cận:** Kẻ xấu dùng tài khoản ảo đăng ảnh đẹp, chủ động nhắn tin làm quen trên Instagram, Snapchat, Facebook, Tinder.
2. **Giai đoạn tạo niềm tin lãng mạn:** Kẻ xấu nhắn tin trò chuyện ngọt ngào mỗi ngày, chia sẻ các câu chuyện bí mật để khơi gợi sự tin tưởng sâu sắc của bạn.
3. **Giai đoạn dẫn dụ:** Kẻ xấu đề nghị gọi video call riêng tư hoặc gửi ảnh "khoe body", ảnh nhạy cảm của kẻ xấu trước (thực chất là video/ảnh ăn cắp trên mạng) rồi dụ bạn gửi lại ảnh khỏa thân (nudes) của bạn.
4. **Giai đoạn tống tiền (Sextortion):** Ngay sau khi bạn gửi, kẻ xấu gửi lại ảnh chụp màn hình danh bạ bạn bè, tài khoản Facebook của cha mẹ, thầy cô của bạn và đe dọa: *"Chuyển 5 triệu ngay trong 30 phút, nếu không toàn bộ ảnh này sẽ được gửi cho trường học và bố mẹ bạn"*.

---

## 2. Hướng dẫn Ứng phó Sống còn khi rơi vào bẫy Sextortion

> [!CAUTION]
> **1. TUYỆT ĐỐI KHÔNG CHUYỂN TIỀN:**
> Nếu bạn chuyển 1 lần, kẻ xấu sẽ biết bạn quá sợ hãi và sẽ tiếp tục đòi 10 triệu, 50 triệu và không bao giờ dừng lại!

- **2. Chụp màn hình bằng chứng:** Lưu lại toàn bộ tin nhắn, tài khoản kẻ xấu, số tài khoản ngân hàng chúng cung cấp.
- **3. Chặn liên lạc ngay:** Cắt đứt mọi kênh giao tiếp với kẻ xấu.
- **4. Sử dụng công cụ Take It Down:**
  - Truy cập trang web chính thức của tổ chức bảo vệ trẻ em quốc tế: [takeitdown.ncmec.org](https://takeitdown.ncmec.org).
  - Nền tảng này tạo mã băm (hash) kỹ thuật số cho bức ảnh nhạy cảm và tự động ngăn chặn nó không bao giờ được tải lên Facebook, Instagram, TikTok...
- **5. Lên tiếng tìm sự hỗ trợ:** Đừng giấu một mình trong lo lắng. Gọi ngay Tổng đài Quốc gia Bảo vệ Trẻ em **111** để được tư vấn tâm lý và hỗ trợ pháp lý kịp thời.
`
      }
    ]
  },

  // SECTION 3
  {
    secId: 3,
    folder: 'section-3',
    secTitle: 'Section 3: Lừa Đảo Tài Chính, Tiền Ảo & Tuyển Dụng Teen',
    secDescription: 'Vạch trần cạm bẫy việc nhẹ lương cao, rủi ro pháp lý khi mở thẻ hộ và bẫy tín dụng đen học đường.',
    lessons: [
      {
        slug: '01-tuyen-dung-viec-nhe-luong-cao',
        title: "Bài 3.1: Bẫy Tuyển Dụng 'Việc Nhẹ Lương Cao' & Cộng Tác Viên Giật Đơn",
        description: 'Giải mã chiêu trò lừa nạp tiền giật đơn hàng Shopee/Tiki và bẫy tuyển mẫu ảnh nhí học sinh.',
        weight: 1,
        content: `
# Bài 3.1: Bẫy Tuyển Dụng 'Việc Nhẹ Lương Cao' & Cộng Tác Viên Giật Đơn

> **Mục tiêu:** Nhận diện các bẫy tuyển dụng việc làm thêm trá hình nhắm vào học sinh, sinh viên thiếu kinh nghiệm.

---

## 1. Kịch bản bẫy Giật đơn hàng / Cộng tác viên Shopee, TikTok Shop

\`\`\`mermaid
flowchart TD
    Step1["Tuyển dụng: CTV chốt đơn tại nhà, ngày 500k"] --> Step2["Đơn 1: Nạp 100k -> Nhận về 130k (Rút tiền thành công)"]
    Step2 --> Step3["Đơn 2: Nạp 1 triệu -> Nhận về 1.3 triệu (Tạo lòng tin)"]
    Step3 --> Step4["Đơn lớn: Bắt nạp 20 triệu -> Hệ thống báo 'Lỗi cú pháp'"]
    Step4 --> Step5["Ép nạp tiếp 20 triệu để 'Mở đóng băng ví' -> Chặn liên lạc"]
\`\`\`

- **Nguyên lý lừa đảo:** Kẻ xấu chấp nhận bỏ ra vài trăm nghìn tiền mồi nhử ban đầu để xây dựng lòng tin tuyệt đối của bạn. Khi bạn đã tin rằng đây là cơ hội kiếm tiền dễ dàng, chúng sẽ tung cú chốt hạ với số tiền hàng chục triệu đồng.

---

## 2. Bẫy Tuyển "Mẫu ảnh học sinh / Lookbook Teen"
- Kẻ xấu đăng bài tuyển mẫu ảnh học sinh chụp quảng cáo quần áo với thù lao 2-5 triệu/buổi.
- Trong buổi phỏng vấn qua video call:
  - Yêu cầu ứng viên cởi bỏ trang phục để "kiểm tra số đo 3 vòng" và "độ phù hợp của làn da".
  - Kẻ xấu lén quay lại màn hình video call và dùng video đó để tống tiền nạn nhân.

---

## 3. Dấu hiệu nhận diện công việc tuyển dụng lừa đảo
- Không yêu cầu kinh nghiệm, kỹ năng nhưng cam kết thu nhập cao bất thường.
- Yêu cầu ứng viên nộp các loại phí: **Tiền cọc giữ chỗ, phí tài liệu, phí mua đơn hàng**.
- Toàn bộ giao dịch làm việc và hướng dẫn chuyển qua nhóm kín **Telegram**.
`
      },
      {
        slug: '02-cho-thue-tai-khoan-ngan-hang',
        title: 'Bài 3.2: Hiểm Họa Cho Thuê, Mua Bán Tài Khoản Ngân Hàng & Rủi Ro Pháp Lý',
        description: 'Hiểu rõ trách nhiệm hình sự khi vô tình trở thành mắt xích rửa tiền cho tội phạm mạng.',
        weight: 2,
        content: `
# Bài 3.2: Hiểm Họa Cho Thuê, Mua Bán Tài Khoản Ngân Hàng & Rủi Ro Pháp Lý

> **Mục tiêu:** Cảnh báo rõ về trách nhiệm pháp lý khi đứng tên mở tài khoản ngân hàng hoặc bán thẻ cho người khác.

---

## 1. Chiêu bài mua bán tài khoản ngân hàng học đường
- Kẻ gian dụ dỗ học sinh vừa đủ 18 tuổi hoặc có CCCD: *"Cần mở tài khoản ngân hàng online để làm marketing, trả công 500k - 1 triệu đồng/tài khoản"*.
- Nhiều bạn học sinh nghĩ rằng: *"Tài khoản đứng tên mình nhưng mình không có tiền trong đó thì mất mát gì đâu"*, và rủ rê cả bạn bè trong lớp cùng mở thẻ để kiếm tiền tiêu vặt.

---

## 2. Số phận của các tài khoản ngân hàng đó đi về đâu?
Kẻ xấu gom hàng trăm tài khoản ngân hàng của học sinh, sinh viên để làm:
1. **Tài khoản nhận tiền lừa đảo:** Nhận tiền từ các vụ lừa đảo giật đơn, bắt cóc online, tống tiền.
2. **Kênh rửa tiền xuyên biên giới:** Chuyển tiền từ các đường dây đánh bạc online ra nước ngoài.

\`\`\`mermaid
flowchart LR
    Victim["Nạn nhân bị lừa"] -->|Chuyển tiền vào| Bank["Tài khoản đứng tên BẠN"]
    Bank -->|Kẻ gian tẩu tán sang| Crypto["Tiền ảo / Đánh bạc nước ngoài"]
    Police["Cơ quan Công An điều tra"] -->|Truy vết STK| You["Triệu tập BẠN (Chủ tài khoản)"]
\`\`\`

---

## 3. Chế tài Xử phạt & Trách nhiệm Hình sự
- Theo **Điều 291 Bộ luật Hình sự Việt Nam**: Hành vi thu thập, tàng trữ, trao đổi, mua bán, công khai hóa trái phép thông tin về tài khoản ngân hàng có thể bị phạt tiền đến 500 triệu đồng hoặc **phạt tù từ 3 tháng đến 7 năm**.
- Bạn sẽ bị phong tỏa toàn bộ tài khoản ngân hàng trong tương lai, bị ghi vào danh sách đen của ngành tài chính (khó vay vốn, mở thẻ sau này) và phải đối mặt với án phạt tù với vai trò đồng phạm lừa đảo.
`
      },
      {
        slug: '03-tin-dung-den-tien-ao',
        title: 'Bài 3.3: Bẫy App Tín Dụng Đen & Đa Cấp Tiền Ảo Học Đường',
        description: 'Vạch trần phương thức đòi nợ khủng bố danh bạ của app tín dụng đen và các hội nhóm sàn lùa gà.',
        weight: 3,
        content: `
# Bài 3.3: Bẫy App Tín Dụng Đen & Đa Cấp Tiền Ảo Học Đường

> **Mục tiêu:** Phòng chống cạm bẫy vay nặng lãi qua app di động và nhận biết các sàn đầu tư lừa đảo đội lốt tài chính công nghệ.

---

## 1. Ma trận Tín dụng đen qua App di động
- Các app vay tiền nhanh trực tuyến không cần thế chấp tài sản, thủ tục đơn giản chỉ cần tải app và chụp ảnh CCCD.
- **Bẫy cấp quyền (App Permissions):** App bắt buộc người dùng cấp quyền truy cập:
  - Toàn bộ danh bạ điện thoại (Contacts).
  - Album ảnh và video (Photos).
  - Vị trí GPS thời gian thực.
- **Phương thức siết nợ áp lực:**
  - Vay 2 triệu thực nhận 1.2 triệu (trừ phí dịch vụ), sau 7 ngày tiền lãi và phạt lên thành 5 triệu đồng (lãi suất tương đương 1.000% - 2.000%/năm).
  - Khi nạn nhân không kịp trả, hệ thống bot tự động gửi tin nhắn, gọi điện liên tục cho thầy cô, cha mẹ, bạn bè trong danh bạ. Chúng ghép ảnh chân dung nạn nhân vào các hình ảnh phản cảm để bôi nhọ trên mạng xã hội.

---

## 2. Bẫy Tiền ảo & Sàn quyền chọn nhị phân (BO)
- Các hội nhóm Telegram "Đầu tư tài chính thế hệ mới", "Kéo vốn sinh lời 30%/tháng".
- Các "chuyên gia" tự xưng liên tục đăng tải hình ảnh chụp cùng xế hộp, cọc tiền đô la, đi du lịch nghỉ dưỡng sang chảnh.
- Thực chất đây là mô hình Ponzi: Tiền gửi vào sàn ảo hoàn toàn không được đầu tư mà nằm trong túi của chủ sàn. Đến khi gom đủ số tiền lớn, sàn sẽ đột ngột "bảo trì hệ thống" rồi biến mất.
`
      }
    ]
  },

  // SECTION 4
  {
    secId: 4,
    folder: 'section-4',
    secTitle: 'Section 4: Kỹ Thuật Phòng Thủ Số & Kịch Bản Ứng Phó Khủng Hoảng',
    secDescription: 'Thiết lập bảo mật cá nhân, quy trình phản ứng nhanh khi bị lừa và danh bạ đường dây nóng quốc gia.',
    lessons: [
      {
        slug: '01-phao-dai-bao-mat-ca-nhan',
        title: 'Bài 4.1: Thiết Lập Pháo Đài Bảo Mật Cá Nhân & 2FA An Toàn',
        description: 'Cách đặt mật khẩu chuẩn passphrase và chuyển đổi từ 2FA qua SMS sang Authenticator App.',
        weight: 1,
        content: `
# Bài 4.1: Thiết Lập Pháo Đài Bảo Mật Cá Nhân & 2FA An Toàn

> **Mục tiêu:** Xây dựng hàng rào bảo mật vững chắc cho danh tính số của bạn trên mọi thiết bị và dịch vụ trực tuyến.

---

## 1. Nghệ thuật đặt Mật khẩu: Chuyển sang Passphrase
- Không sử dụng mật khẩu ngắn hoặc chứa thông tin cá nhân: ngày sinh, số điện thoại, tên crush.
- **Khái niệm Passphrase:** Ghép một chuỗi các từ có ý nghĩa thành một câu dài $\\ge 14$ ký tự, có dấu gạch nối hoặc ký tự đặc biệt.
  - *Ví dụ kém an toàn:* \`Kien2008@\`
  - *Ví dụ cực mạnh:* \`ToiThichAnPhoBo_HaNoi_VaoMuaDong#99\`

---

## 2. Tại sao 2FA qua SMS không còn an toàn tuyệt đối?
- **Tấn công Hoán đổi SIM (SIM Swap):** Kẻ gian dùng giấy tờ giả ra điểm giao dịch nhà mạng báo mất SIM để làm lại SIM mới mang số của bạn. Ngay sau khi SIM mới kích hoạt, SIM trong máy bạn mất sóng và toàn bộ mã OTP SMS chuyển thẳng vào máy kẻ gian.
- **Giải pháp:** Sử dụng ứng dụng tạo mã xác thực 2 yếu tố dựa trên thời gian (TOTP) như **Google Authenticator**, **Microsoft Authenticator** hoặc Khóa bảo mật vật lý (FIDO2 YubiKey).

\`\`\`mermaid
flowchart TD
    Old["Bảo mật cũ: Password + SMS OTP"] -->|Dễ bị dính SIM swap, BTS giả| Risk["Rủi ro lộ tài khoản"]
    New["Bảo mật hiện đại: Passphrase + Authenticator App"] -->|Mã sinh trực tiếp trên chip máy| Safe["An toàn tối đa"]
\`\`\`
`
      },
      {
        slug: '02-quy-trinh-phan-ung-nhanh',
        title: 'Bài 4.2: Quy Trình 5 Bước Phản Ứng Nhanh Khi Dính Bẫy Lừa Đảo',
        description: 'Hành động chuẩn xác từng giây khi lỡ chuyển tiền hoặc bấm vào đường link cài mã độc.',
        weight: 2,
        content: `
# Bài 4.2: Quy Trình 5 Bước Phản Ứng Nhanh Khi Dính Bẫy Lừa Đảo

> **Mục tiêu:** Nắm vững kịch bản ứng phó sự cố (Incident Response) để giảm thiểu tối đa thiệt hại tài sản và tâm lý.

---

## 1. Quy trình phản ứng khẩn cấp 5 bước

\`\`\`mermaid
flowchart LR
    Step1["1. Ngắt Mạng Ngay"] --> Step2["2. Khóa Khẩn Cấp TK/Thẻ"]
    Step2 --> Step3["3. Lưu Giữ Bằng Chứng"]
    Step3 --> Step4["4. Đổi Pass từ Máy Sạch"]
    Step4 --> Step5["5. Trình Báo & Nhờ Hỗ Trợ"]
\`\`\`

1. **Bước 1: Ngắt kết nối mạng ngay lập tức:**
   - Tắt Wifi và ngắt 4G/5G trên thiết bị nếu nghi ngờ vừa tải file có mã độc hoặc vô tình bấm vào liên kết lạ. Việc này ngăn chặn mã độc gửi dữ liệu và token đăng nhập về máy chủ của kẻ tấn công.
2. **Bước 2: Khóa khẩn cấp thẻ và tài khoản ngân hàng:**
   - Mở app ngân hàng khóa tính năng giao dịch trực tuyến hoặc gọi hotline tổng đài ngân hàng yêu cầu phong tỏa tài khoản khẩn cấp.
3. **Bước 3: Thu thập và bảo lưu chứng cứ:**
   - Chụp ảnh màn hình toàn bộ tin nhắn, trang cá nhân của kẻ xấu, số điện thoại, số tài khoản nhận tiền và biên lai chuyển khoản. Tuyệt đối **không xóa tin nhắn** vì đây là bằng chứng pháp lý quan trọng.
4. **Bước 4: Đổi mật khẩu từ một thiết bị sạch khác:**
   - Dùng một điện thoại/máy tính an toàn khác để đổi mật khẩu email gốc và chọn tính năng: **"Đăng xuất khỏi tất cả các thiết bị khác"**.
5. **Bước 5: Lên tiếng tìm kiếm trợ giúp:**
   - Nói chuyện ngay với người lớn trong gia đình, thầy cô giáo và làm đơn trình báo tại cơ quan Công an xã/phường/quận gần nhất.
`
      },
      {
        slug: '03-danh-ba-khan-cap-cuu-nan-so',
        title: 'Bài 4.3: Danh Bạ Khẩn Cấp & Công Cụ Cứu Nạn Số Quốc Gia',
        description: 'Tổng hợp đường dây nóng, cổng cảnh báo an ninh mạng chính thống tại Việt Nam.',
        weight: 3,
        content: `
# Bài 4.3: Danh Bạ Khẩn Cấp & Công Cụ Cứu Nạn Số Quốc Gia

> **Mục tiêu:** Cung cấp danh bạ cứu hộ số khi gặp các sự cố lừa đảo, đe dọa tống tiền hoặc xâm hại trên không gian mạng.

---

## 1. Danh bạ Tổng đài Hỗ trợ Khẩn cấp tại Việt Nam

| Đầu số / Nền tảng | Chức năng hỗ trợ | Chi phí |
|---|---|---|
| **Tổng đài 156** | Tiếp nhận phản ánh cuộc gọi rác, tin nhắn rác, cuộc gọi lừa đảo | Miễn phí |
| **Tổng đài 111** | Tổng đài Quốc gia Bảo vệ Trẻ em (can thiệp xâm hại, bạo lực mạng, tống tiền nudes) | Miễn phí 24/7 |
| **Tổng đài 113** | Cơ quan Công an tiếp nhận tố giác tội phạm an ninh trật tự | Miễn cước |

---

## 2. Cổng thông tin và Tiện ích An toàn Mạng

- **Cổng Cảnh báo An toàn Thông tin Quốc gia:** [canhbao.ncsc.gov.vn](https://canhbao.ncsc.gov.vn) (Trung tâm Giám sát an toàn không gian mạng quốc gia NCSC - Bộ TT&TT).
- **Dự án Chống Lừa Đảo:** [chongluadao.vn](https://chongluadao.vn) (Cộng đồng an ninh mạng Việt Nam hỗ trợ cảnh báo website lừa đảo, giả mạo).
- **Take It Down (Hỗ trợ gỡ bỏ ảnh nhạy cảm):** [takeitdown.ncmec.org](https://takeitdown.ncmec.org).
`
      }
    ]
  }
];

// 5. Generate lesson pages and quizzes for each section
lessonContents.forEach(secConfig => {
  const secDir = path.join(baseDir, secConfig.folder);
  fs.mkdirSync(secDir, { recursive: true });

  // Section index
  const secIndexContent = `---
title: ${JSON.stringify(secConfig.secTitle)}
description: ${JSON.stringify(secConfig.secDescription)}
url: "/projects/anti-scam/${secConfig.folder}/"
showToc: true
weight: ${secConfig.secId}
---

# ${secConfig.secTitle}

> ${secConfig.secDescription}

## Danh sách bài học:
${secConfig.lessons.map(l => `- [**${l.title}**](/projects/anti-scam/${secConfig.folder}/${l.slug}/): ${l.description}`).join('\n')}

---

## Bài kiểm tra đánh giá Section ${secConfig.secId}:
Sau khi hoàn thành tất cả các bài học lý thuyết trên, học viên làm bài kiểm tra trắc nghiệm 20 câu:
- [**Làm Bài Kiểm Tra Trắc Nghiệm Section ${secConfig.secId} (20 câu hỏi - Pass rate $\\ge 80\\%$)**](/projects/anti-scam/${secConfig.folder}/quiz/)
- [**Làm trên Ứng dụng Tương tác Trực quan có Lưu Tiến độ**](/anti-scam/)
`;

  fs.writeFileSync(path.join(secDir, '_index.md'), secIndexContent, 'utf8');

  // Lessons
  secConfig.lessons.forEach(lesson => {
    const lessonFrontmatter = `---
title: ${JSON.stringify(lesson.title)}
description: ${JSON.stringify(lesson.description)}
url: "/projects/anti-scam/${secConfig.folder}/${lesson.slug}/"
weight: ${lesson.weight}
showToc: true
TocOpen: true
---

`;
    fs.writeFileSync(path.join(secDir, `${lesson.slug}.md`), lessonFrontmatter + lesson.content.trim() + '\n', 'utf8');
  });

  // Quiz page for this section
  const sectionQuestions = courseData.sections.find(s => s.id === secConfig.secId)?.questions || [];
  let quizMd = `---
title: ${JSON.stringify(`Bài Kiểm Tra Trắc Nghiệm: ${secConfig.secTitle} (20 Câu)`)}
description: ${JSON.stringify(`Bài test trắc nghiệm 20 câu hỏi tình huống thực tế cho ${secConfig.secTitle}. Điểm đạt yêu cầu: 16/20 (80%).`)}
url: "/projects/anti-scam/${secConfig.folder}/quiz/"
weight: 99
showToc: true
---

# Bài Kiểm Tra Trắc Nghiệm: ${secConfig.secTitle}

> **Quy định làm bài:**
> - Số lượng câu hỏi: **20 câu hỏi tình huống**.
> - Điểm đạt yêu cầu: **Tối thiểu 16/20 câu đúng (80%)** để đủ điều kiện mở khóa Section tiếp theo.
> - [**Mở Ứng Dụng Làm Bài Test Tự Động Chấm Điểm & Lưu Tiến Độ Vào Trình Duyệt**](/anti-scam/)

---

## Danh sách 20 câu hỏi trắc nghiệm & Tình huống

`;

  sectionQuestions.forEach((q, idx) => {
    quizMd += `### Câu ${idx + 1}: ${q.prompt}\n\n`;
    q.options.forEach(opt => {
      quizMd += `- **${opt.key}.** ${opt.text}\n`;
    });
    quizMd += `\n<details>\n<summary><b>Xem đáp án & Giải thích</b></summary>\n\n> **Đáp án đúng: ${q.answer}**\n</details>\n\n---\n\n`;
  });

  quizMd += `
## Hoàn thành bài test
Nếu bạn làm trên ứng dụng [Hệ Thống Trắc Nghiệm Tương Tác](/anti-scam/), hệ thống sẽ tự động chấm điểm, highlight đáp án và mở khóa Section kế tiếp cho bạn!
`;

  fs.writeFileSync(path.join(secDir, 'quiz.md'), quizMd, 'utf8');
});

console.log('Successfully regenerated entire Anti-Scam project: teen-friendly voice, minimal emoji.');
