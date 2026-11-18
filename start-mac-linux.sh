#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
echo "============================================================"
echo "  STICKMAN STORY STUDIO - AUTO LAUNCHER (macOS / Linux)"
echo "============================================================"

if [ ! -d "node_modules/playwright" ]; then
  echo "[*] Lần chạy đầu tiên: Đang tự động cài đặt thư viện..."
  node scripts/setup.mjs
fi

(sleep 1.5 && (open "http://127.0.0.1:4567" 2>/dev/null || xdg-open "http://127.0.0.1:4567" 2>/dev/null || true)) &
node server/index.mjs
