# In-Browser AI Possibilities for Telo Ride (Free Hugging Face Models & Browser APIs)

> **Status:** Exploratory research & architectural feasibility study (no product code changes).
> **Date:** 2026-11-23
> **Scope:** Exhaustive investigation of **55+ features and alternative options** enabled by shipping Telo Ride with free, open-weight Hugging Face models running locally in the browser (plus native browser AI/compute APIs), audited against Telo Ride's purpose, architecture, and hardware constraints.

---

## 1. Executive Summary & Purpose Alignment

Telo Ride turns a smart indoor bike at home into a **kart-racing-style game** (cyclists driven by riders on Echelon and FTMS bikes over Web Bluetooth), with **two doors**—**Race** (courses modelled after GCN online classes where resistance drives elevation and holding stage cadence drives score) and **Classes** (video ride-alongs, solo or group)—plus **Custom Workouts** under Profile, all feeding one progression of XP, rider levels, stars, and map unlocks (`AGENTS.md`, `docs/specs/L1.md`).

Shipping **free, open-weight Hugging Face models** directly inside the browser (using `@huggingface/transformers` v3/v4, ONNX Runtime Web, WebGPU/WASM/WebNN, and optionally Chrome's built-in Gemini Nano APIs) aligns unusually well with Telo Ride's existing architecture:

1. **Zero cloud AI bill ($0/token):** Fits ADR 0025's thin .NET backend philosophy—the backend stays focused on auth, progression, SignalR multiplayer, and feedback, never proxying paid LLM/TTS/ASR APIs.
2. **100% Privacy & L1-021 Compliance:** L1-021 mandates that *"nothing may leave the device except to Telo Ride's backend, YouTube, and Google Maps when the rider gives their own key."* Self-hosting quantized ONNX weights on Telo Ride's own origin (just like `/draco/` in ADR 0021 and `/courses/` in ADR 0035) means voice commands, camera frames, BLE packet logs, and riding telemetry **never leave the rider's device**.
3. **Offline-First Resilience (L1-022, Journey 17):** Once cached in the browser's Origin Private File System (OPFS), every AI feature continues working if home Wi-Fi drops mid-ride.
4. **Chrome & Edge Are Already Required (L1-002):** Because Web Bluetooth already limits Telo Ride to Chrome and Edge, Telo Ride automatically lands on the **two browsers with the strongest client-side AI stack on Earth**: WebGPU, WebNN, OPFS synchronous worker access, `Compute Pressure API`, `<iframe credentialless>`, and Chrome Built-in AI (`LanguageModel`, `Summarizer`, `Translator`).
5. **The Core Engineering Tension—Shared GPU & 1-Hour Tablet Stability:** Telo Ride's top frontend priority is **lazy loading and memory management** for hour-long rides on tablets and low-power laptops alongside a 3D `three/webgpu` World Ride renderer (ADR 0021). Therefore, **where and when** a model runs matters as much as *which* model runs:
   - **Inter-ride windows** (Home, Race Setup, Results, Profile, Custom Workout, Diagnostics) have 100% of the device's GPU/CPU available with zero Three.js contention.
   - **Mid-ride windows** (Racing, Class Ride) must restrict inference to ultra-lightweight models (< 100 MB, CPU/WASM or NPU/WebNN or brief throttled WebGPU bursts inside a dedicated Web Worker), with pre-cached audio/text buffers and automatic thermal shedding via `PressureObserver`.

---

## 2. Browser Capabilities Research Matrix (2026)

Because Telo Ride requires Chrome or Edge over HTTPS (L1-002), we can evaluate the exact browser platform primitives available to our riders today.

| Capability / API | Role in In-Browser AI | Chrome / Edge Support (2026) | Key Constraints & Telo Ride Notes |
| :--- | :--- | :--- | :--- |
| **WebGPU (`navigator.gpu`)** | Primary GPU compute backend for ONNX Runtime Web / Transformers.js v3–v4 (10x–100x faster than WASM). | Broad on desktop & modern Android tablets (~85% global). | Default `maxBufferSize` is 256 MB (`maxStorageBufferBindingSize` 128 MB); runtimes must request higher adapter limits. **Shares physical GPU with Three.js `WebGPURenderer` (ADR 0021)**—must isolate in a Web Worker and throttle mid-ride. |
| **WebNN (`navigator.ml`)** | Routes neural network graphs to OS accelerators (**DirectML** on Windows, **CoreML** on macOS, **NNAPI/NPU** on laptops/tablets). | Shipping / preview in Edge & Chrome on Windows/macOS/ChromeOS. | **Killer feature for Telo Ride:** Offloads mid-ride VAD, ASR, pose, or TTS onto an **NPU**, leaving 100% of the GPU free for Three.js World Ride! |
| **WebAssembly (WASM SIMD + Threads + Memory64)** | Universal CPU fallback when WebGPU is busy or absent. | 100% in Chrome/Edge; Memory64 in Chrome 133+. | Standard 32-bit WASM caps linear memory at 4 GB (ArrayBuffer ~2 GB). Multi-threaded WASM requires `SharedArrayBuffer` (cross-origin isolation). Single-threaded WASM SIMD needs no special headers. |
| **Cross-Origin Isolation (`COOP`/`COEP`) + `<iframe credentialless>`** | Unlocks `SharedArrayBuffer` for multi-threaded WASM ONNX workers without breaking YouTube embeds. | Chrome 110+ & Edge. | **Critical Telo Ride finding:** `COEP: require-corp` breaks YouTube class iframes (ADR 0012). Sending `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: credentialless` and adding `credentialless` to the YouTube `<iframe>` lets both multi-threaded WASM and YouTube coexist cleanly. |
| **OPFS (Origin Private File System)** | Persistent binary storage for ONNX weights (`.onnx`, `.bin`) with **synchronous** `FileSystemSyncAccessHandle` inside Web Workers. | 100% in Chrome/Edge. | Shares Chromium's origin pool (up to **60% of disk**). Always check `navigator.storage.estimate()`, call `navigator.storage.persist()` (auto-granted for installed PWAs, Journey 27), and catch `QuotaExceededError`. |
| **Chrome Built-in AI (Gemini Nano)** | Browser-bundled on-device `LanguageModel` (Prompt API), `Summarizer`, `Translator`, `LanguageDetector`. | Chrome desktop (flag/origin-trial → stable rollout); Edge exploring Phi Silica equivalents. | **0 MB download for Telo Ride** when present! Use as a zero-footprint fast-path adapter behind our `ai` token, with Hugging Face ONNX models as the guaranteed portable runtime. |
| **Web Audio API + `AudioWorklet`** | Real-time 16 kHz PCM capture for VAD/ASR, DSP noise gate (critical for bike fan/flywheel noise!), and low-latency TTS/SFX playback. | 100% in Chrome/Edge. | `AudioWorklet` runs on a dedicated audio thread—zero main-thread jank. Essential for filtering Echelon/fan hum before Silero VAD. |
| **Web Speech API** | Lightweight native `SpeechSynthesis` fallback. | 100% in Chrome/Edge. | Note: Chrome's `SpeechRecognition` sends audio to Google servers—**violates L1-021 privacy!** Always use local Hugging Face Moonshine/Whisper instead of cloud `SpeechRecognition`. |
| **MediaDevices (`getUserMedia`) + WebCodecs (`VideoFrame`)** | Opt-in mic & front-facing webcam feed for hands-free voice and local-only pose/gesture vision. | 100% in Chrome/Edge. | Must use `OffscreenCanvas` / `ImageBitmap` transferable objects to pass downscaled frames (e.g., 256×256 @ 5–10 FPS) to the AI Worker, then immediately `close()` frames to prevent memory leaks. |
| **Compute Pressure API (`PressureObserver`)** | Real-time CPU/thermal pressure states (`nominal`, `fair`, `serious`, `critical`). | Chrome 125+ / Edge. | **Vital for 1-hour tablet rides:** If pressure hits `serious` or `critical`, Telo Ride automatically pauses non-essential AI (e.g., vision or announcer) while keeping BLE, clock, and Three.js smooth. |
| **`navigator.deviceMemory` & `hardwareConcurrency`** | Coarse RAM (GB) and logical CPU core hints for capability gating. | Chrome/Edge. | Gates which AI packs are recommended in `Ride Settings` (e.g., devices ≤ 4 GB RAM allow only ultra-light packs < 150 MB). |

---

## 3. Free Open-Weight Hugging Face Model Catalog for Telo Ride

All models below are freely downloadable from Hugging Face under permissive open weights (Apache 2.0, MIT, Gemma, or Qwen licenses), pre-converted (or trivially convertible) to ONNX for `@huggingface/transformers` v3/v4 and `onnxruntime-web`.

| Modality | Model Family & HF Repo (ONNX) | License | Quantization | Approx. Download | Runtime RAM / VRAM | Best Telo Ride Window |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **VAD** | `onnx-community/silero-vad` | MIT | FP32 / INT8 | ~2 MB | ~15 MB (CPU) | **Mid-Ride (Always-On)** — < 1 ms per 30 ms frame |
| **ASR (Fast)** | `onnx-community/moonshine-tiny-ONNX` | MIT | INT8 / Q4 | ~27–45 MB | ~120 MB (WASM/WebGPU) | **Mid-Ride (Voice Cockpit)** — 5x faster than Whisper on short commands |
| **ASR (Accurate)** | `onnx-community/whisper-tiny.en` / `whisper-base` | MIT | Q4 / INT8 | ~40–85 MB | ~200–350 MB | **Mid-Ride (Captions) / Post-Ride** |
| **TTS (Natural)** | `onnx-community/Kokoro-82M-v1.0-ONNX` | Apache 2.0 | Q8 / Q4 | ~85–92 MB | ~250 MB (WebGPU/WASM) | **Mid-Ride (Queued) / Pre-Cached** — studio-grade commentary & coaching |
| **TTS (Ultra-Light)** | `rhasspy/piper-voices` (ONNX VITS) / `Supertonic` | MIT / Apache 2.0 | INT8 | ~15–35 MB | ~60 MB (CPU) | **Mid-Ride (Low-Power Tablets)** |
| **SLM (Micro)** | `onnx-community/SmolLM2-135M-Instruct-ONNX` | Apache 2.0 | Q4 | ~90 MB | ~250 MB | **Mid-Ride (Command Intent) / Inter-Ride** |
| **SLM (Compact)** | `onnx-community/SmolLM2-360M-Instruct-ONNX` | Apache 2.0 | Q4 | ~210 MB | ~550 MB | **Inter-Ride & Throttled Mid-Ride** |
| **SLM (Sweet Spot)** | `onnx-community/Qwen3-0.6B-ONNX` / `Qwen2.5-0.5B-Instruct` | Apache 2.0 | Q4F16 | ~330–400 MB | ~900 MB–1.3 GB | **Inter-Ride** (JSON workout builder, debrief, diagnostics) |
| **SLM (Gemma Nano-class)** | `onnx-community/gemma-3-270m-it-ONNX` / `gemma-3-1b-it-ONNX` | Gemma | Q4 | ~180–650 MB | ~450 MB–1.4 GB | **Inter-Ride** (fast instruction following & coaching copy) |
| **SLM (Power Desktop)** | `onnx-community/Qwen3.5-2B-ONNX` / `Phi-4-mini` (3.8B) | Apache 2.0 / MIT | Q4 | ~1.1–2.2 GB | ~2.2–3.8 GB | **Desktop Opt-In Only** (deep training-block & telemetry reasoning) |
| **Embeddings** | `Xenova/bge-micro-v2` / `Xenova/all-MiniLM-L6-v2` | MIT / Apache 2.0 | Q8 | ~17–23 MB | ~60 MB (CPU/WebGPU) | **Instant Inter-Ride** (semantic class/map search & recommendations) |
| **Time-Series** | `onnx-community/chronos-bolt-tiny` | Apache 2.0 | INT8 / FP16 | ~18–35 MB | ~90 MB (CPU) | **Mid-Ride (1 Hz–0.2 Hz)** — zero-shot power/fatigue/cadence forecasting |
| **Pose Vision** | `MoveNet Lightning` (ONNX) / `MediaPipe Pose Landmarker Lite` | Apache 2.0 | INT8 / FP16 | ~6–12 MB | ~50 MB (WASM/WebNN) | **Mid-Ride (Opt-In 5–10 FPS)** — standing/seated & posture detection |
| **Hand / Face Vision** | `MediaPipe Hand Landmarker` / `Face Landmarker` | Apache 2.0 | FP16 | ~5–10 MB | ~45 MB | **Mid-Ride (Opt-In)** — sweat-free gesture control & head-lean steering |
| **VLM (Compact)** | `onnx-community/SmolVLM-256M-Instruct` / `Florence-2-base` | Apache 2.0 / MIT | Q4 / FP16 | ~190–250 MB | ~600 MB | **Inter-Ride** (bike setup photo check, room lighting/avatar snapshots) |
| **Depth Vision** | `onnx-community/depth-anything-v2-small` | Apache 2.0 | Q8 | ~25–50 MB | ~150 MB | **Inter-Ride** (one-shot bike-fit camera distance calibration) |
| **Audio Events / Music** | `Xenova/ast-finetuned-audioset` / `Xenova/clap-htsat-unfused` | Apache 2.0 | Q8 | ~85–150 MB | ~250 MB | **Inter-Ride / Pre-Ride** (soundscape & music energy matching) |
| **Safety / Moderation** | `Xenova/toxic-bert` / `onnx-community/distilbert-base-multilingual` | Apache 2.0 | Q8 | ~65 MB | ~140 MB | **Inter-Ride** (instant client-side display name & chat safety) |
| **Translation** | `Xenova/opus-mt-*` / `Xenova/nllb-200-distilled-600M` | MIT / CC-BY-NC | Q8 | ~45–350 MB | ~150–600 MB | **Mid-Ride (Quick Chat) / Class Captions** |

---

## 4. Comprehensive Feature Investigation: 55 Features & Alternative Options

Every feature below is grounded in Telo Ride's exact screens (`Home`, `Map Select`, `Race Setup`, `Lobby`, `Racing`, `Results`, `Classes`, `Class Ride`, `Custom Workout`, `Profile`, `Ride Settings`, `Diagnostics`, `Feedback`) and terminology (`resistance`, `target resistance`, `ble`, `cadence`, `power`, `World Ride`, `courses`).

---

### Domain A: Hands-Free Voice & Conversational Cockpit (Features 01–07)

When you are drenched in sweat at 105 rpm on an Echelon bike, touching a tablet screen is awkward and breaks rhythm. Local voice turns Telo Ride into a truly hands-free cockpit without sending a single audio packet off-device.

#### Feature 01: Hands-Free Resistance & Playback Voice Cockpit
- **What it does in Telo Ride:** While in **Racing**, **Class Ride**, or **Custom Workout**, the rider says *"Resistance up two"*, *"Target 18"*, *"Match plan"*, *"Pause ride"*, *"Mute music"*, or *"Full screen"*. Telo Ride translates the utterance into deterministic `domain` commands (`setTargetResistance`, `nudgeResistance`, `pause`) and confirms with a crisp audio chime or spoken readout.
- **Hugging Face Models:** `onnx-community/silero-vad` (~2 MB) → `onnx-community/moonshine-tiny-ONNX` (~30 MB) → deterministic grammar parser (or `SmolLM2-135M` Q4 for fuzzy phrasing).
- **Browser APIs:** `getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true } })`, `AudioWorklet` (16 kHz resampler + fan-noise gate), Web Worker.
- **Execution Window & Impact:** Mid-ride, CPU/WASM (zero WebGPU contention with Three.js). Total RAM ~150 MB.
- **Another Option:** *Push-to-Talk via Bluetooth Media Button / Keyboard Spacebar*—skips always-on VAD entirely, dropping idle CPU to 0% on ultra-low-power tablets.
- **Alignment Verdict:** **Ship-Ready (Tier 1).** Directly solves L1-005 & L1-023 ("easy to hit from the saddle").

#### Feature 02: Wake-Word "Hey Telo" Local Activation
- **What it does in Telo Ride:** Keeps Moonshine asleep until a tiny wake-word detector hears *"Hey Telo"* (or *"Telo"*), preventing YouTube class instructors or heavy breathing from triggering accidental resistance changes.
- **Hugging Face Models:** `onnx-community/silero-vad` (~2 MB) + compact ONNX keyword-spotting model (`openWakeWord` ONNX ~1.5 MB).
- **Browser APIs:** `AudioWorklet` ring buffer (bounded to 2 seconds—never grows).
- **Execution Window & Impact:** Mid-ride, < 2% single CPU core, ~20 MB RAM.
- **Another Option:** *Auto-ducking wake detection*—when playing a YouTube class or world music, cross-correlate output audio or lower sensitivity during loud instructor segments.
- **Alignment Verdict:** **Ship-Ready (Tier 1).** Essential guardrail for Feature 01.

#### Feature 03: Spoken Telemetry Query ("How far to the top?" / "Where's my ghost?")
- **What it does in Telo Ride:** Mid-race or mid-class, the rider asks *"How much climb is left?"*, *"What's my gap to first?"*, *"How many stars am I on pace for?"*, or *"What's the next interval?"*. Telo Ride reads live `race-store` / `workout-engine` state and answers concisely in 1 sentence via local TTS.
- **Hugging Face Models:** `moonshine-tiny-ONNX` (~30 MB) + intent classifier (`bge-micro-v2` cosine similarity against 25 fixed intent templates—faster and safer than an LLM!) + `Kokoro-82M-v1.0-ONNX` (~85 MB) or Piper ONNX.
- **Browser APIs:** Web Audio API (ducks world music during speech), Web Worker.
- **Execution Window & Impact:** Mid-ride, event-driven on voice trigger. ~350 MB RAM peak.
- **Another Option:** *Zero-TTS visual flash card*—answers with a giant 3-second high-contrast HUD banner (great for riders in noisy rooms or with sound off).
- **Alignment Verdict:** **Ship-Ready (Tier 1).** Zero hallucination risk because numbers come straight from `domain` stores.

#### Feature 04: Voice-Driven Lobby & Race Setup Launcher
- **What it does in Telo Ride:** From **Home** or **Race Setup**, the rider says *"Race Ibiza against medium bots"* or *"Start a 20-minute climbing class"* while strapping into their pedals. Telo Ride navigates to the exact map/class, configures bot strength, and waits for *"Ready"* to start.
- **Hugging Face Models:** `moonshine-tiny-ONNX` + `SmolLM2-360M-Instruct-ONNX` (or `Qwen3-0.6B-ONNX`) using Transformers.js v4 **JSON-schema constrained decoding** to emit a validated `{ door: 'race'|'class', worldId, opponent, botTier }` action.
- **Browser APIs:** OPFS model cache, Angular Router integration.
- **Execution Window & Impact:** Pre-ride (Three.js idle—100% GPU available).
- **Another Option:** *Embedding-only launcher* using `bge-micro-v2` (~17 MB) matching spoken query against map/class metadata—no SLM required!
- **Alignment Verdict:** **Ship-Ready (Tier 1).** Directly serves L1-007 ("answer 'what should I ride now?' within ten seconds").

#### Feature 05: Voice-Dictated Mid-Ride Bug Reports & Feedback (L1-019)
- **What it does in Telo Ride:** L1-019 requires riders to send a bug report, idea, or kudos *from a ride without losing their place*. Instead of typing on a sweaty tablet, the rider taps Feedback (or says *"Report bug"*) and speaks: *"Resistance lagged two seconds entering the Ibiza sprint."* Moonshine transcribes it locally, attaches ride/BLE context, and submits through Telo Ride's existing backend feedback endpoint.
- **Hugging Face Models:** `moonshine-tiny-ONNX` (~30 MB) or `whisper-tiny.en` (~40 MB).
- **Browser APIs:** `getUserMedia`, Web Worker.
- **Execution Window & Impact:** Mid-ride pause/overlay or post-ride; ~120 MB RAM, 100% offline-queueable.
- **Another Option:** *Auto-categorizer* using `SmolLM2-135M` to pre-select `Bug / Idea / Kudos` and draft a clean 1-line title before the rider confirms.
- **Alignment Verdict:** **Ship-Ready (Tier 1).** High utility, tiny footprint, directly upgrades L1-019.

#### Feature 06: Saddle-Safe Acoustic Breath & Noise-Floor Guard
- **What it does in Telo Ride:** Indoor cycling rooms have box fans, trainer hum, and heavy breathing. A tiny audio-event model classifies ambient audio in real time to distinguish intentional speech from fan noise, bike creaks, or YouTube instructor audio—preventing false voice triggers.
- **Hugging Face Models:** `silero-vad` (~2 MB) + lightweight spectral/ONNX classifier (`ast-finetuned-audioset` Q8 or custom tiny CNN).
- **Browser APIs:** `AudioWorklet` + `AnalyserNode` (DSP bandpass filter 300 Hz–3400 Hz before neural VAD).
- **Execution Window & Impact:** Mid-ride, CPU-only, < 3% core.
- **Another Option:** *Pure Web Audio DSP high-pass + noise-gate* calibrated during a 3-second "Room Noise Check" in `Ride Settings`.
- **Alignment Verdict:** **Conditional (Tier 2).** DSP + Silero VAD covers 90% of cases at 1/20th the weight.

#### Feature 07: Hands-Free Custom Workout Verbal Editing
- **What it does in Telo Ride:** In **Profile → Custom Workout**, the rider speaks adjustments while warming up: *"Add two more 30-second sprints at resistance 22 with 60 seconds recovery."* Updates the structured interval plan live before starting.
- **Hugging Face Models:** `moonshine-tiny-ONNX` + `Qwen3-0.6B-ONNX` (constrained JSON output matching Telo Ride's `WorkoutPlan` schema).
- **Browser APIs:** WebGPU (inter-ride, no Three.js contention).
- **Execution Window & Impact:** Pre-ride only. ~900 MB RAM while open, released (`dispose()`) upon starting the ride.
- **Another Option:** *Chrome Built-in `LanguageModel` (Gemini Nano)* fast-path when available—zero download!
- **Alignment Verdict:** **Ship-Ready (Tier 2).**

---

### Domain B: Kart-Racing Personality, Commentary & Dynamic Audio (Features 08–14)

Telo Ride is a **kart-racing-style game** (AGENTS.md). Mario Kart's magic isn't just the track—it's the *energy, announcers, rivalries, and reactive soundscape*. Free in-browser Kokoro TTS + tiny SLMs bring this arcade soul to life offline.

#### Feature 08: Live Kart-Race Play-by-Play Announcer
- **What it does in Telo Ride:** During **Racing**, an energetic sports/arcade announcer calls out key race moments in real time: *"You're closing on Marco up the Ibiza climb—hold 95 rpm to take second!"*, *"Final sprint—five seconds to the line!"*, *"Personal best ghost ahead by twelve metres!"*
- **Hugging Face Models:** `onnx-community/Kokoro-82M-v1.0-ONNX` (~85 MB, multiple voice presets: British cycling commentator, hyped arcade announcer, calm coach) + template engine (or `SmolLM2-360M` generating short 1-sentence quips between climbs).
- **Browser APIs:** Web Audio API (spatial/reverb stadium filter + music ducking), Web Worker, OPFS phrase cache.
- **Execution Window & Impact:** Mid-ride. **Critical optimization:** Synthesize common callouts ("3, 2, 1, GO!", "Final lap!", "Cadence locked!") during the **Race Lobby** countdown and cache their PCM buffers in memory (bounded to 30 clips); only run live Kokoro synthesis on major events (max once per 20 seconds).
- **Another Option:** *Hybrid Pre-Rendered + Live Names*—only synthesize dynamic parts (rider display name, bot name, gap in metres) and splice cleanly with Web Audio.
- **Alignment Verdict:** **Ship-Ready (Tier 1 — Signature Differentiator!).** Transforms Telo Ride's kart-racing feel immediately.

#### Feature 09: Bot Racers with Distinct Personalities & Mid-Race Banter
- **What it does in Telo Ride:** Instead of silent bots filling the 8–10 seat start grid (L1-011), each bot has a persona (*The Climber*, *The Sprinter*, *The Metronome*, *The Showboat*) with a distinct Kokoro voice and short, playful kart-style taunts or cheers when you pass them or they draft past you (e.g., *"Nice cadence—see you at the summit!"*).
- **Hugging Face Models:** `SmolLM2-360M-Instruct-ONNX` (pre-generates a bounded pool of 8–12 lines per race during **Lobby** wait!) + `Kokoro-82M-v1.0-ONNX` (distinct voice embeddings per bot).
- **Browser APIs:** Web Audio `PannerNode` (3D positional audio so a bot passing on your left sounds like it's on your left!).
- **Execution Window & Impact:** **Zero mid-ride LLM cost** because lines are generated during the Lobby countdown, and audio is synthesized on-demand or cached!
- **Another Option:** *Speech-bubble HUD popups* (accessible & silent-friendly) for riders with sound off or in reduced-motion mode.
- **Alignment Verdict:** **Ship-Ready (Tier 1).** Pure kart-racing joy, zero mid-ride GPU contention when pre-generated in Lobby.

#### Feature 10: Personalized Victory & Map-Unlock Fanfare Narration
- **What it does in Telo Ride:** L1-013 notes that *"the unlock is the one moment the app celebrates with motion."* Pair that celebration on **Results** with a bespoke spoken highlight: *"Three stars on Ibiza Sunset Strip! You nailed 94% cadence accuracy on the five finale sprints—Sella Ronda is now open!"*
- **Hugging Face Models:** `Qwen3-0.6B-ONNX` (or `SmolLM2-360M`) + `Kokoro-82M-v1.0-ONNX`.
- **Browser APIs:** Web Audio API.
- **Execution Window & Impact:** Post-ride **Results** screen (Three.js disposed—zero contention).
- **Another Option:** *Template + Kokoro TTS only* (no LLM needed for deterministic stats, cutting download by 200+ MB).
- **Alignment Verdict:** **Ship-Ready (Tier 1).**

#### Feature 11: Cadence-Adaptive Music Energy & Transition DJ
- **What it does in Telo Ride:** Telo Ride already ships unique Opus music tracks per world (`docs/world-music.md`). Using an audio-feature/beat model (or neural audio analyzer), Telo Ride detects each track's BPM, energy peaks, and phrases, dynamically crossfading intensity, applying subtle tempo/filter lifts when the rider hits their target cadence zone, and triggering crowd swells on sprints.
- **Hugging Face Models:** `Xenova/clap-htsat-unfused` (or lightweight ONNX beat-tracking model like `beat_this` ONNX ~15 MB) run once per track and cached in IndexedDB.
- **Browser APIs:** Web Audio API (`BiquadFilterNode`, `GainNode`, `AudioBufferSourceNode.playbackRate` with pitch-preservation or subtle ±4% cadence-lock).
- **Execution Window & Impact:** Pre-ride track analysis cached forever; mid-ride is pure Web Audio DSP (< 1% CPU).
- **Another Option:** *Pre-compute BPM & beat-grid JSON at build time* in `frontend/public/music/` using a local Python/HF script, then use pure Web Audio in-browser!
- **Alignment Verdict:** **Ship-Ready (Tier 2).** Huge sensory payoff; build-time pre-computation is even lighter than runtime analysis.

#### Feature 12: World-Specific Procedural Crowd & Ambience Soundscapes
- **What it does in Telo Ride:** Caribana Parade has steelpan cheers, Alpe d'Huez has Dutch Corner roars and cowbells, Venice Beach has surf and skaters, Ibiza has DJ crowd drops. A lightweight audio-tagging/synthesis controller layers world-matched crowd reactions triggered by the rider's cadence streak and overtake events.
- **Hugging Face Models:** `Kokoro-82M` (multi-voice crowd shouts mixed with Web Audio reverb) or tiny ONNX Foley/DSP layers guided by `CLAP` semantic tags matched to `docs/class-worlds.md` descriptions.
- **Browser APIs:** Web Audio API convolver/mixer.
- **Execution Window & Impact:** Mid-ride Web Audio mixing (< 2% CPU).
- **Another Option:** Ship tiny 3-second Opus crowd-stinger loops per world theme and let an AI director decide *when* to fire them based on race drama.
- **Alignment Verdict:** **Conditional (Tier 2).** Keeps audio assets tiny while making every world feel alive.

#### Feature 13: Rival Ghost Audio Taunts & Time-Split Chimes
- **What it does in Telo Ride:** When racing your own best-time ghost (L1-010), an AI narrator tracks micro-splits at every stage boundary of the GCN-modelled course: *"You were 3 watts faster here last Tuesday—spin up to 92 rpm to take the lead on the crest!"*
- **Hugging Face Models:** `Kokoro-82M-v1.0-ONNX` + deterministic split analyzer.
- **Browser APIs:** Web Audio API.
- **Execution Window & Impact:** Mid-ride, triggered only at stage transitions (every 30–180 s).
- **Another Option:** *Pure tonal pitch-shift cues* (rising chord when pulling ahead of ghost, falling pulse when trailing).
- **Alignment Verdict:** **Ship-Ready (Tier 1).** Directly reinforces learning every corner and hill of a course (ADR 0034/0035).

#### Feature 14: On-Demand Multilingual Announcer & World Localisation
- **What it does in Telo Ride:** Riders riding Alpe d'Huez, Montmartre, Strade Bianche, Havana Malecón, or Shibuya Crossing can switch their announcer to French, Italian, Spanish, Japanese, or British/American English—all locally!
- **Hugging Face Models:** `Kokoro-82M-v1.0-ONNX` (supports multi-language voice packs including EN, ES, FR, IT, JA, ZH, PT, HI) + `Xenova/opus-mt-*` or Chrome Built-in `Translator` API.
- **Browser APIs:** OPFS (download only the language pack the rider picks in `Ride Settings`).
- **Execution Window & Impact:** Pre-cached in Lobby; zero extra runtime cost over English announcer.
- **Another Option:** *World-themed bilingual callouts* (e.g., *"Allez! Allez!"* on Alpe d'Huez, *"Dai! Dai!"* on Strade Bianche).
- **Alignment Verdict:** **Ship-Ready (Tier 2).** Effortless immersion multiplier.

---

### Domain C: Real-Time Coaching, Cadence Scoring & Pacing Intelligence (Features 15–22)

Telo Ride's core gameplay mechanic is **holding the target cadence (rpm) across each stage as target resistance changes for hills** (`AGENTS.md`). Local ML turns raw 1 Hz BLE telemetry (power, cadence, resistance, optional heart rate) into smart, personal coaching.

#### Feature 15: Live Cadence-Lock Micro-Coach
- **What it does in Telo Ride:** Monitors the 1 Hz BLE telemetry stream against the current stage's target rpm. Instead of nagging every second, a smart local cadence coach detects *drift patterns* (e.g., rider consistently drops 6 rpm 20 seconds into steep climbs) and gives timely, encouraging cues right *before* the next hill: *"Hill coming in ten seconds—resistance jumps to 24, keep your legs turning at 80."*
- **Hugging Face Models:** Lightweight rule/state tracker + `Kokoro-82M-v1.0-ONNX` (or Piper ONNX) for spoken cue; optional `SmolLM2-135M` to vary phrasing so cues never feel robotic over an hour.
- **Browser APIs:** Web Worker consuming bounded 60-second telemetry ring buffer.
- **Execution Window & Impact:** Mid-ride, CPU-only, < 1% CPU.
- **Another Option:** *Haptic/Audio Metronome Pulse*—a subtle rhythmic click locked to the stage's target rpm that fades in only when the rider drifts > 5 rpm off target.
- **Alignment Verdict:** **Ship-Ready (Tier 1).** Directly serves Telo Ride's #1 scoring mechanic.

#### Feature 16: Zero-Shot Power & Fatigue Forecaster (Time-Series Foundation Model)
- **What it does in Telo Ride:** Feeds the rider's rolling 10-minute power, cadence, resistance, and (if connected, L1-006) heart-rate time series into **Chronos-Bolt-Tiny** every 30 seconds to forecast the next 3–5 minutes of sustainable output with confidence bands. Warns if the rider is going out too hot to survive the final climb, or tells them they have gas in the tank to chase a 3-star finish!
- **Hugging Face Models:** `onnx-community/chronos-bolt-tiny` (~20–35 MB INT8).
- **Browser APIs:** ONNX Runtime Web (WASM/WebNN), Web Worker, bounded ring buffer (max 600 samples = 10 min @ 1 Hz).
- **Execution Window & Impact:** Mid-ride, runs once every 30 seconds (~40 ms inference on CPU!). Zero GPU contention.
- **Another Option:** *Post-ride pacing curve audit* on the **Results** screen showing "Predicted vs Actual Fade" per stage.
- **Alignment Verdict:** **Ship-Ready (Tier 2).** Genuine ML value that heuristics struggle to match across varied fitness levels.

#### Feature 17: Smart Resistance Nudge Advisor (Respecting L1-005)
- **What it does in Telo Ride:** L1-005 lets riders nudge resistance by hand. If a rider is grinding below 60 rpm on a climb (risking knee strain) or spinning out above 115 rpm on a flat, the AI advisor suggests a gentle ±2 resistance nudge—and if the rider accepts (by voice or tap), remembers their personal scaling offset for similar stages in future rides.
- **Hugging Face Models:** `chronos-bolt-tiny` or tiny local ridge-regression/ONNX personalization model stored in IndexedDB.
- **Browser APIs:** IndexedDB (local-only rider profile).
- **Execution Window & Impact:** Mid-ride, negligible CPU (< 1 ms).
- **Another Option:** *"Auto-Scale Effort" slider (80%–120%)* suggested on **Race Setup / Class Start** based on the rider's last 5 rides.
- **Alignment Verdict:** **Ship-Ready (Tier 1).** Directly improves accessibility across beginner and advanced cyclists.

#### Feature 18: Star-Unlock Pacing Strategist
- **What it does in Telo Ride:** Every map has 3 stars and an unlock goal (L1-008). Before a race (**Race Setup**) and during key checkpoints (**Racing**), the strategist computes the exact stage-by-stage cadence/power budget needed to hit the next star—e.g., *"Hold 88+ rpm through stages 3–5 and you can recover at 75 on the descent and still earn Star 2."*
- **Hugging Face Models:** Deterministic course math + `SmolLM2-360M` (pre-race natural-language brief) + `Kokoro-82M` (checkpoint callouts).
- **Browser APIs:** Web Worker, OPFS.
- **Execution Window & Impact:** Pre-race (0 contention) + lightweight checkpoint math mid-ride.
- **Another Option:** *Visual "Star Pace Line"* overlaid on the elevation/cadence HUD bar without any LLM text.
- **Alignment Verdict:** **Ship-Ready (Tier 1).** Connects progression (L1-008) directly to moment-to-moment gameplay.

#### Feature 19: Post-Ride Coach Debrief & Actionable Weak-Spot Finder
- **What it does in Telo Ride:** On the **Results** screen (L1-013), analyzes the completed ride's bounded per-stage summary (target vs actual cadence, target vs actual resistance, power spikes, HR drift if present) and writes a crisp 3-bullet coaching debrief: what you crushed, which single stage cost you the most score/time, and what to try next ride.
- **Hugging Face Models:** `onnx-community/Qwen3-0.6B-ONNX` or `gemma-3-1b-it-ONNX` (or Chrome Built-in `LanguageModel` / `Summarizer`).
- **Browser APIs:** WebGPU (post-ride, Three.js disposed).
- **Execution Window & Impact:** Post-ride only, ~1–2 s generation time.
- **Another Option:** *Spoken 15-second cool-down summary* via `Kokoro-82M` while the rider spins easy after crossing the finish line.
- **Alignment Verdict:** **Ship-Ready (Tier 1).** High perceived value, zero mid-ride risk.

#### Feature 20: Heart-Rate Drift & Recovery Zone Guardian (L1-006)
- **What it does in Telo Ride:** When a Bluetooth HR strap is paired (L1-006), tracks cardiac drift (rising HR at constant power/cadence) across an hour-long endurance course like Dolomites or Cliffside Coast, gently prompting hydration breaks or suggesting a lighter resistance recovery block if drift exceeds the rider's personal baseline.
- **Hugging Face Models:** `chronos-bolt-tiny` (multivariate/residual drift check) + `Kokoro-82M` for calm audio nudge.
- **Browser APIs:** Web Bluetooth HR telemetry + Web Worker.
- **Execution Window & Impact:** Mid-ride, evaluated once per minute (~20 ms CPU).
- **Another Option:** *Pure cardiovascular decoupling formula* (first-half vs second-half Pw:HR ratio) with an optional AI explanation on the Results screen.
- **Alignment Verdict:** **Conditional (Tier 2).** Great for long 60-minute rides; gracefully inactive when no HR strap is present (honoring L1-006).

#### Feature 21: Adaptive Bot Difficulty Calibrator ("Fair & Thrilling Pack")
- **What it does in Telo Ride:** In solo bot races (L1-010), riders often pick a bot tier that's either too easy (lonely ride) or impossibly fast. A tiny local performance model predicts the rider's expected finish time on *this specific course's* climbing/cadence profile from their local ride history and recommends—or dynamically tunes—a "Rival Match" bot pack so the final sprint is always a photo finish.
- **Hugging Face Models:** Tiny ONNX regression/MLP model (< 1 MB) or `chronos-bolt-tiny` + local ride history in IndexedDB.
- **Browser APIs:** IndexedDB.
- **Execution Window & Impact:** Pre-race (**Race Setup**), < 10 ms.
- **Another Option:** *Mario Kart-style transparent "Rival Pack" mode* (explicitly labelled so competitive purists can still pick fixed Easy/Medium/Hard bots).
- **Alignment Verdict:** **Ship-Ready (Tier 1).** Massive fun-factor boost for solo kart racing.

#### Feature 22: Class Video Cue Alignment & Smart Callout Highlighter
- **What it does in Telo Ride:** In **Class Ride** (L1-015), riders watch a YouTube GCN class while the plan drives resistance. Using local speech/caption analysis (when captions or user-permitted tab/mic audio are available), highlights *why* the instructor is asking for a cadence change (e.g., *"Out of the saddle!"*, *"High-cadence spin-up!"*, *"Drop your shoulders"*) as clean HUD cues synchronized with Telo Ride's stage bar.
- **Hugging Face Models:** `SmolLM2-360M` (offline/pre-ride caption parser) or `moonshine-tiny-ONNX` (if rider enables mic).
- **Browser APIs:** Web Worker, IndexedDB cache per `classId`.
- **Execution Window & Impact:** Pre-ride or build-time catalogue enrichment.
- **Another Option:** Run this pipeline **at build time** when adding GCN classes to `classes.json`, shipping the extracted cue tags as static JSON (0 bytes of runtime AI!).
- **Alignment Verdict:** **Watch-Out → Adapt (Tier 2).** Build-time extraction is strictly superior for catalogued classes; keep in-browser version only for user-supplied custom YouTube URLs (L1-016)!

---

### Domain D: Custom Workout, Course & Class Discovery (Features 23–30)

Telo Ride has **100+ classes/worlds** (`docs/class-worlds.md`) and a **Custom Workout** builder (L1-016). Local embeddings + small SLMs make discovery and workout creation effortless in under 10 seconds (L1-007).

#### Feature 23: Natural-Language Custom Workout Generator (L1-016)
- **What it does in Telo Ride:** In **Profile → Custom Workout**, instead of manually clicking 15 interval rows, the rider types or speaks: *"Build a 25-minute Tabata pyramid with a 4-minute warm-up, peaking at resistance 26 and 95 rpm, easy cool-down."* The in-browser SLM generates a schema-valid `WorkoutPlan` JSON (warm-up, intervals, target resistance, target cadence, cool-down) and renders the exact preview chart before starting.
- **Hugging Face Models:** `onnx-community/Qwen3-0.6B-ONNX` or `onnx-community/gemma-3-1b-it-ONNX` (with Transformers.js v4 **structured JSON schema decoding** so output can *never* be invalid JSON!).
- **Browser APIs:** WebGPU (inter-ride), OPFS, or Chrome Built-in `LanguageModel`.
- **Execution Window & Impact:** Pre-ride (`Profile → Custom Workout`), disposed before ride starts.
- **Another Option:** *1-click "Remix This Class"* button—takes any GCN class plan and asks the SLM to scale it to 15 minutes or lower peak resistance.
- **Alignment Verdict:** **Ship-Ready (Tier 1 — Huge UX Win!).** Directly upgrades L1-016.

#### Feature 24: Semantic "Mood & Goal" Class & Map Search
- **What it does in Telo Ride:** Riders search **Classes** or **Map Select** with natural queries like *"short brutal sprints with neon lights"*, *"flat recovery ride by the ocean"*, *"steep Alpine climb under 30 minutes"*, or *"carnival vibes"*. Local vector search matches against all 100+ class/world descriptions, resistance profiles, lengths, and music genres in < 15 ms—even completely offline!
- **Hugging Face Models:** `Xenova/bge-micro-v2` (~17 MB Q8) or `Xenova/all-MiniLM-L6-v2` (~23 MB Q8). Pre-compute the catalogue's 100+ embeddings once at build time into a tiny ~150 KB static `.bin` file; only embed the user's query string in-browser!
- **Browser APIs:** Web Worker (WASM—takes ~8 ms per query!).
- **Execution Window & Impact:** Inter-ride, tiny memory (~60 MB), instant UX.
- **Another Option:** *Hybrid lexical + semantic ranker* combining exact duration/level filters (respecting locked tiers in L1-014) with cosine similarity.
- **Alignment Verdict:** **Ship-Ready (Tier 1 — Best ROI in this entire document!).** 17 MB model, 8 ms latency, zero GPU contention.

#### Feature 25: "What Should I Ride Now?" AI Concierge on Home (L1-007)
- **What it does in Telo Ride:** L1-007 requires Home to answer *"what should I ride now?"* within ten seconds. Alongside the deterministic `Next ride` unlock card, an optional local concierge considers time of day, recent ride history (e.g., hard legs yesterday → suggest high-cadence spin or recovery flat), streak status, and closest map unlock to give a 1-sentence personalized pitch.
- **Hugging Face Models:** `bge-micro-v2` (ranking) + `SmolLM2-360M` (or Chrome Built-in `LanguageModel`) for the 1-sentence rationale.
- **Browser APIs:** IndexedDB (local ride history), Web Worker.
- **Execution Window & Impact:** Home screen (inter-ride), < 500 ms.
- **Another Option:** *Zero-LLM deterministic scorer + template rationale*—faster and 100% consistent with L1-007's 10-second rule.
- **Alignment Verdict:** **Ship-Ready (Tier 2).** Keep it subordinate to the primary `Next ride` unlock card so it never clutters Home.

#### Feature 26: Custom YouTube Video → Structured Workout Plan Draft (L1-016)
- **What it does in Telo Ride:** L1-016 lets riders attach an optional YouTube video to a Custom Workout. When the rider pastes a YouTube video's description/chapters (or transcript), the in-browser SLM parses timestamps, effort cues, and RPE/cadence hints into a ready-to-edit Telo Ride interval plan synced to the video clock!
- **Hugging Face Models:** `Qwen3-0.6B-ONNX` or `SmolLM2-360M-Instruct-ONNX` with JSON-schema output.
- **Browser APIs:** WebGPU/WASM (inter-ride), Clipboard API.
- **Execution Window & Impact:** Pre-ride (`Custom Workout` screen).
- **Another Option:** *Manual paste + Chrome Built-in `Summarizer` + regex timestamp extractor*—works with 0 MB download on supported Chrome builds.
- **Alignment Verdict:** **Ship-Ready (Tier 1).** Solves a huge real-world pain point for custom YouTube rides while staying 100% compliant with L1-021 (no external scraping!).

#### Feature 27: "Vibe-to-World" Recommender (Match Your Playlist or Mood to a World)
- **What it does in Telo Ride:** Riders describe a vibe (*"rainy neon Tokyo sprint"*, *"sunny Mediterranean climb"*, *"festival energy"*) and get the top 3 matching worlds from `docs/class-worlds.md` (e.g., Shibuya Crossing, Ibiza Sunset Strip, Caribana Parade) along with their unlock status and how to unlock them.
- **Hugging Face Models:** `Xenova/bge-micro-v2` (~17 MB) reusing Feature 24's exact model & pre-computed embeddings!
- **Browser APIs:** WASM Worker.
- **Execution Window & Impact:** Inter-ride, ~8 ms.
- **Another Option:** *Photo-to-World*—drop a vacation photo locally and use `Xenova/clip-vit-base-patch32` to find the visually closest Telo Ride world!
- **Alignment Verdict:** **Ship-Ready (Tier 2).** Essentially free once Feature 24 is built.

#### Feature 28: Pre-Ride Course Scout & Elevation Briefing
- **What it does in Telo Ride:** On **Race Setup**, generates a punchy 20-second "Course Scout" card (and optional spoken preview) summarizing the course's signature traps from its `course.json` geometry: *"Dolomites packs 860 m of climbing—save your matches until the three steep ramps after km 22."*
- **Hugging Face Models:** `SmolLM2-360M-Instruct-ONNX` + `Kokoro-82M-v1.0-ONNX` (cached per `worldId` in OPFS so it only generates once!).
- **Browser APIs:** OPFS, Web Audio.
- **Execution Window & Impact:** Pre-ride only.
- **Another Option:** Pre-generate scout briefs at course-build time inside `tools/blender/build_course.py`!
- **Alignment Verdict:** **Ship-Ready (Tier 2).** Enhances ADR 0034's goal: *"A course is a place a rider learns."*

#### Feature 29: Smart Interval Naming & Emoji-Free Arcade Stage Titles
- **What it does in Telo Ride:** When a rider builds a Custom Workout with raw resistance/duration numbers, the local SLM automatically gives each stage evocative racing names (*"Harbour Warm-Up"*, *"Bridge Kick #1"*, *"Redline Surge"*, *"Coast to Cool-Down"*) so the ride HUD feels like a real course.
- **Hugging Face Models:** `SmolLM2-135M-Instruct-ONNX` (~90 MB) or Chrome Built-in `LanguageModel`.
- **Browser APIs:** Web Worker.
- **Execution Window & Impact:** Pre-ride, < 400 ms.
- **Another Option:** Curated cycling stage-name dictionary mapped by `(resistanceDelta, durationSec, targetRpm)`.
- **Alignment Verdict:** **Conditional (Tier 3).** Fun polish when an SLM is already loaded for Feature 23.

#### Feature 30: Local Natural-Language Ride History Search & Analytics Q&A
- **What it does in Telo Ride:** On **Profile**, riders can ask their local ride log questions in plain English: *"What was my best average power on Ibiza last month?"*, *"How many 3-star finishes did I get this week?"*, *"Compare my last two Sella Ronda rides."* The SLM converts the question into a safe, read-only filter/aggregation over the rider's local IndexedDB/cached ride list and formats the answer.
- **Hugging Face Models:** `Qwen3-0.6B-ONNX` (structured JSON query generation—never raw eval!) or `bge-micro-v2` semantic search over ride notes.
- **Browser APIs:** IndexedDB, Web Worker.
- **Execution Window & Impact:** Profile screen (inter-ride).
- **Another Option:** Pre-built Profile filter chips (Map, Date Range, Best Power, 3-Star Rides) with a lightweight local summarizer.
- **Alignment Verdict:** **Conditional (Tier 2).** Great once a rider accumulates 30+ rides.

---

### Domain E: Optional Local Camera & Computer Vision from the Saddle (Features 31–37)

Many indoor cyclists mount a tablet or laptop directly on their Echelon handlebars with a front-facing camera already aimed right at them. Because **every single frame is processed locally in a Web Worker and immediately discarded (`VideoFrame.close()`)**, zero video ever leaves the device (100% L1-021 compliant). All vision features are **strictly opt-in** in `Ride Settings`.

#### Feature 31: Out-of-the-Saddle Standing vs. Seated Detector
- **What it does in Telo Ride:** Detects when the rider rises out of the saddle during steep climbs (e.g., Mont Ventoux *"In & Out of the Saddle Hill Climb Reps"*, Koppenberg Cobbles, Alpe d'Huez) and mirrors that exact posture onto their rigged 3D cyclist avatar (ADR 0036) in real time! Bonus: awards style callouts when matching climb cues.
- **Hugging Face Models:** `MoveNet Lightning` ONNX (~6 MB INT8) or `MediaPipe Pose Landmarker Lite` (~9 MB).
- **Browser APIs:** `getUserMedia` (320×240 @ 5 FPS), `OffscreenCanvas`, `ImageBitmap` transferable, Web Worker (WASM/WebNN).
- **Execution Window & Impact:** Mid-ride, 5 FPS = ~10 ms per 200 ms (~5% CPU, 0% GPU if on WASM/WebNN).
- **Another Option:** *BLE-only heuristic* (sudden torque spike + cadence dip on high resistance = probable standing)—zero camera needed, though less accurate.
- **Alignment Verdict:** **Ship-Ready (Tier 2 — Magical Kart/Avatar Polish!).** Tiny model, huge immersion payoff.

#### Feature 32: Head-Tilt / Shoulder-Lean Kart Cornering & Camera Look
- **What it does in Telo Ride:** In **Racing**, leaning your shoulders or tilting your head slightly left/right leans your 3D cyclist into corners, shifts lanes on the road to draft behind a bot/rider, or peeks laterally around the pack—bringing authentic arcade kart-racing physicality to a stationary bike!
- **Hugging Face Models:** `MoveNet Lightning` (~6 MB) or `MediaPipe Face Landmarker` (~5 MB).
- **Browser APIs:** `getUserMedia` (5–10 FPS), Web Worker → Three.js `world` camera/avatar input.
- **Execution Window & Impact:** Mid-ride, CPU/WebNN (~50 MB RAM). Automatically disabled under `prefers-reduced-motion` (L1-023).
- **Another Option:** *Phone gyroscope/accelerometer companion* or simple keyboard/tap lane-shift buttons for riders without a webcam.
- **Alignment Verdict:** **Conditional (Tier 2).** Pure Mario Kart soul—must remain strictly opt-in and visually comfortable (no motion sickness).

#### Feature 33: Sweat-Free Hand Gesture Controls (Thumbs-Up / Wave / Palm)
- **What it does in Telo Ride:** Riders with noisy rooms (fans, family, music) who don't want voice can use simple hand gestures from the handlebars: open palm = pause/resume (solo), thumbs-up = send kudos in a group class/race, point up/down = nudge target resistance ±1, peace sign = toggle camera angle.
- **Hugging Face Models:** `MediaPipe Hand Landmarker` / `Gesture Recognizer` ONNX (~8 MB).
- **Browser APIs:** `getUserMedia` (4 FPS), Web Worker.
- **Execution Window & Impact:** Mid-ride, ~40 MB RAM, < 4% CPU.
- **Another Option:** Combine with Feature 31 inside a single `MediaPipe Holistic/Pose` pass so only one vision model runs at a time.
- **Alignment Verdict:** **Ship-Ready (Tier 2).** Solves the "wet hands on touchscreen" problem silently.

#### Feature 34: One-Shot Bike-Fit & Posture Check (Pre-Ride Profile Tool)
- **What it does in Telo Ride:** Before riding, the rider steps back (or takes a side-profile snapshot on their tablet) in **Profile → Bike Settings**. A local pose + depth pipeline estimates knee flexion angle at bottom dead centre, torso angle, and shoulder hunching, giving plain-English seat-height/handlebar adjustment tips—privately on-device.
- **Hugging Face Models:** `MediaPipe Pose Landmarker` (~9 MB) + `onnx-community/depth-anything-v2-small` (~25 MB Q8) + optional `onnx-community/SmolVLM-256M-Instruct` (~190 MB Q4) for plain-English explanation.
- **Browser APIs:** `getUserMedia` single snapshot (disposed immediately after analysis!).
- **Execution Window & Impact:** Pre-ride only (0 contention with Three.js).
- **Another Option:** Pure 2D joint-angle trigonometry on MoveNet keypoints with static visual overlay (drops download from ~225 MB to ~9 MB!).
- **Alignment Verdict:** **Conditional (Tier 3).** Must include a clear non-medical disclaimer; high value for new Echelon owners.

#### Feature 35: Upper-Body Tension & Form Reminder ("Drop Your Shoulders")
- **What it does in Telo Ride:** During long 30–60 minute rides, fatigued riders creep their shoulders up toward their ears and lock their elbows. Sampling shoulder-to-ear landmark ratios once every 10 seconds detects tension creep and flashes a subtle, non-intrusive HUD hint (*"Relax shoulders & grip"*).
- **Hugging Face Models:** Reuses `MoveNet Lightning` (~6 MB) from Feature 31—0 extra model download!
- **Browser APIs:** `getUserMedia` (0.1 FPS = 1 frame every 10 seconds!).
- **Execution Window & Impact:** Mid-ride, virtually 0% CPU/GPU because it runs at 0.1 Hz.
- **Another Option:** *Time-based form checklist reminders* every 10 minutes with zero camera usage.
- **Alignment Verdict:** **Ship-Ready (Tier 2).** Virtually free piggyback on Feature 31.

#### Feature 36: Room-Lighting Adaptive Theme & World Exposure Helper
- **What it does in Telo Ride:** Samples a single low-res (32×32) camera frame once at ride start (or uses `AmbientLightSensor` where available) to detect whether the rider is in a pitch-black pain cave or a sunlit living room—automatically recommending Dark vs. Light theme (L1-023) and adjusting HUD contrast/number size (L1-026).
- **Hugging Face Models:** None required for luminance (pure canvas math), or tiny `SmolVLM-256M` / `CLIP` zero-shot indoor-lighting classifier for glare detection.
- **Browser APIs:** `AmbientLightSensor` (if enabled) or 1-frame `getUserMedia` → `OffscreenCanvas` (immediately releases camera!).
- **Execution Window & Impact:** Pre-ride 1-shot, < 5 ms.
- **Another Option:** Respect `prefers-color-scheme` + time-of-day heuristic (already standard in Journey 24).
- **Alignment Verdict:** **Conditional (Tier 3).** Pure luminance math beats an ML model here—good example of knowing when *not* to use AI.

#### Feature 37: Privacy-Safe Local Avatar Expression Mirroring (No Video Streamed!)
- **What it does in Telo Ride:** In live multiplayer races or group classes (L1-020), riders never want to stream a sweaty webcam feed over the internet. Instead, a tiny local face-landmark model extracts just 4–6 compact blendshape floats (`effort`, `smile`, `cheering`, `focus`) locally and sends only a tiny enum over SignalR so your 3D cyclist's face or helmet visor emote reacts in real time!
- **Hugging Face Models:** `MediaPipe Face Landmarker` (~5 MB) or `Xenova/facial_emotions_image_detection` (~25 MB).
- **Browser APIs:** `getUserMedia` (2 FPS), Web Worker, existing SignalR client (`api` library).
- **Execution Window & Impact:** Mid-ride, < 3% CPU; sends only 1 byte over SignalR every 2 seconds.
- **Another Option:** *Telemetry-driven avatar expressions* (high power = grit teeth, high cadence streak = grinning, finish line = arms raised)—zero camera needed!
- **Alignment Verdict:** **Conditional (Tier 3).** Telemetry-driven expressions are simpler and universally available; camera mirroring is a fun opt-in bonus.

---

### Domain F: Social, Multiplayer & Community Safety (Features 38–42)

Telo Ride's thin .NET backend handles multiplayer races, group classes, display names, and feedback (L1-001, L1-019, L1-020). Client-side Hugging Face models add instant safety, multilingual inclusion, and shareable fun without bloating backend compute.

#### Feature 38: Instant Client-Side Display Name & Quick-Chat Safety Filter
- **What it does in Telo Ride:** Before a rider saves a display name (L1-001) or sends a lobby reaction/feedback note, a local toxicity classifier flags slurs, harassment, or personal contact details (helping uphold AGENTS.md's privacy rule) instantaneously in the browser UI before the request even hits the backend (backend still validates authoritatively per L1-021).
- **Hugging Face Models:** `Xenova/toxic-bert` (~65 MB Q8) or `onnx-community/MiniLM-L6-H384-uncased` fine-tuned safety head (~23 MB).
- **Browser APIs:** Web Worker (WASM).
- **Execution Window & Impact:** Inter-ride (`Profile`, `Sign-in`, `Feedback`), ~25 ms inference.
- **Another Option:** Lightweight deterministic profanity/PII regex + server-side validation (0 MB download) for baseline, reserving `toxic-bert` for optional rich chat if ever added.
- **Alignment Verdict:** **Conditional (Tier 3).** Backend remains source of truth; client filter is purely UX pre-check.

#### Feature 39: Real-Time Multilingual Group-Ride Quick-Chat & Callout Translator
- **What it does in Telo Ride:** In international group classes and live multiplayer lobbies (L1-011, L1-015), riders can send quick encouragement or lobby greetings in their own language and see others' messages translated locally into their preferred language with zero cloud translation bills.
- **Hugging Face Models:** Chrome Built-in `Translator` + `LanguageDetector` APIs (0 MB download!) with fallback to `Xenova/opus-mt-*` (~45 MB per language pair) or `Xenova/nllb-200-distilled-600M` (Q4).
- **Browser APIs:** `LanguageDetector`, `Translator`, OPFS.
- **Execution Window & Impact:** Lobby & low-frequency group ride events (~20 ms).
- **Another Option:** Fixed internationalized quick-emote pack (*"Great pull!"*, *"See you on the climb!"*, *"GG!"*) localized via standard i18n JSON—0 MB AI required!
- **Alignment Verdict:** **Conditional (Tier 2).** Use Chrome's free Built-in Translator API first; static i18n emotes for zero-cost universal fallback.

#### Feature 40: Post-Ride Shareable Race Recap & Highlight Story Card
- **What it does in Telo Ride:** On **Results** (L1-013), generates a punchy 2-sentence race newspaper headline & highlight caption (e.g., *"Photofinish on Neon Docklands: Sarah held 98 rpm across the final harbour bridge to beat her ghost by 1.4 seconds!"*) rendered onto a downloadable canvas card with the course's elevation profile and stars earned.
- **Hugging Face Models:** `SmolLM2-360M-Instruct-ONNX` or `Qwen3-0.6B-ONNX` (or Chrome Built-in `LanguageModel`).
- **Browser APIs:** `OffscreenCanvas.convertToBlob()`, Web Share API (`navigator.share`).
- **Execution Window & Impact:** Post-ride only (Three.js disposed).
- **Another Option:** Deterministic headline templates with mad-lib race stats (0 MB) + optional AI "Spice it up" button.
- **Alignment Verdict:** **Ship-Ready (Tier 2).** Drives organic word-of-mouth growth for Telo Ride.

#### Feature 41: Group-Ride "Vibe & Pacing" Lobby Icebreaker
- **What it does in Telo Ride:** While 8–10 riders wait in the **Race Lobby** (L1-011) during the countdown, a local announcer summarizes the matchup using public lobby facts (e.g., *"Six humans and two pro bots on Sella Ronda—watch out for the 357 m climb at minute 14!"*) to build Mario Kart-style pre-race hype.
- **Hugging Face Models:** `SmolLM2-360M-Instruct-ONNX` + `Kokoro-82M-v1.0-ONNX`.
- **Browser APIs:** Web Audio API.
- **Execution Window & Impact:** Lobby screen only (before Three.js render loop hits peak load).
- **Another Option:** Pre-authored per-course lobby intro scripts read by `Kokoro-82M`.
- **Alignment Verdict:** **Ship-Ready (Tier 1).** Turns dead lobby wait time into pure anticipation.

#### Feature 42: Smart Ghost & Rival Recommendation Engine
- **What it does in Telo Ride:** Analyzes your past rides across maps to suggest the most motivating opponent in **Race Setup** (L1-010): *"You're only 4 seconds off your Col du Granit ghost—race your ghost today for Star 3, or try Hard bots on Ibiza."*
- **Hugging Face Models:** Lightweight local scoring model or `bge-micro-v2` similarity across course profiles.
- **Browser APIs:** IndexedDB.
- **Execution Window & Impact:** Pre-ride (`Race Setup`), < 10 ms.
- **Another Option:** Pure deterministic rules on local ride history (no neural net needed).
- **Alignment Verdict:** **Ship-Ready (Tier 2).** High retention impact.

---

### Domain G: Diagnostics, Hardware Reliability & Accessibility (Features 43–49)

Telo Ride has dedicated requirements for **Diagnostics** (L1-018), **Feedback** (L1-019), **Performance & Reliability** (L1-022), and **WCAG 2.2 AA Accessibility** (L1-023). In-browser AI shines here because diagnostics data is sensitive and must stay on-device (L1-018: *"Logging must stay on the device unless the rider chooses to send it"*).

#### Feature 43: Local BLE Packet Log Analyzer & Bike Troubleshooter (L1-018)
- **What it does in Telo Ride:** On **Diagnostics**, a rider experiencing an Echelon EX-5s/EX-3/EX-8s or FTMS connection drop can click *"Explain this BLE log"*. A local SLM inspects the recorded Bluetooth packet summary (GATT disconnects, keepalive timeouts, checksum mismatches, target vs. reported resistance lag) completely on-device and produces a plain-English diagnosis & fix checklist (e.g., *"Your Echelon dropped 3 keepalives—close the Echelon app on your phone so it stops fighting for the Bluetooth lock"*).
- **Hugging Face Models:** `onnx-community/Qwen3-0.6B-ONNX` or `Phi-4-mini` (desktop) seeded with a compact local RAG knowledge base of Echelon/FTMS troubleshooting docs (`docs/protocol/`) retrieved via `bge-micro-v2`.
- **Browser APIs:** OPFS, Web Worker (inter-ride).
- **Execution Window & Impact:** Diagnostics screen only (0 contention with Three.js).
- **Another Option:** Deterministic rule-based BLE fault detector for the top 15 known Echelon/FTMS issues + optional SLM summary for novel logs.
- **Alignment Verdict:** **Ship-Ready (Tier 1 — Huge Support Cost Reducer!).** Strictly honors L1-018's on-device logging rule.

#### Feature 44: Smart Bug-Report & Diagnostics Summarizer (L1-019)
- **What it does in Telo Ride:** When a rider chooses to attach diagnostics to a bug report in **Feedback**, a local summarizer condenses a 10,000-line BLE packet log into a clean, privacy-scrubbed incident summary (stripping any accidental PII, highlighting exact timestamps of `ble` state transitions and resistance command mismatches) while keeping the raw log optional.
- **Hugging Face Models:** Chrome Built-in `Summarizer` API (0 MB) or `SmolLM2-360M-Instruct-ONNX`.
- **Browser APIs:** Web Worker.
- **Execution Window & Impact:** Feedback modal only.
- **Another Option:** Structured deterministic log reducer (counts errors, extracts last 20 state transitions) + 1-click SLM polish.
- **Alignment Verdict:** **Ship-Ready (Tier 2).** Makes rider bug reports 10x more actionable for developers.

#### Feature 45: Adaptive Screen-Reader & Low-Vision Spatial Race Narrator (WCAG 2.2 AA)
- **What it does in Telo Ride:** For blind or low-vision riders (L1-023), a live 3D race can be hard to follow via raw ARIA live regions alone. A local spatial narrator translates the 3D world and race standings into calm, prioritized audio cues: *"Approaching right-hand hairpin, gradient rising to 6%, resistance increasing to 19, target cadence 82 rpm; two bots drafting just behind."*
- **Hugging Face Models:** `Kokoro-82M-v1.0-ONNX` (or Piper ONNX for instant zero-lag speech) + priority event scheduler.
- **Browser APIs:** Web Audio API (`PannerNode` for left/right overtake cues), ARIA `aria-live="polite"` sync.
- **Execution Window & Impact:** Mid-ride, CPU-only (~85 MB download).
- **Another Option:** Native `SpeechSynthesis` API as an instant 0 MB fallback before Kokoro finishes downloading.
- **Alignment Verdict:** **Ship-Ready (Tier 1 — Exemplary Accessibility!).** Makes 3D kart racing genuinely playable without sight.

#### Feature 46: Live Offline Captions & Translation for Custom/GCN Classes
- **What it does in Telo Ride:** For deaf/hard-of-hearing riders or riders in another language (L1-023), transcribes audio (or translates pasted/available captions) into large, saddle-readable high-contrast captions pinned cleanly below the video without obscuring power/cadence readouts.
- **Hugging Face Models:** `onnx-community/moonshine-tiny-ONNX` (~30 MB) or `whisper-tiny.en` (~40 MB) + Chrome Built-in `Translator` API.
- **Browser APIs:** `AudioWorklet` (note: browser security restricts direct cross-origin YouTube iframe audio capture, so this works best on mic loopback, local audio files, or translating text captions).
- **Execution Window & Impact:** Mid-ride (Class Ride, where Three.js may be lighter or YouTube-only).
- **Another Option:** Focus on **caption translation** (via Chrome `Translator` API / `opus-mt`) and **local-video transcription** where browser CORS permits clean audio access.
- **Alignment Verdict:** **Watch-Out → Adapt (Tier 3).** Be transparent about YouTube cross-origin audio capture limits; do not promise impossible iframe audio tapping.

#### Feature 47: BLE Telemetry Anomaly & Sensor-Drop Detector
- **What it does in Telo Ride:** Occasionally, an Echelon or FTMS bike emits a bogus power/cadence spike (e.g., 1,800 W or 240 rpm for 1 tick) or freezes at a stale resistance value before disconnecting. A tiny local sequence anomaly model distinguishes genuine sprint surges from sensor glitches, smoothing the 3D bike animation and flagging silent `ble` stalls earlier for auto-reconnect (L1-003).
- **Hugging Face Models:** `onnx-community/chronos-bolt-tiny` (residual check) or a tiny < 500 KB ONNX 1D-CNN autoencoder trained on normal cycling telemetry.
- **Browser APIs:** Web Worker (`domain` telemetry pipeline).
- **Execution Window & Impact:** Mid-ride, 1 Hz, < 0.5 ms CPU.
- **Another Option:** Classic Kalman / Hampel median filter in pure TypeScript—0 MB download and deterministic!
- **Alignment Verdict:** **Conditional (Tier 3).** Pure signal processing handles 95% of spikes; ML shines mainly for subtle pre-disconnect drift patterns.

#### Feature 48: AI-Assisted Device & Thermal Auto-Governor (L1-022, L1-026)
- **What it does in Telo Ride:** Combines `PressureObserver` (Compute Pressure API), `navigator.deviceMemory`, Three.js frame times, and WebGPU adapter limits into a smart governor that dynamically recommends the ideal `Ride Settings` profile (quality tier + which AI packs are safe) and gracefully sheds AI workers if a tablet heats up at minute 45 of a 60-minute ride.
- **Hugging Face Models:** None (pure browser platform intelligence!)—the **enabler** that keeps all other 54 AI features safe on low-power tablets!
- **Browser APIs:** `PressureObserver`, `navigator.deviceMemory`, `navigator.gpu.requestAdapter()`, `performance.measureUserAgentSpecificMemory()` (when cross-origin isolated).
- **Execution Window & Impact:** Always-on lightweight monitor (< 0.1% CPU).
- **Another Option:** Manual "AI Performance Mode" toggle (`Off` / `Eco (Voice Only)` / `Full`) in `Ride Settings`.
- **Alignment Verdict:** **Ship-Ready (Tier 1 — Mandatory Prerequisite!).** Directly enforces AGENTS.md's *Lazy loading and memory* mandate.

#### Feature 49: Simplified "Focus Mode" Plain-Language Settings & Onboarding Guide
- **What it does in Telo Ride:** New riders setting up Web Bluetooth, FTMS beta bikes, or 3D quality tiers (`low`/`medium`/`high`/`ultra`) can ask a local help assistant inside **Ride Settings** or **Diagnostics**: *"Why does my bike connect but resistance doesn't change?"* or *"Which quality setting is best for my older iPad/Chromebook?"*
- **Hugging Face Models:** `bge-micro-v2` (searches bundled Telo Ride help docs) + `SmolLM2-360M` (or Chrome Built-in `LanguageModel`).
- **Browser APIs:** OPFS, Web Worker.
- **Execution Window & Impact:** Inter-ride settings only.
- **Another Option:** Semantic FAQ search (`bge-micro-v2` only, ~17 MB) returning exact curated help cards—zero risk of hallucinated troubleshooting steps!
- **Alignment Verdict:** **Ship-Ready (Tier 2).** Semantic FAQ retrieval is safer and lighter than free-form generation.

---

### Domain H: Progression, Narrative, World Immersion & Compound AI (Features 50–55)

These features weave in-browser AI into Telo Ride's long-term progression loop (XP, Levels 1–30, 3 stars per map, streaks, 100+ worlds) and show how combining multiple tiny models creates experiences greater than the sum of their parts.

#### Feature 50: Procedural Rival Backstories & Persistent Season Rivalries
- **What it does in Telo Ride:** Gives Telo Ride's recurring bots persistent local memory across your sessions: *"Last week Marco beat you by 2 seconds on Old Town Criterium—today he's back on the front row in Neon Docklands looking for a rematch!"* Builds genuine Mario Kart / arcade tournament attachment without needing a single extra backend database table.
- **Hugging Face Models:** `SmolLM2-360M-Instruct-ONNX` (generates short rivalry blurbs pre-race/post-race) + IndexedDB local rivalry ledger.
- **Browser APIs:** IndexedDB, Web Worker.
- **Execution Window & Impact:** Pre-race & post-race only.
- **Another Option:** Deterministic rivalry state machine (wins/losses per bot) + `Kokoro-82M` voice callouts.
- **Alignment Verdict:** **Ship-Ready (Tier 1).** Pure replayability gold for solo racers.

#### Feature 51: World Lore & Landmark Audio Tour Guide
- **What it does in Telo Ride:** Telo Ride's worlds are rich real-world places—Caribana Parade, Amsterdam Canals, Alpe d'Huez, Strade Bianche, Havana Malecón, Giza Plateau, Stanley Park (`docs/class-worlds.md`). In an optional *"Discovery / Scenic"* audio mode during endurance climbs or cool-downs, a friendly local tour guide shares 10-second cultural & cycling-history nuggets as you pass landmarks!
- **Hugging Face Models:** `Kokoro-82M-v1.0-ONNX` (speaking curated or `Qwen3-0.6B`-expanded landmark notes tied to course distance markers).
- **Browser APIs:** Web Audio API, OPFS cache.
- **Execution Window & Impact:** Mid-ride, sparse triggers (once every 2–3 minutes during recovery/endurance blocks).
- **Another Option:** Pre-write 5 landmark blurbs per course in `course.json` and only run `Kokoro-82M` to narrate them (guarantees 100% historical accuracy—zero hallucinations!).
- **Alignment Verdict:** **Ship-Ready (Tier 2).** Makes 60-minute endurance rides fly by.

#### Feature 52: Smart Streak-Protection & Micro-Ride Nudge Planner (L1-008)
- **What it does in Telo Ride:** Daily riding builds a streak (L1-008). When a rider opens Telo Ride late in the evening or after a tough week, the local planner notices their streak risk and surfaces the shortest high-enjoyment ride (e.g., a 10–15 minute beginner class like *Amsterdam Canals* or a quick custom recovery spin) with an encouraging 1-line prompt to keep the streak alive without burnout.
- **Hugging Face Models:** Local heuristic + `SmolLM2-135M` (or Chrome Built-in `LanguageModel`) for warm, non-guilt-tripping copy.
- **Browser APIs:** IndexedDB.
- **Execution Window & Impact:** Home screen (inter-ride).
- **Another Option:** Pure deterministic streak-saver card on Home with 0 MB AI.
- **Alignment Verdict:** **Conditional (Tier 2).** Great UX; keep the logic deterministic and use AI only if already loaded.

#### Feature 53: Personalized Multi-Week Training Block Builder (Profile)
- **What it does in Telo Ride:** On **Profile**, riders pick a goal (*"Unlock Col du Granit"*, *"Improve 20-minute climbing power"*, *"Ride 4× a week for 30 minutes"*). An inter-ride SLM builds a 4-week calendar mixing existing Telo Ride **Races**, **GCN Classes**, and generated **Custom Workouts** that respect their unlocked tiers and ramp difficulty gradually.
- **Hugging Face Models:** `onnx-community/Qwen3-0.6B-ONNX` or `Qwen3.5-2B-ONNX` (desktop) with JSON-schema constrained output referencing real `mapId` / `classId` entries from `classes.json` and `maps.json`.
- **Browser APIs:** WebGPU (inter-ride), IndexedDB.
- **Execution Window & Impact:** Profile screen only (disposed immediately after saving the plan).
- **Another Option:** Curated 4-week template plans parameterized by the rider's current level and weekly days available.
- **Alignment Verdict:** **Ship-Ready (Tier 2).** Bridges Race, Classes, and Custom Workouts into one cohesive progression journey.

#### Feature 54: Custom Course Theme & Sky/Palette Generator (For Custom Workouts)
- **What it does in Telo Ride:** Currently Custom Workouts ride on a dashboard (L1-016), while courses carry `sky`, `haze`, `light`, and `fill` hex palettes (ADR 0035). A rider could type *"Midnight cyberpunk rain"* or *"Golden Tuscan sunset"* to generate a validated WCAG-safe palette & world atmosphere preset for their custom workout backdrop—all locally!
- **Hugging Face Models:** `SmolLM2-135M-Instruct-ONNX` (JSON hex palette output) + deterministic WCAG contrast validator.
- **Browser APIs:** Web Worker.
- **Execution Window & Impact:** Pre-ride only.
- **Another Option:** `bge-micro-v2` matching the rider's prompt to the closest existing world palette from Telo Ride's 100+ worlds!
- **Alignment Verdict:** **Conditional (Tier 3).** Neat personalization without touching Blender assets.

#### Feature 55: The Unified "Race Director" Compound Pipeline (Voice + Telemetry + Optional Vision + Audio)
- **What it does in Telo Ride:** The ultimate synthesis of our investigation: a single, lightweight **Race Director Worker** that orchestrates *shared* tiny models rather than loading redundant ones:
  1. **Inputs:** 1 Hz BLE telemetry (`domain`), optional `silero-vad` + `moonshine-tiny` voice commands, optional 5 FPS `MoveNet` standing/lean state, and `chronos-bolt-tiny` 30-second fatigue forecast.
  2. **Coordinator:** A deterministic TypeScript priority queue (zero mid-ride LLM bloat!) that decides the single most exciting or helpful moment to act on—preventing audio spam.
  3. **Outputs:** `Kokoro-82M` announcer/bot callouts + Web Audio spatial crowd/music ducking + subtle HUD badges + 3D cyclist avatar animations—all automatically governed by `PressureObserver` so Three.js never drops a frame!
- **Hugging Face Models:** Shared pack: `silero-vad` (2 MB) + `moonshine-tiny` (30 MB) + `Kokoro-82M` (85 MB) + `chronos-bolt-tiny` (20 MB) + optional `MoveNet` (6 MB) = **~143 MB total** for an entire arcade-intelligent cycling experience!
- **Browser APIs:** Web Worker, OPFS, Web Audio `AudioWorklet`, WebGPU/WASM/WebNN, `PressureObserver`.
- **Execution Window & Impact:** Mid-ride safe on tablets with ≥ 4 GB RAM when TTS phrases are pre-cached in Lobby and vision/ASR run on CPU/WebNN.
- **Another Option:** Modular "À la carte" packs in `Ride Settings` so a rider with a low-end tablet can enable *only* the 32 MB Voice Cockpit or *only* the 85 MB Announcer.
- **Alignment Verdict:** **Ship-Ready (Tier 1 North Star Architecture!).** Proves you don't need a 4 GB LLM to make Telo Ride feel magical.

---

## 5. Iterative Audit, Critique & Refinement Log (50+ Findings Stress-Tested)

To ensure this investigation is not just a brainstorm but an actionable engineering blueprint for Telo Ride, all 55 findings were iterated through **five refinement passes**:

1. **Pass 1 — Purpose & Direction Filter (`AGENTS.md`):** Every idea was tested against Telo Ride's core identity (*kart-racing-style game on Echelon/FTMS bikes + GCN-modelled courses + Classes + unified XP/stars/unlocks*). Ideas that felt like generic chatbot bloat were either reshaped into kart-racing/coaching features or moved to the Rejected Anti-Features list.
2. **Pass 2 — WebGPU & 1-Hour Tablet Stress Test:** Every feature running during **Racing** or **Class Ride** was audited for VRAM contention with `three/webgpu` (ADR 0021) and thermal throttling over a 60-minute ride. **Key refinement:** *Zero LLMs (> 200 MB) are permitted to run free-form generation on WebGPU during active 3D rendering.* All SLM tasks were moved to **Inter-Ride** windows (Home, Lobby, Results, Profile, Diagnostics) or replaced mid-ride by deterministic TypeScript + `Kokoro-82M` / `bge-micro-v2` / `chronos-bolt-tiny` / `MoveNet` on CPU/WASM/WebNN.
3. **Pass 3 — Model Consolidation (Stopping Weight Bloat):** Instead of 55 features downloading 55 models, we consolidated the entire catalog onto **6 core shared models** (`silero-vad`, `moonshine-tiny`, `Kokoro-82M`, `bge-micro-v2`, `chronos-bolt-tiny`, `Qwen3-0.6B` / `SmolLM2-360M`, plus optional `MoveNet Lightning`). One download unlocks 5–12 features simultaneously!
4. **Pass 4 — Build-Time vs. Runtime Shift:** Where a task operates on static catalogue data (e.g., class embeddings for Feature 24, music beat grids for Feature 11, GCN class cue tags for Feature 22, static course briefs for Feature 28), we shifted heavy inference to **build time** (shipping tiny KB JSON/binary files) so the rider's browser does near-zero work.
5. **Pass 5 — Browser Platform & Privacy Verification:** Verified L1-021 compliance (same-origin model hosting, zero audio/video exfiltration, rejecting cloud `SpeechRecognition`) and resolved the `SharedArrayBuffer` vs. YouTube iframe deadlock using `COEP: credentialless` + `<iframe credentialless>`.

### Complete 55-Feature Audit & Prioritization Matrix

| # | Feature | Purpose Fit | Tablet Safety | Mid-Ride GPU Risk | Shared Pack | Priority Tier |
| :---: | :--- | :---: | :---: | :---: | :--- | :--- |
| 01 | Hands-Free Resistance & Playback Voice Cockpit | 5/5 | 5/5 | None (WASM) | Pack 1 (Voice) | **Tier 1** |
| 02 | Wake-Word "Hey Telo" Local Activation | 5/5 | 5/5 | None (WASM) | Pack 1 (Voice) | **Tier 1** |
| 03 | Spoken Telemetry Query ("Where's my ghost?") | 5/5 | 4/5 | Low (TTS burst) | Pack 1 (Voice) | **Tier 1** |
| 04 | Voice-Driven Lobby & Race Setup Launcher | 4/5 | 5/5 | None (Pre-ride) | Pack 1 + 2 | **Tier 1** |
| 05 | Voice-Dictated Mid-Ride Bug Reports (L1-019) | 5/5 | 5/5 | None (WASM) | Pack 1 (Voice) | **Tier 1** |
| 06 | Saddle-Safe Acoustic Breath & Noise Guard | 4/5 | 5/5 | None (DSP/WASM) | Pack 1 (Voice) | **Tier 2** |
| 07 | Hands-Free Custom Workout Verbal Editing | 4/5 | 4/5 | None (Pre-ride) | Pack 1 + 2 | **Tier 2** |
| 08 | Live Kart-Race Play-by-Play Announcer | 5/5 | 4/5 | Low (Lobby cache) | Pack 1 (Voice) | **Tier 1** |
| 09 | Bot Racers with Personalities & Mid-Race Banter | 5/5 | 5/5 | Low (Lobby cache) | Pack 1 + 2 | **Tier 1** |
| 10 | Personalized Victory & Map-Unlock Fanfare | 5/5 | 5/5 | None (Post-ride) | Pack 1 (Voice) | **Tier 1** |
| 11 | Cadence-Adaptive Music Energy & Transition DJ | 5/5 | 5/5 | None (Web Audio) | Build-time + DSP | **Tier 2** |
| 12 | World-Specific Procedural Crowd & Ambience | 5/5 | 5/5 | None (Web Audio) | Pack 1 + DSP | **Tier 2** |
| 13 | Rival Ghost Audio Taunts & Time-Split Chimes | 5/5 | 5/5 | Low (Sparse) | Pack 1 (Voice) | **Tier 1** |
| 14 | On-Demand Multilingual Announcer & Localisation | 4/5 | 4/5 | Low (Cached) | Pack 1 (Lang) | **Tier 2** |
| 15 | Live Cadence-Lock Micro-Coach | 5/5 | 5/5 | Low (Sparse) | Pack 1 + 3 | **Tier 1** |
| 16 | Zero-Shot Power & Fatigue Forecaster (Chronos) | 5/5 | 5/5 | None (CPU 30s) | Pack 3 (Coach) | **Tier 2** |
| 17 | Smart Resistance Nudge Advisor (L1-005) | 5/5 | 5/5 | None (CPU) | Pack 3 (Coach) | **Tier 1** |
| 18 | Star-Unlock Pacing Strategist | 5/5 | 5/5 | None (Pre + math) | Pack 2 + 3 | **Tier 1** |
| 19 | Post-Ride Coach Debrief & Weak-Spot Finder | 5/5 | 5/5 | None (Post-ride) | Pack 2 (SLM) | **Tier 1** |
| 20 | Heart-Rate Drift & Recovery Guardian (L1-006) | 4/5 | 5/5 | None (CPU 60s) | Pack 3 (Coach) | **Tier 2** |
| 21 | Adaptive Bot Difficulty Calibrator ("Rival Pack") | 5/5 | 5/5 | None (Pre-ride) | Pack 3 (Coach) | **Tier 1** |
| 22 | Class Video Cue Alignment & Callout Highlighter | 4/5 | 5/5 | None (Build-time) | Build-time / Pack 2 | **Tier 2** |
| 23 | Natural-Language Custom Workout Generator | 5/5 | 4/5 | None (Pre-ride) | Pack 2 (SLM) | **Tier 1** |
| 24 | Semantic "Mood & Goal" Class & Map Search | 5/5 | 5/5 | None (17 MB WASM) | Pack 2 (Embed) | **Tier 1** |
| 25 | "What Should I Ride Now?" Home Concierge | 4/5 | 5/5 | None (Home) | Pack 2 (Embed) | **Tier 2** |
| 26 | Custom YouTube Description → Workout Draft | 5/5 | 4/5 | None (Pre-ride) | Pack 2 (SLM) | **Tier 1** |
| 27 | "Vibe-to-World" Recommender | 4/5 | 5/5 | None (17 MB WASM) | Pack 2 (Embed) | **Tier 2** |
| 28 | Pre-Ride Course Scout & Elevation Briefing | 5/5 | 5/5 | None (Pre-ride) | Pack 1 + 2 | **Tier 2** |
| 29 | Smart Arcade Stage Titles for Custom Workouts | 3/5 | 5/5 | None (Pre-ride) | Pack 2 (SLM) | **Tier 3** |
| 30 | Local Natural-Language Ride History Analytics | 4/5 | 4/5 | None (Profile) | Pack 2 (SLM) | **Tier 2** |
| 31 | Out-of-the-Saddle Standing vs. Seated Detector | 5/5 | 4/5 | Low (5 FPS WASM) | Pack 5 (Vision) | **Tier 2** |
| 32 | Head-Tilt / Shoulder-Lean Kart Cornering | 5/5 | 4/5 | Low (5–10 FPS) | Pack 5 (Vision) | **Tier 2** |
| 33 | Sweat-Free Hand Gesture Controls | 5/5 | 4/5 | Low (4 FPS WASM) | Pack 5 (Vision) | **Tier 2** |
| 34 | One-Shot Bike-Fit & Posture Check (Profile) | 4/5 | 4/5 | None (Pre-ride) | Pack 5 (Vision) | **Tier 3** |
| 35 | Upper-Body Tension & Form Reminder | 4/5 | 5/5 | None (0.1 FPS) | Pack 5 (Vision) | **Tier 2** |
| 36 | Room-Lighting Adaptive Theme Helper | 3/5 | 5/5 | None (1-shot) | Pure Canvas | **Tier 3** |
| 37 | Privacy-Safe Local Avatar Expression Mirroring | 4/5 | 4/5 | Low (2 FPS WASM) | Pack 5 (Vision) | **Tier 3** |
| 38 | Client-Side Display Name & Chat Safety Filter | 3/5 | 5/5 | None (Inter-ride) | Pack 4 (Safety) | **Tier 3** |
| 39 | Multilingual Group-Ride Quick-Chat Translator | 4/5 | 5/5 | None (Chrome API) | Built-in / Pack 4 | **Tier 2** |
| 40 | Post-Ride Shareable Race Recap Story Card | 4/5 | 5/5 | None (Post-ride) | Pack 2 (SLM) | **Tier 2** |
| 41 | Group-Ride Lobby Icebreaker & Hype Intro | 5/5 | 5/5 | None (Lobby) | Pack 1 + 2 | **Tier 1** |
| 42 | Smart Ghost & Rival Recommendation Engine | 5/5 | 5/5 | None (Pre-ride) | Pack 3 (Coach) | **Tier 2** |
| 43 | Local BLE Packet Log Analyzer & Troubleshooter | 5/5 | 5/5 | None (Diagnostics) | Pack 2 + 4 | **Tier 1** |
| 44 | Smart Bug-Report & Diagnostics Summarizer | 5/5 | 5/5 | None (Feedback) | Built-in / Pack 2 | **Tier 2** |
| 45 | Adaptive Screen-Reader Spatial Race Narrator | 5/5 | 5/5 | Low (TTS WASM) | Pack 1 (Voice) | **Tier 1** |
| 46 | Live Offline Captions & Translation for Classes | 4/5 | 4/5 | Low (WASM) | Pack 1 + 4 | **Tier 3** |
| 47 | BLE Telemetry Anomaly & Sensor-Drop Detector | 4/5 | 5/5 | None (CPU 1 Hz) | Pack 3 / DSP | **Tier 3** |
| 48 | Device & Thermal Auto-Governor (`PressureObserver`) | 5/5 | 5/5 | None (Platform) | **Core Prerequisite** | **Tier 1** |
| 49 | Plain-Language Settings & Help FAQ Assistant | 4/5 | 5/5 | None (Settings) | Pack 2 (Embed) | **Tier 2** |
| 50 | Procedural Rival Backstories & Season Rivalries | 5/5 | 5/5 | None (Pre/Post) | Pack 1 + 2 | **Tier 1** |
| 51 | World Lore & Landmark Audio Tour Guide | 5/5 | 5/5 | Low (Sparse) | Pack 1 (Voice) | **Tier 2** |
| 52 | Smart Streak-Protection & Micro-Ride Nudge | 4/5 | 5/5 | None (Home) | Pack 2 / Rules | **Tier 2** |
| 53 | Personalized Multi-Week Training Block Builder | 5/5 | 4/5 | None (Profile) | Pack 2 (SLM) | **Tier 2** |
| 54 | Custom Course Sky/Atmosphere Palette Generator | 3/5 | 5/5 | None (Pre-ride) | Pack 2 (Embed) | **Tier 3** |
| 55 | Unified "Race Director" Compound Pipeline | 5/5 | 4/5 | Managed/Governed | Packs 1 + 3 + (5) | **Tier 1 North Star** |

### 5 Anti-Features Explicitly Rejected (Do Not Build)

Honoring `AGENTS.md` (*"if it does not serve the purpose, do not build it"*):

1. **Free-form conversational LLM chat mid-race:** Dangerous distraction while pedalling hard, starves Three.js of WebGPU VRAM, and adds zero kart-racing value. *Use structured short voice commands (Feature 01/03) instead.*
2. **Real-time generative AI textures / diffusion / 3D mesh generation mid-ride:** Even tiny diffusion models consume > 2 GB VRAM and take seconds per frame—guaranteed OOM crash on a tablet beside Three.js. *Keep Blender-baked courses (ADR 0034/0035).*
3. **Browser `webkitSpeechRecognition` (cloud ASR):** Sends microphone audio to Google servers, directly violating L1-021's zero-exfiltration guarantee. *Use local Hugging Face Moonshine/Whisper ONNX.*
4. **Unverified medical / cardiac diagnosis from HR or webcam rPPG:** Reading heart rate from a webcam or diagnosing arrhythmia is unreliable under sweat/motion and creates liability. *Use real BLE HR straps (L1-006) and non-medical coaching disclaimers.*
5. **Shipping AI models in the initial Angular bundle or auto-downloading without consent:** Violates Telo Ride's #1 frontend rule (*Lazy loading and memory*) and eats mobile/tablet storage unexpectedly. *Every pack must be opt-in, lazy-loaded, and removable in `Ride Settings`.*

---

## 6. Architectural Blueprint for Telo Ride (`frontend/projects/ai/`)

To integrate in-browser Hugging Face AI cleanly into Telo Ride's existing Angular 22 multi-project workspace without violating a single boundary rule:

### 6.1 Workspace & Dependency Direction

Add one focused, lazy-loaded library: **`frontend/projects/ai/`**.
- **Dependency direction:** `ride` → `ai` (dynamic `import()` only, never in initial chunk); `ai` → `api` (contracts & injection tokens only); `ai` never imports `ride`, `world`, `domain`, or `components`.
- **Contracts in `api`:** Define `AI_RUNTIME`, `VOICE_COCKPIT`, `RACE_ANNOUNCER`, `WORKOUT_GENERATOR`, and `AI_MODEL_STORE` tokens in `frontend/projects/api/`. When AI is disabled (the default on first visit), `ride` binds zero-byte no-op stubs.

### 6.2 Threading, WebGPU Coexistence & Memory Lifecycle

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                         MAIN THREAD (Angular 22 + Zoneless)                │
│  ┌─────────────────────┐   ┌───────────────────────┐   ┌────────────────┐  │
│  │ Three.js WebGPU     │   │ Domain BLE & Engine   │   │ PressureObserver│ │
│  │ (World Ride 30-60fps)│   │ (1 Hz Telemetry)      │   │ Auto-Governor  │  │
│  └─────────────────────┘   └──────────┬────────────┘   └───────┬────────┘  │
└───────────────────────────────────────┼────────────────────────┼───────────┘
                                        │ postMessage (compact   │ shed/pause
                                        │ structs / transferables)│ signals
                                        ▼                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     DEDICATED AI WEB WORKER (ai.worker.ts)                 │
│  ┌──────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐  │
│  │ ONNX Runtime Web /   │  │ OPFS Model Cache      │  │ Bounded Buffers │  │
│  │ Transformers.js v4   │◄─┤ (FileSystemSyncAccess │  │ (600-tick ring, │  │
│  │ WebNN → WASM → WebGPU│  │  Handle, zero-copy)   │  │  max 30 TTS)    │  │
│  └──────────────────────┘  └───────────────────────┘  └─────────────────┘  │
└───────────────────────────────────────▲────────────────────────────────────┘
                                        │ 16 kHz PCM chunks (ring buffer)
┌───────────────────────────────────────┴────────────────────────────────────┐
│                     AUDIO WORKLET THREAD (noise-gate.worklet.ts)           │
│           Bandpass filter (300–3400 Hz) + Fan Noise Gate + Resampler       │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Strict Teardown (`DestroyRef`):** Every inter-ride SLM (`Qwen3-0.6B` / `SmolLM2-360M`) calls `session.release()` / `pipeline.dispose()` immediately when the rider navigates into **Racing** or **Class Ride**, returning 100% of VRAM to Three.js before the 3D scene initializes.
- **Mid-Ride Execution Priority:** Mid-ride models prefer **WebNN (NPU)** → **WASM SIMD (CPU)** → **throttled WebGPU** so Three.js frame pacing stays locked.
- **Memory & Heap Proof:** Add a Playwright heap spec (`npm run heap`) proving that repeated enter/leave of AI-enabled races returns heap to baseline.

### 6.3 Same-Origin Hosting, CSP & YouTube Compatibility

1. **Same-Origin Weights (L1-021 Compliant):** Mirror pinned, audited Hugging Face ONNX files under `/models/<pack-id>/` on Telo Ride's own origin (Azure Blob / CDN fronted by the same origin, matching ADR 0021 `/draco/` and ADR 0035 `/courses/`). No CSP wildcard to third-party CDNs needed; zero user data ever leaves the device.
2. **YouTube + Multi-Threaded WASM Coexistence:** Serve Telo Ride with:
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Embedder-Policy: credentialless`
   - Add the `credentialless` attribute to the YouTube `<iframe>` in `frontend/projects/video/`. This unlocks `SharedArrayBuffer` for fast multi-threaded WASM inference in Chrome & Edge without breaking YouTube class embeds!
3. **Ride Settings Storage UX (L1-026):** Extend `Ride Settings` (right beside *Saved worlds*) with an **AI Packs** section showing:
   - Device readiness badge (RAM, WebGPU/WebNN, available OPFS quota via `navigator.storage.estimate()`).
   - Per-pack toggle, download progress bar, exact MB on disk, and 1-click **Delete pack** button.
   - Automatic `navigator.storage.persist()` request when the rider downloads their first pack.

### 6.4 Testing Strategy (`AGENTS.md` Compliant)

- **Zero real Hugging Face network calls in Vitest or Playwright.**
- Provide a deterministic `FakeAiWorker` fixture in e2e tests that returns instant canned transcripts, structured workout JSON, and silent PCM audio buffers, verifying UI flows, accessibility announcements, and error/quota-exceeded handling cleanly offline.

### 6.5 Recommended ADRs Before Any Implementation

1. **ADR 0037:** *An opt-in `ai` library running Hugging Face ONNX models in a dedicated Web Worker with OPFS caching and same-origin weights.*
2. **ADR 0038:** *Cross-origin isolation via `COEP: credentialless` and `<iframe credentialless>` for YouTube coexistence.*
3. **ADR 0039:** *Thermal and memory governance (`PressureObserver` + Three.js WebGPU non-contention rules).*

---

## 7. Recommended Modular "AI Packs" & Phased Rollout Roadmap

Rather than shipping a monolithic AI download, bundle the highest-value Tier 1 & Tier 2 features into **five opt-in, composable packs**:

| Pack | Included Models (Free HF ONNX) | Approx. Size | Unlocks Features | Target Phase |
| :--- | :--- | :---: | :--- | :---: |
| **Pack 0: Core Governor & Chrome Built-in Adapter** | Platform APIs (`PressureObserver`, Chrome `LanguageModel`/`Summarizer`/`Translator`) | **0 MB** | #48 (Governor), #39, #44, fast-path #19/#23 | **Phase 1** |
| **Pack 1: Voice Cockpit & Kart Announcer** | `silero-vad` + `moonshine-tiny` + `Kokoro-82M` (Q8) | **~117 MB** | #01, #02, #03, #05, #08, #09, #10, #13, #15, #41, #45, #51 | **Phase 1** |
| **Pack 2: Smart Discovery & Workout Builder** | `bge-micro-v2` (17 MB) + `Qwen3-0.6B` or `SmolLM2-360M` (210–330 MB) | **~227–347 MB** | #04, #07, #18, #19, #23, #24, #25, #26, #27, #28, #30, #40, #43, #49, #50, #53 | **Phase 2** |
| **Pack 3: Cadence Coach & Fatigue Forecaster** | `chronos-bolt-tiny` (INT8) + tiny local calibrator | **~22 MB** | #15, #16, #17, #20, #21, #42, #47 | **Phase 2** |
| **Pack 4: Multilingual & Community Safety** | `opus-mt-*` (per language) + `toxic-bert` (optional) | **~45–110 MB** | #14, #38, #39, #46 | **Phase 3** |
| **Pack 5: Opt-In Saddle Vision** | `MoveNet Lightning` + `MediaPipe Hand/Face Landmarker` | **~18 MB** | #31, #32, #33, #34, #35, #37 | **Phase 4** |

### Recommended First Vertical Slice (Highest Impact / Lowest Risk)

1. **Start with Pack 0 + Semantic Search (`bge-micro-v2`, 17 MB — Feature 24):** Proves the `frontend/projects/ai/` worker, OPFS caching, `Ride Settings` pack manager, and Playwright fake-worker fixture with a tiny 17 MB model and zero Three.js contention.
2. **Next, land Pack 1 (Voice Cockpit + Kart Announcer — Features 01, 02, 08, 09, 10, 45):** Delivers the single biggest leap in Telo Ride's kart-racing soul, saddle usability, and WCAG 2.2 AA accessibility.
3. **Then, land Pack 2 (Custom Workout Generator + Post-Ride Debrief + BLE Diagnostics Troubleshooter — Features 19, 23, 26, 43):** Unlocks massive utility during inter-ride screens where 100% of WebGPU is free.
4. **Finally, layer Pack 3 (Chronos-Bolt Coach) & Pack 5 (Opt-In Saddle Vision)** into the unified **Race Director (Feature 55)**.

---

## 8. What's Coming in Chrome & Running Telo Ride on Chrome Canary (Bleeding-Edge Options)

Because Telo Ride already requires Chrome or Edge for Web Bluetooth (L1-002), riders and developers who opt into **Chrome Canary** (or upcoming Chrome stable milestones) get early access to a wave of browser-native AI and hardware primitives that eliminate model downloads, offload Three.js GPU contention onto NPUs, and let Telo Ride expose native AI tools.

### 8.1 Upcoming Chrome Built-in AI & Platform Capabilities

| Bleeding-Edge Chrome Feature | Current Status (Canary / Roadmap) | What It Unlocks for Telo Ride | Impact on Hugging Face Packs |
| :--- | :--- | :--- | :--- |
| **Multimodal Prompt API (`LanguageModel` with Audio & Image + JSON Schema)** | Chrome Canary / Origin Trials (desktop) | Feed short voice clips (mic) or a single bike-fit camera snapshot *directly* into Chrome's bundled Gemini Nano, with native JSON-schema output for Custom Workouts (#23, #26) and Race Setup (#04). | **0 MB download** for Telo Ride's SLM/VLM features on supported desktops—keeps OPFS quota completely free for 3D worlds! |
| **Writer, Rewriter & Proofreader APIs** | Chrome Canary / Developer Preview | Instant local generation and tone-shifting for Victory Recaps (#40), Lobby Hype Intros (#41), Rival Backstories (#50), Stage Naming (#29), and polishing spoken Bug Reports (#05, #44). | Replaces `SmolLM2-360M` for all text-polishing tasks with 0 MB app weight. |
| **Summarizer, Translator & Language Detector APIs** | Shipping / Rolling out in Chrome desktop | Condense 10,000-line BLE Diagnostics logs (#44), translate multilingual group-ride quick-chat (#39), and localize class captions (#46) offline. | Replaces `opus-mt-*` / `nllb-200` packs on desktop Chrome. |
| **WebMCP (`navigator.modelContext`)** | Chrome Canary / W3C WebML CG proposal | Telo Ride can register typed, structured tools (`navigator.modelContext.registerTool(...)`) such as `start_race`, `set_target_resistance`, `build_custom_workout`, `search_classes`, and `export_ble_log`. Any browser-native AI agent or accessibility assistant can operate Telo Ride cleanly without brittle DOM scraping. | Turns Telo Ride into an **agent-ready web app**—huge win for hands-free saddle control and WCAG 2.2 AA accessibility. |
| **WebNN (`navigator.ml`) with NPU Offload** | Chrome Canary / Edge (DirectML, CoreML, LiteRT) | Routes ONNX Runtime Web graphs (`silero-vad`, `moonshine-tiny`, `MoveNet`, `Kokoro-82M`, `chronos-bolt-tiny`) directly onto the device's **NPU (Neural Processing Unit)** instead of the GPU or CPU. | **Solves Three.js GPU contention completely:** World Ride keeps 100% of the GPU at 60 FPS while mid-ride AI runs cool and silent on the NPU! |
| **WebGPU `fp16` & `subgroups` (`subgroup_size_control`)** | Shipping / Expanding in Chrome & Canary | Cuts Hugging Face ONNX/WebLLM VRAM usage nearly in half (`fp16`) and accelerates transformer attention & matrix multiplication via warp/wavefront subgroup control. | Makes desktop power-tier models (`Qwen3.5-2B`, `Phi-4-mini`) run ~2x faster in inter-ride windows and reduces thermal spikes. |
| **WASM `Memory64`** | Chrome 133+ / Canary | Lifts the legacy 32-bit 4 GB WebAssembly linear memory cap when running large CPU fallback models. | Prevents OOM tab crashes on devices without WebGPU. |

### 8.2 Practical Guide: Running Telo Ride with Bleeding-Edge AI in Chrome Canary

Power users and developers testing Telo Ride on **Chrome Canary** today can enable Chrome's on-device AI stack alongside Hugging Face ONNX models:

1. **Check Prerequisites:**
   - **OS:** Windows 10/11, macOS 13+ (Ventura or newer), Linux, or Chromebook Plus. *(Note: Android/iOS mobile tablets do not yet ship Chrome's built-in Gemini Nano—they continue using Telo Ride's Hugging Face ONNX packs via OPFS.)*
   - **Disk Space:** At least **22 GB free** on the drive hosting your Chrome Canary profile (Chrome's hard gate for unpacking the ~2–4 GB Gemini Nano weights).
2. **Enable Canary Flags (`chrome://flags`):**
   - `#optimization-guide-on-device-model` → **Enabled** *(or **Enabled BypassPerfRequirement** on older test laptops)*
   - `#prompt-api-for-gemini-nano` → **Enabled**
   - `#prompt-api-for-gemini-nano-multimodal-input` → **Enabled** *(for audio/image input experiments)*
   - `#web-machine-learning-neural-network` → **Enabled** *(to test WebNN / NPU execution in ONNX Runtime Web)*
   - `#enable-experimental-web-platform-features` → **Enabled** *(unlocks experimental APIs like WebMCP `navigator.modelContext` when available in your Canary build)*
   - Relaunch Chrome Canary.
3. **Verify & Inspect Local Model State:**
   - Open `chrome://components` → locate **Optimization Guide On Device Model** → click *Check for update* (confirm version is non-zero).
   - Open `chrome://on-device-internals` → inspect hardware qualification, VRAM/disk checks, and live token throughput.
   - Open `chrome://gpu` → confirm WebGPU and hardware acceleration are active.
   - Users can purge or disable Chrome's built-in weights anytime via **Chrome Settings → System → On-device AI**.

### 8.3 The Recommended "Progressive Enhancement" Strategy (Canary Fast-Path + Hugging Face Universal Base)

Telo Ride should **never require Chrome Canary**, nor fail when Chrome's built-in Gemini Nano is absent (e.g., on an Android tablet beside an Echelon bike, or a laptop with < 22 GB free disk). Instead, behind `frontend/projects/api/`'s `AI_RUNTIME` token, Telo Ride should use a clean **3-tier capability waterfall**:

1. **Tier A — Zero-Download Browser-Native Fast-Path (Chrome Canary / Modern Desktop Chrome):**
   - Probe `LanguageModel.availability()`, `Summarizer.availability()`, `Translator.availability()`, and `navigator.modelContext` at runtime.
   - When `"available"`, route inter-ride text/JSON/summary/translation features (#04, #19, #23, #26, #39, #40, #43, #44) straight to Chrome's built-in Gemini Nano (**0 MB downloaded, instant cold start**).
   - If `navigator.modelContext` exists, register Telo Ride's declarative WebMCP tools automatically.
2. **Tier B — WebNN / NPU-Accelerated Hugging Face ONNX (Canary / Edge / NPU Laptops):**
   - Run mid-ride voice, TTS, pose, and time-series models (`silero-vad`, `moonshine-tiny`, `Kokoro-82M`, `MoveNet`, `chronos-bolt-tiny`) through ONNX Runtime Web's `webnn` execution provider with `{ deviceType: 'npu' }` so Three.js World Ride suffers zero GPU contention.
3. **Tier C — Portable Hugging Face ONNX over WebGPU / WASM + OPFS (Every Chrome & Edge Device, Including Tablets):**
   - The guaranteed baseline that works identically across stable Chrome, Edge, and Android tablets—keeping all 55 features available offline with zero cloud API bills and 100% L1-021 privacy.
