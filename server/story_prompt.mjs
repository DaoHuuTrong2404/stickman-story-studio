export const ALLOWED_LAYOUTS = [
	"ui_transfer_stamp",
	"ecu_main",
	"ecu_rival",
	"ecu_glow_eyes",
	"over_monitor",
	"solo_stage_talk",
	"two_shot",
	"sneak_phone",
	"prop_phone_chat",
	"prop_terminal_code",
	"prop_board_table",
	"prop_magnifying_item",
	"prop_document_note",
	"prop_breaker_padlock",
	"fake_collapse",
	"stage_pitch",
	"red_alarm",
	"stage_webcam_expose",
	"grand_entrance",
	"karma_sprint",
];

export const ALLOWED_BGS = [
	"dark_lab",
	"campus_hall",
	"dorm_room",
	"prison_noir",
	"stage_hall",
	"stage_expose",
	"dark_noir",
];

export const ALLOWED_SFX = [
	"click_stamp",
	"dark_boom",
	"whoosh",
	"camera_snap",
	"key_clack",
	"cash_ding",
	"bubbling",
	"alert_ping",
	"red_siren",
	"stomach_gurgle",
	"applause_cheer",
];

export function buildExpansionPrompt({
	roughIdea,
	targetMinutes = 5,
	characters,
	channelName = "Hồ Sơ Lật Kèo",
}) {
	const sceneCount = targetMinutes <= 1.2 ? 14 : targetMinutes <= 3.2 ? 34 : 58;
	const charSummary = Object.entries(characters || {})
		.map(
			([id, c]) =>
				`- id="${id}": tên="${c.name}", nhãn ngực="${c.badge || ""}", vai trò="${c.role || id}"`,
		)
		.join("\n");

	return `Bạn là biên kịch trưởng của kênh hoạt hình 2D người que lật kèo kiểu "Thỏ Kì Quái" (Sandiao Twist Storytelling).
Nhiệm vụ: Từ ý tưởng thô bên dưới, hãy viết bung thành một kịch bản hoàn chỉnh gồm ĐÚNG KHOẢNG ${sceneCount} CẢNH (chia 6 hồi kịch tính, thời lượng mục tiêu ~${targetMinutes} phút, mỗi câu thoại dài 16–24 từ tiếng Việt sắc gọn, cuốn hút, không sáo rỗng).

Ý TƯỞNG GỐC CỦA NGƯỜI DÙNG:
"""
${roughIdea}
"""

DANH SÁCH NHÂN VẬT (chỉ dùng các id speaker này):
${charSummary}
- id="ai": Hệ thống thông báo / giọng AI trên sân khấu (nếu có cảnh báo tự động).

QUY TẮC CỐT TRUYỆN KIỂU "THỎ KÌ QUÁI":
1. Cảnh 1 (Hook 0-5s): Luôn mở đầu bằng hành động ngược đời gây sốc (layout "ui_transfer_stamp"), ví dụ nhân vật chính tự tay chuyển giao thứ quý giá cho kẻ phản bội.
2. Cảnh 2: Cận cảnh mặt nhân vật chính nhếch mép ("ecu_main", sfx "dark_boom"): "Tôi cố tình làm vậy..."
3. Hồi 2 & 3: Khắc họa chi tiết màn lợi dụng / học lỏm / gài bẫy của đối thủ và khoảnh khắc nhân vật chính tình cờ phát hiện âm mưu rồi âm thầm cài bẫy ngược.
4. Hồi 4 & 5: Đêm diễn kịch giả thua ("fake_collapse") và màn bóc phốt công khai cực đã trước đám đông ("stage_pitch" -> "red_alarm" -> "stage_webcam_expose").
5. Hồi 6: Nhân vật chính xuất hiện ("grand_entrance"), đối thủ nhận quả báo hài hước ("karma_sprint"), chốt câu triết lý sắc lẹm cuối phim.
6. Đa dạng hóa góc máy liên tục! Không lặp lại cùng 1 layout quá 2 cảnh liên tiếp.

CHỈ TRẢ VỀ ĐÚNG 1 ĐỐI TƯỢNG JSON HỢP LỆ (không bọc giải thích dài dòng) theo cấu trúc:
{
  "title": "Tiêu đề tập phim giật tít kiểu Thỏ Kì Quái",
  "channelName": "${channelName}",
  "scenes": [
    {
      "act": 1,
      "speaker": "main | rival | boss | ai",
      "bg": "${ALLOWED_BGS.join(" | ")}",
      "layout": "${ALLOWED_LAYOUTS.join(" | ")}",
      "leftEmotion": "neutral | smirk | deadpan | cold | angry | happy",
      "rightEmotion": "neutral | smug | fake_smile | greed | shock_greed | villain | panic | stomach_doom",
      "propKind": "cup_poison | cup_clean | bottle_poison | usb_drive | contract",
      "isError": false,
      "alertPop": false,
      "cardTitle": "Tiêu đề ngắn hiện trên màn hình/biển báo/tài liệu nếu dùng layout prop_* hoặc ui_* hoặc stage_*",
      "cardLines": ["Dòng 1 trên bảng/màn hình", "Dòng 2", "Dòng 3"],
      "stampText": "ĐÃ CHUYỂN GIAO! (chỉ khi cần đóng dấu đỏ)",
      "sfx": "${ALLOWED_SFX.join(" | ")}",
      "cam": { "z0": 1.0, "z1": 1.07, "shake": 0.15 },
      "text": "Lời dẫn chuyện hoặc lời thoại tiếng Việt tự nhiên (16-24 từ, viết số thành chữ tiếng Việt để TTS đọc chuẩn 100%)."
    }
  ]
}`;
}

