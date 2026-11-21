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
	"ots_phone_groupchat",
	"floating_chat_scene",
	"creature_enclosure",
	"fence_two_shot",
];

export const ALLOWED_BGS = [
	"dark_lab",
	"campus_hall",
	"dorm_room",
	"prison_noir",
	"stage_hall",
	"stage_expose",
	"dark_noir",
	"zoo_enclosure",
	"haunted_corridor",
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
	"chat_pop",
	"heartbeat_thump",
	"beast_growl",
];

export function buildExpansionPrompt({
	roughIdea,
	targetMinutes = 5,
	characters,
	channelName = "Hồ Sơ Lật Kèo",
	visualStyle = "cao_hoi_hop",
}) {
	const sceneCount = targetMinutes <= 1.2 ? 14 : targetMinutes <= 3.2 ? 34 : 58;
	const charSummary = Object.entries(characters || {})
		.map(
			([id, c]) =>
				`- id="${id}": tên="${c.name}", nhãn ngực="${c.badge || ""}", vai trò="${c.role || id}"`,
		)
		.join("\n");

	const styleRules =
		visualStyle === "cao_hoi_hop"
			? `QUY TẮC CỐT TRUYỆN KIỂU "CÁO HỒI HỘP" (2.5D RULES HORROR / NHÓM CHAT BÍ MẬT / HỒI HỘP LẬT KÈO):
1. Cảnh 1 (Hook 0-5s): Luôn mở đầu bằng cú nhìn trộm điện thoại gây sốc ("ots_phone_groupchat", sfx "chat_pop"), cardTitle là tên nhóm chat rùng rợn (VD: "[NHÓM CẮN CHẾT QUẢN LÝ]"), cardLines là 4 thành viên dạng "icon|Tên" (icon thuộc tiger|gorilla|elephant|parrot|skull|hacker|boss).
2. Xen kẽ liên tục các góc máy chiều sâu 3 lớp mới:
   - "floating_chat_scene": nhân vật đứng sau hàng rào gỗ/chuồng thú ("foregroundType": "wood_fence") vừa run vừa đọc tin nhắn nổi ("avatarIcon" + "cardTitle" người gửi + "cardLines" câu chat lạnh gáy, sfx "chat_pop").
   - "creature_enclosure": đối diện sinh vật/kẻ thủ ác sau song sắt ("foregroundType": "iron_cage", sfx "beast_growl" hoặc "heartbeat_thump").
   - "fence_two_shot": hai người thì thầm sau rào cản ("leftEmotion": "dread", "rightEmotion": "panic").
   - "ecu_main" với "leftEmotion": "dread" ở khoảnh khắc nhận ra quy tắc chết người (sfx "heartbeat_thump" / "dark_boom").
3. Nhịp kể quy tắc sinh tồn / quái đàm hoặc phá án lật kèo rõ 6 hồi, không lặp lại 1 layout quá 2 cảnh liên tiếp.`
			: `QUY TẮC CỐT TRUYỆN KIỂU "THỎ KÌ QUÁI":
1. Cảnh 1 (Hook 0-5s): Luôn mở đầu bằng hành động ngược đời gây sốc (layout "ui_transfer_stamp"), ví dụ nhân vật chính tự tay chuyển giao thứ quý giá cho kẻ phản bội.
2. Cảnh 2: Cận cảnh mặt nhân vật chính nhếch mép ("ecu_main", sfx "dark_boom"): "Tôi cố tình làm vậy..."
3. Hồi 2 & 3: Khắc họa chi tiết màn lợi dụng / học lỏm / gài bẫy của đối thủ và khoảnh khắc nhân vật chính tình cờ phát hiện âm mưu rồi âm thầm cài bẫy ngược.
4. Hồi 4 & 5: Đêm diễn kịch giả thua ("fake_collapse") và màn bóc phốt công khai cực đã trước đám đông ("stage_pitch" -> "red_alarm" -> "stage_webcam_expose").
5. Hồi 6: Nhân vật chính xuất hiện ("grand_entrance"), đối thủ nhận quả báo hài hước ("karma_sprint"), chốt câu triết lý sắc lẹm cuối phim.
6. Đa dạng hóa góc máy liên tục! Không lặp lại cùng 1 layout quá 2 cảnh liên tiếp.`;

	return `Bạn là biên kịch trưởng của kênh hoạt hình 2.5D người que lật kèo / kinh dị quy tắc chuẩn "${visualStyle === "cao_hoi_hop" ? "Cáo Hồi Hộp" : "Thỏ Kì Quái"}".
Nhiệm vụ: Từ ý tưởng thô bên dưới, hãy viết bung thành một kịch bản hoàn chỉnh gồm ĐÚNG KHOẢNG ${sceneCount} CẢNH (chia 6 hồi kịch tính, thời lượng mục tiêu ~${targetMinutes} phút, mỗi câu thoại dài 16–24 từ tiếng Việt sắc gọn, cuốn hút, không sáo rỗng).

Ý TƯỞNG GỐC CỦA NGƯỜI DÙNG:
"""
${roughIdea}
"""

DANH SÁCH NHÂN VẬT (chỉ dùng các id speaker này):
${charSummary}
- id="ai": Hệ thống thông báo / giọng AI trên sân khấu (nếu có cảnh báo tự động).

${styleRules}

CHỈ TRẢ VỀ ĐÚNG 1 ĐỐI TƯỢNG JSON HỢP LỆ (không bọc giải thích dài dòng) theo cấu trúc:
{
  "title": "Tiêu đề tập phim giật tít",
  "channelName": "${channelName}",
  "visualStyle": "${visualStyle}",
  "scenes": [
    {
      "act": 1,
      "speaker": "main | rival | boss | ai",
      "bg": "${ALLOWED_BGS.join(" | ")}",
      "layout": "${ALLOWED_LAYOUTS.join(" | ")}",
      "leftEmotion": "neutral | smirk | deadpan | cold | angry | happy | dread | panic",
      "rightEmotion": "neutral | smug | fake_smile | greed | shock_greed | villain | panic | stomach_doom",
      "avatarIcon": "tiger | gorilla | elephant | parrot | skull | hacker | boss",
      "foregroundType": "none | wood_fence | iron_cage",
      "propKind": "cup_poison | cup_clean | bottle_poison | usb_drive | contract",
      "isError": false,
      "alertPop": false,
      "cardTitle": "Tiêu đề ngắn / Tên người gửi chat HUD / Nhóm chat",
      "cardLines": ["Dòng 1 trên bảng/màn hình/bong bóng chat", "Dòng 2", "Dòng 3"],
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

	const visualStyle =
		(raw?.visualStyle || fallbackMeta.visualStyle) === "cao_hoi_hop"
			? "cao_hoi_hop"
			: (raw?.visualStyle || fallbackMeta.visualStyle) === "tho_ki_quai"
				? "tho_ki_quai"
				: fallbackMeta.visualStyle || "tho_ki_quai";

	const ALLOWED_ICONS = [
		"tiger",
		"gorilla",
		"elephant",
		"parrot",
		"skull",
		"hacker",
		"boss",
	];
	const ALLOWED_FOREGROUNDS = ["none", "wood_fence", "iron_cage"];

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
				leftEmotion:
					s.leftEmotion || (visualStyle === "cao_hoi_hop" ? "dread" : "smirk"),
				rightEmotion: s.rightEmotion || "smug",
				avatarIcon: ALLOWED_ICONS.includes(s.avatarIcon)
					? s.avatarIcon
					: "elephant",
				foregroundType: ALLOWED_FOREGROUNDS.includes(s.foregroundType)
					? s.foregroundType
					: "none",
				bgImageUrl: typeof s.bgImageUrl === "string" ? s.bgImageUrl : "",
				cutoutImageUrl:
					typeof s.cutoutImageUrl === "string" ? s.cutoutImageUrl : "",
				sceneImageUrl:
					typeof s.sceneImageUrl === "string" ? s.sceneImageUrl : "",
				avatarImageUrl:
					typeof s.avatarImageUrl === "string" ? s.avatarImageUrl : "",
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
		visualStyle,
		scenes: cleanScenes,
	};
}
