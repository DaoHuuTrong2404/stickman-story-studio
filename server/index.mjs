#!/usr/bin/env node
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync, createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { buildExpansionPrompt, sanitizeStorySpec } from "./story_prompt.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const JOBS_DIR = path.join(ROOT, "jobs");
const PORT = Number(process.env.PORT || 4567);

await mkdir(JOBS_DIR, { recursive: true });

// Resolve Playwright cleanly (local node_modules OR shared toolkit cache)
function loadPlaywright() {
	const candidates = [
		path.join(ROOT, "package.json"),
		process.env.MVD_TOOLKIT
			? path.join(process.env.MVD_TOOLKIT, "package.json")
			: "",
		"D:\\Du-lieu-ung-dung\\antigravity-skill-deps\\playwright-1.64.1\\package.json",
	].filter(Boolean);

	for (const pkgPath of candidates) {
		if (!existsSync(pkgPath)) continue;
		try {
			const req = createRequire(pkgPath);
			return req("playwright");
		} catch {
			// try next candidate
		}
	}
	throw new Error(
		"Chưa cài Playwright. Hãy chạy 'npm run setup' hoặc bấm START-WINDOWS.bat để tự động cài đặt.",
	);
}

function findHeadlessBrowserExecutable() {
	if (process.env.MVD_CHROMIUM && existsSync(process.env.MVD_CHROMIUM)) {
		return process.env.MVD_CHROMIUM;
	}
	const winCandidates = [
		"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
		"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
		"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
	];
	const macCandidates = [
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
	];
	for (const p of [...winCandidates, ...macCandidates]) {
		if (existsSync(p)) return p;
	}
	return undefined;
}

function resolvePythonBin() {
	return process.platform === "win32" ? "python" : "python3";
}

const MIME = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".ttf": "font/ttf",
	".png": "image/png",
	".jpg": "image/jpeg",
	".mp4": "video/mp4",
	".vtt": "text/vtt; charset=utf-8",
};

const activeJobs = new Map();

function pushJobUpdate(jobId, patch) {
	const job = activeJobs.get(jobId);
	if (!job) return;
	Object.assign(job, patch, { updatedAt: Date.now() });
	const payload = `data: ${JSON.stringify({
		id: job.id,
		status: job.status,
		phase: job.phase,
		progress: job.progress,
		message: job.message,
		videoUrl: job.videoUrl,
		vttUrl: job.vttUrl,
		duration: job.duration,
		error: job.error,
	})}\n\n`;
	for (const res of job.clients) {
		try {
			res.write(payload);
		} catch {
			job.clients.delete(res);
		}
	}
}