export function sanitizeStorySpec(raw, fallbackMeta = {}) {
	const scenesIn = Array.isArray(raw?.scenes) ? raw.scenes : [];
	if (!scenesIn.length) {
		throw new Error("Kịch bản JSON không có danh sách scenes hợp lệ.");
	}

	const cleanScenes = scenesIn
		.map((s, idx) => {
			const layout = ALLOWED_LAYOUTS.includes(s.layout) ? s.layout : "two_shot";
			const bg = ALLOWED_BGS.includes(s.bg) ? s.bg : "dark_lab";
			const sfx = ALLOWED_SFX.includes(s.sfx) ? s.sfx : "whoosh";
			return {
				id: idx + 1,
				act:
					Number(s.act) ||
					Math.min(6, Math.floor((idx / scenesIn.length) * 6) + 1),
				speaker: ["main", "rival", "boss", "ai"].includes(s.speaker)
					? s.speaker
					: "main",
				bg,
				layout,
				leftChar: "main",
				rightChar: s.speaker === "boss" ? "boss" : "rival",
				leftEmotion: s.leftEmotion || "smirk",
				rightEmotion: s.rightEmotion || "smug",
				propKind: s.propKind || "cup_poison",
				isError: Boolean(s.isError),
				alertPop: Boolean(s.alertPop),
				cardTitle: String(s.cardTitle || "").slice(0, 60),
				cardLines: Array.isArray(s.cardLines)
					? s.cardLines.map((x) => String(x)).slice(0, 5)
					: [],
				stampText: String(s.stampText || ""),
				sfx,
				cam: {
					z0: Number(s.cam?.z0) || 1.0,
					z1: Number(s.cam?.z1) || 1.06,
					shake: Number(s.cam?.shake) || 0.0,
				},
				text: String(s.text || "").trim(),
			};
		})
		.filter((s) => s.text.length > 0);

	return {
		title: String(raw?.title || fallbackMeta.title || "Tập Phim Lật Kèo Mới"),
		channelName: String(
			raw?.channelName || fallbackMeta.channelName || "Hồ Sơ Lật Kèo",
		),
		scenes: cleanScenes,
	};
}
