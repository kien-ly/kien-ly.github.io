import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const detailContent = `# GIÁO TRÌNH CHI TIẾT: KỸ NĂNG PHÒNG CHỐNG LỪA ĐẢO TRỰC TUYẾN DÀNH CHO THANH THIẾU NIÊN (CYBER SAFETY & DEFENSE FOR TEENS)

> **Mục tiêu giáo trình:** Cung cấp hệ thống kiến thức toàn diện, phân tích sâu về kỹ thuật, tâm lý học tội phạm mạng, bóc tách các kịch bản lừa đảo nhắm vào học sinh, sinh viên và thanh thiếu niên (Gen Z). Đồng thời trang bị các kỹ thuật phòng thủ cá nhân, cách bảo vệ danh tính số và quy trình ứng phó khủng hoảng khi xảy ra sự cố.
>
> **Quy chuẩn kiểm tra:** Mỗi Section có bài kiểm tra trắc nghiệm 20 câu hỏi tình huống thực tế. Điểm đạt yêu cầu: $\\ge 80\\%$ (tối thiểu 16/20 câu đúng) mới được mở khóa Section tiếp theo.

---

## 📌 LỘ TRÌNH TỔNG QUAN KHÓA HỌC

\`\`\`mermaid
flowchart TD
    S1["Section 1: Nhận thức số & Dấu hiệu đỏ (Red Flags)"] -->|Pass Quiz 1 (>=16/20)| S2["Section 2: Bẫy Mạng Xã Hội, Game Online & AI Deepfake"]
    S2 -->|Pass Quiz 2 (>=16/20)| S3["Section 3: Lừa đảo Tài chính, Tiền ảo & Việc làm Teen"]
    S3 -->|Pass Quiz 3 (>=16/20)| S4["Section 4: Kỹ thuật Phòng thủ số & Ứng phó Khủng hoảng"]
\`\`\`

---

# SECTION 1: NHẬN THỨC SỐ & BẢN ĐỒ CHIÊU TRÒ LỪA ĐẢO TRỰC TUYẾN

## 1.1. Bài 1: Giải mã Tâm lý học Tội phạm Mạng (Social Engineering)
### A. Khái niệm cốt lõi
* **Social Engineering (Thao túng tâm lý xã hội):** Là nghệ thuật thao túng con người để họ tự nguyện cung cấp thông tin bí mật, cấp quyền truy cập hoặc tự tay chuyển tiền cho kẻ xấu. Trong an ninh mạng, con người luôn được xem là mắt xích yếu nhất (The Human Factor).
* Tội phạm mạng hiện đại hiếm khi dùng sức mạnh bẻ khóa máy chủ mà chủ yếu khai thác các điểm mù tâm lý của nạn nhân:
  1. **Nỗi sợ hãi (Fear):** Dọa nạt liên quan đến vi phạm pháp luật, bị đuổi học, bị công an bắt, tài khoản bị khóa vĩnh viễn.
  2. **Lòng tham & Cám dỗ (Greed):** Trúng thưởng ngẫu nhiên giá trị cao (iPhone, xe máy, tiền mặt), mua đồ game giá siêu rẻ.
  3. **Tính tò mò & Bốc đồng (Curiosity & Impulsiveness):** "Xem video lộ clip nóng của hot girl trường mình", link tò mò kèm tiêu đề giật gân.
  4. **Tạo cảm giác khẩn cấp giả tạo (False Urgency):** Đếm ngược thời gian ("Chỉ còn 3 phút", "Trong vòng 24 giờ"), làm nạn nhân không kịp suy nghĩ lý trí hay hỏi ý kiến người khác.
  5. **Lòng trắc ẩn & Lợi dụng uy tín người quen:** Giả mạo bạn thân, người thân cần tiền gấp do tai nạn cấp cứu.

### B. Case Study điển hình
* **Tình huống:** Nữ sinh lớp 11 nhận được tin nhắn Facebook từ tài khoản của bạn thân cùng lớp: *"Cậu ơi tớ đang đi viện với mẹ, thẻ tớ hết tiền, cậu chuyển khoản tạm 500k vào số tài khoản này hộ tớ 1 tiếng nữa tớ trả gấp đôi"*. Nữ sinh thấy bạn thân đang cần gấp nên không mảy may nghi ngờ và chuyển khoản ngay. Sau đó liên lạc lại mới biết tài khoản của bạn thân đã bị chiếm quyền truy cập (hack Facebook) từ tối hôm qua.
* **Bài học rút ra:** Bất cứ khi nào nhận được yêu cầu tài chính đột ngột qua tin nhắn mạng xã hội, **bắt buộc phải kiểm chứng qua kênh độc lập** (gọi điện thoại trực tiếp bằng sóng di động SIM hoặc gặp mặt trực tiếp).

---

## 1.2. Bài 2: Nhận diện các Dấu hiệu Cảnh báo Đỏ (Red Flags)
### A. Bộ nguyên tắc nhận diện Red Flags
1. **Dấu hiệu 1: Thúc ép thời gian phi thực tế (Urgency Trap)**
   * Tin nhắn luôn kèm từ ngữ tạo áp lực: *"Khẩn cấp"*, *"Tài khoản sẽ bị hủy sau 15 phút"*, *"Đăng nhập ngay để tránh bị xóa"*.
2. **Dấu hiệu 2: Tên miền và Địa chỉ gửi mập mờ (Typosquatting & Fake Domains)**
   * Kẻ gian tạo tên miền giả mạo gần giống thương hiệu thật: \`vietcombank-login.top\`, \`facebook-support-appeal.cfd\`, \`vnedu-trangcanhan.xyz\`.
   * Sử dụng đuôi tên miền rẻ tiền hoặc miễn phí: \`.xyz\`, \`.top\`, \`.cc\`, \`.tk\`, \`.online\`.
   * Tên miền chính thống của cơ quan nhà nước Việt Nam luôn có đuôi: \`.gov.vn\`. Tên miền trường học thường có đuôi \`.edu.vn\`.
3. **Dấu hiệu 3: Lỗi chính tả, dịch thuật máy móc**
   * Do nhiều đường dây lừa đảo hoạt động từ nước ngoài, văn bản thường được dịch bằng Google Dịch thời kỳ đầu hoặc công cụ tự động, xuất hiện những từ ngữ kỳ quặc, xưng hô không tự nhiên ("Chào bạn hữu", "Quý ngài hãy bấm vào").
4. **Dấu hiệu 4: Đòi hỏi thông tin nhạy cảm**
   * Ngân hàng và các tổ chức uy tín **không bao giờ** yêu cầu người dùng cung cấp mật khẩu đăng nhập, mã OTP hoặc mã PIN thẻ qua tin nhắn, email hay điện thoại.

---

## 1.3. Bài 3: Phishing (Giả mạo liên kết) & Smishing (Lừa đảo qua tin nhắn SMS)
### A. Kỹ thuật Phishing hoạt động như thế nào?
1. Kẻ lừa đảo sao chép 100% giao diện của các trang uy tín (Facebook, Google, cổng thông tin trường học, ví điện tử).
2. Chúng gửi liên kết bẫy qua tin nhắn, email hoặc bài đăng mạng xã hội.
3. Khi nạn nhân nhập tên đăng nhập và mật khẩu, dữ liệu sẽ được gửi thẳng về máy chủ hoặc con bot Telegram của kẻ lừa đảo.
4. Một số trang Phishing nâng cao còn yêu cầu nhập mã OTP ngay lập tức để kẻ gian đăng nhập và chuyển tiền trong thời gian thực.

### B. Smishing và Thiết bị trạm BTS giả mạo
* Kẻ gian sử dụng thiết bị phát sóng BTS giả gắn trên ô tô hoặc xe máy chạy quanh khu vực đông dân cư. Thiết bị này đè sóng nhà mạng chính thức và gửi hàng nghìn tin nhắn SMS Brandname giả mạo (ví dụ giả Brandname của ngân hàng hoặc nhà mạng) chèn vào đúng luồng tin nhắn thật trên điện thoại của nạn nhân.
* **Quy tắc vàng:** Không bao giờ nhấp vào đường link trong bất kỳ tin nhắn SMS nào, dù tin nhắn đó nằm chung luồng với tin nhắn chính thức của ngân hàng/nhà mạng. Khi cần truy cập dịch vụ, hãy mở trình duyệt và tự gõ địa chỉ chính thức hoặc mở ứng dụng di động đã cài sẵn từ App Store / Google Play.

---

## 1.4. Bài kiểm tra trắc nghiệm Section 1 (20 câu hỏi)
*(Bao gồm đầy đủ 20 câu trắc nghiệm chi tiết kiểm tra năng lực nhận thức số, dấu hiệu đỏ và tấn công xã hội)*

---

# SECTION 2: BẪY MẠNG XÃ HỘI, GAME ONLINE & CÔNG NGHỆ DEEPFAKE AI

## 2.1. Bài 1: Bẫy Game Online & Không gian Ảo
### A. Các hình thức lừa đảo phổ biến trong thế giới game
1. **Bẫy nạp thẻ giá rẻ / x5 x10 giá trị:**
   * Các trang web tự lập nạp Quân Huy, Kim Cương, Robux với giá chỉ bằng 10-20% giá niêm yết.
   * Để nhận vật phẩm, web yêu cầu đăng nhập bằng Facebook, Zing ID hoặc Google. Mục đích thực sự: Cướp tài khoản mạng xã hội để phục vụ các hành vi lừa đảo tiếp theo.
2. **Phần mềm độc hại đội lốt "Tool Hack / Mod Game":**
   * Các file chia sẻ trên YouTube, TikTok với lời mời gọi hack map, hack trang phục, mod skin.
   * Các file thực thi này chứa Trojan, phần mềm gián điệp (Spyware), mã độc Info-stealer chuyên quét cookie trình duyệt, mật khẩu đã lưu và token Discord/Telegram.
3. **Lừa đảo mua bán, trao đổi tài khoản game:**
   * Người bán và "Trung gian uy tín" là đồng bọn hoặc cùng một người điều khiển tài khoản phụ (clone). Sau khi người mua chuyển tiền, kẻ gian chặn liên lạc ngay lập tức.
   * Sau khi bán acc, người bán sử dụng thông tin CCCD, email gốc để khiếu nại nhà phát hành và lấy lại tài khoản đã bán.

---

## 2.2. Bài 2: Trí tuệ Nhân tạo (AI) & Kỷ nguyên Deepfake
### A. Cơ chế của Deepfake
* **Deepfake Video & Face Swap:** Sử dụng mạng nơ-ron học sâu để thay thế khuôn mặt của kẻ lừa đảo bằng khuôn mặt của người thân, bạn bè của nạn nhân.
* **AI Voice Cloning (Giả mạo giọng nói):** Chỉ cần một đoạn clip âm thanh từ 3-5 giây trên TikTok, Facebook Reel của một người, AI đã có thể tổng hợp và đọc bất kỳ văn bản nào bằng chính chất giọng và ngữ điệu của người đó.

### B. Cách nhận diện và bẻ gãy bẫy Deepfake
1. Kẻ lừa đảo thường tạo cuộc gọi video cực ngắn (chỉ 5-10 giây) với lý do "mạng yếu", "sóng chập chờn", kèm hình ảnh người thân cử động bất thường, viền mặt mờ nhòe, chớp mắt thiếu tự nhiên hoặc răng và khẩu hình miệng không khớp với lời nói.
2. **Kỹ thuật lật tẩy tại chỗ:**
   * Yêu cầu người gọi đưa bàn tay vẫy qua lại trước khuôn mặt (thuật toán AI Face Swap sẽ bị nhiễu loạn và làm biến dạng khuôn mặt).
   * Yêu cầu quay mặt sang trái/phải 90 độ.
   * Đặt câu hỏi bí mật về kỷ niệm cá nhân mà người ngoài không thể biết được.

---

## 2.3. Bài 3: Cạm bẫy Tình cảm (Romance Scam) & Tống tiền Nhạy cảm (Sextortion)
### A. Kịch bản Tống tiền Tình dục (Sextortion)
* Đối tượng xấu sử dụng tài khoản ảo có ảnh đại diện hấp dẫn, kết bạn, trò chuyện thân mật, khen ngợi và tạo sự tin tưởng lãng mạn.
* Sau khi tạo được sự gắn kết, kẻ xấu dụ dỗ nạn nhân tham gia cuộc gọi gợi cảm hoặc gửi hình ảnh, video nhạy cảm của bản thân (nudes).
* Ngay sau khi nhận được hình ảnh, kẻ xấu lộ diện bộ mặt tống tiền: Đe dọa gửi toàn bộ hình ảnh cho bạn bè trên danh bạ, gia đình, thầy cô hoặc đăng lên fanpage trường học nếu không chuyển khoản số tiền lớn hoặc tiếp tục gửi video bệnh hoạn hơn.

### B. Hướng dẫn ứng phó khẩn cấp khi bị tống tiền Sextortion
1. **Không chuyển tiền:** Việc chuyển tiền không làm kẻ xấu dừng lại mà sẽ biến bạn thành "con mồi béo bở" tiếp tục bị tống tiền vô tận.
2. **Chặn liên lạc và bảo lưu bằng chứng:** Chụp lại toàn bộ tin nhắn, tài khoản kẻ xấu, số điện thoại, sau đó chặn liên lạc.
3. **Sử dụng công cụ Take It Down (takeitdown.ncmec.org):** Nền tảng quốc tế miễn phí giúp gỡ bỏ và ngăn chặn hình ảnh nhạy cảm của người dưới 18 tuổi lan truyền trên các nền tảng lớn (Facebook, Instagram, TikTok, OnlyFans...).
4. **Chia sẻ với người lớn tin cậy:** Bình tĩnh tâm sự với cha mẹ, thầy cô hoặc liên hệ Tổng đài Quốc gia Bảo vệ Trẻ em **111** để được can thiệp pháp lý và tâm lý kịp thời.

---

## 2.4. Bài kiểm tra trắc nghiệm Section 2 (20 câu hỏi)
*(Bộ 20 câu hỏi tình huống thực tế về Game, Deepfake và phòng chống Sextortion)*

---

# SECTION 3: BẪY TÀI CHÍNH, TIỀN ẢO & TUYỂN DỤNG "VIỆC NHẸ LƯƠNG CAO" CHO TEEN

## 3.1. Bài 1: Bẫy Tuyển dụng "Việc nhẹ Lương cao" Trực tuyến
### A. Kịch bản Bẫy Giật đơn hàng / Cộng tác viên Online
* **Mồi nhử ban đầu:** Tin tuyển dụng đánh vào học sinh muốn tự kiếm tiền mua sắm hoặc phụ giúp gia đình: *"Cần tuyển học sinh gõ văn bản, lồng tiếng truyện, giật đơn Shopee tại nhà, ngày kiếm 200k-500k"*.
* **Giai đoạn tạo niềm tin:** Nạn nhân được giao nhiệm vụ nhỏ nạp 100k, sau 5 phút nhận lại 130k cả gốc lẫn lãi. Lặp lại với số tiền 500k nhận về 650k.
* **Giai đoạn sập bẫy:** Kẻ xấu giao đơn hàng lớn (5 triệu, 10 triệu, 20 triệu). Sau khi nạn nhân chuyển tiền, hệ thống ảo sẽ báo: *"Lỗi cú pháp nạp tiền", "Cần nạp thêm 100% để mở khóa ví", "Cần đóng thuế thu nhập cá nhân"*. Cứ như vậy, nạn nhân tiếp tục vay mượn bạn bè nạp tiền vào với hy vọng lấy lại số vốn ban đầu cho đến khi kiệt quệ tài chính và bị chặn liên lạc.

---

## 3.2. Bài 2: Bẫy Mua bán, Cho thuê Tài khoản Ngân hàng & Hiểm họa Pháp lý
### A. Chiêu trò mua bán thông tin tài khoản
* Các đối tượng trong hội nhóm mạng xã hội mời gọi học sinh, sinh viên đủ 18 tuổi (hoặc có CCCD): *"Cần mở thẻ ATM/tài khoản ngân hàng online, trả công 500k - 1.5 triệu đồng mỗi tài khoản"*.
* Học sinh nghĩ rằng tài khoản không có tiền của mình nên sẽ không có rủi ro gì và vô tư bán lại thông tin đăng nhập, SIM đăng ký hoặc thẻ ngân hàng.

### B. Trách nhiệm Hình sự
* Các tài khoản ngân hàng này sau đó được tội phạm công nghệ cao sử dụng làm tài khoản trung gian để nhận tiền lừa đảo, rửa tiền xuyên quốc gia hoặc đánh bạc trực tuyến.
* Theo quy định của Bộ luật Hình sự Việt Nam (Điều 291): Hành vi thu thập, tàng trữ, trao đổi, mua bán, công khai hóa trái phép thông tin về tài khoản ngân hàng có thể bị phạt tù từ 3 tháng đến 7 năm. Nạn nhân vô tình trở thành **đồng phạm** giúp sức cho đường dây tội phạm có tổ chức.

---

## 3.3. Bài 3: Bẫy Tín dụng Đen & Đa cấp Tiền số Trá hình
### A. App Vay tiền Nặng lãi
* App vay tiền không thế chấp chỉ yêu cầu cấp quyền truy cập danh bạ, vị trí và album ảnh.
* Khi khoản vay đến hạn (thường chỉ 7 ngày) với lãi suất lên tới hàng nghìn %/năm, nếu chậm trả, nhóm đòi nợ sẽ tự động nhắn tin, gọi điện khủng bố cho toàn bộ danh bạ (cha mẹ, thầy cô, bạn bè cùng lớp) và cắt ghép ảnh thờ, ảnh đồi trụy để bôi nhọ danh dự nạn nhân.

### B. Sàn Giao dịch Nhị phân (BO) và Tiền ảo "Lùa gà"
* Các nhóm "Chuyên gia đọc lệnh 2k", khoe xe sang, đồng hồ hiệu, cam kết sinh lời 30%/tháng "bao lỗ 100%".
* Bản chất là mô hình Ponzi lừa đảo, hệ thống biểu đồ nến hoàn toàn do kẻ lập sàn can thiệp thao túng.

---

## 3.4. Bài kiểm tra trắc nghiệm Section 3 (20 câu hỏi)
*(Bộ 20 câu hỏi trắc nghiệm về tài chính, rủi ro pháp lý tài khoản ngân hàng và tín dụng đen)*

---

# SECTION 4: KỸ THUẬT PHÒNG THỦ SỐ & KỊCH BẢN ỨNG PHÓ KHỦNG HOẢNG

## 4.1. Bài 1: Thiết lập Pháo đài Bảo mật Cá nhân (Digital Hygiene)
### A. Nguyên tắc Mật khẩu Mạnh & Passphrase
* Không sử dụng mật khẩu ngắn, chứa thông tin dễ đoán (ngày sinh, số điện thoại, tên thú cưng).
* Áp dụng nguyên tắc Cụm mật khẩu (Passphrase): Ghép 4-5 từ ngẫu nhiên có dấu cách hoặc ký tự đặc biệt, dễ nhớ với bản thân nhưng bất khả thi với máy tính bẻ khóa. Ví dụ: \`CaPhe_SuaDa_Ng0n_H0mNay!\`.
* Không sử dụng chung một mật khẩu cho nhiều tài khoản khác nhau. Sử dụng trình quản lý mật khẩu tin cậy (Bitwarden, 1Password, Apple Keychain).

### B. Nâng cấp Xác thực 2 bước (2FA) An toàn
* 2FA qua tin nhắn SMS có nguy cơ bị tấn công hoán đổi SIM (SIM Swap) hoặc trạm BTS giả mạo chặn bắt mã OTP.
* Khuyến khích chuyển đổi sang ứng dụng tạo mã xác thực: **Google Authenticator**, **Microsoft Authenticator** hoặc Khóa bảo mật vật lý (FIDO2 / YubiKey).

---

## 4.2. Bài 2: Kịch bản Phản ứng Nhanh 5 Bước khi Gặp Sự cố Lừa đảo
\`\`\`mermaid
flowchart LR
    B1["Bước 1: Ngắt kết nối mạng"] --> B2["Bước 2: Khóa khẩn cấp TK / Thẻ"]
    B2 --> B3["Bước 3: Thu thập bằng chứng"]
    B3 --> B4["Bước 4: Đổi mật khẩu từ máy sạch"]
    B4 --> B5["Bước 5: Trình báo cơ quan chức năng"]
\`\`\`

1. **Bước 1: Ngắt kết nối mạng ngay lập tức:** Tắt Wifi và dữ liệu di động 4G nếu nghi ngờ điện thoại/máy tính bị cài mã độc hoặc nhấp vào link lừa đảo.
2. **Bước 2: Liên hệ hotline ngân hàng khóa dịch vụ:** Gọi hotline ngân hàng yêu cầu khóa thẻ và tài khoản ngân hàng khẩn cấp.
3. **Bước 3: Bảo lưu toàn bộ bằng chứng pháp lý:** Chụp ảnh màn hình toàn bộ tin nhắn, số điện thoại, link trang web, biên lai chuyển khoản (tuyệt đối không bấm xóa tin nhắn).
4. **Bước 4: Đổi mật khẩu từ thiết bị an toàn:** Sử dụng một thiết bị sạch khác để đăng xuất toàn bộ phiên đăng nhập và đổi mật khẩu email gốc, tài khoản quan trọng.
5. **Bước 5: Tìm kiếm trợ giúp & Trình báo:** Tâm sự ngay với phụ huynh, giáo viên; nộp đơn trình báo tại cơ quan Công an gần nhất.

---

## 4.3. Bài 3: Danh bạ Đường dây Nóng & Công cụ An toàn Mạng Quốc gia
* **Tổng đài 156:** Đầu số quốc gia tiếp nhận phản ánh về cuộc gọi rác, tin nhắn rác và cuộc gọi có dấu hiệu lừa đảo (miễn cước).
* **Tổng đài 111:** Tổng đài Quốc gia Bảo vệ Trẻ em, tư vấn tâm lý và hỗ trợ pháp lý bảo vệ trẻ em, vị thành niên bị xâm hại trên không gian mạng.
* **Cổng Cảnh báo An toàn Thông tin Việt Nam:** \`canhbao.ncsc.gov.vn\` (Cục An toàn thông tin - Bộ TT&TT).
* **Dự án Chống Lừa Đảo:** \`chongluadao.vn\` - kiểm tra và cảnh báo link web độc hại.

---

## 4.4. Bài kiểm tra trắc nghiệm Section 4 (20 câu hỏi)
*(Bộ 20 câu hỏi trắc nghiệm đánh giá năng lực phản xạ phòng vệ số và ứng phó khẩn cấp)*
`;

const destPath = path.resolve(root, '.idea/pj/anti-scam/detail-content.md');
fs.writeFileSync(destPath, detailContent, 'utf8');
console.log('Successfully written .idea/pj/anti-scam/detail-content.md');
