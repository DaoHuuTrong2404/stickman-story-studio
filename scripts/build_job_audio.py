import concurrent.futures
import json
import math
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import wave
from pathlib import Path
import numpy as np


def fallback_vi_tts_mp3(text: str, out_mp3: Path):
    """Zero-key multi-chunk Vietnamese TTS fallback if edge-tts endpoint rate-limits."""
    clauses = [c.strip() for c in re.split(r"(?<=[,.;:!?])\s+", text) if c.strip()] or [
        text
    ]
    chunks_txt = []
    cur = ""
    for cl in clauses:
        if len(cur) + len(cl) + 1 <= 175:
            cur = f"{cur} {cl}".strip()
        else:
            if cur:
                chunks_txt.append(cur)
            cur = cl[:175]
    if cur:
        chunks_txt.append(cur)

    mp3_bytes = bytearray()
    for ch in chunks_txt:
        q = urllib.parse.quote(ch)
        url = f"https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q={q}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            mp3_bytes.extend(resp.read())
    out_mp3.write_bytes(bytes(mp3_bytes))


def resolve_edge_tts_cmd():
    # 1. Check PATH
    exe = shutil.which("edge-tts")
    if exe:
        return [exe]
    # 2. Check common user local bin on Windows / macOS / Linux
    home = Path.home()
    for cand in [
        home / ".local" / "bin" / "edge-tts.exe",
        home / ".local" / "bin" / "edge-tts",
        Path(sys.executable).parent / "Scripts" / "edge-tts.exe",
        Path(sys.executable).parent / "edge-tts",
    ]:
        if cand.exists():
            return [str(cand)]
    # 3. Fallback to python -m edge_tts
    return [sys.executable, "-m", "edge_tts"]


def has_rubberband():
    try:
        r = subprocess.run(["ffmpeg", "-filters"], capture_output=True, text=True)
        return "rubberband" in (r.stdout or "")
    except Exception:
        return False


EDGE_CMD = resolve_edge_tts_cmd()
USE_RUBBERBAND = has_rubberband()

VOICE_PRESETS = {
    "male_calm": {
        "voice": "vi-VN-NamMinhNeural",
        "rate": "+18%",
        "pitch": 1.03,
        "tempo": 1.36,
        "eq": "highpass=f=80,equalizer=f=3100:t=q:w=1.2:g=2.2",
    },
    "male_schemer": {
        "voice": "vi-VN-NamMinhNeural",
        "rate": "+20%",
        "pitch": 1.15,
        "tempo": 1.38,
        "eq": "highpass=f=110,equalizer=f=2800:t=q:w=1.1:g=3.0",
    },
    "male_boss": {
        "voice": "vi-VN-NamMinhNeural",
        "rate": "+12%",
        "pitch": 0.87,
        "tempo": 1.30,
        "eq": "highpass=f=65,equalizer=f=180:t=q:w=1.0:g=3.0",
    },
    "female_sharp": {
        "voice": "vi-VN-HoaiMyNeural",
        "rate": "+18%",
        "pitch": 1.02,
        "tempo": 1.34,
        "eq": "highpass=f=120,equalizer=f=3500:t=q:w=1.0:g=2.8",
    },
}


def build_af(preset: dict) -> str:
    p = preset["pitch"]
    t = preset["tempo"]
    if USE_RUBBERBAND:
        core = f"rubberband=pitch={p}:tempo={t}:formant=preserved"
    else:
        # Universal portable fallback if friend's FFmpeg lacks librubberband!
        sr_shift = int(24000 * p)
        atempo = max(0.5, min(2.0, t / p))
        core = f"asetrate={sr_shift},aresample=48000,atempo={atempo:.3f}"
    return (
        f"{core},{preset['eq']},"
        "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-46dB,"
        "areverse,silenceremove=start_periods=1:start_silence=0.05:start_threshold=-46dB,areverse"
    )


def sanitize_tts_text(text: str) -> str:
    # Split CamelCase words like CyberVentures -> Cyber Ventures so edge-tts never drops stream
    cleaned = re.sub(r"([a-z])([A-Z])", r"\1 \2", str(text or ""))
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned or " Tiếp theo."


