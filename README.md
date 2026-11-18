# Stickman Story Studio 🎬

Công cụ Web Studio tự động biến **2–5 câu ý tưởng thô** thành **video hoạt hình 2D người que lật kèo Full HD 1080p** (chuẩn phong cách *Thỏ Kì Quái* / Sandiao Storytelling) — tự động bung kịch bản 6 hồi, lồng tiếng đa nhân vật tiếng Việt, nhép môi 30fps, lồng nhạc nền Noir + hiệu ứng Foley và xuất `.mp4` đa luồng.

---

## Tính năng nổi bật

- **Nhập sương sương -> Bung kịch bản 6 hồi (1' / 3' / 5'):** Hỗ trợ cả **Gemini API Key miễn phí** (`gemini-4-hydrogen` / `gemini-3.5-flash-lite` qua `POST /v1/interactions`) lẫn **Chế độ 0 cần API Key** (Copy Prompt mẫu dán qua Gemini/ChatGPT Web rồi dán JSON về Studio).
- **Tùy biến dàn nhân vật:** Đổi tên, nhãn thẻ đeo cổ (`UEH`, `CEO`, `VIP`...), màu áo, kiểu tóc và chất giọng riêng cho từng vai (`Nam Trầm Điềm Tĩnh`, `Nam Nhanh Láu Cá`, `Nam Chủ Tịch Uy Nghiêm`, `Nữ Sắc Sảo`).
- **Màn hình dựng phim 60fps trực tiếp trên trình duyệt:** Bấm vào từng cảnh để xem thử ngay chuyển động, góc máy (`20` bố cục dựng sẵn: đóng dấu chuyển giao, chụp lén điện thoại, kính lúp soi trà sữa độc, còi báo động đỏ, chiếu camera 4K bóc phốt, ôm bụng chạy...), sửa lời thoại tức thì trước khi xuất.
- **2 tỷ lệ khung hình:** `16:9` Ngang (`1920×1080` YouTube) và `9:16` Dọc (`1080×1920` TikTok / Reels / Shorts).
- **Render đa nhân tốc độ cao & Chuẩn âm thanh phát sóng:** Ghép `N` worker Chromium song song + FFmpeg `H.264 High yuv420p` + chuẩn hóa âm lượng `-15 LUFS`, xuất kèm file phụ đề rời `.vtt`.

---

## Cách cài đặt & Chạy cho người mới (Windows / macOS)

### Yêu cầu cài sẵn trên máy (chỉ cài 1 lần duy nhất):
1. **Node.js 20+**: [https://nodejs.org](https://nodejs.org)
2. **Python 3.10+**: [https://www.python.org/downloads/](https://www.python.org/downloads/) *(Trên Windows nhớ tích ô **"Add Python to PATH"** lúc cài)*
3. **FFmpeg**:
   - Windows (mở PowerShell gõ 1 dòng): `winget install Gyan.FFmpeg`
   - macOS: `brew install ffmpeg`

### Khởi động 1 chạm:
- **Trên Windows:** Tải repo về (hoặc `git clone`), nhấp đúp file **`START-WINDOWS.bat`**. Lần đầu tiên tool sẽ tự động tải `edge-tts`, `numpy` và nhân trình duyệt render, sau đó tự mở trang Studio tại `http://127.0.0.1:4567`.
- **Trên macOS / Linux:**
  ```bash
  chmod +x start-mac-linux.sh
  ./start-mac-linux.sh
  ```
- **Chạy bằng lệnh thủ công:**
  ```bash
  npm run setup
  npm start
  ```

---

## Lấy Gemini API Key miễn phí (Tùy chọn)

1. Vào [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) bấm **Create API Key** (miễn phí).
2. Dán mã API Key vào ô **Gemini API Key** trên giao diện Studio (mã chỉ lưu cục bộ trong trình duyệt máy bạn, không gửi đi đâu khác).
3. Nếu không muốn dùng API Key: bấm nút **"Dùng Không Cần API Key (Copy/Dán JSON)"** ở góc phải trên cùng giao diện!
