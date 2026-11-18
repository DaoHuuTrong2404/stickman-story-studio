---
name: stickman-story-studio
description: "Build and render full 1080p 2D bean-stickman twist story videos (Thỏ Kì Quái / Sandiao style) from a rough 2-5 sentence plot outline. Expands rough ideas into 6-act scene JSON, synthesizes multi-character Vietnamese TTS with 30fps lip-sync, mixes noir pizzicato score and Foley SFX (-15 LUFS), and renders parallel H.264 MP4 + WebVTT via Web UI or HTTP API."
---

# Stickman Story Studio

End-to-end 2D stickman twist-story video studio (`16:9` `1920x1080` YouTube & `9:16` `1080x1920` TikTok/Shorts @ `30fps`).

## Quick Launch

- **Windows 1-Click:** Run `START-WINDOWS.bat`
- **macOS / Linux:** `./start-mac-linux.sh`
- **CLI:**
  ```bash
  npm run setup
  npm start
  # Opens http://127.0.0.1:4567
  ```

## Agent / API Workflow

1. Start server (`node server/index.mjs`, default port `4567`).
2. Expand rough plot into 6-act scene JSON (`POST /api/expand-story` with `gemini-4-hydrogen` on `/v1/interactions`, or author `scenes` directly following `server/story_prompt.mjs`).
3. Render full `.mp4` + `.vtt` (`POST /api/render` -> poll `GET /api/jobs/<jobId>/status` until `status === "completed"`).