def split_into_subtitles(text: str, max_words: int = 9):
    parts = re.split(r"(?<=[,.;:!?])\s+", str(text or "").strip())
    chunks = []
    for part in parts:
        words = part.split()
        if not words:
            continue
        if len(words) <= max_words:
            chunks.append(" ".join(words))
        else:
            n_sub = math.ceil(len(words) / max_words)
            step = math.ceil(len(words) / n_sub)
            for i in range(0, len(words), step):
                sub = " ".join(words[i : i + step])
                if sub:
                    chunks.append(sub)
    merged = []
    for ch in chunks:
        if (
            merged
            and len(ch.split()) <= 2
            and len(merged[-1].split()) + len(ch.split()) <= max_words + 1
        ):
            merged[-1] = merged[-1] + " " + ch
        else:
            merged.append(ch)
    return merged or [str(text or "")]


def make_sfx(kind: str, sr: int = 48000) -> np.ndarray:
    rng = np.random.default_rng(abs(hash(kind)) % (2**32))
    if kind == "click_stamp":
        d = int(0.55 * sr)
        out = np.zeros(d, dtype=np.float32)
        c0, cl = int(0.06 * sr), int(0.025 * sr)
        ct = np.arange(cl) / sr
        out[c0 : c0 + cl] += 0.45 * np.sin(2 * np.pi * 2400 * ct) * np.exp(-ct * 140)
        s0 = int(0.22 * sr)
        st = np.arange(d - s0) / sr
        out[s0:] += (
            0.75
            * np.sin(2 * np.pi * (95 * np.exp(-st * 14) + 38) * st)
            * np.exp(-st * 10)
            + 0.35 * rng.normal(0, 1, len(st)) * np.exp(-st * 38)
        ).astype(np.float32)
        return out * 0.55
    if kind == "dark_boom":
        d = int(0.95 * sr)
        t = np.arange(d) / sr
        return (
            (
                np.sin(2 * np.pi * (72 * np.exp(-t * 4.5) + 34) * t) * np.exp(-t * 3.4)
                + 0.22 * rng.normal(0, 1, d) * np.exp(-t * 28)
            )
            * 0.52
        ).astype(np.float32)
    if kind == "camera_snap":
        d = int(0.22 * sr)
        t = np.arange(d) / sr
        return (
            ((np.sin(2 * np.pi * 3200 * t) + rng.normal(0, 0.8, d)) * np.exp(-t * 95))
            * 0.28
        ).astype(np.float32)
    if kind == "key_clack":
        d = int(0.60 * sr)
        out = np.zeros(d, dtype=np.float32)
        for offset in [0.02, 0.11, 0.20, 0.29, 0.38, 0.48]:
            i0 = int(offset * sr)
            kl = min(int(0.035 * sr), d - i0)
            kt = np.arange(kl) / sr
            out[i0 : i0 + kl] += (
                (0.5 * np.sin(2 * np.pi * 1750 * kt) + 0.5 * rng.normal(0, 1, kl))
                * np.exp(-kt * 130)
                * 0.22
            ).astype(np.float32)
        return out
    if kind == "cash_ding":
        d = int(0.60 * sr)
        t = np.arange(d) / sr
        return (
            (
                0.6 * np.sin(2 * np.pi * 1568 * t) * np.exp(-t * 6.5)
                + 0.4
                * np.sin(2 * np.pi * 2093 * np.maximum(0, t - 0.06))
                * (t >= 0.06)
                * np.exp(-np.maximum(0, t - 0.06) * 5.5)
            )
            * 0.26
        ).astype(np.float32)
    if kind == "bubbling":
        d = int(0.70 * sr)
        out = np.zeros(d, dtype=np.float32)
        for offset in np.linspace(0.03, 0.58, 8):
            i0 = int(offset * sr)
            bl = min(int(0.07 * sr), d - i0)
            bt = np.arange(bl) / sr
            out[i0 : i0 + bl] += (
                np.sin(2 * np.pi * (340 + 420 * bt / 0.07) * bt)
                * np.sin(np.pi * bt / 0.07)
                * 0.20
            ).astype(np.float32)
        return out
    if kind == "alert_ping":
        d = int(0.36 * sr)
        t = np.arange(d) / sr
        return (
            (
                np.sin(2 * np.pi * 1175 * t) * np.exp(-t * 14)
                + np.sin(2 * np.pi * 1760 * np.maximum(0, t - 0.09))
                * (t >= 0.09)
                * np.exp(-np.maximum(0, t - 0.09) * 10)
            )
            * 0.26
        ).astype(np.float32)
    if kind == "red_siren":
        d = int(0.90 * sr)
        t = np.arange(d) / sr
        mod = np.where((t * 4.5) % 1.0 < 0.5, 880.0, 622.25)
        phase = 2 * np.pi * np.cumsum(mod) / sr
        return (
            (0.7 * np.sin(phase) + 0.25 * np.sin(2 * phase)) * np.exp(-t * 1.4) * 0.28
        ).astype(np.float32)
    if kind == "stomach_gurgle":
        d = int(0.85 * sr)
        t = np.arange(d) / sr
        freq = 95 + 45 * np.sin(2 * np.pi * 11 * t) + 25 * np.sin(2 * np.pi * 23 * t)
        phase = 2 * np.pi * np.cumsum(freq) / sr
        return (np.sin(phase) * np.sin(np.pi * t / 0.85) * 0.40).astype(np.float32)
    if kind == "applause_cheer":
        d = int(1.20 * sr)
        t = np.arange(d) / sr
        env = np.minimum(1.0, t / 0.15) * np.exp(-np.maximum(0, t - 0.35) * 2.2)
        claps = np.zeros(d, dtype=np.float32)
        for _ in range(85):
            i0 = int(rng.uniform(0, 1.05) * sr)
            cl = min(int(0.022 * sr), d - i0)
            ct = np.arange(cl) / sr
            claps[i0 : i0 + cl] += (
                rng.normal(0, 1, cl) * np.exp(-ct * 160) * 0.12
            ).astype(np.float32)
        return claps * env.astype(np.float32)
    if kind == "chat_pop":
        d = int(0.16 * sr)
        t = np.arange(d) / sr
        t1 = np.exp(-t * 36.0)
        tone1 = np.sin(2 * np.pi * 880.0 * t) * t1 * (t < 0.065)
        t_shift = np.maximum(0.0, t - 0.05)
        tone2 = (
            np.sin(2 * np.pi * 1318.5 * t_shift) * np.exp(-t_shift * 28.0) * (t >= 0.05)
        )
        return ((tone1 + tone2) * 0.34).astype(np.float32)
    if kind == "heartbeat_thump":
        d = int(0.58 * sr)
        t = np.arange(d) / sr
        lub = np.sin(2 * np.pi * 56.0 * t) * np.exp(-t * 16.0) * (t < 0.22)
        dt2 = np.maximum(0.0, t - 0.22)
        dub = np.sin(2 * np.pi * 48.0 * dt2) * np.exp(-dt2 * 14.0) * (t >= 0.22)
        return (lub * 0.55 + dub * 0.44).astype(np.float32)
    if kind == "beast_growl":
        d = int(0.75 * sr)
        t = np.arange(d) / sr
        env = np.minimum(1.0, t / 0.08) * np.exp(-np.maximum(0.0, t - 0.18) * 3.8)
        mod = np.sin(2 * np.pi * 24.0 * t) * 18.0
        growl = (
            np.sin(2 * np.pi * (72.0 + mod) * t) * 0.52
            + np.sin(2 * np.pi * (108.0 + mod * 1.4) * t) * 0.28
            + rng.normal(0, 0.14, d)
        ) * env
        return (growl * 0.42).astype(np.float32)
    # Default whoosh
    d = int(0.24 * sr)
    t = np.arange(d) / sr
    env = np.sin(np.pi * t / 0.24) ** 1.6
    return (np.sin(2 * np.pi * (220 + 620 * (t / 0.24)) * t) * env * 0.22).astype(
        np.float32
    )


