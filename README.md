# Stickman Story Studio v2.0 🎬

Công cụ Web Studio tự động biến **2–5 câu ý tưởng thô** thành **video hoạt hình 2.5D người que Full HD 1080p** — hỗ trợ **2 phong cách đỉnh cao**:
- **🐺 Cáo Hồi Hộp v2.0 (`cao_hoi_hop`):** Khung **Letterbox 2.05:1** họa tiết dấu chân tối, chiều sâu 3 lớp OTS/rào gỗ/song sắt, bong bóng **Chat HUD nổi 180×180**, nhân vật 2.5D đổ bóng u ám, sinh vật Dark-Comic, phụ đề `ALL-CAPS` kẹp mép dưới, nhạc nền `A minor` (`thriller_drone`) tự ngắt nghỉ nhịp kịch tính và tùy chọn **AI vẽ nền Dark-Comic (`gemini-nano-banana-2.1`)**.
- **🐰 Thỏ Kì Quái v1.0 (`tho_ki_quai`):** Full 16:9 drama học đường / công sở lật kèo 6 hồi, nhạc nền Noir pizzicato.

---

## Tính năng nổi bật

- **Nhập sương sương -> Bung kịch bản 6 hồi (1' / 3' / 5'):** Hỗ trợ cả **Gemini API Key miễn phí** (`gemini-4-hydrogen` / `gemini-3.5-flash-lite` qua `POST /v1/interactions`) lẫn **Chế độ 0 cần API Key** (Copy Prompt mẫu dán qua Gemini/ChatGPT Web rồi dán JSON về Studio).
- **24 Bố cục Góc máy & 9 Bối cảnh:** Bao gồm 4 góc máy 2.5D OTS mới (`ots_phone_groupchat`, `floating_chat_scene`, `creature_enclosure`, `fence_two_shot`), nền `zoo_enclosure` / `haunted_corridor`, cùng 20 bố cục drama lật kèo truyền thống (`ui_transfer_stamp`, `ecu_main`, `prop_magnifying_item`, `red_alarm`, `stage_webcam_expose`, `karma_sprint`...).
- **Vẽ nền Dark-Comic bằng AI hoặc Tải ảnh riêng:** Tích hợp **Nano Banana 2.1 (`gemini-nano-banana-2.1`)** qua `POST /api/generate-scene-art` hoặc nút tải ảnh trực tiếp trên từng cảnh.
- **Tùy biến dàn nhân vật:** Đổi tên, nhãn thẻ ngực (`UEH`, `CEO`, `VIP`...), màu áo, tóc (`wavy_part`, `slick_side`, `curly_exec`, `sparse_bald` 3 sợi hói) và chất giọng riêng cho từng vai.
- **2 tỷ lệ khung hình & Render đa nhân:** `16:9` Ngang (`1920×1080` YouTube) và `9:16` Dọc (`1080×1920` TikTok / Reels / Shorts), ghép `N` worker Chromium song song + FFmpeg `H.264 High yuv420p` + chuẩn hóa âm lượng `-15 LUFS`, xuất kèm phụ đề rời `.vtt`.

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
