(function () {
	const CAO_HOI_HOP_STORY = {
		title: "[v2.0] Tôi Lọt Vào Nhóm Chat Bạo Động Của Sở Thú",
		channelName: "Cáo Hồi Hộp",
		visualStyle: "cao_hoi_hop",
		scenes: [
			{
				act: 1,
				speaker: "main",
				bg: "zoo_enclosure",
				layout: "ots_phone_groupchat",
				cardTitle: "NHÓM CẮN CHẾT QUẢN LÝ",
				cardLines: [
					"parrot|Vẹt Sát Thủ",
					"gorilla|King Kong",
					"tiger|Hổ Một Đấm",
					"elephant|Voi Già Ăn Chay",
				],
				sfx: "chat_pop",
				cam: { z0: 1.0, z1: 1.05, shake: 0.08 },
				text: "Vừa nhận ca trực đêm ở sở thú bỏ hoang, điện thoại tôi rung lên vì bị kéo thẳng vào nhóm chat bí mật mang tên Cắn Chết Quản Lý.",
			},
			{
				act: 2,
				speaker: "rival",
				bg: "zoo_enclosure",
				layout: "fence_two_shot",
				leftEmotion: "dread",
				rightEmotion: "panic",
				foregroundType: "wood_fence",
				sfx: "heartbeat_thump",
				cam: { z0: 1.0, z1: 1.04, shake: 0.05 },
				text: "Đồng nghiệp hói đầu run lẩy bẩy dặn tôi tuyệt đối không được mở khóa chuồng số bốn sau hai mươi hai giờ đêm dù có tiếng gõ cửa.",
			},
			{
				act: 3,
				speaker: "boss",
				bg: "zoo_enclosure",
				layout: "floating_chat_scene",
				leftEmotion: "dread",
				avatarIcon: "elephant",
				foregroundType: "wood_fence",
				cardTitle: "Voi Già Ăn Chay",
				cardLines: [
					"Tao ăn chay, nhưng có thể giúp tụi mày giẫm nát xương thằng quản lý mới.",
				],
				sfx: "chat_pop",
				cam: { z0: 1.01, z1: 1.07, shake: 0.12 },
				text: "Ngay lúc đó, tài khoản Voi Già Ăn Chay thả một dòng tin nhắn rợn người khiến sống lưng tôi lạnh toát giữa khu chuồng tối.",
			},
			{
				act: 4,
				speaker: "main",
				bg: "haunted_corridor",
				layout: "creature_enclosure",
				leftEmotion: "dread",
				avatarIcon: "tiger",
				foregroundType: "iron_cage",
				cardTitle: "CẤM MỞ CỬA SAU 22:00",
				sfx: "beast_growl",
				cam: { z0: 1.0, z1: 1.09, shake: 0.25 },
				text: "Bên ngoài song sắt hành lang, đôi mắt trắng dã của con hổ dữ lóe sáng trong bóng tối, nhưng nó không biết tôi đã bật sẵn còi khóa toàn khu.",
			},
			{
				act: 5,
				speaker: "main",
				bg: "dark_noir",
				layout: "ecu_main",
				leftEmotion: "dread",
				sfx: "dark_boom",
				cam: { z0: 1.02, z1: 1.1, shake: 0.15 },
				text: "Bởi vì quy tắc thật sự của sở thú này không phải là giữ mạng cho nhân viên, mà là thử xem ai mới là kẻ đứng sau màn hình kích hoạt cuộc bạo động.",
			},
		],
	};

	const DEMO_STORY = {
		title: "[Demo] Tôi bẫy ngược thằng bạn thân học lỏm code định ám sát mình",
		channelName: "Hồ Sơ Lật Kèo",
		visualStyle: "tho_ki_quai",
		scenes: [
			{
				act: 1,
				speaker: "main",
				bg: "dark_lab",
				layout: "ui_transfer_stamp",
				cardTitle: "HỆ THỐNG KHO MÃ NGUỒN: 100-AI-SKILLS",
				cardLines: [
					"NGƯỜI NHẬN: TRỌNG TÍNH (KINH TẾ UEH)",
					"TÀI SẢN: 100 SKILLS + MÃ NGUỒN GỐC",
					"XÁC NHẬN CHUYỂN QUYỀN",
				],
				stampText: "ĐÃ CHUYỂN GIAO 100%!",
				sfx: "click_stamp",
				cam: { z0: 1.0, z1: 1.06, shake: 0.35 },
				text: "Biết tin thằng bạn thân Trọng Tính định ám sát mình để cướp siêu dự án AI, tôi đã tự tay chuyển luôn toàn bộ mã nguồn cho nó.",
			},
			{
				act: 1,
				speaker: "main",
				bg: "dark_lab",
				layout: "ecu_main",
				leftEmotion: "smirk",
				sfx: "dark_boom",
				cam: { z0: 1.02, z1: 1.1, shake: 0 },
				text: "Tôi cố tình làm vậy. Bởi với một kẻ thích dùng đòn bẩy trên lưng bạn bè, món quà miễn phí luôn là cái bẫy đắt giá nhất.",
			},
			{
				act: 2,
				speaker: "main",
				bg: "dark_lab",
				layout: "sneak_phone",
				sfx: "camera_snap",
				cam: { z0: 1.0, z1: 1.06, shake: 0.1 },
				text: "Suốt hai tháng trời, tối nào Trọng Tính cũng mang trà sữa qua phòng tôi giả vờ học nhóm nhưng thực chất bật điện thoại chụp lén từng dòng lệnh.",
			},
			{
				act: 3,
				speaker: "rival",
				bg: "dorm_room",
				layout: "prop_magnifying_item",
				propKind: "cup_poison",
				rightEmotion: "villain",
				cardTitle: "NGỦ MÊ + XỔ BỤNG CẤP TỐC",
				sfx: "bubbling",
				cam: { z0: 1.0, z1: 1.07, shake: 0.15 },
				text: "Trước ngày thi chung kết năm tỷ đồng, nó lén pha bột ngủ mê và thuốc xổ bụng vào ly trà sữa rồi khóa trái cửa nhốt tôi trong phòng.",
			},
			{
				act: 4,
				speaker: "main",
				bg: "dark_noir",
				layout: "ecu_glow_eyes",
				sfx: "dark_boom",
				cam: { z0: 1.0, z1: 1.11, shake: 0 },
				text: "Nó đâu hề biết tôi đã đọc được bản kế hoạch trên đám mây, đánh tráo cốc trà sạch và cài sẵn giao thức tự vạch trần vào kho mã nguồn.",
			},
			{
				act: 5,
				speaker: "ai",
				bg: "stage_expose",
				layout: "red_alarm",
				cardTitle: "CẢNH BÁO ĐÁNH CẮP MÃ NGUỒN!",
				cardLines: [
					"PHÁT HIỆN KẺ HỌC LỎM: TRỌNG TÍNH",
					"KÍCH HOẠT SKILL #101: VẠCH TRẦN 4K!",
				],
				sfx: "red_siren",
				cam: { z0: 1.0, z1: 1.09, shake: 0.45 },
				text: "Ngay khi nó bấm nút chạy thử trên sân khấu lớn, còi báo động hú vang và toàn bộ cảnh quay hồng ngoại đêm qua phát trực tiếp trước năm trăm khán giả!",
			},
			{
				act: 6,
				speaker: "main",
				bg: "stage_hall",
				layout: "karma_sprint",
				sfx: "stomach_gurgle",
				cam: { z0: 1.0, z1: 1.07, shake: 0.3 },
				text: "Uống nhầm chính chai nước pha bột xổ của mình, Trọng Tính ôm bụng chạy trối chết khỏi sân khấu, còn tôi đàng hoàng bước lên ký hợp đồng năm tỷ đồng.",
			},
		],
	};

	let currentStory = JSON.parse(JSON.stringify(CAO_HOI_HOP_STORY));
	let selectedIdx = 0;
	let previewAnimId = null;

	const el = (id) => document.getElementById(id);
	const canvas = el("previewCanvas");

	// Restore saved API key locally
	const savedKey = localStorage.getItem("stickman_gemini_key") || "";
	if (savedKey) el("apiKey").value = savedKey;
	el("apiKey").addEventListener("input", (e) => {
		localStorage.setItem("stickman_gemini_key", e.target.value.trim());
	});

	el("roughIdea").value =
		"Bạn A tên Trọng Tính học Kinh tế ở UEH có thằng bạn thân là Đào Trọng dân Kỹ thuật. Tính hay qua phòng Đào Trọng học lỏm kiến thức kỹ thuật AI rồi định bỏ thuốc nhốt Đào Trọng để cướp giải thưởng 5 tỷ, nhưng bị Đào Trọng cài bẫy ngược ngay trên sân khấu.";

	function readCharactersFromInputs() {
		return {
			main: {
				name: el("charMainName").value.trim() || "Đào Trọng",
				badge: el("charMainBadge").value.trim(),
				shirtColor: el("charMainColor").value,
				hairStyle: "wavy_part",
				hairColor: "#313840",
				voicePreset: el("charMainVoice").value,
			},
			rival: {
				name: el("charRivalName").value.trim() || "Trọng Tính",
				badge: el("charRivalBadge").value.trim(),
				shirtColor: el("charRivalColor").value,
				hairStyle:
					el("visualStyle").value === "cao_hoi_hop"
						? "sparse_bald"
						: "slick_side",
				hairColor: "#3d2d27",
				voicePreset: el("charRivalVoice").value,
			},
			boss: {
				name: el("charBossName").value.trim() || "Chủ tịch Trần",
				badge: el("charBossBadge").value.trim(),
				shirtColor: el("charBossColor").value,
				hairStyle: "curly_exec",
				hairColor: "#423338",
				moustache: true,
				voicePreset: el("charBossVoice").value,
			},
		};
	}

	function buildPreviewData(animOffsetSec = 1.2) {
		const aspect = el("aspectRatio").value;
		const width = aspect === "9:16" ? 1080 : 1920;
		const height = aspect === "9:16" ? 1920 : 1080;
		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
			el("canvasContainer").style.aspectRatio =
				aspect === "9:16" ? "9 / 16" : "16 / 9";
			el("canvasContainer").style.maxHeight =
				aspect === "9:16" ? "560px" : "none";
		}

		const chars = readCharactersFromInputs();
		let cur = 0;
		const timedScenes = currentStory.scenes.map((s, i) => {
			const dur = 4.2;
			const item = {
				...s,
				id: i + 1,
				start: cur,
				end: cur + dur,
				subs: [
					{
						start: cur,
						end: cur + dur,
						text:
							s.text.length > 62
								? s.text.slice(0, 62).replace(/\s+\S*$/, "")
								: s.text,
						speaker: s.speaker,
					},
				],
			};
			cur += dur;
			return item;
		});

		const totalFrames = Math.ceil((cur + 1) * 30);
		const fakeMouth = { main: [], rival: [], boss: [], ai: [] };
		for (let f = 0; f < totalFrames; f++) {
			const wave = Math.max(0, Math.sin(f * 0.65) * 0.75);
			fakeMouth.main[f] = wave;
			fakeMouth.rival[f] = wave;
			fakeMouth.boss[f] = wave;
			fakeMouth.ai[f] = wave;
		}

		const targetT = timedScenes[selectedIdx]
			? timedScenes[selectedIdx].start + animOffsetSec
			: 0.5;

		return {
			data: {
				title: currentStory.title,
				channelName: el("channelName").value.trim() || "Hồ Sơ Lật Kèo",
				visualStyle: el("visualStyle").value,
				width,
				height,
				fps: 30,
				duration: cur,
				totalFrames,
				characters: chars,
				scenes: timedScenes,
				subs: timedScenes.flatMap((x) => x.subs),
				mouthEnv: fakeMouth,
			},
			targetT,
		};
	}

	function redrawPreview(offset = 1.25) {
		const { data, targetT } = buildPreviewData(offset);
		window.StickmanEngine.renderAtOnCanvas(canvas, data, targetT);
	}

	function syncInspector() {
		const sc = currentStory.scenes[selectedIdx];
		if (!sc) return;
		el("inspectorLabel").textContent =
			`Chỉnh Sửa Nhanh Cảnh #${String(selectedIdx + 1).padStart(2, "0")}`;
		el("scSpeaker").value = sc.speaker || "main";
		el("scLayout").value = sc.layout || "two_shot";
		el("scBg").value = sc.bg || "dark_lab";
		el("scAvatarIcon").value = sc.avatarIcon || "elephant";
		el("scForeground").value = sc.foregroundType || "none";
		el("scCardTitle").value = sc.cardTitle || "";
		el("scText").value = sc.text || "";
	}

	function preloadStoryImagesAndRedraw() {
		if (window.StickmanEngine && window.StickmanEngine.preloadImages) {
			window.StickmanEngine.preloadImages(currentStory, () =>
				redrawPreview(1.25),
			);
		}
		redrawPreview(1.25);
	}

	function renderScenesList() {
		el("storyTitleHeading").textContent =
			currentStory.title || "Kịch bản hiện tại";
		el("sceneCountBadge").textContent = String(currentStory.scenes.length);
		const host = el("scenesList");
		host.innerHTML = "";
		currentStory.scenes.forEach((sc, idx) => {
			const row = document.createElement("div");
			row.className = "scene-item" + (idx === selectedIdx ? " active" : "");
			row.innerHTML = `
        <span class="sc-num">#${String(idx + 1).padStart(2, "0")}</span>
        <span class="sc-text">${sc.text || "(Trống)"}</span>
        <span class="sc-meta">${sc.layout || "two_shot"}</span>
      `;
			row.addEventListener("click", () => {
				selectedIdx = idx;
				renderScenesList();
				syncInspector();
				redrawPreview(1.25);
			});
			host.appendChild(row);
		});
	}

	// Bind inspector edits
	[
		"scSpeaker",
		"scLayout",
		"scBg",
		"scAvatarIcon",
		"scForeground",
		"scCardTitle",
		"scText",
	].forEach((id) => {
		el(id).addEventListener("input", () => {
			const sc = currentStory.scenes[selectedIdx];
			if (!sc) return;
			sc.speaker = el("scSpeaker").value;
			sc.layout = el("scLayout").value;
			sc.bg = el("scBg").value;
			sc.avatarIcon = el("scAvatarIcon").value;
			sc.foregroundType = el("scForeground").value;
			sc.cardTitle = el("scCardTitle").value;
			sc.text = el("scText").value;
			renderScenesList();
			redrawPreview(1.25);
		});
	});

	[
		"visualStyle",
		"aspectRatio",
		"channelName",
		"charMainName",
		"charMainBadge",
		"charMainColor",
		"charMainVoice",
		"charRivalName",
		"charRivalBadge",
		"charRivalColor",
		"charRivalVoice",
		"charBossName",
		"charBossBadge",
		"charBossColor",
		"charBossVoice",
	].forEach((id) => {
		el(id).addEventListener("input", () => redrawPreview(1.25));
	});

	el("btnAddScene").addEventListener("click", () => {
		const base = currentStory.scenes[selectedIdx] || {};
		currentStory.scenes.splice(selectedIdx + 1, 0, {
			act: base.act || 1,
			speaker: "main",
			bg: base.bg || "dark_lab",
			layout: "two_shot",
			sfx: "whoosh",
			cam: { z0: 1.0, z1: 1.05, shake: 0 },
			text: "Nhập lời thoại mới cho cảnh tiếp theo tại đây.",
		});
		selectedIdx++;
		renderScenesList();
		syncInspector();
		redrawPreview(1.25);
	});

	el("btnDeleteScene").addEventListener("click", () => {
		if (currentStory.scenes.length <= 1) return;
		currentStory.scenes.splice(selectedIdx, 1);
		selectedIdx = Math.max(0, selectedIdx - 1);
		renderScenesList();
		syncInspector();
		redrawPreview(1.25);
	});

	el("btnPlayPreview").addEventListener("click", () => {
		if (previewAnimId) {
			cancelAnimationFrame(previewAnimId);
			previewAnimId = null;
		}
		const startMs = performance.now();
		function tick(now) {
			const elapsed = (now - startMs) / 1000;
			if (elapsed > 3.8) {
				previewAnimId = null;
				return;
			}
			redrawPreview(elapsed);
			previewAnimId = requestAnimationFrame(tick);
		}
		previewAnimId = requestAnimationFrame(tick);
	});

	el("btnLoadCaoHoiHop").addEventListener("click", () => {
		currentStory = JSON.parse(JSON.stringify(CAO_HOI_HOP_STORY));
		el("visualStyle").value = "cao_hoi_hop";
		el("channelName").value = "Cáo Hồi Hộp";
		selectedIdx = 0;
		renderScenesList();
		syncInspector();
		preloadStoryImagesAndRedraw();
	});

	el("btnLoadDemo").addEventListener("click", () => {
		currentStory = JSON.parse(JSON.stringify(DEMO_STORY));
		el("visualStyle").value = "tho_ki_quai";
		el("channelName").value = "Hồ Sơ Lật Kèo";
		selectedIdx = 0;
		renderScenesList();
		syncInspector();
		preloadStoryImagesAndRedraw();
	});

	el("btnUploadSceneBg").addEventListener("click", () => {
		el("fileSceneBg").click();
	});
	el("fileSceneBg").addEventListener("change", (ev) => {
		const f = ev.target.files && ev.target.files[0];
		if (!f) return;
		const reader = new FileReader();
		reader.onload = () => {
			const sc = currentStory.scenes[selectedIdx];
			if (!sc) return;
			sc.bgImageUrl = String(reader.result || "");
			preloadStoryImagesAndRedraw();
		};
		reader.readAsDataURL(f);
	});

	el("btnGenSceneArt").addEventListener("click", async () => {
		const sc = currentStory.scenes[selectedIdx];
		if (!sc) return;
		const btn = el("btnGenSceneArt");
		const orig = btn.textContent;
		const apiKey = el("apiKey").value.trim();
		if (!apiKey) {
			alert(
				"Hãy dán Gemini API Key ở Bước 01 để AI vẽ ảnh nền dark-comic (hoặc dùng nút Tải Ảnh Nền Lên miễn phí).",
			);
			return;
		}
		btn.disabled = true;
		btn.textContent = "⏳ Nano Banana 2.1 đang vẽ...";
		try {
			const res = await fetch("/api/generate-scene-art", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					apiKey,
					aspectRatio: el("aspectRatio").value,
					prompt: `Dark moody midnight comic-book illustration background (no text, no speech bubbles, wide shot): ${sc.bg || "zoo_enclosure"}. Scene mood: ${sc.cardTitle || ""} - ${sc.text || "suspense night thriller"}`,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Lỗi gọi Nano Banana 2.1");
			sc.bgImageUrl = data.dataUrl;
			preloadStoryImagesAndRedraw();
		} catch (err) {
			alert(err.message);
		} finally {
			btn.disabled = false;
			btn.textContent = orig;
		}
	});

	// AI Story Expansion
	el("btnExpandAI").addEventListener("click", async () => {
		const btn = el("btnExpandAI");
		const roughIdea = el("roughIdea").value.trim();
		if (!roughIdea) {
			alert("Hãy nhập vài dòng ý tưởng cốt truyện trước nhé!");
			return;
		}
		btn.disabled = true;
		const origLabel = btn.textContent;
		btn.textContent = "⏳ Đang viết bung kịch bản 6 hồi...";
		try {
			const res = await fetch("/api/expand-story", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					provider: "gemini",
					apiKey: el("apiKey").value.trim(),
					model: el("aiModel").value,
					roughIdea,
					targetMinutes: Number(el("targetMinutes").value),
					characters: readCharactersFromInputs(),
					channelName: el("channelName").value.trim(),
					visualStyle: el("visualStyle").value,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Lỗi gọi AI");
			currentStory = data;
			selectedIdx = 0;
			renderScenesList();
			syncInspector();
			redrawPreview(1.25);
		} catch (err) {
			alert(err.message);
		} finally {
			btn.disabled = false;
			btn.textContent = origLabel;
		}
	});

	// No-Key Copy Prompt / Paste JSON Modal
	el("btnOpenNoKeyModal").addEventListener("click", () =>
		el("noKeyModal").classList.add("open"),
	);
	el("btnCloseModal").addEventListener("click", () =>
		el("noKeyModal").classList.remove("open"),
	);

	el("btnCopyPrompt").addEventListener("click", async () => {
		const res = await fetch("/api/build-prompt", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				roughIdea:
					el("roughIdea").value.trim() ||
					"Một câu chuyện lật kèo bạn thân phản bội",
				targetMinutes: Number(el("targetMinutes").value),
				characters: readCharactersFromInputs(),
				channelName: el("channelName").value.trim(),
				visualStyle: el("visualStyle").value,
			}),
		});
		const data = await res.json();
		await navigator.clipboard.writeText(data.prompt);
		el("btnCopyPrompt").textContent =
			"✅ Đã Copy! Hãy dán qua Gemini / ChatGPT Web";
		setTimeout(() => {
			el("btnCopyPrompt").textContent =
				"📋 Copy Prompt Mẫu Theo Ý Tưởng Của Bạn";
		}, 3000);
	});

	el("btnImportJson").addEventListener("click", async () => {
		try {
			const rawJson = el("pasteJsonArea").value.trim();
			const res = await fetch("/api/sanitize-json", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					rawJson,
					channelName: el("channelName").value.trim(),
					visualStyle: el("visualStyle").value,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "JSON chưa đúng cấu trúc");
			currentStory = data;
			selectedIdx = 0;
			el("noKeyModal").classList.remove("open");
			renderScenesList();
			syncInspector();
			redrawPreview(1.25);
		} catch (err) {
			alert("Không đọc được JSON: " + err.message);
		}
	});

	// Start Full Video Render
	el("btnStartRender").addEventListener("click", async () => {
		const btn = el("btnStartRender");
		btn.disabled = true;
		el("videoResult").classList.remove("visible");
		el("progressBox").classList.add("visible");
		el("progressBar").style.width = "2%";
		el("progressPct").textContent = "2%";
		el("progressMsg").textContent = "Đang gửi kịch bản xuống cụm Render...";

		const aspect = el("aspectRatio").value;
		const width = aspect === "9:16" ? 1080 : 1920;
		const height = aspect === "9:16" ? 1920 : 1080;

		try {
			const res = await fetch("/api/render", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					width,
					height,
					workers: Number(el("workersCount").value) || 4,
					story: {
						...currentStory,
						channelName: el("channelName").value.trim() || "Hồ Sơ Lật Kèo",
						visualStyle: el("visualStyle").value,
						characters: readCharactersFromInputs(),
					},
				}),
			});
			const data = await res.json();
			if (!res.ok)
				throw new Error(data.error || "Không khởi tạo được job render");

			const es = new EventSource(`/api/jobs/${data.jobId}/events`);
			es.onmessage = (ev) => {
				const st = JSON.parse(ev.data);
				el("progressBar").style.width = `${st.progress || 0}%`;
				el("progressPct").textContent = `${st.progress || 0}%`;
				el("progressMsg").textContent = st.message || "";

				if (st.status === "completed") {
					es.close();
					btn.disabled = false;
					el("videoResult").classList.add("visible");
					el("outputVideo").src = st.videoUrl + "?t=" + Date.now();
					el("downloadMp4").href = st.videoUrl;
					el("downloadVtt").href = st.vttUrl;
				} else if (st.status === "failed") {
					es.close();
					btn.disabled = false;
					alert("Render thất bại: " + (st.error || st.message));
				}
			};
		} catch (err) {
			btn.disabled = false;
			alert(err.message);
		}
	});

	// Boot
	document.fonts.ready.then(() => {
		renderScenesList();
		syncInspector();
		redrawPreview(1.25);
	});
})();