def synthesize_noir_bgm(total_samples: int, sr: int) -> tuple[np.ndarray, np.ndarray]:
    left = np.zeros(total_samples, dtype=np.float32)
    right = np.zeros(total_samples, dtype=np.float32)
    notes = [
        261.63,
        311.13,
        392.00,
        311.13,
        293.66,
        392.00,
        415.30,
        392.00,
        261.63,
        311.13,
        392.00,
        466.16,
        392.00,
        311.13,
        246.94,
        293.66,
    ]
    bass_roots = [65.41, 65.41, 58.27, 49.00]
    step_sec = 0.33
    total_sec = total_samples / sr
    step_idx = 0
    t_cur = 0.0
    while t_cur < total_sec - 0.1:
        freq = notes[step_idx % len(notes)]
        i0 = int(t_cur * sr)
        n_len = min(int(0.50 * sr), total_samples - i0)
        if n_len <= 10:
            break
        nt = np.arange(n_len) / sr
        pluck = (
            0.72 * np.sin(2 * np.pi * freq * nt) * np.exp(-nt * 7.5)
            + 0.22 * np.sin(2 * np.pi * 2 * freq * nt) * np.exp(-nt * 13.0)
        ) * np.minimum(1.0, nt / 0.008)
        pan = 0.5 + 0.22 * math.sin(step_idx * 0.9)
        left[i0 : i0 + n_len] += (pluck * (1.0 - pan * 0.45) * 0.25).astype(np.float32)
        right[i0 : i0 + n_len] += (pluck * (0.55 + pan * 0.45) * 0.25).astype(
            np.float32
        )
        if step_idx % 4 == 0:
            bfreq = bass_roots[(step_idx // 4) % 4]
            b_len = min(int(step_sec * 4.0 * sr), total_samples - i0)
            bt = np.arange(b_len) / sr
            bass = (
                (
                    0.75 * np.sin(2 * np.pi * bfreq * bt)
                    + 0.25 * np.sin(2 * np.pi * 2 * bfreq * bt)
                )
                * np.minimum(1.0, bt / 0.03)
                * np.exp(-bt * 1.45)
            )
            left[i0 : i0 + b_len] += (bass * 0.23).astype(np.float32)
            right[i0 : i0 + b_len] += (bass * 0.23).astype(np.float32)
        t_cur += step_sec
        step_idx += 1

    fade_n = min(int(1.2 * sr), total_samples)
    fade = np.linspace(1.0, 0.0, fade_n, dtype=np.float32)
    left[-fade_n:] *= fade
    right[-fade_n:] *= fade
    return left, right


def synthesize_thriller_bgm(
    total_samples: int, sr: int, timeline_scenes: list
) -> tuple[np.ndarray, np.ndarray]:
    """A-minor dark suspense drone + heartbeat pulse + eerie chimes with tense silences."""
    left = np.zeros(total_samples, dtype=np.float32)
    right = np.zeros(total_samples, dtype=np.float32)
    t_all = np.arange(total_samples, dtype=np.float32) / sr

    # Low A-minor drone pad (55 Hz + 110 Hz + soft fifth 164.81 Hz)
    lfo = 0.72 + 0.28 * np.sin(2 * np.pi * 0.18 * t_all)
    drone = (
        (
            0.52 * np.sin(2 * np.pi * 55.0 * t_all)
            + 0.32 * np.sin(2 * np.pi * 110.0 * t_all + 0.4)
            + 0.16 * np.sin(2 * np.pi * 164.81 * t_all)
        )
        * lfo
        * 0.16
    )
    left += drone.astype(np.float32)
    right += drone.astype(np.float32)

    # Sparse eerie high A-minor bell tones + rhythmic heartbeat sub-pulse
    chimes = [880.0, 698.46, 659.25, 523.25, 440.0, 587.33]
    beat_sec = 0.625
    total_sec = total_samples / sr
    step = 0
    cur_t = 0.0
    while cur_t < total_sec - 0.25:
        i0 = int(cur_t * sr)
        if step % 2 == 0:
            hb_len = min(int(0.26 * sr), total_samples - i0)
            if hb_len > 10:
                ht = np.arange(hb_len, dtype=np.float32) / sr
                thump = np.sin(2 * np.pi * 54.0 * ht) * np.exp(-ht * 15.0) * 0.22
                left[i0 : i0 + hb_len] += thump
                right[i0 : i0 + hb_len] += thump
        if step % 3 == 0:
            freq = chimes[(step // 3) % len(chimes)]
            c_len = min(int(0.95 * sr), total_samples - i0)
            if c_len > 10:
                ct = np.arange(c_len, dtype=np.float32) / sr
                bell = (
                    (
                        0.7 * np.sin(2 * np.pi * freq * ct)
                        + 0.25 * np.sin(2 * np.pi * (freq * 2.01) * ct)
                    )
                    * np.minimum(1.0, ct / 0.025)
                    * np.exp(-ct * 3.8)
                )
                pan = 0.5 + 0.3 * math.sin(step * 0.8)
                left[i0 : i0 + c_len] += (bell * (1.0 - pan * 0.4) * 0.14).astype(
                    np.float32
                )
                right[i0 : i0 + c_len] += (bell * (0.6 + pan * 0.4) * 0.14).astype(
                    np.float32
                )
        cur_t += beat_sec
        step += 1

    # Deliberate suspense music dropouts at dread / shock reveals after 2.5s
    env_mask = np.ones(total_samples, dtype=np.float32)
    tense_layouts = {"floating_chat_scene", "creature_enclosure", "ecu_glow_eyes"}
    for sc in timeline_scenes:
        sc_start = float(sc.get("start", 0.0))
        sc_dur = float(sc.get("end", 0.0)) - sc_start
        if (
            sc_start >= 2.5
            and sc_dur >= 2.2
            and (sc.get("layout") in tense_layouts or sc.get("leftEmotion") == "dread")
        ):
            d0 = int(sc_start * sr)
            d1 = min(total_samples, int((sc_start + min(1.5, sc_dur * 0.45)) * sr))
            if d1 > d0 + 100:
                env_mask[d0:d1] = 0.05

    smooth_k = np.ones(int(0.08 * sr), dtype=np.float32) / int(0.08 * sr)
    env_smooth = np.convolve(env_mask, smooth_k, mode="same")
    left *= env_smooth
    right *= env_smooth

    fade_n = min(int(1.2 * sr), total_samples)
    fade = np.linspace(1.0, 0.0, fade_n, dtype=np.float32)
    left[-fade_n:] *= fade
    right[-fade_n:] *= fade
    return left, right


def main():
    job_dir = Path(sys.argv[1]).resolve()
    spec = json.loads((job_dir / "story_input.json").read_text(encoding="utf-8"))
    tts_dir = job_dir / "tts"
    tts_dir.mkdir(parents=True, exist_ok=True)

    characters = spec.get("characters") or {}
    scenes = spec.get("scenes") or []
    width = int(spec.get("width") or 1920)
    height = int(spec.get("height") or 1080)
    fps = int(spec.get("fps") or 30)
    channel_name = spec.get("channelName") or "Hồ Sơ Lật Kèo"
    visual_style = spec.get("visualStyle") or "tho_ki_quai"

    sr = 48000
    total_sc = len(scenes)
    done_count = 0

    def synth_scene(idx_and_sc):
        idx, sc = idx_and_sc
        sid = idx + 1
        spk = sc.get("speaker") or "main"
        cdef = characters.get(spk) or {}
        vkey = cdef.get("voicePreset") or (
            "male_schemer"
            if spk == "rival"
            else "male_boss"
            if spk == "boss"
            else "female_sharp"
            if spk == "ai"
            else "male_calm"
        )
        preset = VOICE_PRESETS.get(vkey, VOICE_PRESETS["male_calm"])

        txt_path = tts_dir / f"s_{sid:03d}.txt"
        raw_mp3 = tts_dir / f"s_{sid:03d}_raw.mp3"
        proc_wav = tts_dir / f"s_{sid:03d}.wav"
        clean_txt = sanitize_tts_text(sc.get("text", ""))
        txt_path.write_text(clean_txt, encoding="utf-8")
        used_fallback = False

        if not raw_mp3.exists() or raw_mp3.stat().st_size < 300:
            for attempt in range(2):
                res = subprocess.run(
                    EDGE_CMD
                    + [
                        "--voice",
                        preset["voice"],
                        f"--rate={preset['rate']}",
                        "--file",
                        str(txt_path),
                        "--write-media",
                        str(raw_mp3),
                    ],
                    capture_output=True,
                    text=True,
                )
                if (
                    res.returncode == 0
                    and raw_mp3.exists()
                    and raw_mp3.stat().st_size > 300
                ):
                    break
                time.sleep(0.6 * (attempt + 1))
            else:
                fallback_vi_tts_mp3(clean_txt, raw_mp3)
                used_fallback = True

        eff_preset = dict(preset)
        if used_fallback and vkey != "female_sharp":
            eff_preset["pitch"] = round(preset["pitch"] * 0.80, 3)
            eff_preset["tempo"] = round(preset["tempo"] * 1.05, 3)

        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(raw_mp3),
                "-af",
                build_af(eff_preset),
                "-ar",
                "48000",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(proc_wav),
            ],
            check=True,
            capture_output=True,
        )
        with wave.open(str(proc_wav), "rb") as w:
            pcm = (
                np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(
                    np.float32
                )
                / 32768.0
            )
        pk = float(np.max(np.abs(pcm))) if len(pcm) else 1.0
        if pk > 0.01:
            pcm = pcm * (0.70 / pk)
        return sid, pcm

    pcm_map = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
        futs = [ex.submit(synth_scene, (i, s)) for i, s in enumerate(scenes)]
        for f in concurrent.futures.as_completed(futs):
            sid, pcm = f.result()
            pcm_map[sid] = pcm
            done_count += 1
            print(f"PROGRESS_TTS:{done_count}/{total_sc}", flush=True)

    cur_t = 0.18
    timeline_scenes = []
    all_subs = []
    speaker_ids = set(list(characters.keys()) + ["main", "rival", "boss", "ai"])

    for i, s in enumerate(scenes):
        sid = i + 1
        pcm = pcm_map[sid]
        voice_dur = len(pcm) / sr
        pause_after = 1.05 if sid == total_sc else 0.15
        scene_start = cur_t - (0.18 if sid == 1 else 0.0)
        voice_start = cur_t
        voice_end = voice_start + voice_dur
        scene_end = voice_end + pause_after

        phrases = split_into_subtitles(s.get("text", ""), max_words=9)
        weights = [max(1, len(p)) for p in phrases]
        w_sum = sum(weights)
        p_cur = voice_start
        scene_subs = []
        for idx_p, ph in enumerate(phrases):
            p_dur = voice_dur * (weights[idx_p] / w_sum)
            p_end = p_cur + p_dur + (0.09 if idx_p == len(phrases) - 1 else 0.0)
            sub_item = {
                "start": round(p_cur, 3),
                "end": round(p_end, 3),
                "text": ph,
                "speaker": s.get("speaker", "main"),
            }
            scene_subs.append(sub_item)
            all_subs.append(sub_item)
            p_cur += p_dur

        out_sc = dict(s)
        out_sc.update(
            {
                "id": sid,
                "start": round(scene_start, 3),
                "end": round(scene_end, 3),
                "voice_start": round(voice_start, 3),
                "voice_end": round(voice_end, 3),
                "subs": scene_subs,
            }
        )
        timeline_scenes.append(out_sc)
        cur_t = scene_end

    total_dur = round(cur_t + 0.30, 3)
    total_frames = int(math.ceil(total_dur * fps))
    total_samples = int(math.ceil(total_dur * sr))

    voice_L = np.zeros(total_samples, dtype=np.float32)
    voice_R = np.zeros(total_samples, dtype=np.float32)
    mouth_env = {k: [0.0] * total_frames for k in speaker_ids}

    for ts in timeline_scenes:
        sid = ts["id"]
        spk = ts.get("speaker") or "main"
        if spk not in mouth_env:
            mouth_env[spk] = [0.0] * total_frames
        pcm = pcm_map[sid]
        i0 = int(ts["voice_start"] * sr)
        i1 = min(total_samples, i0 + len(pcm))
        voice_L[i0:i1] += pcm[: i1 - i0]
        voice_R[i0:i1] += pcm[: i1 - i0]

        spf = sr // fps
        for f_idx in range(
            max(0, int(ts["voice_start"] * fps)),
            min(total_frames, int(math.ceil(ts["voice_end"] * fps))),
        ):
            s0, s1 = f_idx * spf, min(total_samples, (f_idx + 1) * spf)
            if s1 > s0:
                rms = float(np.sqrt(np.mean(voice_L[s0:s1] ** 2)))
                mouth_env[spk][f_idx] = round(min(1.0, rms * 4.2), 3)

    sfx_L = np.zeros(total_samples, dtype=np.float32)
    sfx_R = np.zeros(total_samples, dtype=np.float32)
    for ts in timeline_scenes:
        kind = ts.get("sfx") or "whoosh"
        fx = make_sfx(kind, sr)
        offset_s = ts["start"] + (0.72 if kind == "click_stamp" else 0.04)
        i0 = max(0, int(offset_s * sr))
        i1 = min(total_samples, i0 + len(fx))
        if i1 > i0:
            sfx_L[i0:i1] += fx[: i1 - i0] * 0.82
            sfx_R[i0:i1] += fx[: i1 - i0] * 0.82

    print("PROGRESS_MIX:mastering", flush=True)
    if visual_style == "cao_hoi_hop" or spec.get("bgmStyle") == "thriller_drone":
        bgm_L, bgm_R = synthesize_thriller_bgm(total_samples, sr, timeline_scenes)
    else:
        bgm_L, bgm_R = synthesize_noir_bgm(total_samples, sr)

    hop = 480
    abs_v = np.abs(voice_L)
    n_hops = math.ceil(total_samples / hop)
    hop_env = np.array(
        [
            float(np.mean(abs_v[i * hop : min(total_samples, (i + 1) * hop)]))
            for i in range(n_hops)
        ],
        dtype=np.float32,
    )
    duck_hop = np.where(hop_env > 0.015, 0.24, 0.55).astype(np.float32)
    duck_smooth = np.convolve(
        duck_hop, np.ones(12, dtype=np.float32) / 12.0, mode="same"
    )
    duck_full = np.repeat(duck_smooth, hop)[:total_samples]

    mix_L = np.tanh((voice_L * 0.92 + bgm_L * duck_full + sfx_L * 0.62) * 1.05) * 0.92
    mix_R = np.tanh((voice_R * 0.92 + bgm_R * duck_full + sfx_R * 0.62) * 1.05) * 0.92

    raw_wav = job_dir / "audio_raw.wav"
    master_wav = job_dir / "audio_master.wav"
    stereo = np.empty((total_samples * 2,), dtype=np.int16)
    stereo[0::2] = np.clip(mix_L * 32767.0, -32768, 32767).astype(np.int16)
    stereo[1::2] = np.clip(mix_R * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(str(raw_wav), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(stereo.tobytes())

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(raw_wav),
            "-af",
            "loudnorm=I=-15.0:TP=-1.2:LRA=9.0",
            "-ar",
            "48000",
            "-ac",
            "2",
            "-c:a",
            "pcm_s16le",
            str(master_wav),
        ],
        check=True,
        capture_output=True,
    )

    def fmt_vtt(sec: float) -> str:
        return f"{int(sec // 3600):02d}:{int((sec % 3600) // 60):02d}:{sec % 60:06.3f}"

    vtt = ["WEBVTT", ""]
    for idx_s, sub in enumerate(all_subs, 1):
        vtt += [
            str(idx_s),
            f"{fmt_vtt(sub['start'])} --> {fmt_vtt(sub['end'])}",
            sub["text"],
            "",
        ]
    (job_dir / "captions.vtt").write_text("\n".join(vtt), encoding="utf-8")

    beats_out = {
        "title": spec.get("title") or "Stickman Story",
        "channelName": channel_name,
        "visualStyle": visual_style,
        "width": width,
        "height": height,
        "fps": fps,
        "duration": total_dur,
        "totalFrames": total_frames,
        "characters": characters,
        "scenes": timeline_scenes,
        "subs": all_subs,
        "mouthEnv": mouth_env,
    }
    (job_dir / "beats.json").write_text(
        json.dumps(beats_out, ensure_ascii=False), encoding="utf-8"
    )
    print(f"AUDIO_DONE:{total_dur}:{total_frames}", flush=True)


if __name__ == "__main__":
    main()
