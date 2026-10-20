# 🎱 Vietlott SMS Smart Analyzer & Generator

Ứng dụng web Single Page Application (SPA) cao cấp hỗ trợ phân tích thống kê xác suất chuyên sâu và gợi ý bộ số thông minh cho 2 loại hình xổ số điện toán phổ biến nhất của Vietlott: **Mega 6/45** và **Power 6/55**.

Hoạt động hoàn toàn **Client-side (Serverless)**, bảo mật dữ liệu tuyệt đối và lưu trữ cá nhân thông qua `localStorage`.

---

## ✨ Tính Năng Nổi Bật

### 1. Phân Tích Xác Suất Thống Kê (Analytics Engine)
- **Số Nóng (Hot Numbers):** Top 10 số có tần suất xuất hiện cao nhất theo từng khung thời gian (30 kỳ, 100 kỳ hoặc toàn bộ lịch sử).
- **Số Lạnh & Chu Kỳ Gan (Cold Numbers & Gan Tracker):** Đo lường số kỳ liên tiếp chưa về (gan hiện tại), so sánh với kỷ lục gan cực đại trong lịch sử và gắn nhãn cảnh báo **"Sắp Chạm Đỉnh"** (ngưỡng $\ge 80\%$).
- **Ma Trận Cặp Số (Co-occurrence Pairs):** Thống kê các cặp 2 số có xu hướng thường xuyên xuất hiện cùng nhau trong cùng một kỳ quay.

### 2. Sinh Số Thông Minh (Generator Engine & 5 Golden Filters)
Tạo cùng lúc 3 bộ số tối ưu theo 3 triết lý chiến thuật độc lập:
1. **Phong Độ Cao:** Ưu tiên 4-5 số nóng kết hợp với cặp số có tần suất đi cùng cao.
2. **Cân Bằng & Đón Sóng:** Kết hợp hài hòa 3 số nóng + 2 số lạnh sắp chạm đỉnh + 1 số trung lập.
3. **Tối Ưu Độc Đắc (Anti-Split):** Ép buộc $\ge 3-4$ số lớn hơn 31 để giảm tối đa tỷ lệ trùng ngày sinh của đám đông, bảo toàn trọn vẹn giá trị giải Jackpot khi trúng.

**Bộ 5 Bộ Lọc Vàng (5 Golden Filters):**
- **F1 (Zero-Repeat):** Không trùng 6/6 với bất kỳ kỳ nào trong lịch sử; không trùng $>4/6$ với 20 kỳ gần nhất.
- **F2 (Chẵn/Lẻ):** Đảm bảo tỷ lệ 2:4, 3:3 hoặc 4:2 (loại bỏ hoàn toàn các trường hợp lệch cực đoan như 0:6, 6:0, 1:5, 5:1).
- **F3 (Tài/Xỉu):** Đảm bảo tỷ lệ số nhỏ/số lớn cân bằng 2:4, 3:3 hoặc 4:2.
- **F4 (Tổng Bell-Curve):** Tổng 6 số rơi vào khoảng phân phối chuẩn xác suất cao (Mega 6/45: $105 - 170$; Power 6/55: $130 - 210$).
- **F5 (Giới Hạn Liên Tiếp):** Loại bỏ dãy có từ 3 số tự nhiên liên tiếp trở lên (ví dụ: `12, 13, 14`).

### 3. Kiểm Tra & Chấm Điểm Bộ Số (Custom Checker)
- Nhập 6 số bất kỳ để hệ thống chấm điểm chất lượng trên thang điểm 100.
- Hiển thị bảng phân tích chi tiết tiêu chí vượt qua các bộ lọc và điểm thưởng số nóng/lạnh.
- Dò tìm tự động trong toàn bộ lịch sử quay thưởng để xem bộ số này trong quá khứ đã từng trúng các hạng giải nào (**Jackpot**, **Giải Nhất**, **Giải Nhì**, **Giải Ba**).

### 4. Kho Vé Đã Lưu & Đối Chiếu Trúng Thưởng (Saved Vault)
- Lưu trữ các vé yêu thích vào kho dữ liệu cá nhân trên trình duyệt.
- Tính năng **"Đối chiếu kết quả"** tự động so khớp vé với kỳ mở thưởng mới nhất, highlight bóng trùng màu xanh và hiển thị hạng giải trúng thưởng trực quan.

### 5. Quản Lý Dữ Liệu Linh Hoạt (Data Manager)
- Khởi tạo sẵn Seed Data gồm **120 kỳ quay gần nhất** cho cả Mega 6/45 và Power 6/55.
- Hỗ trợ **Import file JSON / CSV** mở rộng dữ liệu.
- Tính năng **Fetch từ đường dẫn URL** (GitHub Raw JSON).
- Thêm nhanh kết quả kỳ mở thưởng mới trực tiếp trên giao diện.
- Khôi phục nhanh về dữ liệu gốc bất kỳ lúc nào.

### 6. Tích Hợp Vietlott SMS
- Nút bấm 1-click tự động sao chép dãy số theo định dạng chuẩn cú pháp mua vé qua tổng đài 9969 của ứng dụng **Vietlott SMS**.

---

## 🛠 Công Nghệ Sử Dụng

- **Frontend Core:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 8](https://vite.dev/) (Tốc độ build siêu nhanh, hỗ trợ HMR)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (Hệ màu Dark Theme sang trọng, hiệu ứng 3D bóng số)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Lưu trữ:** Web Storage API (`localStorage`)
- **CI/CD:** GitHub Actions tự động build & deploy GitHub Pages

---

## 🚀 Cài Đặt & Chạy Thử Trên Máy

### 1. Yêu cầu hệ thống
- [Node.js](https://nodejs.org/) phiên bản 18 trở lên.
- Quản lý gói `npm` hoặc `yarn` / `pnpm`.

### 2. Cài đặt các thư viện phụ thuộc
```bash
git clone https://github.com/pntuan-dev/VietlottSMS.git
cd VietlottSMS
npm install
```

### 3. Chạy môi trường phát triển (Dev Server)
```bash
npm run dev
```
Mở trình duyệt tại địa chỉ: `http://localhost:5173`

### 4. Build sản phẩm (Production Bundle)
```bash
npm run build
```
Thư mục xuất bản tĩnh sẽ nằm tại `./dist`. Bạn có thể chạy thử bản build:
```bash
npm run preview
```

---

## 🌐 Triển Khai (Deploy)

Dự án đã được tích hợp sẵn file cấu hình GitHub Actions tại `.github/workflows/deploy.yml`. 
Để kích hoạt tính năng GitHub Pages:
1. Vào repository trên GitHub: `Settings` > `Pages`.
2. Tại mục **Build and deployment** > **Source**, chọn **GitHub Actions**.
3. Mỗi khi push commit lên nhánh `master` hoặc `main`, workflow sẽ tự động chạy build và phát hành ứng dụng lên web.

---

## ⚠️ Tuyên Bố Miễn Trừ Trách Nhiệm (Disclaimer)
Ứng dụng sử dụng các phương pháp thống kê mô tả và mô hình xác suất học để hỗ trợ tối ưu hóa lựa chọn dãy số ngẫu nhiên. Xổ số là trò chơi may rủi hoàn toàn, ứng dụng không đảm bảo cơ hội trúng thưởng 100%. Vui lòng tham gia có trách nhiệm và trong ngân sách cho phép.