function extractJsonObject(rawText) {
	let txt = String(rawText || "").trim();
	txt = txt
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/\s*```$/i, "")
		.trim();
	const firstBrace = txt.indexOf("{");
	const lastBrace = txt.lastIndexOf("}");
	if (firstBrace >= 0 && lastBrace > firstBrace) {
		txt = txt.slice(firstBrace, lastBrace + 1);
	}
	return JSON.parse(txt);
}

async function expandStoryWithAI({
	provider = "gemini",
	apiKey = "",
	model = "gemini-4-hydrogen",
	baseUrl = "",
	roughIdea,
	targetMinutes = 5,
	characters,
	channelName,
	visualStyle = "cao_hoi_hop",
}) {
	const prompt = buildExpansionPrompt({
		roughIdea,
		targetMinutes,
		characters,
		channelName,
		visualStyle,
	});

	if (provider === "openai_compat") {
		const endpoint =
			(baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "") +
			"/chat/completions";
		const headers = { "Content-Type": "application/json" };
		if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
		const res = await fetch(endpoint, {
			method: "POST",
			headers,
			body: JSON.stringify({
				model: model || "gpt-4o-mini",
				messages: [
					{
						role: "system",
						content:
							"Chỉ trả về đúng 1 đối tượng JSON hợp lệ theo schema được yêu cầu.",
					},
					{ role: "user", content: prompt },
				],
			}),
		});
		const data = await res.json();
		if (!res.ok) {
			throw new Error(data?.error?.message || `HTTP ${res.status}`);
		}
		const content = data?.choices?.[0]?.message?.content || "";
		return sanitizeStorySpec(extractJsonObject(content), {
			channelName,
			visualStyle,
		});
	}

	// Default: Official Gemini v1 Interactions API (`POST /v1/interactions`)
	if (!apiKey) {
		throw new Error(
			"Chưa nhập Gemini API Key. Bạn có thể lấy miễn phí tại aistudio.google.com/apikey hoặc dùng nút 'Copy Prompt Cho Web AI' không cần key!",
		);
	}
	const chosenModel = model || "gemini-4-hydrogen";
	const res = await fetch(
		"https://generativelanguage.googleapis.com/v1/interactions",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Api-Revision": "2026-05-20",
				"x-goog-api-key": apiKey,
			},
			body: JSON.stringify({
				model: chosenModel,
				system_instruction:
					"Bạn là biên kịch hoạt hình 2D lật kèo. Chỉ xuất ra đúng một JSON hợp lệ duy nhất, không thêm markdown thừa.",
				input: prompt,
				generation_config: {
					max_output_tokens: 32768,
				},
				store: false,
			}),
		},
	);

	const data = await res.json();
	if (!res.ok) {
		throw new Error(
			data?.error?.message || JSON.stringify(data?.error || data).slice(0, 300),
		);
	}

	let outText = data?.output_text || "";
	if (!outText && Array.isArray(data?.steps)) {
		const texts = [];
		for (const step of data.steps) {
			if (step?.type === "model_output" && Array.isArray(step.content)) {
				for (const part of step.content) {
					if (part?.type === "text" && part.text) texts.push(part.text);
				}
			}
		}
		outText = texts.join("\n");
	}
	return sanitizeStorySpec(extractJsonObject(outText), {
		channelName,
		visualStyle,
	});
}

async function generateSceneArtWithAI({
	apiKey = "",
	prompt = "",
	aspectRatio = "16:9",
	target = "bg",
}) {
	if (!apiKey) {
		throw new Error("Cần Gemini API Key để dùng Nano Banana 2.1 vẽ nền AI.");
	}
	const ratio =
		target === "avatar" || target === "cutout"
			? "1:1"
			: aspectRatio === "9:16"
				? "9:16"
				: "16:9";
	const res = await fetch(
		"https://generativelanguage.googleapis.com/v1beta/interactions",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Api-Revision": "2026-05-20",
				"x-goog-api-key": apiKey,
			},
			body: JSON.stringify({
				model: "gemini-nano-banana-2.1",
				input: String(prompt || "Dark comic moody midnight background").slice(
					0,
					1200,
				),
				response_format: {
					type: "image",
					mime_type: "image/jpeg",
					aspect_ratio: ratio,
					image_size: "1K",
				},
				store: false,
			}),
		},
	);
	const data = await res.json();
	if (!res.ok) {
		throw new Error(
			data?.error?.message || JSON.stringify(data?.error || data).slice(0, 300),
		);
	}

	let imgPart = data?.output_image || null;
	if (!imgPart?.data && Array.isArray(data?.outputs)) {
		imgPart = data.outputs.find((o) => o?.type === "image" && o?.data) || null;
	}
	if (!imgPart?.data && Array.isArray(data?.steps)) {
		for (const step of data.steps) {
			if (Array.isArray(step?.content)) {
				const found = step.content.find((p) => p?.type === "image" && p?.data);
				if (found) {
					imgPart = found;
					break;
				}
			}
		}
	}
	if (!imgPart?.data) {
		throw new Error("Model không trả về dữ liệu ảnh hợp lệ.");
	}
	const mime = imgPart.mime_type || "image/jpeg";
	return { dataUrl: `data:${mime};base64,${imgPart.data}` };
}

async function runRenderPipeline(jobId, spec, workersReq) {
	const jobDir = path.join(JOBS_DIR, jobId);
	await mkdir(jobDir, { recursive: true });
	await writeFile(
		path.join(jobDir, "story_input.json"),
		JSON.stringify(spec, null, 2),
		"utf8",
	);

	pushJobUpdate(jobId, {
		status: "running",
		phase: "audio",
		progress: 3,
		message: `Đang tổng hợp giọng đọc & nhạc nền cho ${spec.scenes.length} cảnh...`,
	});

	// Step 1: Python TTS + Foley + Noir BGM + Loudnorm
	const py = spawn(resolvePythonBin(), [
		path.join(ROOT, "scripts", "build_job_audio.py"),
		jobDir,
	]);

	let pyErr = "";
	py.stderr.on("data", (chunk) => {
		pyErr += chunk.toString();
	});
	py.stdout.on("data", (chunk) => {
		const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
		for (const ln of lines) {
			if (ln.startsWith("PROGRESS_TTS:")) {
				const [done, tot] = ln
					.slice("PROGRESS_TTS:".length)
					.split("/")
					.map(Number);
				const pct = Math.round((done / Math.max(1, tot)) * 34) + 4;
				pushJobUpdate(jobId, {
					progress: pct,
					message: `Đang lồng tiếng AI: ${done}/${tot} cảnh...`,
				});
			} else if (ln.startsWith("PROGRESS_MIX:")) {
				pushJobUpdate(jobId, {
					progress: 40,
					message:
						"Đang hòa âm nhạc nền Noir, hiệu ứng Foley & chuẩn hóa -15 LUFS...",
				});
			}
		}
	});

	const [pyCode] = await once(py, "exit");
	if (pyCode !== 0) {
		throw new Error(`Lỗi tổng hợp âm thanh: ${pyErr.slice(-450)}`);
	}

	const beats = JSON.parse(
		await readFile(path.join(jobDir, "beats.json"), "utf8"),
	);
	const totalFrames = beats.totalFrames;
	const fps = beats.fps || 30;
	const width = beats.width || 1920;
	const height = beats.height || 1080;

	// Step 2: Multi-worker Parallel Playwright Frame Render
	const cpuCores = Math.max(2, os.cpus().length);
	const workersCount = Math.max(
		1,
		Math.min(Number(workersReq) || 4, Math.min(8, cpuCores)),
	);
	const segDir = path.join(jobDir, "segments");
	await mkdir(segDir, { recursive: true });

	pushJobUpdate(jobId, {
		phase: "video",
		progress: 43,
		message: `Khởi động ${workersCount} worker dựng hình song song (${totalFrames} frames @ ${width}x${height})...`,
	});

	const { chromium } = loadPlaywright();
	let browser;
	try {
		try {
			browser = await chromium.launch({ headless: true });
		} catch {
			const executablePath = findHeadlessBrowserExecutable();
			browser = await chromium.launch({ headless: true, executablePath });
		}

		const chunkSize = Math.ceil(totalFrames / workersCount);
		const segPaths = [];
		let renderedFrames = 0;
		const t0 = Date.now();
		const renderUrl = `http://127.0.0.1:${PORT}/render_frame.html`;

		async function renderSlice(wIdx) {
			const fStart = wIdx * chunkSize;
			const fEnd = Math.min(totalFrames, (wIdx + 1) * chunkSize);
			if (fStart >= fEnd) return null;

			const segPath = path.join(
				segDir,
				`seg_${String(wIdx).padStart(2, "0")}.mp4`,
			);
			segPaths[wIdx] = segPath;

			const page = await browser.newPage({
				viewport: { width, height },
				deviceScaleFactor: 1,
			});
			await page.goto(renderUrl, { waitUntil: "load" });
			await page.evaluate((id) => window.__initJob(id), jobId);

			const ff = spawn(
				"ffmpeg",
				[
					"-y",
					"-loglevel",
					"error",
					"-f",
					"image2pipe",
					"-vcodec",
					"mjpeg",
					"-framerate",
					String(fps),
					"-i",
					"-",
					"-vf",
					"scale=in_range=full:out_range=tv,format=yuv420p",
					"-c:v",
					"libx264",
					"-preset",
					"veryfast",
					"-crf",
					"18",
					"-pix_fmt",
					"yuv420p",
					"-color_range",
					"tv",
					"-colorspace",
					"bt709",
					"-color_primaries",
					"bt709",
					"-color_trc",
					"bt709",
					"-r",
					String(fps),
					segPath,
				],
				{ stdio: ["pipe", "ignore", "pipe"] },
			);

			for (let f = fStart; f < fEnd; f++) {
				const dataUrl = await page.evaluate(
					(timeSec) => window.renderAndGrab(timeSec, "image/jpeg", 0.94),
					f / fps,
				);
				const buf = Buffer.from(
					dataUrl.slice(dataUrl.indexOf(",") + 1),
					"base64",
				);
				if (!ff.stdin.write(buf)) {
					await once(ff.stdin, "drain");
				}
				renderedFrames++;
				if (renderedFrames % 60 === 0 || renderedFrames === totalFrames) {
					const elapsed = Math.max(0.2, (Date.now() - t0) / 1000);
					const speed = (renderedFrames / elapsed).toFixed(1);
					const pct = 43 + Math.round((renderedFrames / totalFrames) * 52);
					pushJobUpdate(jobId, {
						progress: Math.min(95, pct),
						message: `Đang kết xuất khung hình: ${renderedFrames}/${totalFrames} (${speed} fps)...`,
					});
				}
			}

			ff.stdin.end();
			const [code] = await once(ff, "exit");
			await page.close();
			if (code !== 0)
				throw new Error(`FFmpeg segment ${wIdx} failed (${code})`);
			return segPath;
		}

		await Promise.all(
			Array.from({ length: workersCount }, (_, i) => renderSlice(i)),
		);

		pushJobUpdate(jobId, {
			phase: "mux",
			progress: 97,
			message: "Đang đóng gói MP4 H.264 High + FastStart...",
		});

		const listFile = path.join(segDir, "concat.txt");
		const concatTxt = segPaths
			.filter(Boolean)
			.map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
			.join("\n");
		await writeFile(listFile, concatTxt, "utf8");

		const finalMp4 = path.join(jobDir, "output.mp4");
		const masterWav = path.join(jobDir, "audio_master.wav");

		await new Promise((resolve, reject) => {
			const mux = spawn("ffmpeg", [
				"-y",
				"-loglevel",
				"error",
				"-f",
				"concat",
				"-safe",
				"0",
				"-i",
				listFile,
				"-i",
				masterWav,
				"-c:v",
				"copy",
				"-c:a",
				"aac",
				"-b:a",
				"192k",
				"-ar",
				"48000",
				"-movflags",
				"+faststart",
				"-shortest",
				finalMp4,
			]);
			mux.on("exit", (c) =>
				c === 0 ? resolve() : reject(new Error("Mux failed " + c)),
			);
		});

		pushJobUpdate(jobId, {
			status: "completed",
			phase: "done",
			progress: 100,
			duration: beats.duration,
			videoUrl: `/jobs/${jobId}/output.mp4`,
			vttUrl: `/jobs/${jobId}/captions.vtt`,
			outputPath: finalMp4,
			message: `Hoàn tất! Thời lượng ${Math.floor(beats.duration / 60)}:${String(Math.floor(beats.duration % 60)).padStart(2, "0")} (${width}x${height} @ ${fps}fps)`,
		});
	} finally {
		if (browser) await browser.close();
	}
}

