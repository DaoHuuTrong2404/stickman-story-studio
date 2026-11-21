(function () {
	function clamp(v, a, b) {
		return Math.max(a, Math.min(b, v));
	}
	function lerp(a, b, u) {
		return a + (b - a) * u;
	}
	function easeOutCubic(x) {
		return 1 - Math.pow(1 - clamp(x, 0, 1), 3);
	}
	function easeOutBack(x) {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		const u = clamp(x, 0, 1);
		return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
	}
	function hash01(seed) {
		const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
		return x - Math.floor(x);
	}

	function roundRectPath(c, x, y, w, h, r) {
		const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
		c.beginPath();
		c.moveTo(x + rr, y);
		c.arcTo(x + w, y, x + w, y + h, rr);
		c.arcTo(x + w, y + h, x, y + h, rr);
		c.arcTo(x, y + h, x, y, rr);
		c.arcTo(x, y, x + w, y, rr);
		c.closePath();
	}

	function wrapLines(c, text, maxWidth) {
		const words = String(text || "")
			.split(/\s+/)
			.filter(Boolean);
		const lines = [];
		let cur = "";
		for (const w of words) {
			const test = cur ? cur + " " + w : w;
			if (c.measureText(test).width > maxWidth && cur) {
				lines.push(cur);
				cur = w;
			} else {
				cur = test;
			}
		}
		if (cur) lines.push(cur);
		return lines;
	}

	const bgCache = {};
	const imageCache = {};

	function getCachedImage(url) {
		if (!url) return null;
		const entry = imageCache[url];
		if (entry && entry.loaded && entry.img && entry.img.naturalWidth > 0) {
			return entry.img;
		}
		if (!entry) {
			const img = new Image();
			const rec = { img, loaded: false, error: false };
			img.onload = () => {
				rec.loaded = true;
			};
			img.onerror = () => {
				rec.error = true;
			};
			img.src = url;
			imageCache[url] = rec;
		}
		return null;
	}

	async function preloadImages(data, onLoaded) {
		const urls = new Set();
		const scenes = (data && Array.isArray(data.scenes) && data.scenes) || [];
		for (const sc of scenes) {
			if (sc.bgImageUrl) urls.add(sc.bgImageUrl);
			if (sc.cutoutImageUrl) urls.add(sc.cutoutImageUrl);
			if (sc.sceneImageUrl) urls.add(sc.sceneImageUrl);
			if (sc.avatarImageUrl) urls.add(sc.avatarImageUrl);
		}
		if (urls.size === 0) return;
		await Promise.race([
			Promise.all(
				Array.from(urls).map(
					(url) =>
						new Promise((resolve) => {
							const existing = imageCache[url];
							if (existing && (existing.loaded || existing.error)) {
								resolve();
								return;
							}
							const img = (existing && existing.img) || new Image();
							const rec = existing || { img, loaded: false, error: false };
							imageCache[url] = rec;
							img.onload = () => {
								rec.loaded = true;
								if (onLoaded) onLoaded();
								resolve();
							};
							img.onerror = () => {
								rec.error = true;
								resolve();
							};
							if (!img.src) img.src = url;
						}),
				),
			),
			new Promise((resolve) => setTimeout(resolve, 4500)),
		]);
	}

	const letterboxCache = {};
	function getLetterboxBarCanvas(W, H) {
		const key = `${W}x${H}`;
		if (letterboxCache[key]) return letterboxCache[key];
		const off = document.createElement("canvas");
		off.width = W;
		off.height = H;
		const c = off.getContext("2d");
		const g = c.createLinearGradient(0, 0, W, H);
		g.addColorStop(0, "#0e1a2c");
		g.addColorStop(0.5, "#11223a");
		g.addColorStop(1, "#0b1525");
		c.fillStyle = g;
		c.fillRect(0, 0, W, H);

		// Subtle stamped dark paw prints along the bar
		c.fillStyle = "rgba(4, 9, 17, 0.56)";
		const count = Math.max(10, Math.round(W / 120));
		for (let i = 0; i < count; i++) {
			const px = ((i + 0.45) / count) * W + (hash01(i * 3.1) - 0.5) * 40;
			const py = H * (0.28 + hash01(i * 7.3) * 0.44);
			const ang = (hash01(i * 11.7) - 0.5) * 1.1;
			const sc = (0.72 + hash01(i * 5.9) * 0.45) * (H / 76);
			c.save();
			c.translate(px, py);
			c.rotate(ang);
			c.scale(sc, sc);
			c.beginPath();
			c.ellipse(0, 6, 12, 10, 0, 0, Math.PI * 2);
			c.fill();
			const toes = [
				[-12, -8, -0.3],
				[-4, -13, -0.1],
				[5, -13, 0.1],
				[13, -8, 0.3],
			];
			for (const [tx, ty, rot] of toes) {
				c.beginPath();
				c.ellipse(tx, ty, 4, 6, rot, 0, Math.PI * 2);
				c.fill();
			}
			c.restore();
		}
		letterboxCache[key] = off;
		return off;
	}

	function getBgCanvas(name, W, H) {
		const key = `${name}_${W}x${H}`;
		if (bgCache[key]) return bgCache[key];

		const off = document.createElement("canvas");
		off.width = W;
		off.height = H;
		const c = off.getContext("2d");

		const addVignette = (strength = 0.58) => {
			const vg = c.createRadialGradient(
				W * 0.5,
				H * 0.46,
				Math.min(W, H) * 0.22,
				W * 0.5,
				H * 0.5,
				Math.max(W, H) * 0.68,
			);
			vg.addColorStop(0, "rgba(0,0,0,0)");
			vg.addColorStop(1, `rgba(6, 11, 17, ${strength})`);
			c.fillStyle = vg;
			c.fillRect(0, 0, W, H);
		};

		if (name === "dark_lab" || name === "office_room") {
			const g = c.createLinearGradient(0, 0, 0, H);
			g.addColorStop(0, "#121d28");
			g.addColorStop(0.55, "#1f3242");
			g.addColorStop(1, "#0e1720");
			c.fillStyle = g;
			c.fillRect(0, 0, W, H);

			c.fillStyle = "rgba(125, 165, 190, 0.13)";
			c.fillRect(W * 0.06, H * 0.08, W * 0.36, H * 0.68);
			c.fillRect(W * 0.45, H * 0.08, W * 0.38, H * 0.68);
			c.fillStyle = "#15212c";
			c.fillRect(W * 0.08, H * 0.15, W * 0.16, H * 0.63);
			c.strokeStyle = "#0b1117";
			c.lineWidth = 7;
			c.strokeRect(W * 0.08, H * 0.15, W * 0.16, H * 0.63);

			for (let i = 0; i < 5; i++) {
				const bx = W * 0.28 + i * (W * 0.13);
				const by = H * 0.42 + (i % 2) * 28;
				c.fillStyle = "rgba(18, 29, 38, 0.72)";
				c.fillRect(bx, by, W * 0.09, H * 0.09);
				c.fillStyle = "rgba(92, 185, 235, 0.16)";
				c.fillRect(bx + 10, by + 10, W * 0.09 - 20, H * 0.09 - 22);
			}

			const cg = c.createRadialGradient(
				W * 0.5,
				H * 0.6,
				20,
				W * 0.5,
				H * 0.6,
				W * 0.42,
			);
			cg.addColorStop(0, "rgba(70, 185, 255, 0.18)");
			cg.addColorStop(1, "rgba(0,0,0,0)");
			c.fillStyle = cg;
			c.fillRect(0, 0, W, H);
			addVignette(0.62);
		} else if (name === "campus_hall" || name === "ueh_hall") {
			const g = c.createLinearGradient(0, 0, W, H);
			g.addColorStop(0, "#1a2d3b");
			g.addColorStop(0.5, "#2b4658");
			g.addColorStop(1, "#16242f");
			c.fillStyle = g;
			c.fillRect(0, 0, W, H);

			for (let i = 0; i < 4; i++) {
				c.fillStyle = "rgba(185, 220, 240, 0.11)";
				c.fillRect(W * 0.07 + i * (W * 0.22), H * 0.09, W * 0.17, H * 0.52);
			}
			c.fillStyle = "rgba(14, 24, 34, 0.76)";
			roundRectPath(c, W * 0.58, H * 0.13, W * 0.34, H * 0.31, 14);
			c.fill();
			for (let i = 0; i < 10; i++) {
				const cx = W * 0.61 + i * (W * 0.028);
				const up = i % 3 !== 0;
				const hBar = 35 + hash01(i + 7) * 90;
				c.fillStyle = up
					? "rgba(62, 214, 152, 0.45)"
					: "rgba(238, 92, 92, 0.45)";
				c.fillRect(cx, H * 0.35 - i * 8 - hBar * 0.6, W * 0.014, hBar);
			}
			c.fillStyle = "#14202a";
			c.fillRect(0, H * 0.74, W, H * 0.26);
			addVignette(0.52);
		} else if (name === "dorm_room" || name === "tinh_dorm") {
			const g = c.createLinearGradient(0, 0, 0, H);
			g.addColorStop(0, "#1f2430");
			g.addColorStop(0.6, "#2d3344");
			g.addColorStop(1, "#151821");
			c.fillStyle = g;
			c.fillRect(0, 0, W, H);

			c.fillStyle = "#1b1f2a";
			c.fillRect(W * 0.08, H * 0.13, W * 0.24, H * 0.52);
			c.strokeStyle = "#10131a";
			c.lineWidth = 7;
			c.strokeRect(W * 0.08, H * 0.13, W * 0.24, H * 0.52);
			for (let row = 0; row < 3; row++) {
				for (let b = 0; b < 5; b++) {
					c.fillStyle = ["#5d3a58", "#3a5268", "#68533a", "#3f5e52"][
						(row + b) % 4
					];
					c.fillRect(
						W * 0.095 + b * (W * 0.042),
						H * 0.18 + row * (H * 0.15),
						W * 0.026,
						H * 0.09,
					);
				}
			}
			const wg = c.createRadialGradient(
				W * 0.74,
				H * 0.35,
				20,
				W * 0.74,
				H * 0.4,
				W * 0.35,
			);
			wg.addColorStop(0, "rgba(255, 196, 110, 0.20)");
			wg.addColorStop(1, "rgba(0,0,0,0)");
			c.fillStyle = wg;
			c.fillRect(0, 0, W, H);
			addVignette(0.62);
		} else if (name === "prison_noir" || name === "prison_metaphor") {
			const g = c.createLinearGradient(0, 0, 0, H);
			g.addColorStop(0, "#181d22");
			g.addColorStop(0.6, "#2a323a");
			g.addColorStop(1, "#111519");
			c.fillStyle = g;
			c.fillRect(0, 0, W, H);
			c.fillStyle = "rgba(10, 13, 17, 0.45)";
			for (let x = 80; x < W; x += 130) c.fillRect(x, 0, 24, H);
			addVignette(0.68);
		} else if (name === "stage_hall" || name === "stage_expose") {
			const isAlarm = name === "stage_expose";
			const g = c.createLinearGradient(0, 0, 0, H);
			g.addColorStop(0, isAlarm ? "#240910" : "#0e1826");
			g.addColorStop(0.6, isAlarm ? "#3d111b" : "#1c3048");
			g.addColorStop(1, "#090d14");
			c.fillStyle = g;
			c.fillRect(0, 0, W, H);

			for (const sx of [W * 0.25, W * 0.75]) {
				c.beginPath();
				c.moveTo(sx, -20);
				c.lineTo(sx - W * 0.18, H);
				c.lineTo(sx + W * 0.18, H);
				c.closePath();
				const sg = c.createLinearGradient(sx, 0, sx, H);
				sg.addColorStop(
					0,
					isAlarm ? "rgba(255, 65, 85, 0.24)" : "rgba(120, 205, 255, 0.20)",
				);
				sg.addColorStop(1, "rgba(0,0,0,0)");
				c.fillStyle = sg;
				c.fill();
			}
			c.fillStyle = isAlarm ? "#1c070b" : "#0b1420";
			roundRectPath(c, W * 0.12, H * 0.07, W * 0.76, H * 0.5, 16);
			c.fill();
			c.strokeStyle = isAlarm ? "#ff3b4e" : "#3d7ea8";
			c.lineWidth = 6;
			c.stroke();

			c.fillStyle = isAlarm ? "#1c0d12" : "#142030";
			c.fillRect(0, H * 0.72, W, H * 0.28);
			addVignette(0.56);
		} else if (name === "zoo_enclosure") {
			const sky = c.createLinearGradient(0, 0, 0, H * 0.72);
			sky.addColorStop(0, "#1d242e");
			sky.addColorStop(0.55, "#2b333f");
			sky.addColorStop(1, "#141a22");
			c.fillStyle = sky;
			c.fillRect(0, 0, W, H);

			// Misty storm clouds
			for (let i = 0; i < 12; i++) {
				const cx = hash01(i * 13.7) * W;
				const cy = hash01(i * 5.3) * H * 0.34;
				const cr = 180 + hash01(i * 9.1) * 180;
				const cg = c.createRadialGradient(cx, cy, 10, cx, cy, cr);
				cg.addColorStop(0, "rgba(115, 132, 152, 0.16)");
				cg.addColorStop(1, "rgba(25, 32, 42, 0)");
				c.fillStyle = cg;
				c.fillRect(0, 0, W, H * 0.55);
			}

			// Dense night foliage treeline
			c.fillStyle = "#0e151a";
			for (let x = -40; x < W + 80; x += 95) {
				const h = 210 + hash01(x * 0.13) * 260;
				c.beginPath();
				c.arc(x, H * 0.54 - h * 0.45, h * 0.48, 0, Math.PI * 2);
				c.fill();
			}

			// Jagged dark zoo rockery mound center
			c.fillStyle = "#262f3a";
			c.beginPath();
			c.moveTo(W * 0.25, H * 0.64);
			c.lineTo(W * 0.37, H * 0.38);
			c.lineTo(W * 0.47, H * 0.34);
			c.lineTo(W * 0.58, H * 0.31);
			c.lineTo(W * 0.69, H * 0.43);
			c.lineTo(W * 0.81, H * 0.64);
			c.closePath();
			c.fill();
			c.strokeStyle = "#0b0f14";
			c.lineWidth = 4;
			c.stroke();

			// Rock facets
			c.fillStyle = "#394452";
			c.beginPath();
			c.moveTo(W * 0.37, H * 0.38);
			c.lineTo(W * 0.47, H * 0.34);
			c.lineTo(W * 0.52, H * 0.56);
			c.lineTo(W * 0.41, H * 0.59);
			c.closePath();
			c.fill();

			// Midground steel rail fence
			c.strokeStyle = "#0a0e13";
			c.lineWidth = 6;
			c.strokeRect(0, H * 0.56, W, H * 0.08);
			for (let x = 24; x < W; x += 36) {
				c.beginPath();
				c.moveTo(x, H * 0.56);
				c.lineTo(x, H * 0.64);
				c.stroke();
			}

			// Flagstone pavement
			const pave = c.createLinearGradient(0, H * 0.64, 0, H);
			pave.addColorStop(0, "#242c35");
			pave.addColorStop(1, "#12171d");
			c.fillStyle = pave;
			c.fillRect(0, H * 0.64, W, H * 0.36);

			c.strokeStyle = "rgba(9, 13, 18, 0.65)";
			c.lineWidth = 3;
			for (let row = 0; row < 5; row++) {
				const y = H * 0.66 + row * 72;
				c.beginPath();
				c.moveTo(0, y);
				c.lineTo(W, y);
				c.stroke();
				for (let col = 0; col < 10; col++) {
					const x = col * 220 + (row % 2) * 110;
					c.beginPath();
					c.moveTo(x, y);
					c.lineTo(x - 38, y + 72);
					c.stroke();
				}
			}
			addVignette(0.55);
		} else if (name === "haunted_corridor") {
			const g = c.createLinearGradient(0, 0, 0, H);
			g.addColorStop(0, "#0b111a");
			g.addColorStop(0.5, "#15202e");
			g.addColorStop(1, "#070b10");
			c.fillStyle = g;
			c.fillRect(0, 0, W, H);

			// Perspective corridor walls & ceiling
			c.strokeStyle = "#06090e";
			c.lineWidth = 6;
			c.fillStyle = "#192433";
			c.beginPath();
			c.moveTo(0, 0);
			c.lineTo(W * 0.34, H * 0.24);
			c.lineTo(W * 0.34, H * 0.72);
			c.lineTo(0, H);
			c.closePath();
			c.fill();
			c.stroke();

			c.beginPath();
			c.moveTo(W, 0);
			c.lineTo(W * 0.66, H * 0.24);
			c.lineTo(W * 0.66, H * 0.72);
			c.lineTo(W, H);
			c.closePath();
			c.fill();
			c.stroke();

			// Flickering overhead cold light panel
			const lg = c.createRadialGradient(
				W * 0.5,
				H * 0.26,
				15,
				W * 0.5,
				H * 0.36,
				520,
			);
			lg.addColorStop(0, "rgba(155, 224, 255, 0.34)");
			lg.addColorStop(0.45, "rgba(82, 145, 195, 0.12)");
			lg.addColorStop(1, "rgba(10, 16, 24, 0)");
			c.fillStyle = lg;
			c.fillRect(0, 0, W, H);

			c.fillStyle = "#b5e8ff";
			c.fillRect(W * 0.43, H * 0.14, W * 0.14, 18);

			// Dark barred exit door at vanishing point
			c.fillStyle = "#0b1017";
			c.fillRect(W * 0.4, H * 0.26, W * 0.2, H * 0.44);
			c.strokeStyle = "#263344";
			c.lineWidth = 5;
			c.strokeRect(W * 0.4, H * 0.26, W * 0.2, H * 0.44);

			// Red emergency EXIT glow
			c.fillStyle = "#d92638";
			c.fillRect(W * 0.46, H * 0.21, W * 0.08, 28);
			addVignette(0.68);
		} else {
			const g = c.createRadialGradient(
				W * 0.5,
				H * 0.45,
				40,
				W * 0.5,
				H * 0.5,
				Math.max(W, H) * 0.65,
			);
			g.addColorStop(0, "#1c2b38");
			g.addColorStop(1, "#070b10");
			c.fillStyle = g;
			c.fillRect(0, 0, W, H);
		}

		bgCache[key] = off;
		return off;
	}

	function darkenHex(hex, factor = 0.72) {
		const clean = String(hex || "#2978a0").replace("#", "");
		const r = Math.round(parseInt(clean.slice(0, 2) || "41", 16) * factor);
		const g = Math.round(parseInt(clean.slice(2, 4) || "120", 16) * factor);
		const b = Math.round(parseInt(clean.slice(4, 6) || "160", 16) * factor);
		return `rgb(${r},${g},${b})`;
	}

	function drawPropItem(ctx, kind, x, y, s = 1.0, t = 0) {
		ctx.save();
		ctx.translate(x, y);
		ctx.scale(s, s);
		if (kind === "bottle_poison") {
			roundRectPath(ctx, -46, -110, 92, 220, 22);
			ctx.fillStyle = "rgba(115, 235, 155, 0.82)";
			ctx.fill();
			ctx.lineWidth = 6;
			ctx.strokeStyle = "#080b0f";
			ctx.stroke();
			ctx.fillStyle = "#e03131";
			ctx.fillRect(-24, -140, 48, 30);
		} else if (kind === "usb_drive") {
			roundRectPath(ctx, -40, -70, 80, 150, 16);
			ctx.fillStyle = "#339af0";
			ctx.fill();
			ctx.lineWidth = 6;
			ctx.strokeStyle = "#080b0f";
			ctx.stroke();
			ctx.fillStyle = "#ced4da";
			ctx.fillRect(-26, -118, 52, 48);
			ctx.strokeRect(-26, -118, 52, 48);
		} else if (kind === "contract" || kind === "money_bag") {
			roundRectPath(ctx, -68, -88, 136, 176, 12);
			ctx.fillStyle = "#fff9db";
			ctx.fill();
			ctx.lineWidth = 6;
			ctx.strokeStyle = "#080b0f";
			ctx.stroke();
			ctx.fillStyle = "#f08c00";
			ctx.font = "900 54px BeVietnamPro, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText("$", 0, 18);
		} else {
			const poisoned = kind === "cup_poison";
			ctx.fillStyle = "#e84a5f";
			ctx.strokeStyle = "#080b0f";
			ctx.lineWidth = 5;
			ctx.beginPath();
			ctx.rect(-8, -95, 16, 55);
			ctx.fill();
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(-42, -42);
			ctx.lineTo(42, -42);
			ctx.lineTo(32, 62);
			ctx.lineTo(-32, 62);
			ctx.closePath();
			ctx.fillStyle = poisoned ? "#b89c72" : "#dfb98c";
			ctx.fill();
			ctx.lineWidth = 6;
			ctx.stroke();
			ctx.fillStyle = "#1c130e";
			for (const [bx, by] of [
				[-18, 46],
				[-4, 49],
				[12, 45],
				[-10, 34],
				[8, 33],
			]) {
				ctx.beginPath();
				ctx.arc(bx, by, 6.5, 0, Math.PI * 2);
				ctx.fill();
			}
			if (poisoned) {
				for (let i = 0; i < 4; i++) {
					const p = (t * 1.4 + i * 0.25) % 1;
					ctx.fillStyle = `rgba(92, 235, 115, ${1 - p})`;
					ctx.beginPath();
					ctx.arc(-18 + i * 12, -45 - p * 48, 7 + i * 1.5, 0, Math.PI * 2);
					ctx.fill();
				}
			}
		}
		ctx.restore();
	}

	function drawCharacter(ctx, charDef, opts) {
		const {
			x = 960,
			y = 540,
			scale = 1.0,
			facing = 1,
			emotion = "neutral",
			mouthOpen = 0.0,
			pose = "idle",
			t = 0,
			rimCyan = false,
			showBody = true,
		} = opts;

		const shirtColor = (charDef && charDef.shirtColor) || "#2978a0";
		const shirtShadow = darkenHex(shirtColor, 0.7);
		const hairStyle = (charDef && charDef.hairStyle) || "wavy_part";
		const hairColor = (charDef && charDef.hairColor) || "#313840";
		const badge =
			charDef && charDef.badge ? String(charDef.badge).slice(0, 6) : "";
		const hasMoustache = Boolean(charDef && charDef.moustache);

		ctx.save();
		const bob =
			pose === "fainted"
				? 0
				: Math.sin(t * 3.2 + (facing < 0 ? 1.5 : 0)) * 3.5 * scale;
		const trembleX =
			emotion === "panic" || emotion === "stomach_doom"
				? Math.sin(t * 48) * 5 * scale
				: 0;
		ctx.translate(x + trembleX, y + bob);

		const lw = Math.max(3.5, 9.5 * scale);
		const rx = 114 * scale;
		const ry = 102 * scale;

		if (showBody) {
			ctx.strokeStyle = "#080b0f";
			ctx.lineWidth = lw * 1.08;
			ctx.lineCap = "round";
			const legSpread = 34 * scale;
			ctx.beginPath();
			ctx.moveTo(-legSpread, ry * 0.85 + 205 * scale);
			ctx.lineTo(-legSpread - 4 * scale, ry * 0.85 + 330 * scale);
			ctx.moveTo(legSpread, ry * 0.85 + 205 * scale);
			ctx.lineTo(legSpread + 4 * scale, ry * 0.85 + 330 * scale);
			ctx.stroke();

			const bx = -64 * scale;
			const by = ry * 0.78;
			const bw = 128 * scale;
			const bh = 225 * scale;
			const tg = ctx.createLinearGradient(bx, by, bx + bw, by);
			tg.addColorStop(0, shirtShadow);
			tg.addColorStop(0.38, shirtColor);
			tg.addColorStop(1, shirtColor);

			roundRectPath(ctx, bx, by, bw, bh, 56 * scale);
			ctx.fillStyle = tg;
			ctx.fill();
			ctx.lineWidth = lw;
			ctx.strokeStyle = "#080b0f";
			ctx.stroke();

			if (badge) {
				ctx.strokeStyle = "#2998e5";
				ctx.lineWidth = 5 * scale;
				ctx.beginPath();
				ctx.moveTo(-20 * scale, by + 14 * scale);
				ctx.lineTo(0, by + 92 * scale);
				ctx.lineTo(20 * scale, by + 14 * scale);
				ctx.stroke();

				roundRectPath(
					ctx,
					-30 * scale,
					by + 90 * scale,
					60 * scale,
					36 * scale,
					5 * scale,
				);
				ctx.fillStyle = "#f5f8fc";
				ctx.fill();
				ctx.lineWidth = 3 * scale;
				ctx.strokeStyle = "#080b0f";
				ctx.stroke();
				ctx.fillStyle = "#165ba8";
				ctx.font = `900 ${Math.round(15 * scale)}px BeVietnamPro, sans-serif`;
				ctx.textAlign = "center";
				ctx.fillText(badge, 0, by + 114 * scale);
			} else if (hasMoustache) {
				ctx.fillStyle = "#a82838";
				ctx.beginPath();
				ctx.moveTo(0, by + 14 * scale);
				ctx.lineTo(-13 * scale, by + 95 * scale);
				ctx.lineTo(0, by + 116 * scale);
				ctx.lineTo(13 * scale, by + 95 * scale);
				ctx.closePath();
				ctx.fill();
			}
		}

		// Oval white head
		ctx.save();
		ctx.beginPath();
		ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
		const hg = ctx.createRadialGradient(
			rx * 0.22 * facing,
			-ry * 0.18,
			rx * 0.15,
			0,
			0,
			rx * 1.15,
		);
		hg.addColorStop(0, "#f7faff");
		hg.addColorStop(0.72, "#eef3f9");
		hg.addColorStop(1, "#cfdbe8");
		ctx.fillStyle = hg;
		ctx.fill();

		if (emotion === "stomach_doom") {
			const sg = ctx.createLinearGradient(0, -ry, 0, ry * 0.35);
			sg.addColorStop(0, "rgba(74, 198, 118, 0.62)");
			sg.addColorStop(1, "rgba(74, 198, 118, 0)");
			ctx.fillStyle = sg;
			ctx.fill();
		} else if (emotion === "dread") {
			const dg = ctx.createLinearGradient(0, -ry * 0.95, 0, ry * 0.35);
			dg.addColorStop(0, "rgba(16, 26, 44, 0.62)");
			dg.addColorStop(0.55, "rgba(26, 38, 58, 0.24)");
			dg.addColorStop(1, "rgba(26, 38, 58, 0)");
			ctx.fillStyle = dg;
			ctx.fill();
		} else if (["villain", "cold", "greed"].includes(emotion)) {
			const dg = ctx.createLinearGradient(0, -ry, 0, ry * 0.2);
			dg.addColorStop(0, "rgba(18, 28, 42, 0.42)");
			dg.addColorStop(1, "rgba(18, 28, 42, 0)");
			ctx.fillStyle = dg;
			ctx.fill();
		}
		ctx.lineWidth = lw;
		ctx.strokeStyle = "#080b0f";
		ctx.stroke();
		ctx.restore();

		const faceShiftX = 12 * scale * facing;
		const eyeY = 2 * scale;
		const eyeSpan = 42 * scale;
		const blinkCycle = (t + (facing < 0 ? 1.3 : 0.4)) % 3.6;
		const isBlinking =
			blinkCycle > 3.46 &&
			!["greed", "shock_greed", "glow_eyes", "panic", "stomach_doom"].includes(
				emotion,
			);

		for (const side of [-1, 1]) {
			const ex = faceShiftX + side * eyeSpan;
			if (emotion === "glow_eyes") {
				ctx.save();
				ctx.shadowColor = "#42d4ff";
				ctx.shadowBlur = 24 * scale;
				ctx.fillStyle = "#bbf2ff";
				ctx.beginPath();
				ctx.ellipse(ex, eyeY, 15 * scale, 9 * scale, 0, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
			} else if (emotion === "greed" || emotion === "shock_greed") {
				ctx.fillStyle = "#0b0e12";
				ctx.beginPath();
				ctx.ellipse(ex, eyeY, 17 * scale, 24 * scale, 0, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = "#ffd43b";
				ctx.font = `900 ${Math.round(28 * scale)}px BeVietnamPro, sans-serif`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText("$", ex, eyeY + 1 * scale);
			} else if (emotion === "panic" || emotion === "stomach_doom") {
				ctx.fillStyle = "#ffffff";
				ctx.strokeStyle = "#080b0f";
				ctx.lineWidth = 4 * scale;
				ctx.beginPath();
				ctx.ellipse(ex, eyeY, 18 * scale, 24 * scale, 0, 0, Math.PI * 2);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = "#080b0f";
				ctx.beginPath();
				ctx.arc(
					ex + Math.sin(t * 40) * 2 * scale,
					eyeY,
					5.5 * scale,
					0,
					Math.PI * 2,
				);
				ctx.fill();
			} else {
				ctx.fillStyle = "#080b0f";
				ctx.beginPath();
				ctx.ellipse(
					ex,
					eyeY,
					11.5 * scale,
					isBlinking ? 2.5 * scale : 20 * scale,
					0,
					0,
					Math.PI * 2,
				);
				ctx.fill();
			}
		}

		// L-Nose
		ctx.strokeStyle = "#080b0f";
		ctx.lineWidth = Math.max(3, 6.2 * scale);
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.beginPath();
		ctx.moveTo(faceShiftX + 2 * scale * facing, eyeY - 4 * scale);
		ctx.lineTo(faceShiftX - 3 * scale * facing, eyeY + 26 * scale);
		ctx.lineTo(faceShiftX + 11 * scale * facing, eyeY + 24 * scale);
		ctx.stroke();

		// Brows
		ctx.lineWidth = Math.max(3.5, 7.5 * scale);
		const browY = eyeY - 30 * scale;
		const drawBrows = (lIn, lOut, rIn, rOut) => {
			ctx.beginPath();
			ctx.moveTo(faceShiftX - eyeSpan - 18 * scale, browY + lOut * scale);
			ctx.lineTo(faceShiftX - eyeSpan + 16 * scale, browY + lIn * scale);
			ctx.moveTo(faceShiftX + eyeSpan - 16 * scale, browY + rIn * scale);
			ctx.lineTo(faceShiftX + eyeSpan + 18 * scale, browY + rOut * scale);
			ctx.stroke();
		};
		if (
			[
				"smirk",
				"cold",
				"angry",
				"villain",
				"greed",
				"glow_eyes",
				"dread",
			].includes(emotion)
		) {
			drawBrows(
				emotion === "dread" ? 12 : 10,
				emotion === "dread" ? -9 : -7,
				10,
				-7,
			);
		} else if (["panic", "stomach_doom"].includes(emotion)) {
			drawBrows(-10, 9, -10, 9);
		} else if (emotion === "smug") {
			drawBrows(8, -4, -9, -2);
		} else {
			drawBrows(-2, 2, -2, 2);
		}

		const mouthY = eyeY + 52 * scale;
		if (hasMoustache) {
			ctx.fillStyle = "#363038";
			ctx.strokeStyle = "#080b0f";
			ctx.lineWidth = 4 * scale;
			ctx.beginPath();
			ctx.ellipse(
				faceShiftX,
				mouthY - 12 * scale,
				26 * scale,
				8 * scale,
				0,
				Math.PI,
				0,
				false,
			);
			ctx.fill();
			ctx.stroke();
		}

		if (mouthOpen > 0.08 && pose !== "fainted") {
			const mw = (18 + mouthOpen * 22) * scale;
			const mh = (8 + mouthOpen * 22) * scale;
			ctx.fillStyle = "#ffffff";
			ctx.strokeStyle = "#080b0f";
			ctx.lineWidth = Math.max(3, 5.2 * scale);
			roundRectPath(
				ctx,
				faceShiftX - mw * 0.5,
				mouthY - mh * 0.45,
				mw,
				mh,
				6 * scale,
			);
			ctx.fill();
			ctx.stroke();
		} else {
			ctx.strokeStyle = "#080b0f";
			ctx.lineWidth = Math.max(3, 6 * scale);
			ctx.beginPath();
			if (["smirk", "smug", "villain", "greed"].includes(emotion)) {
				ctx.moveTo(faceShiftX - 18 * scale, mouthY + 2 * scale);
				ctx.quadraticCurveTo(
					faceShiftX + 4 * scale,
					mouthY + 11 * scale,
					faceShiftX + 22 * scale * facing,
					mouthY - 7 * scale,
				);
			} else if (["happy", "fake_smile"].includes(emotion)) {
				ctx.arc(
					faceShiftX,
					mouthY - 4 * scale,
					16 * scale,
					0.15 * Math.PI,
					0.85 * Math.PI,
				);
			} else if (["panic", "stomach_doom"].includes(emotion)) {
				ctx.ellipse(
					faceShiftX,
					mouthY + 2 * scale,
					14 * scale,
					9 * scale,
					0,
					0,
					Math.PI * 2,
				);
			} else {
				ctx.moveTo(faceShiftX - 14 * scale, mouthY);
				ctx.lineTo(faceShiftX + 14 * scale, mouthY + 2 * scale);
			}
			ctx.stroke();
		}

		if (emotion === "panic" || emotion === "stomach_doom") {
			for (let s = 0; s < 3; s++) {
				const dropP = (t * 2.4 + s * 0.33) % 1;
				const dx = s === 0 ? -rx * 0.78 : s === 1 ? rx * 0.76 : rx * 0.52;
				const dy = -ry * 0.35 + dropP * 55 * scale;
				ctx.fillStyle = "#74d2ff";
				ctx.strokeStyle = "#080b0f";
				ctx.lineWidth = 2.5 * scale;
				ctx.beginPath();
				ctx.ellipse(dx, dy, 6.5 * scale, 11 * scale, 0, 0, Math.PI * 2);
				ctx.fill();
				ctx.stroke();
			}
		}

		// Hair styles
		ctx.save();
		if (hairStyle === "slick_side") {
			ctx.beginPath();
			ctx.moveTo(-rx * 1.04, -ry * 0.36);
			ctx.bezierCurveTo(
				-rx * 1.12,
				-ry * 0.98,
				-rx * 0.45,
				-ry * 1.35,
				rx * 0.25,
				-ry * 1.25,
			);
			ctx.bezierCurveTo(
				rx * 0.95,
				-ry * 1.2,
				rx * 1.16,
				-ry * 0.76,
				rx * 1.04,
				-ry * 0.34,
			);
			ctx.bezierCurveTo(
				rx * 0.62,
				-ry * 0.44,
				rx * 0.15,
				-ry * 0.36,
				-rx * 0.32,
				-ry * 0.58,
			);
			ctx.bezierCurveTo(
				-rx * 0.58,
				-ry * 0.36,
				-rx * 0.85,
				-ry * 0.32,
				-rx * 1.04,
				-ry * 0.36,
			);
			ctx.closePath();
		} else if (hairStyle === "curly_exec") {
			ctx.beginPath();
			ctx.arc(0, -ry * 0.24, rx * 1.03, Math.PI * 1.04, Math.PI * 1.96);
			ctx.quadraticCurveTo(rx * 0.4, -ry * 0.58, 0, -ry * 0.52);
			ctx.quadraticCurveTo(-rx * 0.4, -ry * 0.58, -rx * 1.02, -ry * 0.3);
			ctx.closePath();
		} else if (hairStyle === "sparse_bald") {
			ctx.strokeStyle = "#080b0f";
			ctx.lineWidth = 6.5 * scale;
			ctx.lineCap = "round";
			for (const sx of [-rx * 0.24, 0, rx * 0.24]) {
				ctx.beginPath();
				ctx.moveTo(sx, -ry * 0.92);
				ctx.quadraticCurveTo(
					sx + 10 * scale * facing,
					-ry * 1.24,
					sx + 24 * scale * facing,
					-ry * 1.08,
				);
				ctx.stroke();
			}
		} else {
			ctx.beginPath();
			ctx.moveTo(-rx * 1.06, -ry * 0.34);
			ctx.bezierCurveTo(
				-rx * 1.2,
				-ry * 0.92,
				-rx * 0.68,
				-ry * 1.32,
				-rx * 0.04,
				-ry * 1.2,
			);
			ctx.bezierCurveTo(
				rx * 0.62,
				-ry * 1.34,
				rx * 1.2,
				-ry * 0.92,
				rx * 1.08,
				-ry * 0.32,
			);
			ctx.quadraticCurveTo(rx * 0.88, -ry * 0.22, rx * 0.68, -ry * 0.34);
			ctx.quadraticCurveTo(rx * 0.46, -ry * 0.24, rx * 0.24, -ry * 0.36);
			ctx.bezierCurveTo(
				rx * 0.16,
				-ry * 0.76,
				-rx * 0.12,
				-ry * 0.76,
				-rx * 0.2,
				-ry * 0.38,
			);
			ctx.quadraticCurveTo(-rx * 0.45, -ry * 0.26, -rx * 0.68, -ry * 0.36);
			ctx.quadraticCurveTo(-rx * 0.88, -ry * 0.24, -rx * 1.06, -ry * 0.34);
			ctx.closePath();
		}
		if (hairStyle !== "sparse_bald") {
			ctx.fillStyle = hairColor;
			ctx.fill();
			if (rimCyan) {
				ctx.save();
				ctx.clip();
				ctx.strokeStyle = "#5bc0ff";
				ctx.lineWidth = lw * 1.15;
				ctx.stroke();
				ctx.restore();
			}
			ctx.strokeStyle = "#080b0f";
			ctx.lineWidth = lw;
			ctx.stroke();
		}
		ctx.restore();

		// Noodle arms
		if (showBody) {
			const shY = ry * 0.95;
			const drawArm = (sx, sy, cx1, cy1, hx, hy) => {
				ctx.strokeStyle = "#080b0f";
				ctx.lineWidth = lw * 1.02;
				ctx.lineCap = "round";
				ctx.beginPath();
				ctx.moveTo(sx, sy);
				ctx.quadraticCurveTo(cx1, cy1, hx, hy);
				ctx.stroke();
				ctx.fillStyle = "#080b0f";
				ctx.beginPath();
				ctx.ellipse(hx, hy, 13 * scale, 16 * scale, 0.2, 0, Math.PI * 2);
				ctx.fill();
			};
			const talkWave =
				Math.sin(t * 9.5) * 18 * scale * (mouthOpen > 0.05 ? 1 : 0.2);

			if (pose === "chest") {
				drawArm(
					-58 * scale,
					shY + 12 * scale,
					-62 * scale,
					shY + 125 * scale,
					-12 * scale,
					shY + 95 * scale,
				);
				drawArm(
					58 * scale,
					shY + 12 * scale,
					68 * scale,
					shY + 115 * scale,
					64 * scale,
					shY + 185 * scale,
				);
			} else if (pose === "talk") {
				drawArm(
					-58 * scale,
					shY + 12 * scale,
					-72 * scale,
					shY + 120 * scale,
					-64 * scale,
					shY + 185 * scale,
				);
				drawArm(
					58 * scale,
					shY + 12 * scale,
					95 * scale * facing,
					shY + 95 * scale,
					95 * facing * scale,
					shY + 55 * scale + talkWave,
				);
			} else if (pose === "phone_spy") {
				const px = 92 * scale * facing;
				const py = shY + 28 * scale;
				drawArm(
					52 * scale * facing,
					shY + 15 * scale,
					85 * scale * facing,
					shY + 80 * scale,
					px,
					py + 24 * scale,
				);
				roundRectPath(
					ctx,
					px - 18 * scale,
					py - 32 * scale,
					36 * scale,
					64 * scale,
					6 * scale,
				);
				ctx.fillStyle = "#18222e";
				ctx.fill();
				ctx.lineWidth = 3.5 * scale;
				ctx.strokeStyle = "#9ad8ff";
				ctx.stroke();
			} else if (pose === "tablet") {
				const tx = 86 * scale * facing;
				const ty = shY + 68 * scale;
				drawArm(
					52 * scale * facing,
					shY + 15 * scale,
					78 * scale * facing,
					shY + 95 * scale,
					tx,
					ty + 18 * scale,
				);
				roundRectPath(
					ctx,
					tx - 38 * scale,
					ty - 26 * scale,
					76 * scale,
					52 * scale,
					7 * scale,
				);
				ctx.fillStyle = "#10283b";
				ctx.fill();
				ctx.lineWidth = 4 * scale;
				ctx.strokeStyle = "#48dcff";
				ctx.stroke();
			} else if (pose === "hold_phone") {
				const px = 86 * scale * facing;
				const py = shY + 52 * scale;
				drawArm(
					-56 * scale * facing,
					shY + 12 * scale,
					-66 * scale * facing,
					shY + 105 * scale,
					-58 * scale * facing,
					shY + 175 * scale,
				);
				drawArm(
					52 * scale * facing,
					shY + 14 * scale,
					74 * scale * facing,
					shY + 95 * scale,
					px - 8 * scale * facing,
					py + 22 * scale,
				);
				ctx.save();
				ctx.translate(px, py);
				ctx.rotate(facing * -0.26);
				roundRectPath(
					ctx,
					-28 * scale,
					-44 * scale,
					56 * scale,
					88 * scale,
					9 * scale,
				);
				ctx.fillStyle = "#1c232d";
				ctx.fill();
				ctx.lineWidth = 4 * scale;
				ctx.strokeStyle = "#080b0f";
				ctx.stroke();
				// Dual rear camera lenses
				for (const [lx, ly] of [
					[-12 * scale, -28 * scale],
					[-12 * scale, -14 * scale],
				]) {
					ctx.beginPath();
					ctx.arc(lx, ly, 5.2 * scale, 0, Math.PI * 2);
					ctx.fillStyle = "#080b0f";
					ctx.fill();
					ctx.lineWidth = 1.6 * scale;
					ctx.strokeStyle = "#6c7a89";
					ctx.stroke();
				}
				ctx.restore();
			} else if (pose === "stomach_clutch") {
				drawArm(
					-58 * scale,
					shY + 15 * scale,
					-78 * scale,
					shY + 95 * scale,
					-18 * scale,
					shY + 128 * scale,
				);
				drawArm(
					58 * scale,
					shY + 15 * scale,
					78 * scale,
					shY + 95 * scale,
					18 * scale,
					shY + 128 * scale,
				);
			} else {
				drawArm(
					-58 * scale,
					shY + 12 * scale,
					-70 * scale,
					shY + 110 * scale,
					-64 * scale,
					shY + 185 * scale,
				);
				drawArm(
					58 * scale,
					shY + 12 * scale,
					70 * scale,
					shY + 110 * scale,
					64 * scale,
					shY + 185 * scale,
				);
			}
		}
		if (emotion === "dread" || emotion === "panic") {
			const vib = Math.sin(t * 28.0) * 2.5 * scale;
			ctx.strokeStyle = "rgba(255,255,255,0.65)";
			ctx.lineWidth = 3.2 * scale;
			ctx.lineCap = "round";
			for (const side of [-1, 1]) {
				for (const ring of [0, 1]) {
					const ox = side * (rx + (20 + ring * 13) * scale) + vib * 0.4;
					ctx.beginPath();
					ctx.arc(
						ox,
						-ry * 0.25,
						22 * scale,
						side < 0 ? Math.PI * 0.68 : -Math.PI * 0.32,
						side < 0 ? Math.PI * 1.32 : Math.PI * 0.32,
					);
					ctx.stroke();
				}
			}
		}
		ctx.restore();
	}

	function drawAvatarPortrait(c, kind, size, customImg, opts = {}) {
		const isCutout = Boolean(opts && opts.cutoutMode);
		c.save();
		if (isCutout) {
			c.beginPath();
			c.arc(size * 0.5, size * 0.5, size * 0.49, 0, Math.PI * 2);
			c.save();
			c.clip();
		} else {
			roundRectPath(c, 0, 0, size, size, size * 0.16);
			c.fillStyle = "#d9e1ea";
			c.fill();
			c.save();
			c.clip();
		}

		if (customImg) {
			const iw = customImg.naturalWidth || size;
			const ih = customImg.naturalHeight || size;
			const sc = Math.max(size / iw, size / ih);
			c.drawImage(
				customImg,
				(size - iw * sc) / 2,
				(size - ih * sc) / 2,
				iw * sc,
				ih * sc,
			);
			c.restore();
			if (!isCutout) {
				c.lineWidth = Math.max(4, size * 0.04);
				c.strokeStyle = "#0b1016";
				roundRectPath(c, 0, 0, size, size, size * 0.16);
				c.stroke();
			}
			c.restore();
			return;
		}

		if (isCutout) {
			const cg = c.createRadialGradient(
				size * 0.5,
				size * 0.5,
				size * 0.05,
				size * 0.5,
				size * 0.5,
				size * 0.5,
			);
			cg.addColorStop(0, "rgba(28, 36, 48, 0.95)");
			cg.addColorStop(0.75, "rgba(15, 21, 29, 0.85)");
			cg.addColorStop(1, "rgba(10, 14, 20, 0)");
			c.fillStyle = cg;
		} else {
			const bg = c.createLinearGradient(0, 0, 0, size);
			bg.addColorStop(0, "#cfd8e3");
			bg.addColorStop(1, "#7c8896");
			c.fillStyle = bg;
		}
		c.fillRect(0, 0, size, size);

		const s = size / 180;
		const cx = size * 0.5;
		const cy = size * 0.56;
		c.lineJoin = "round";
		c.lineCap = "round";

		if (kind === "tiger") {
			// Ears
			for (const sd of [-1, 1]) {
				c.fillStyle = "#c97428";
				c.strokeStyle = "#0a0d12";
				c.lineWidth = 4.5 * s;
				c.beginPath();
				c.arc(cx + sd * 48 * s, cy - 42 * s, 20 * s, 0, Math.PI * 2);
				c.fill();
				c.stroke();
			}
			// Broad feline head
			c.fillStyle = "#d9822b";
			c.beginPath();
			c.ellipse(cx, cy + 4 * s, 58 * s, 54 * s, 0, 0, Math.PI * 2);
			c.fill();
			c.stroke();
			// Pale cheek muffs
			c.fillStyle = "#edeae4";
			for (const sd of [-1, 1]) {
				c.beginPath();
				c.ellipse(
					cx + sd * 28 * s,
					cy + 20 * s,
					26 * s,
					22 * s,
					sd * 0.2,
					0,
					Math.PI * 2,
				);
				c.fill();
			}
			// Tiger stripes
			c.strokeStyle = "#14100d";
			c.lineWidth = 5 * s;
			for (const yOff of [-36, -24, -12]) {
				c.beginPath();
				c.moveTo(cx - 24 * s, cy + yOff * s);
				c.lineTo(cx, cy + (yOff + 6) * s);
				c.lineTo(cx + 24 * s, cy + yOff * s);
				c.stroke();
			}
			// Glowing pinhole eyes
			for (const sd of [-1, 1]) {
				c.fillStyle = "#090b0e";
				c.beginPath();
				c.ellipse(
					cx + sd * 21 * s,
					cy - 6 * s,
					11 * s,
					6 * s,
					sd * -0.25,
					0,
					Math.PI * 2,
				);
				c.fill();
				c.fillStyle = "#ffffff";
				c.beginPath();
				c.arc(cx + sd * 20 * s, cy - 6 * s, 3.2 * s, 0, Math.PI * 2);
				c.fill();
			}
			// Snarl nose & fangs
			c.fillStyle = "#7a2c38";
			c.beginPath();
			c.moveTo(cx - 10 * s, cy + 12 * s);
			c.lineTo(cx + 10 * s, cy + 12 * s);
			c.lineTo(cx, cy + 23 * s);
			c.closePath();
			c.fill();
			c.fillStyle = "#180d0e";
			c.beginPath();
			c.ellipse(cx, cy + 36 * s, 19 * s, 12 * s, 0, 0, Math.PI * 2);
			c.fill();
		} else if (kind === "gorilla") {
			c.fillStyle = "#26282e";
			c.strokeStyle = "#090b0e";
			c.lineWidth = 4.5 * s;
			c.beginPath();
			c.arc(cx, cy - 10 * s, 54 * s, 0, Math.PI * 2);
			c.fill();
			c.stroke();
			c.beginPath();
			c.ellipse(cx, cy + 34 * s, 66 * s, 38 * s, 0, Math.PI, 0);
			c.fill();
			c.stroke();
			c.fillStyle = "#564a46";
			c.beginPath();
			c.ellipse(cx, cy + 8 * s, 38 * s, 30 * s, 0, 0, Math.PI * 2);
			c.fill();
			for (const sd of [-1, 1]) {
				c.fillStyle = "#0a0c0f";
				c.beginPath();
				c.arc(cx + sd * 15 * s, cy - 6 * s, 9 * s, 0, Math.PI * 2);
				c.fill();
				c.fillStyle = "#ffffff";
				c.beginPath();
				c.arc(cx + sd * 14 * s, cy - 6 * s, 3.3 * s, 0, Math.PI * 2);
				c.fill();
			}
			// Roaring teeth
			c.fillStyle = "#12090b";
			roundRectPath(c, cx - 22 * s, cy + 18 * s, 44 * s, 18 * s, 6 * s);
			c.fill();
			c.fillStyle = "#f4f4f6";
			c.fillRect(cx - 18 * s, cy + 20 * s, 36 * s, 6 * s);
		} else if (kind === "parrot") {
			c.fillStyle = "#3c4b59";
			c.strokeStyle = "#090b0f";
			c.lineWidth = 4.5 * s;
			c.beginPath();
			c.ellipse(cx - 6 * s, cy + 18 * s, 58 * s, 66 * s, 0.15, 0, Math.PI * 2);
			c.fill();
			c.stroke();
			// Wing highlight & yellow crown
			c.fillStyle = "#6c7f67";
			c.beginPath();
			c.ellipse(cx - 20 * s, cy + 38 * s, 34 * s, 44 * s, 0.2, 0, Math.PI * 2);
			c.fill();
			// Sharp hooked black beak
			c.fillStyle = "#181d22";
			c.beginPath();
			c.moveTo(cx + 22 * s, cy - 22 * s);
			c.quadraticCurveTo(cx + 76 * s, cy - 10 * s, cx + 52 * s, cy + 36 * s);
			c.quadraticCurveTo(cx + 30 * s, cy + 10 * s, cx + 16 * s, cy + 14 * s);
			c.closePath();
			c.fill();
			c.stroke();
			// Pale face patch + sinister glowing eye
			c.fillStyle = "#dce2e8";
			c.beginPath();
			c.ellipse(cx + 8 * s, cy - 12 * s, 18 * s, 14 * s, 0, 0, Math.PI * 2);
			c.fill();
			c.fillStyle = "#0a0c0f";
			c.beginPath();
			c.arc(cx + 12 * s, cy - 12 * s, 6 * s, 0, Math.PI * 2);
			c.fill();
			c.fillStyle = "#ffffff";
			c.beginPath();
			c.arc(cx + 12 * s, cy - 12 * s, 2.5 * s, 0, Math.PI * 2);
			c.fill();
		} else if (kind === "skull") {
			c.fillStyle = "#d8dde4";
			c.strokeStyle = "#080b0f";
			c.lineWidth = 5 * s;
			c.beginPath();
			c.arc(cx, cy - 12 * s, 50 * s, 0, Math.PI * 2);
			c.fill();
			c.stroke();
			c.fillRect(cx - 28 * s, cy + 20 * s, 56 * s, 32 * s);
			c.strokeRect(cx - 28 * s, cy + 20 * s, 56 * s, 32 * s);
			for (const sd of [-1, 1]) {
				c.fillStyle = "#080b0f";
				c.beginPath();
				c.arc(cx + sd * 20 * s, cy - 8 * s, 14 * s, 0, Math.PI * 2);
				c.fill();
				c.fillStyle = "#ff4252";
				c.beginPath();
				c.arc(cx + sd * 20 * s, cy - 8 * s, 4 * s, 0, Math.PI * 2);
				c.fill();
			}
			for (let t = -16; t <= 16; t += 11) {
				c.fillStyle = "#080b0f";
				c.fillRect(cx + t * s, cy + 26 * s, 3 * s, 20 * s);
			}
		} else if (kind === "hacker" || kind === "boss") {
			c.fillStyle = kind === "boss" ? "#1e293b" : "#111820";
			c.strokeStyle = "#070a0f";
			c.lineWidth = 5 * s;
			c.beginPath();
			c.ellipse(cx, cy + 56 * s, 66 * s, 42 * s, 0, Math.PI, 0);
			c.fill();
			c.stroke();
			c.fillStyle = "#eef3f9";
			c.beginPath();
			c.arc(cx, cy - 8 * s, 42 * s, 0, Math.PI * 2);
			c.fill();
			c.stroke();
			// Dark hoodie shadow or boss sunglasses
			if (kind === "hacker") {
				c.fillStyle = "#0c131d";
				c.beginPath();
				c.arc(cx, cy - 12 * s, 48 * s, Math.PI * 0.9, Math.PI * 2.1);
				c.fill();
			}
			for (const sd of [-1, 1]) {
				c.fillStyle = "#090d14";
				roundRectPath(
					c,
					cx + sd * 18 * s - 12 * s,
					cy - 16 * s,
					24 * s,
					13 * s,
					4 * s,
				);
				c.fill();
				c.fillStyle = "#48dcff";
				c.beginPath();
				c.arc(cx + sd * 18 * s, cy - 10 * s, 3 * s, 0, Math.PI * 2);
				c.fill();
			}
		} else {
			// Elephant default
			c.fillStyle = "#5f5a55";
			c.strokeStyle = "#090b0f";
			c.lineWidth = 4.5 * s;
			// Flared ears
			for (const sd of [-1, 1]) {
				c.beginPath();
				c.ellipse(
					cx + sd * 46 * s,
					cy - 8 * s,
					32 * s,
					44 * s,
					sd * 0.12,
					0,
					Math.PI * 2,
				);
				c.fill();
				c.stroke();
			}
			// Dome head + long wrinkled trunk
			c.fillStyle = "#797169";
			c.beginPath();
			c.arc(cx, cy - 12 * s, 44 * s, 0, Math.PI * 2);
			c.fill();
			c.stroke();
			c.beginPath();
			c.moveTo(cx - 16 * s, cy + 4 * s);
			c.quadraticCurveTo(cx - 8 * s, cy + 56 * s, cx + 18 * s, cy + 68 * s);
			c.lineTo(cx + 28 * s, cy + 56 * s);
			c.quadraticCurveTo(cx + 12 * s, cy + 36 * s, cx + 16 * s, cy + 4 * s);
			c.closePath();
			c.fill();
			c.stroke();
			// Ivory tusks
			c.fillStyle = "#f1efe9";
			for (const sd of [-1, 1]) {
				c.beginPath();
				c.moveTo(cx + sd * 20 * s, cy + 18 * s);
				c.quadraticCurveTo(
					cx + sd * 32 * s,
					cy + 46 * s,
					cx + sd * 46 * s,
					cy + 52 * s,
				);
				c.quadraticCurveTo(
					cx + sd * 26 * s,
					cy + 34 * s,
					cx + sd * 14 * s,
					cy + 20 * s,
				);
				c.closePath();
				c.fill();
				c.stroke();
			}
			// Sinister tiny glowing eyes
			for (const sd of [-1, 1]) {
				c.fillStyle = "#080b0f";
				c.beginPath();
				c.ellipse(
					cx + sd * 20 * s,
					cy - 12 * s,
					7 * s,
					5 * s,
					sd * -0.2,
					0,
					Math.PI * 2,
				);
				c.fill();
				c.fillStyle = "#ffffff";
				c.beginPath();
				c.arc(cx + sd * 20 * s, cy - 12 * s, 2.3 * s, 0, Math.PI * 2);
				c.fill();
			}
		}

		c.restore();
		if (!isCutout) {
			c.lineWidth = Math.max(4, size * 0.036);
			c.strokeStyle = "#090d14";
			roundRectPath(c, 0, 0, size, size, size * 0.16);
			c.stroke();
		}
		c.restore();
	}

	function drawCreatureCutout(c, kind, x, y, scale, t, customImg) {
		c.save();
		const sway = Math.sin(t * 1.9) * 6;
		c.translate(x, y + sway);
		if (customImg) {
			const h = 540 * scale;
			const w =
				h *
				((customImg.naturalWidth || 1) /
					Math.max(1, customImg.naturalHeight || 1));
			c.shadowColor = "rgba(0,0,0,0.75)";
			c.shadowBlur = 24;
			c.drawImage(customImg, -w / 2, -h / 2, w, h);
			c.restore();
			return;
		}
		// Dark looming beast torso behind cutout bust
		const bodyW = 290 * scale;
		const bodyH = 290 * scale;
		c.save();
		c.fillStyle = "#0f151d";
		c.beginPath();
		c.ellipse(0, 120 * scale, bodyW * 0.72, bodyH * 0.65, 0, 0, Math.PI * 2);
		c.fill();
		c.lineWidth = 6 * scale;
		c.strokeStyle = "#06090d";
		c.stroke();
		c.translate(-bodyW / 2, -bodyH / 2 - 30 * scale);
		drawAvatarPortrait(c, kind || "tiger", bodyW, null, { cutoutMode: true });
		c.restore();
		c.restore();
	}

	function drawForegroundBarrier(c, type, W, H) {
		if (!type || type === "none") return;
		c.save();
		if (type === "iron_cage") {
			c.fillStyle = "#10161e";
			c.strokeStyle = "#05070a";
			c.lineWidth = 5;
			for (let x = 110; x < W - 40; x += 155) {
				c.fillRect(x, H * 0.44, 18, H * 0.6);
				c.strokeRect(x, H * 0.44, 18, H * 0.6);
			}
			for (const ry of [H * 0.56, H * 0.78]) {
				c.fillStyle = "#18212d";
				c.fillRect(0, ry, W, 24);
				c.strokeRect(0, ry, W, 24);
			}
		} else {
			// Weathered wooden zoo fence across foreground lower third
			const posts = [170, 810, 1460];
			const gBeam = c.createLinearGradient(0, H * 0.62, 0, H * 0.94);
			gBeam.addColorStop(0, "#4f4139");
			gBeam.addColorStop(1, "#271f1b");
			for (const ry of [H * 0.65, H * 0.81]) {
				c.fillStyle = gBeam;
				c.fillRect(0, ry, W, 36);
				c.lineWidth = 5;
				c.strokeStyle = "#0b0e12";
				c.strokeRect(0, ry, W, 36);
			}
			for (const px of posts) {
				c.fillStyle = "#483b34";
				c.fillRect(px, H * 0.56, 52, H * 0.46);
				c.strokeStyle = "#090c10";
				c.lineWidth = 5;
				c.strokeRect(px, H * 0.56, 52, H * 0.46);
				c.fillStyle = "#615149";
				c.fillRect(px - 4, H * 0.54, 60, 22);
				c.strokeRect(px - 4, H * 0.54, 60, 22);
			}
		}
		c.restore();
	}

	function drawOtsBlurEdge(c, side, W, H, variant = "dark") {
		c.save();
		try {
			c.filter = "blur(12px)";
		} catch {
			// Fallback without canvas filter
		}
		if (variant === "ots_head_right") {
			// Giant foreground head & black cuff on right reading phone on left
			c.fillStyle = "rgba(8, 12, 18, 0.96)";
			c.beginPath();
			c.arc(W * 0.95, H * 0.25, 590, 0, Math.PI * 2);
			c.fill();
			c.fillStyle = "rgba(220, 228, 238, 0.95)";
			c.beginPath();
			c.arc(W * 0.93, H * 0.26, 480, 0, Math.PI * 2);
			c.fill();
			c.fillStyle = "rgba(9, 13, 19, 0.96)";
			c.beginPath();
			c.ellipse(W * 0.72, H * 0.76, 260, 120, 0.35, 0, Math.PI * 2);
			c.fill();
		} else {
			const bx = side === "left" ? 130 : W - 150;
			const lg = c.createLinearGradient(
				side === "left" ? 0 : W,
				0,
				side === "left" ? 360 : W - 360,
				0,
			);
			lg.addColorStop(0, "rgba(7, 10, 15, 0.96)");
			lg.addColorStop(0.65, "rgba(12, 17, 25, 0.85)");
			lg.addColorStop(1, "rgba(12, 17, 25, 0)");
			c.fillStyle = lg;
			c.fillRect(side === "left" ? -30 : bx - 170, H * 0.22, 420, H * 0.85);
		}
		c.restore();
	}

	// Render any scene onto a virtual 1920x1080 stage (auto-adapted when output canvas is 9:16 vertical!)
	function renderVirtual16x9(ctx, data, sc, localT, dur, t, frameIdx) {
		const W = 1920;
		const H = 1080;
		const chars = data.characters || {
			main: {
				name: "Nhân Vật Chính",
				shirtColor: "#2978a0",
				hairStyle: "wavy_part",
				hairColor: "#313840",
			},
			rival: {
				name: "Đối Thủ",
				badge: "VIP",
				shirtColor: "#7b4880",
				hairStyle: "slick_side",
				hairColor: "#3d2d27",
			},
			boss: {
				name: "Chủ Tịch",
				shirtColor: "#3a4554",
				hairStyle: "curly_exec",
				hairColor: "#423338",
				moustache: true,
			},
		};

		const getMouth = (id) =>
			(data.mouthEnv && data.mouthEnv[id] && data.mouthEnv[id][frameIdx]) || 0;
		const bgImg = getBgCanvas(sc.bg || "dark_lab", W, H);
		ctx.drawImage(bgImg, 0, 0);

		const customBg = getCachedImage(sc.bgImageUrl || sc.sceneImageUrl);
		if (customBg) {
			const iw = customBg.naturalWidth || W;
			const ih = customBg.naturalHeight || H;
			const coverScale = Math.max(W / iw, H / ih);
			ctx.drawImage(
				customBg,
				(W - iw * coverScale) / 2,
				(H - ih * coverScale) / 2,
				iw * coverScale,
				ih * coverScale,
			);
			ctx.fillStyle = "rgba(8, 13, 21, 0.24)";
			ctx.fillRect(0, 0, W, H);
		}

		const L = sc.layout || "two_shot";
		const title = sc.cardTitle || "";
		const lines = Array.isArray(sc.cardLines) ? sc.cardLines : [];
		const stamp = sc.stampText || "ĐÃ XÁC NHẬN!";

		const mainId = sc.leftChar || "main";
		const rivalId = sc.rightChar || "rival";
		const mainDef = chars[mainId] || chars.main;
		const rivalDef = chars[rivalId] || chars.rival;

		if (L === "ui_transfer_stamp") {
			ctx.save();
			ctx.translate(1060, 500);
			ctx.rotate(-0.025);
			roundRectPath(ctx, -640, -390, 1280, 780, 18);
			ctx.fillStyle = "#e9f1f7";
			ctx.fill();
			ctx.lineWidth = 9;
			ctx.strokeStyle = "#0e1722";
			ctx.stroke();

			ctx.fillStyle = "#1b2e40";
			roundRectPath(ctx, -640, -390, 1280, 88, 16);
			ctx.fill();
			ctx.fillStyle = "#ffffff";
			ctx.font = "800 31px BeVietnamPro, sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(
				(title || "HỆ THỐNG XÁC NHẬN GIAO DỊCH").slice(0, 48),
				-590,
				-334,
			);

			ctx.strokeStyle = "#2b3b4a";
			ctx.lineWidth = 4;
			ctx.strokeRect(-540, -230, 1080, 96);
			ctx.strokeRect(-540, -95, 1080, 96);

			ctx.fillStyle = "#16222e";
			ctx.font = "700 32px BeVietnamPro, sans-serif";
			ctx.fillText(
				(lines[0] || `NGƯỜI NHẬN: ${rivalDef.name.toUpperCase()}`).slice(0, 48),
				-510,
				-170,
			);

			const rawVal = lines[1] || "TOÀN BỘ QUYỀN QUẢN TRỊ 100%";
			const typedCount = Math.floor(clamp(localT / 0.85, 0, 1) * rawVal.length);
			ctx.font = "900 33px BeVietnamPro, sans-serif";
			ctx.fillStyle = "#b82535";
			ctx.fillText(rawVal.slice(0, typedCount), -510, -34);

			roundRectPath(ctx, -285, 97, 570, 96, 12);
			ctx.fillStyle = "#c93b4b";
			ctx.fill();
			ctx.lineWidth = 5;
			ctx.strokeStyle = "#181014";
			ctx.stroke();
			ctx.fillStyle = "#ffffff";
			ctx.textAlign = "center";
			ctx.font = "800 32px BeVietnamPro, sans-serif";
			ctx.fillText((lines[2] || "XÁC NHẬN CHUYỂN GIAO").slice(0, 28), 0, 156);

			if (localT >= 1.0) {
				const sp = easeOutBack(clamp((localT - 1.0) / 0.22, 0, 1));
				ctx.save();
				ctx.translate(20, 10);
				ctx.rotate(-0.11);
				ctx.scale(2.2 - 1.2 * sp, 2.2 - 1.2 * sp);
				roundRectPath(ctx, -340, -78, 680, 156, 14);
				ctx.fillStyle = "rgba(255, 248, 248, 0.95)";
				ctx.fill();
				ctx.lineWidth = 8;
				ctx.strokeStyle = "#d92638";
				ctx.stroke();
				ctx.fillStyle = "#d92638";
				ctx.font = "900 46px BeVietnamPro, sans-serif";
				ctx.fillText(stamp.slice(0, 26), 0, 16);
				ctx.restore();
			}
			ctx.restore();
			drawCharacter(ctx, mainDef, {
				x: 165,
				y: 470,
				scale: 2.35,
				facing: 1,
				emotion: "smirk",
				rimCyan: true,
				t,
			});
			return;
		}

		if (L === "ecu_main" || L === "ecu_glow_eyes") {
			drawCharacter(ctx, mainDef, {
				x: 960,
				y: 545,
				scale: 3.12,
				facing: 1,
				emotion:
					L === "ecu_glow_eyes" ? "glow_eyes" : sc.leftEmotion || "smirk",
				mouthOpen: getMouth(mainId),
				rimCyan: true,
				t,
			});
			return;
		}

		if (L === "ecu_rival") {
			drawCharacter(ctx, rivalDef, {
				x: 960,
				y: 545,
				scale: 3.05,
				facing: -1,
				emotion: sc.rightEmotion || "greed",
				mouthOpen: getMouth(rivalId),
				t,
			});
			return;
		}

		if (L === "over_monitor") {
			drawCharacter(ctx, mainDef, {
				x: 940,
				y: 430,
				scale: 2.35,
				facing: 1,
				emotion: sc.leftEmotion || "deadpan",
				mouthOpen: getMouth(mainId),
				rimCyan: true,
				t,
			});
			ctx.fillStyle = "#0b1118";
			ctx.fillRect(0, 920, W, 160);
			for (const [mx, my, mw, mh] of [
				[140, 680, 770, 290],
				[950, 650, 820, 320],
			]) {
				roundRectPath(ctx, mx, my, mw, mh, 10);
				ctx.fillStyle = "#16212c";
				ctx.fill();
				ctx.lineWidth = 8;
				ctx.strokeStyle = "#070a0e";
				ctx.stroke();
				ctx.fillStyle = "rgba(78, 200, 255, 0.55)";
				ctx.fillRect(mx + 8, my + 4, mw - 16, 7);
			}
			if (sc.alertPop) {
				ctx.strokeStyle = "#f4f9ff";
				ctx.lineWidth = 11;
				ctx.lineCap = "round";
				for (const [x1, y1, x2, y2] of [
					[385, 645, 345, 590],
					[460, 630, 452, 560],
					[535, 643, 562, 573],
				]) {
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.stroke();
				}
			}
			if (title) {
				roundRectPath(ctx, 520, 725, 880, 105, 12);
				ctx.fillStyle = "rgba(8, 36, 22, 0.92)";
				ctx.fill();
				ctx.strokeStyle = "#3ef08e";
				ctx.lineWidth = 4;
				ctx.stroke();
				ctx.fillStyle = "#5bffa2";
				ctx.textAlign = "center";
				ctx.font = "800 31px BeVietnamPro, sans-serif";
				ctx.fillText(title.slice(0, 44), 960, 788);
			}
			return;
		}

		if (L === "solo_stage_talk") {
			const spkId = sc.speaker || mainId;
			const cDef = chars[spkId] || mainDef;
			drawCharacter(ctx, cDef, {
				x: 820,
				y: 485,
				scale: 1.78,
				facing: 1,
				emotion: sc.leftEmotion || sc.rightEmotion || "smug",
				mouthOpen: getMouth(spkId),
				pose: "talk",
				t,
			});
			return;
		}

		if (L === "sneak_phone") {
			drawCharacter(ctx, mainDef, {
				x: 540,
				y: 490,
				scale: 1.55,
				facing: -1,
				emotion: "deadpan",
				mouthOpen: getMouth(mainId),
				rimCyan: true,
				t,
			});
			drawCharacter(ctx, rivalDef, {
				x: 1320,
				y: 470,
				scale: 1.78,
				facing: -1,
				emotion: "smug",
				mouthOpen: getMouth(rivalId),
				pose: "phone_spy",
				t,
			});
			drawPropItem(ctx, "cup_clean", 980, 770, 1.05, t);
			return;
		}

		if (L === "prop_phone_chat") {
			ctx.save();
			ctx.translate(960, 500);
			roundRectPath(ctx, -280, -430, 560, 860, 36);
			ctx.fillStyle = "#121c26";
			ctx.fill();
			ctx.lineWidth = 10;
			ctx.strokeStyle = "#7b8fa3";
			ctx.stroke();
			ctx.fillStyle = "#0a131c";
			ctx.fillRect(-250, -370, 500, 720);
			ctx.fillStyle = "#ffd43b";
			ctx.font = "800 24px BeVietnamPro, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText((title || "ĐIỆN THOẠI GHI HÌNH").slice(0, 34), 0, -322);

			ctx.textAlign = "left";
			ctx.font = "700 23px BeVietnamPro, sans-serif";
			lines.slice(0, 5).forEach((ln, idx) => {
				roundRectPath(ctx, -225, -260 + idx * 112, 450, 86, 14);
				ctx.fillStyle = idx % 2 === 0 ? "#1b2e42" : "#243b2c";
				ctx.fill();
				ctx.fillStyle = "#e7f5ff";
				const wrapped = wrapLines(ctx, ln, 415).slice(0, 2);
				wrapped.forEach((wl, wi) =>
					ctx.fillText(wl, -205, -222 + idx * 112 + wi * 30),
				);
			});
			ctx.restore();
			return;
		}

		if (L === "prop_terminal_code") {
			const spkId = sc.speaker || rivalId;
			drawCharacter(ctx, chars[spkId] || rivalDef, {
				x: 560,
				y: 485,
				scale: 1.72,
				facing: 1,
				emotion: sc.rightEmotion || sc.leftEmotion || "smug",
				mouthOpen: getMouth(spkId),
				pose: "talk",
				t,
			});
			const isErr = Boolean(sc.isError);
			roundRectPath(ctx, 940, 190, 820, 530, 18);
			ctx.fillStyle = isErr ? "#190c10" : "#0b1622";
			ctx.fill();
			ctx.lineWidth = 8;
			ctx.strokeStyle = isErr ? "#ff4252" : "#38d9a9";
			ctx.stroke();
			ctx.fillStyle = isErr ? "#ff6b6b" : "#38d9a9";
			ctx.font = "900 30px monospace";
			ctx.textAlign = "left";
			ctx.fillText((title || "// TERMINAL SYSTEM").slice(0, 38), 980, 265);
			ctx.font = "700 26px monospace";
			lines.slice(0, 5).forEach((ln, i) => {
				ctx.fillStyle = i === 0 ? "#ffd43b" : isErr ? "#ffa8a8" : "#a5d8ff";
				ctx.fillText(String(ln).slice(0, 44), 980, 345 + i * 72);
			});
			return;
		}

		if (L === "prop_board_table" || L === "prop_document_note") {
			const isDark = L === "prop_board_table" && sc.isError;
			roundRectPath(ctx, 260, 120, 1400, 740, 22);
			ctx.fillStyle = isDark ? "#1f0a10" : "#f8f6ee";
			ctx.fill();
			ctx.lineWidth = 9;
			ctx.strokeStyle = isDark ? "#ff3b4e" : "#1c2833";
			ctx.stroke();

			ctx.textAlign = "center";
			ctx.fillStyle = isDark ? "#ff6b6b" : "#c92a2a";
			ctx.font = "900 42px BeVietnamPro, sans-serif";
			ctx.fillText((title || "HỒ SƠ CHI TIẾT").slice(0, 46), 960, 215);

			ctx.textAlign = "left";
			ctx.font = "800 32px BeVietnamPro, sans-serif";
			lines.slice(0, 4).forEach((ln, i) => {
				ctx.fillStyle = isDark ? (i === 3 ? "#ffd43b" : "#ffe3e3") : "#1e293b";
				ctx.fillText(String(ln).slice(0, 62), 330, 330 + i * 108);
			});

			if (sc.stampText) {
				ctx.save();
				ctx.translate(960, 735);
				ctx.rotate(-0.07);
				roundRectPath(ctx, -270, -52, 540, 104, 12);
				ctx.strokeStyle = "#d92638";
				ctx.lineWidth = 7;
				ctx.stroke();
				ctx.fillStyle = "#d92638";
				ctx.textAlign = "center";
				ctx.font = "900 38px BeVietnamPro, sans-serif";
				ctx.fillText(sc.stampText.slice(0, 26), 0, 13);
				ctx.restore();
			}
			return;
		}

		if (L === "prop_magnifying_item") {
			const spkId = sc.speaker || rivalId;
			const isClean =
				sc.propKind === "cup_clean" ||
				sc.propKind === "usb_drive" ||
				sc.propKind === "contract";
			drawCharacter(ctx, chars[spkId] || rivalDef, {
				x: 600,
				y: 480,
				scale: 1.78,
				facing: 1,
				emotion: sc.rightEmotion || sc.leftEmotion || "villain",
				mouthOpen: getMouth(spkId),
				pose: "talk",
				t,
			});
			ctx.beginPath();
			ctx.arc(1340, 440, 240, 0, Math.PI * 2);
			ctx.fillStyle = "#162432";
			ctx.fill();
			ctx.lineWidth = 9;
			ctx.strokeStyle = isClean ? "#4ec8ff" : "#69db7c";
			ctx.stroke();

			drawPropItem(ctx, sc.propKind || "cup_poison", 1340, 465, 1.9, t);

			roundRectPath(ctx, 1060, 712, 560, 58, 12);
			ctx.fillStyle = "rgba(10, 16, 24, 0.88)";
			ctx.fill();
			ctx.lineWidth = 3;
			ctx.strokeStyle = isClean ? "#4ec8ff" : "#69db7c";
			ctx.stroke();
			ctx.fillStyle = isClean ? "#74c0fc" : "#8ce99a";
			ctx.textAlign = "center";
			ctx.font = "900 26px BeVietnamPro, sans-serif";
			ctx.fillText((title || "TANG VẬT MẤU CHỐT").slice(0, 32), 1340, 749);
			return;
		}

		if (L === "prop_breaker_padlock") {
			roundRectPath(ctx, 210, 160, 680, 660, 20);
			ctx.fillStyle = "#18222c";
			ctx.fill();
			ctx.lineWidth = 8;
			ctx.strokeStyle = "#080b0f";
			ctx.stroke();
			ctx.fillStyle = "#ff6b6b";
			ctx.textAlign = "center";
			ctx.font = "900 34px BeVietnamPro, sans-serif";
			ctx.fillText((lines[0] || "CẦU DAO TỔNG: OFF").slice(0, 26), 550, 250);
			roundRectPath(ctx, 460, 330, 180, 320, 14);
			ctx.fillStyle = "#2c3846";
			ctx.fill();
			ctx.stroke();
			const swY = lerp(380, 520, clamp(localT / 0.8, 0, 1));
			roundRectPath(ctx, 490, swY, 120, 75, 10);
			ctx.fillStyle = "#e03131";
			ctx.fill();

			roundRectPath(ctx, 1030, 160, 680, 660, 20);
			ctx.fillStyle = "#18222c";
			ctx.fill();
			ctx.strokeStyle = "#080b0f";
			ctx.stroke();
			ctx.fillStyle = "#ffd43b";
			ctx.fillText((lines[1] || "KHÓA TRÁI CỬA PHÒNG").slice(0, 26), 1370, 250);
			ctx.strokeStyle = "#adb5bd";
			ctx.lineWidth = 22;
			ctx.beginPath();
			ctx.arc(1370, 430, 75, Math.PI, 0);
			ctx.stroke();
			roundRectPath(ctx, 1265, 430, 210, 190, 22);
			ctx.fillStyle = "#f08c00";
			ctx.fill();
			ctx.lineWidth = 8;
			ctx.strokeStyle = "#080b0f";
			ctx.stroke();
			return;
		}

		if (L === "fake_collapse") {
			ctx.fillStyle = "#141e28";
			ctx.fillRect(180, 670, 920, 260);
			ctx.save();
			ctx.translate(560, 635);
			ctx.rotate(1.18);
			drawCharacter(ctx, mainDef, {
				x: 0,
				y: 0,
				scale: 1.45,
				facing: 1,
				emotion: "deadpan",
				pose: "fainted",
				t,
			});
			ctx.restore();
			drawCharacter(ctx, rivalDef, {
				x: 1320,
				y: 455,
				scale: 1.88,
				facing: -1,
				emotion: sc.rightEmotion || "villain",
				mouthOpen: getMouth(rivalId),
				pose: "talk",
				t,
			});
			return;
		}

		if (L === "stage_pitch") {
			const stageImg = getBgCanvas("stage_hall", W, H);
			ctx.drawImage(stageImg, 0, 0);
			ctx.textAlign = "center";
			ctx.fillStyle = "#4cc9f0";
			ctx.font = "900 40px BeVietnamPro, sans-serif";
			ctx.fillText((title || "SÂN KHẤU CHUNG KẾT").slice(0, 46), 960, 150);
			ctx.fillStyle = "#ffffff";
			ctx.font = "800 30px BeVietnamPro, sans-serif";
			ctx.fillText((lines[0] || "").slice(0, 56), 960, 212);

			const spkId = sc.speaker || rivalId;
			drawCharacter(ctx, chars[spkId] || rivalDef, {
				x: 960,
				y: 545,
				scale: 1.68,
				facing: 1,
				emotion: sc.rightEmotion || sc.leftEmotion || "smug",
				mouthOpen: getMouth(spkId),
				pose: "talk",
				t,
			});
			ctx.fillStyle = "#06090e";
			for (let i = 0; i < 11; i++) {
				ctx.beginPath();
				ctx.arc(120 + i * 170, 1075, 68, Math.PI, 0);
				ctx.fill();
			}
			return;
		}

		if (L === "red_alarm") {
			const stageImg = getBgCanvas("stage_expose", W, H);
			ctx.drawImage(stageImg, 0, 0);
			const flash = 0.78 + 0.22 * Math.sin(t * 18);
			roundRectPath(ctx, 220, 100, 1480, 740, 22);
			ctx.fillStyle = `rgba(165, 18, 32, ${flash})`;
			ctx.fill();
			ctx.lineWidth = 10;
			ctx.strokeStyle = "#ffec99";
			ctx.stroke();

			ctx.textAlign = "center";
			ctx.fillStyle = "#ffec99";
			ctx.font = "900 56px BeVietnamPro, sans-serif";
			ctx.fillText((title || "CẢNH BÁO HỆ THỐNG!").slice(0, 34), 960, 290);
			ctx.fillStyle = "#ffffff";
			ctx.font = "800 38px BeVietnamPro, sans-serif";
			ctx.fillText(
				(lines[0] || "PHÁT HIỆN DỮ LIỆU BẤT THƯỜNG").slice(0, 46),
				960,
				435,
			);
			ctx.fillStyle = "#ffd43b";
			ctx.font = "900 42px BeVietnamPro, sans-serif";
			ctx.fillText(
				(lines[1] || "KÍCH HOẠT CHẾ ĐỘ VẠCH TRẦN SỰ THẬT!").slice(0, 44),
				960,
				580,
			);
			return;
		}

		if (L === "stage_webcam_expose") {
			const stageImg = getBgCanvas("stage_expose", W, H);
			ctx.drawImage(stageImg, 0, 0);
			ctx.save();
			roundRectPath(ctx, 310, 110, 1300, 495, 14);
			ctx.fillStyle = "#0c2218";
			ctx.fill();
			ctx.clip();

			ctx.fillStyle = "#ff4252";
			ctx.beginPath();
			ctx.arc(365, 158, 11, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = "#8ce99a";
			ctx.textAlign = "left";
			ctx.font = "800 26px monospace";
			ctx.fillText(
				(title || "REC 4K CAM — BẰNG CHỨNG GỐC").slice(0, 48),
				392,
				167,
			);

			drawCharacter(ctx, rivalDef, {
				x: 1020,
				y: 375,
				scale: 1.12,
				facing: -1,
				emotion: "villain",
				showBody: true,
				t,
			});
			drawPropItem(ctx, "cup_poison", 820, 425, 0.9, t);
			ctx.restore();

			roundRectPath(ctx, 310, 110, 1300, 495, 14);
			ctx.lineWidth = 6;
			ctx.strokeStyle = "#51cf66";
			ctx.stroke();

			drawCharacter(ctx, rivalDef, {
				x: 420,
				y: 705,
				scale: 1.42,
				facing: 1,
				emotion: "panic",
				mouthOpen: getMouth(rivalId),
				pose: "talk",
				t,
			});
			return;
		}

		if (L === "grand_entrance") {
			roundRectPath(ctx, 720, 120, 480, 740, 12);
			const dg = ctx.createRadialGradient(960, 420, 30, 960, 420, 460);
			dg.addColorStop(0, "#d0ebff");
			dg.addColorStop(0.55, "#4dabf7");
			dg.addColorStop(1, "rgba(25, 65, 110, 0)");
			ctx.fillStyle = dg;
			ctx.fill();

			drawCharacter(ctx, mainDef, {
				x: 960,
				y: 475,
				scale: 1.85,
				facing: 1,
				emotion: "smirk",
				mouthOpen: getMouth(mainId),
				pose: "tablet",
				rimCyan: true,
				t,
			});
			return;
		}

		if (L === "karma_sprint") {
			const runX = lerp(
				920,
				1680,
				clamp(localT / Math.max(0.8, dur * 0.75), 0, 1),
			);
			drawCharacter(ctx, mainDef, {
				x: 480,
				y: 495,
				scale: 1.68,
				facing: 1,
				emotion: "smirk",
				mouthOpen: getMouth(mainId),
				pose: "tablet",
				t,
			});
			drawCharacter(ctx, rivalDef, {
				x: runX,
				y: 500,
				scale: 1.68,
				facing: 1,
				emotion: "stomach_doom",
				pose: "stomach_clutch",
				t,
			});
			ctx.strokeStyle = "rgba(255,255,255,0.65)";
			ctx.lineWidth = 6;
			for (let i = 0; i < 5; i++) {
				const ly = 380 + i * 65;
				ctx.beginPath();
				ctx.moveTo(runX - 280, ly);
				ctx.lineTo(runX - 130, ly);
				ctx.stroke();
			}
			return;
		}

		if (L === "ots_phone_groupchat") {
			ctx.save();
			ctx.translate(478, 588);
			ctx.rotate(-0.155);
			ctx.scale(0.91, 0.91);
			const pw = 560;
			const ph = 830;
			roundRectPath(ctx, -pw / 2 - 14, -ph / 2 - 14, pw + 28, ph + 28, 38);
			ctx.fillStyle = "#0a0e14";
			ctx.fill();
			ctx.lineWidth = 4;
			ctx.strokeStyle = "#2b394a";
			ctx.stroke();

			roundRectPath(ctx, -pw / 2, -ph / 2, pw, ph, 26);
			ctx.fillStyle = "#eef2f7";
			ctx.fill();
			ctx.save();
			ctx.clip();

			// Chat group header bar
			ctx.fillStyle = "#dce3ec";
			ctx.fillRect(-pw / 2, -ph / 2, pw, 98);
			ctx.strokeStyle = "#b7c3d1";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(-pw / 2, -ph / 2 + 98);
			ctx.lineTo(pw / 2, -ph / 2 + 98);
			ctx.stroke();

			ctx.fillStyle = "#161d26";
			ctx.font = "900 26px BeVietnamPro, sans-serif";
			ctx.textAlign = "left";
			ctx.textBaseline = "middle";
			ctx.fillText(
				`←  ${(title || "NHÓM CẮN CHẾT QUẢN LÝ").slice(0, 26)}`,
				-pw / 2 + 24,
				-ph / 2 + 54,
			);

			const defaultRows = [
				"parrot|Vẹt Sát Thủ",
				"gorilla|King Kong",
				"tiger|Hổ Một Đấm",
				"elephant|Voi Già Ăn Chay",
			];
			const defaultIcons = [
				"parrot",
				"gorilla",
				"tiger",
				"elephant",
				"skull",
				"hacker",
			];
			const rawRows = lines.length ? lines.slice(0, 4) : defaultRows;
			rawRows.forEach((rawRow, idx) => {
				const parts = String(rawRow).split("|");
				const rowIcon =
					parts.length > 1
						? parts[0].trim()
						: defaultIcons[idx % defaultIcons.length];
				const rowName = (parts.length > 1 ? parts[1] : parts[0]).trim();
				const ry = -ph / 2 + 124 + idx * 168;
				ctx.save();
				ctx.translate(-pw / 2 + 26, ry);
				drawAvatarPortrait(ctx, rowIcon, 126, null);
				ctx.restore();
				ctx.fillStyle = "#131922";
				ctx.font = "800 33px BeVietnamPro, sans-serif";
				ctx.textAlign = "left";
				ctx.textBaseline = "middle";
				ctx.fillText(rowName.slice(0, 22), -pw / 2 + 174, ry + 63);
				ctx.strokeStyle = "rgba(150, 165, 184, 0.45)";
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(-pw / 2 + 174, ry + 148);
				ctx.lineTo(pw / 2 - 22, ry + 148);
				ctx.stroke();
			});

			ctx.restore();
			ctx.restore();
			drawOtsBlurEdge(ctx, "right", W, H, "ots_head_right");
			return;
		}

		if (L === "floating_chat_scene") {
			// Background lurking mini figure for depth
			drawCharacter(ctx, rivalDef, {
				x: 910,
				y: 445,
				scale: 0.44,
				facing: -1,
				emotion: "cold",
				t,
			});

			drawCharacter(ctx, mainDef, {
				x: 375,
				y: 550,
				scale: 1.72,
				facing: 1,
				emotion: sc.leftEmotion || "dread",
				mouthOpen: sc.speaker === mainId ? getMouth(mainId) : 0,
				pose: "hold_phone",
				t,
			});

			drawForegroundBarrier(
				ctx,
				sc.foregroundType && sc.foregroundType !== "none"
					? sc.foregroundType
					: "wood_fence",
				W,
				H,
			);
			drawOtsBlurEdge(ctx, "right", W, H, "dark");

			// Floating Pop-In Group Chat HUD Card (crisp foreground layer)
			const pop = easeOutBack(clamp(localT / 0.28, 0, 1));
			const msgLinesRaw = lines.length ? lines : sc.text ? [sc.text] : ["..."];
			ctx.save();
			ctx.translate(1240, 390);
			ctx.scale(0.84 + 0.16 * pop, 0.84 + 0.16 * pop);
			ctx.translate(-1240, -390);

			const avX = 765;
			const avY = 185;
			const avSize = 176;
			ctx.save();
			ctx.shadowColor = "rgba(0,0,0,0.65)";
			ctx.shadowBlur = 18;
			ctx.translate(avX, avY);
			drawAvatarPortrait(
				ctx,
				sc.avatarIcon || "elephant",
				avSize,
				getCachedImage(sc.avatarImageUrl),
			);
			ctx.restore();

			// Sender display name with crisp dark outer outline
			const senderLabel = (title || "Voi Già Ăn Chay").slice(0, 30);
			ctx.font = "900 40px BeVietnamPro, sans-serif";
			ctx.textAlign = "left";
			ctx.textBaseline = "middle";
			ctx.lineWidth = 9;
			ctx.strokeStyle = "#080b10";
			ctx.strokeText(senderLabel, 965, 224);
			ctx.fillStyle = "#ffffff";
			ctx.fillText(senderLabel, 965, 224);

			// Gradient silver-white message card
			ctx.font = "800 34px BeVietnamPro, sans-serif";
			const wrappedMsg = [];
			for (const rawL of msgLinesRaw) {
				wrappedMsg.push(...wrapLines(ctx, rawL, 745));
			}
			const visMsg = wrappedMsg.slice(0, 4);
			const boxW = 815;
			const boxH = Math.max(150, visMsg.length * 46 + 48);
			const boxX = 960;
			const boxY = 264;

			ctx.save();
			ctx.shadowColor = "rgba(0,0,0,0.65)";
			ctx.shadowBlur = 22;
			roundRectPath(ctx, boxX, boxY, boxW, boxH, 16);
			const cg = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
			cg.addColorStop(0, "#ffffff");
			cg.addColorStop(1, "#cfd8e3");
			ctx.fillStyle = cg;
			ctx.fill();
			ctx.lineWidth = 5;
			ctx.strokeStyle = "#0d121a";
			ctx.stroke();
			ctx.restore();

			ctx.fillStyle = "#0e1520";
			ctx.font = "800 34px BeVietnamPro, sans-serif";
			ctx.textAlign = "left";
			ctx.textBaseline = "middle";
			visMsg.forEach((ln, idx) => {
				ctx.fillText(ln, boxX + 34, boxY + 46 + idx * 46);
			});

			ctx.restore();
			return;
		}

		if (L === "creature_enclosure") {
			drawCreatureCutout(
				ctx,
				sc.avatarIcon || "tiger",
				1320,
				455,
				1.75,
				t,
				getCachedImage(sc.cutoutImageUrl),
			);
			drawCharacter(ctx, mainDef, {
				x: 495,
				y: 550,
				scale: 1.74,
				facing: 1,
				emotion: sc.leftEmotion || "dread",
				mouthOpen: sc.speaker === mainId ? getMouth(mainId) : 0,
				pose:
					sc.speaker === mainId && getMouth(mainId) > 0.06
						? "talk"
						: "hold_phone",
				t,
			});
			drawForegroundBarrier(
				ctx,
				sc.foregroundType && sc.foregroundType !== "none"
					? sc.foregroundType
					: "iron_cage",
				W,
				H,
			);
			if (title) {
				ctx.save();
				roundRectPath(ctx, 1020, 128, 600, 68, 12);
				ctx.fillStyle = "rgba(10, 15, 23, 0.86)";
				ctx.fill();
				ctx.lineWidth = 3;
				ctx.strokeStyle = "#ff4d5a";
				ctx.stroke();
				ctx.fillStyle = "#ffd8dc";
				ctx.font = "900 28px BeVietnamPro, sans-serif";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(title.slice(0, 36), 1320, 162);
				ctx.restore();
			}
			drawOtsBlurEdge(ctx, "left", W, H, "dark");
			return;
		}

		if (L === "fence_two_shot") {
			drawCharacter(ctx, mainDef, {
				x: 490,
				y: 545,
				scale: 1.66,
				facing: 1,
				emotion: sc.leftEmotion || "dread",
				mouthOpen: getMouth(mainId),
				pose: getMouth(mainId) > 0.06 ? "talk" : "hold_phone",
				t,
			});
			drawCharacter(ctx, rivalDef, {
				x: 1185,
				y: 545,
				scale: 1.66,
				facing: -1,
				emotion: sc.rightEmotion || "panic",
				mouthOpen: getMouth(rivalId),
				pose: getMouth(rivalId) > 0.06 ? "talk" : "idle",
				t,
			});
			drawForegroundBarrier(
				ctx,
				sc.foregroundType && sc.foregroundType !== "none"
					? sc.foregroundType
					: "wood_fence",
				W,
				H,
			);
			drawOtsBlurEdge(ctx, "right", W, H, "dark");
			return;
		}

		// Default: Dynamic Medium Two-Shot
		drawCharacter(ctx, mainDef, {
			x: 640,
			y: 485,
			scale: 1.68,
			facing: 1,
			emotion: sc.leftEmotion || "deadpan",
			mouthOpen: getMouth(mainId),
			pose: getMouth(mainId) > 0.06 ? "talk" : "chest",
			rimCyan: sc.bg === "dark_lab",
			t,
		});
		drawCharacter(ctx, rivalDef, {
			x: 1290,
			y: 485,
			scale: 1.68,
			facing: -1,
			emotion: sc.rightEmotion || "smug",
			mouthOpen: getMouth(rivalId),
			pose: getMouth(rivalId) > 0.06 ? "talk" : "idle",
			t,
		});
		if (sc.foregroundType && sc.foregroundType !== "none") {
			drawForegroundBarrier(ctx, sc.foregroundType, W, H);
		}
	}

	function renderAtOnCanvas(canvas, data, t) {
		if (!canvas || !data || !Array.isArray(data.scenes) || !data.scenes.length)
			return;
		const ctx = canvas.getContext("2d", { alpha: false });
		const outW = canvas.width;
		const outH = canvas.height;
		const isVertical = outH > outW;

		let sc = data.scenes[data.scenes.length - 1];
		for (let i = 0; i < data.scenes.length; i++) {
			if (t >= data.scenes[i].start && t < data.scenes[i].end) {
				sc = data.scenes[i];
				break;
			}
			if (t < data.scenes[0].start) {
				sc = data.scenes[0];
				break;
			}
		}

		const localT = Math.max(0, t - sc.start);
		const dur = Math.max(0.2, sc.end - sc.start);
		const u = clamp(localT / dur, 0, 1);
		const fps = data.fps || 30;
		const totalFrames =
			data.totalFrames || Math.ceil((data.duration || 10) * fps);
		const frameIdx = clamp(
			Math.floor(t * fps),
			0,
			Math.max(0, totalFrames - 1),
		);

		const cam = sc.cam || { z0: 1.0, z1: 1.05, shake: 0 };
		let zoom = lerp(cam.z0 || 1.0, cam.z1 || 1.05, easeOutCubic(u));
		if (
			dur > 4.2 &&
			sc.subs &&
			sc.subs.length >= 2 &&
			t >= sc.subs[1].start &&
			!String(sc.layout).startsWith("prop_") &&
			sc.layout !== "ui_transfer_stamp"
		) {
			zoom *= 1.1;
		}

		const shakeDecay = Math.exp(-localT * 3.2);
		const shakeAmp = (cam.shake || 0) * 16 * shakeDecay;
		const sx = shakeAmp * Math.sin(t * 53.0);
		const sy = shakeAmp * Math.cos(t * 61.0);

		ctx.save();
		ctx.fillStyle = "#080d14";
		ctx.fillRect(0, 0, outW, outH);

		if (isVertical) {
			// Center-crop / smart scale 1920x1080 stage into 1080x1920 vertical frame
			const vScale = (outH / 1080) * 0.88 * zoom;
			ctx.translate(outW / 2 + sx, outH * 0.48 + sy);
			ctx.scale(vScale, vScale);
			ctx.translate(-960, -540);
			renderVirtual16x9(ctx, data, sc, localT, dur, t, frameIdx);
		} else {
			const hScale = (outW / 1920) * zoom;
			ctx.translate(outW / 2 + sx, outH / 2 + sy);
			ctx.scale(hScale, hScale);
			ctx.translate(-960, -540);
			renderVirtual16x9(ctx, data, sc, localT, dur, t, frameIdx);
		}
		ctx.restore();

		if (sc.sfx === "dark_boom" && localT < 0.08) {
			ctx.fillStyle = `rgba(255,255,255,${(1 - localT / 0.08) * 0.2})`;
			ctx.fillRect(0, 0, outW, outH);
		}

		// Chrome & Watermark: Cáo Hồi Hộp (v2.0) vs Thỏ Kì Quái (v1.0)
		const uiScale = isVertical ? outW / 1080 : outW / 1920;
		const watermark = data.channelName || "Hồ Sơ Lật Kèo";
		const isCaoHoiHop = data.visualStyle === "cao_hoi_hop";
		const barH = isCaoHoiHop
			? Math.round((isVertical ? 110 : 76) * uiScale)
			: 0;

		if (isCaoHoiHop) {
			const barCanvas = getLetterboxBarCanvas(outW, barH);
			ctx.drawImage(barCanvas, 0, 0);
			ctx.drawImage(barCanvas, 0, outH - barH);

			ctx.save();
			ctx.strokeStyle = "#04080e";
			ctx.lineWidth = Math.max(2, 3 * uiScale);
			ctx.beginPath();
			ctx.moveTo(0, barH);
			ctx.lineTo(outW, barH);
			ctx.moveTo(0, outH - barH);
			ctx.lineTo(outW, outH - barH);
			ctx.stroke();

			ctx.scale(uiScale, uiScale);
			const topRingColors = ["#301419", "#2c4f86", "#133f42"];
			topRingColors.forEach((col, idx) => {
				const cx = 42 + idx * 54;
				const cy = isVertical ? 55 : 38;
				ctx.beginPath();
				ctx.arc(cx, cy, 21, 0, Math.PI * 2);
				ctx.fillStyle = col;
				ctx.fill();
				ctx.lineWidth = 4;
				ctx.strokeStyle = "#06090e";
				ctx.stroke();
			});

			// Subtle hollow corner rings on bottom-right letterbox
			const logicalW = outW / uiScale;
			const logicalH = outH / uiScale;
			for (let idx = 0; idx < 3; idx++) {
				const cx = logicalW - 42 - idx * 54;
				const cy = logicalH - (isVertical ? 55 : 38);
				ctx.beginPath();
				ctx.arc(cx, cy, 20, 0, Math.PI * 2);
				ctx.lineWidth = 3.5;
				ctx.strokeStyle = "rgba(4, 8, 15, 0.72)";
				ctx.stroke();
			}

			// Top-right stylized channel emblem
			const wmUpper = watermark.toUpperCase();
			ctx.font = "900 32px BeVietnamPro, sans-serif";
			ctx.textAlign = "right";
			ctx.textBaseline = "middle";
			const wmW = ctx.measureText(wmUpper).width;
			const emX = logicalW - wmW - 36;
			const emY = isVertical ? 55 : 38;
			ctx.fillStyle = "rgba(185, 32, 48, 0.85)";
			ctx.beginPath();
			ctx.moveTo(emX - 30, emY - 12);
			ctx.lineTo(emX + 8, emY - 18);
			ctx.lineTo(emX - 4, emY + 18);
			ctx.closePath();
			ctx.fill();

			ctx.shadowColor = "rgba(72, 220, 255, 0.55)";
			ctx.shadowBlur = 10;
			ctx.lineWidth = 5;
			ctx.strokeStyle = "#06090e";
			ctx.strokeText(wmUpper, logicalW - 24, emY);
			ctx.fillStyle = "#e8f8ff";
			ctx.fillText(wmUpper, logicalW - 24, emY);
			ctx.restore();
		} else {
			ctx.save();
			ctx.scale(uiScale, uiScale);
			ctx.beginPath();
			ctx.arc(46, 46, 26, 0, Math.PI * 2);
			ctx.fillStyle = "#f2e5b5";
			ctx.fill();
			ctx.lineWidth = 2.5;
			ctx.strokeStyle = "rgba(0,0,0,0.65)";
			ctx.stroke();
			ctx.fillStyle = "#11161c";
			ctx.beginPath();
			ctx.arc(46, 51, 10, 0, Math.PI * 2);
			ctx.fill();
			ctx.beginPath();
			ctx.ellipse(42, 34, 4, 11, -0.22, 0, Math.PI * 2);
			ctx.ellipse(50, 34, 4, 11, 0.22, 0, Math.PI * 2);
			ctx.fill();

			ctx.fillStyle = "rgba(255, 255, 255, 0.58)";
			ctx.font = "700 25px BeVietnamPro, sans-serif";
			ctx.textAlign = "left";
			ctx.textBaseline = "middle";
			ctx.fillText(watermark, 84, 47);
			ctx.restore();
		}

		// Subtitle pill bottom
		const subs = data.subs || [];
		let activeSub = null;
		for (let i = 0; i < subs.length; i++) {
			if (t >= subs[i].start && t <= subs[i].end) {
				activeSub = subs[i];
				break;
			}
		}
		if (!activeSub && sc.text) {
			activeSub = { text: sc.text.split(/[,.;!?]/)[0], speaker: sc.speaker };
		}
		if (activeSub && activeSub.text) {
			ctx.save();
			const subDisplay = isCaoHoiHop
				? activeSub.text.toUpperCase()
				: activeSub.text;
			const fontPx = Math.round((isVertical ? 36 : 33) * uiScale);
			ctx.font = `${isCaoHoiHop ? 900 : 800} ${fontPx}px BeVietnamPro, sans-serif`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			const maxBoxW = outW - (isCaoHoiHop ? 220 : 90) * uiScale;
			const linesSub = wrapLines(ctx, subDisplay, maxBoxW - 72 * uiScale).slice(
				0,
				2,
			);
			const widest = Math.max(
				...linesSub.map((l) => ctx.measureText(l).width),
				120,
			);
			const boxW = Math.min(maxBoxW, widest + 64 * uiScale);
			const lineH = fontPx * 1.26;
			const boxH = linesSub.length * lineH + 18 * uiScale;
			const boxX = (outW - boxW) / 2;
			const boxY = isCaoHoiHop
				? outH - barH - (linesSub.length > 1 ? boxH * 0.55 : boxH * 0.42)
				: outH - boxH - (isVertical ? 180 * uiScale : 36 * uiScale);

			roundRectPath(ctx, boxX, boxY, boxW, boxH, 10 * uiScale);
			ctx.fillStyle = isCaoHoiHop
				? "rgba(7, 10, 16, 0.90)"
				: "rgba(6, 9, 13, 0.78)";
			ctx.fill();
			if (isCaoHoiHop) {
				ctx.lineWidth = Math.max(1.5, 2 * uiScale);
				ctx.strokeStyle = "rgba(180, 200, 230, 0.25)";
				ctx.stroke();
			}

			ctx.lineWidth = Math.max(2, 4 * uiScale);
			ctx.strokeStyle = "rgba(0,0,0,0.9)";
			ctx.fillStyle = isCaoHoiHop
				? "#ffffff"
				: activeSub.speaker === "rival"
					? "#ffe8a3"
					: activeSub.speaker === "ai"
						? "#ff9ea8"
						: "#ffffff";

			linesSub.forEach((ln, idx) => {
				const ty = boxY + 10 * uiScale + lineH * (idx + 0.5);
				ctx.strokeText(ln, outW / 2, ty);
				ctx.fillText(ln, outW / 2, ty);
			});
			ctx.restore();
		}
	}

	window.StickmanEngine = { renderAtOnCanvas, preloadImages };

	// Standalone worker page mode (when loaded by render_worker)
	window.renderAt = function (t) {
		const c = document.getElementById("stage");
		if (c && window.STORY_DATA) {
			renderAtOnCanvas(c, window.STORY_DATA, t);
		}
	};
	window.renderAndGrab = function (t, mime = "image/jpeg", quality = 0.94) {
		const c = document.getElementById("stage");
		renderAtOnCanvas(c, window.STORY_DATA, t);
		return c.toDataURL(mime, quality);
	};
})();
