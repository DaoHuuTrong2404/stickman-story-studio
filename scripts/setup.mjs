#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function check(cmd, args = ["--version"]) {
	const r = spawnSync(cmd, args, { encoding: "utf8", shell: true });
	return r.status === 0;
}

console.log("=== KIỂM TRA MÔI TRƯỜNG STICKMAN STORY STUDIO ===");

const pyBin = process.platform === "win32" ? "python" : "python3";
if (!check(pyBin)) {
	console.error(
		"[!] Chưa thấy Python 3 trên PATH. Hãy cài Python 3.10+ từ python.org (nhớ tích Add Python to PATH).",
	);
	process.exit(1);
}
console.log("[OK] Python đã cài đặt.");

if (!check("ffmpeg", ["-version"])) {
	console.log("[!] Chưa thấy FFmpeg. Đang thử cài tự động qua winget/brew...");
	if (process.platform === "win32") {
		spawnSync(
			"winget",
			[
				"install",
				"--id",
				"Gyan.FFmpeg",
				"-e",
				"--accept-source-agreements",
				"--accept-package-agreements",
			],
			{ stdio: "inherit", shell: true },
		);
	} else if (process.platform === "darwin") {
		spawnSync("brew", ["install", "ffmpeg"], { stdio: "inherit", shell: true });
	}
} else {
	console.log("[OK] FFmpeg đã sẵn sàng.");
}

console.log("[*] Đang kiểm tra thư viện Python (edge-tts, numpy)...");
spawnSync(pyBin, ["-m", "pip", "install", "--quiet", "edge-tts", "numpy"], {
	stdio: "inherit",
	shell: true,
});

console.log(
	"[*] Đang kiểm tra thư viện Node & trình duyệt render (Playwright Chromium)...",
);
spawnSync("npm", ["install"], { stdio: "inherit", shell: true });
spawnSync("npx", ["playwright", "install", "chromium"], {
	stdio: "inherit",
	shell: true,
});

console.log(
	"\n[HOÀN TẤT] Mọi công cụ đã sẵn sàng! Chạy 'npm start' để mở Studio.",
);