async function readJsonBody(req) {
	const chunks = [];
	for await (const ch of req) chunks.push(ch);
	return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function sendJson(res, status, obj) {
	const body = JSON.stringify(obj);
	res.writeHead(status, {
		"Content-Type": "application/json; charset=utf-8",
		"Cache-Control": "no-store",
	});
	res.end(body);
}

async function serveFileWithRange(req, res, filePath) {
	const st = await stat(filePath);
	if (st.isDirectory()) throw new Error("Is directory");
	const ext = path.extname(filePath).toLowerCase();
	const contentType = MIME[ext] || "application/octet-stream";
	const range = req.headers.range;

	if (range && ext === ".mp4") {
		const m = /bytes=(\d+)-(\d*)/.exec(range);
		const start = m ? parseInt(m[1], 10) : 0;
		const end = m && m[2] ? parseInt(m[2], 10) : st.size - 1;
		const chunkSize = end - start + 1;
		res.writeHead(206, {
			"Content-Range": `bytes ${start}-${end}/${st.size}`,
			"Accept-Ranges": "bytes",
			"Content-Length": chunkSize,
			"Content-Type": contentType,
		});
		createReadStream(filePath, { start, end }).pipe(res);
		return;
	}

	res.writeHead(200, {
		"Content-Length": st.size,
		"Content-Type": contentType,
	});
	createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
	try {
		const urlObj = new URL(req.url, `http://127.0.0.1:${PORT}`);
		const pathname = decodeURIComponent(urlObj.pathname);

		if (pathname === "/favicon.ico") {
			res.writeHead(204);
			res.end();
			return;
		}

		if (req.method === "GET" && pathname === "/api/health") {
			return sendJson(res, 200, { ok: true, cpus: os.cpus().length });
		}

		if (req.method === "POST" && pathname === "/api/build-prompt") {
			const body = await readJsonBody(req);
			const prompt = buildExpansionPrompt(body);
			return sendJson(res, 200, { prompt });
		}

		if (req.method === "POST" && pathname === "/api/sanitize-json") {
			const body = await readJsonBody(req);
			const parsed =
				typeof body.rawJson === "string"
					? extractJsonObject(body.rawJson)
					: body.rawJson;
			const spec = sanitizeStorySpec(parsed, {
				channelName: body.channelName,
				visualStyle: body.visualStyle,
			});
			return sendJson(res, 200, spec);
		}

		if (req.method === "POST" && pathname === "/api/expand-story") {
			const body = await readJsonBody(req);
			const spec = await expandStoryWithAI(body);
			return sendJson(res, 200, spec);
		}

		if (req.method === "POST" && pathname === "/api/generate-scene-art") {
			const body = await readJsonBody(req);
			const result = await generateSceneArtWithAI(body);
			return sendJson(res, 200, result);
		}

		if (req.method === "POST" && pathname === "/api/render") {
			const body = await readJsonBody(req);
			const cleanSpec = sanitizeStorySpec(body.story, {
				channelName: body.story?.channelName,
				visualStyle: body.story?.visualStyle,
			});
			const fullSpec = {
				...cleanSpec,
				characters: body.story?.characters || {},
				width: Number(body.width) || 1920,
				height: Number(body.height) || 1080,
				fps: 30,
			};

			const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
			activeJobs.set(jobId, {
				id: jobId,
				status: "queued",
				phase: "init",
				progress: 1,
				message: "Đang khởi tạo tiến trình sản xuất...",
				clients: new Set(),
			});

			runRenderPipeline(jobId, fullSpec, body.workers).catch((err) => {
				pushJobUpdate(jobId, {
					status: "failed",
					phase: "error",
					error: err.message || String(err),
					message: `Lỗi: ${err.message || String(err)}`,
				});
			});

			return sendJson(res, 200, { jobId });
		}

		const sseMatch = /^\/api\/jobs\/([a-zA-Z0-9_-]+)\/events$/.exec(pathname);
		if (req.method === "GET" && sseMatch) {
			const job = activeJobs.get(sseMatch[1]);
			if (!job) return sendJson(res, 404, { error: "Job not found" });

			res.writeHead(200, {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			});
			job.clients.add(res);
			res.write(
				`data: ${JSON.stringify({
					id: job.id,
					status: job.status,
					phase: job.phase,
					progress: job.progress,
					message: job.message,
					videoUrl: job.videoUrl,
					vttUrl: job.vttUrl,
					duration: job.duration,
					error: job.error,
				})}\n\n`,
			);
			req.on("close", () => job.clients.delete(res));
			return;
		}

		const statusMatch = /^\/api\/jobs\/([a-zA-Z0-9_-]+)\/status$/.exec(
			pathname,
		);
		if (req.method === "GET" && statusMatch) {
			const job = activeJobs.get(statusMatch[1]);
			if (!job) return sendJson(res, 404, { error: "Job not found" });
			return sendJson(res, 200, {
				id: job.id,
				status: job.status,
				phase: job.phase,
				progress: job.progress,
				message: job.message,
				videoUrl: job.videoUrl,
				vttUrl: job.vttUrl,
				outputPath: job.outputPath,
				duration: job.duration,
				error: job.error,
			});
		}

		if (pathname.startsWith("/jobs/")) {
			const rel = pathname.slice("/jobs/".length);
			if (rel.includes("..")) throw new Error("Forbidden");
			const target = path.resolve(JOBS_DIR, rel);
			if (!target.startsWith(JOBS_DIR + path.sep)) throw new Error("Forbidden");
			return await serveFileWithRange(req, res, target);
		}

		const staticRel = pathname === "/" ? "index.html" : pathname.slice(1);
		if (staticRel.includes("..")) throw new Error("Forbidden");
		const staticFile = path.resolve(PUBLIC_DIR, staticRel);
		if (
			!staticFile.startsWith(PUBLIC_DIR + path.sep) &&
			staticFile !== PUBLIC_DIR
		) {
			throw new Error("Forbidden");
		}
		return await serveFileWithRange(req, res, staticFile);
	} catch (err) {
		if (!res.headersSent) {
			const code =
				err.code === "ENOENT" ? 404 : err.message === "Forbidden" ? 403 : 500;
			sendJson(res, code, {
				error: err.message || "Internal error",
			});
		} else {
			res.end();
		}
	}
});

server.listen(PORT, "127.0.0.1", () => {
	console.log(`\n========================================================`);
	console.log(`  STICKMAN STORY STUDIO ĐÃ SẴN SÀNG!`);
	console.log(`  Mở trình duyệt tại: http://127.0.0.1:${PORT}`);
	console.log(`========================================================\n`);
});
