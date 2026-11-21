---
name: stickman-story-studio
description: "Build and render full 1080p 2.5D stickman thriller/twist story videos (Cáo Hồi Hộp 2.05:1 letterbox + Thỏ Kì Quái / Sandiao styles) from a rough 2-5 sentence plot outline. Expands rough ideas into 6-act scene JSON, generates dark-comic scene art via gemini-nano-banana-2.1, synthesizes multi-character Vietnamese TTS with 30fps lip-sync, mixes A-minor thriller drone or noir pizzicato score and Foley SFX (-15 LUFS), and renders parallel H.264 MP4 + WebVTT."
---

# Stickman Story Studio v2.0

End-to-end 2.5D stickman thriller & twist-story video studio (`16:9` `1920x1080` YouTube & `9:16` `1080x1920` TikTok/Shorts @ `30fps`).

## Visual Styles & Engine Features

- **`cao_hoi_hop` (v2.0 Default):** Patterned midnight-navy `2.05:1` letterbox bars, corner status rings, glowing channel emblem, 3-plane parallax foreground barriers (`wood_fence`, `iron_cage`) + OTS blur, floating `180x180` avatar group-chat HUD cards, dark-comic creatures (`tiger`, `gorilla`, `elephant`, `parrot`, `skull`, `hacker`, `boss`), `dread` upper-brow shading, `sparse_bald` 3-strand hair, `hold_phone` pose, `ALL-CAPS` bottom seam subtitles, and `A minor` thriller drone BGM with tension silences (`chat_pop`, `heartbeat_thump`, `beast_growl`).
- **`tho_ki_quai` (v1.0 Classic):** Full-bleed `16:9` workplace/campus twist story layouts (`ui_transfer_stamp`, `ecu_main`, `prop_magnifying_item`, `red_alarm`, `stage_webcam_expose`, `karma_sprint`) + noir pizzicato score.
- **Scene Art Generation:** Optional `POST /api/generate-scene-art` (`gemini-nano-banana-2.1` via Gemini Interactions API) or direct image upload into scene `bgImageUrl`.

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
2. Expand rough plot into 6-act scene JSON (`POST /api/expand-story` with `visualStyle: "cao_hoi_hop" | "tho_ki_quai"`, `gemini-4-hydrogen` on `/v1/interactions`, or author `scenes` directly following `server/story_prompt.mjs`).
3. Render full `.mp4` + `.vtt` (`POST /api/render` -> poll `GET /api/jobs/<jobId>/status` until `status === "completed"`).
