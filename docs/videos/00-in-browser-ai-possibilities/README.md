# 00 · In-Browser AI Possibilities

A complete narrated explainer of [`docs/in-browser-ai-possibilities.md`](../../in-browser-ai-possibilities.md), built with the exact same motion-graphics runtime, brand tokens, Kokoro-82M voice synthesis, boom bap score, and no-burned-captions pipeline as [`00-meet-telo-ride`](../00-meet-telo-ride/README.md).

- **Film:** [`00-in-browser-ai-possibilities.mp4`](00-in-browser-ai-possibilities.mp4), 1920×1080, 30 fps, 11 min 03 s, H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 92.99 BPM; a bar is 2.58 s.
- **Source document:** [`docs/in-browser-ai-possibilities.md`](../../in-browser-ai-possibilities.md) — covers all 8 sections, all 55 features across Domains A–H, the 5-pass iterative audit, 5 rejected anti-features, the `frontend/projects/ai/` architecture blueprint, the 6 modular opt-in AI packs, and Chrome Canary's bleeding-edge built-in AI & WebMCP roadmap.

## Run sheet

| Scene | Section covered | Headline |
|---|---|---|
| `hook` | Executive Summary | Local AI, **in the browser.** |
| `why` | Section 1 · Purpose & Fit | Why local AI **fits Telo Ride.** |
| `platform` | Section 2 · Browser Capabilities | Chrome & Edge **compute stack.** |
| `models` | Section 3 · Free Hugging Face Catalog | Quantized ONNX, **tab-sized.** |
| `voice` | Domain A · Features 01–07 | Hands-free **voice cockpit.** |
| `kart` | Domain B · Features 08–14 | Kart racing, **comes alive.** |
| `coach` | Domain C · Features 15–22 | Telemetry, **into coaching.** |
| `discover` | Domain D · Features 23–30 | 100 worlds. **Zero friction.** |
| `vision` | Domain E · Features 31–37 | Saddle vision. **Zero video sent.** |
| `social` | Domain F · Features 38–42 | Social rides, **zero bloat.** |
| `diag` | Domain G · Features 43–49 | Reliable. **Accessible.** |
| `narrative` | Domain H · Features 50–55 | One unified **Race Director.** |
| `audit` | Section 5 · 5-Pass Audit & Anti-Features | 55 findings. **5 passes.** |
| `arch` | Section 6 · Angular Blueprint | Lazy library. **Strict isolation.** |
| `packs` | Section 7 · Modular Opt-In Packs | Pick only **what you want.** |
| `canary` | Section 8.1–8.2 · Chrome Canary | Next in Chrome **built-in AI.** |
| `waterfall` | Section 8.3 · Progressive Enhancement | Three-tier **AI waterfall.** |
| `close` | Telo Ride Purpose (`AGENTS.md`) | TELO Ride |

## Build it again

From the repository root:

```shell
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/00-in-browser-ai-possibilities
node tools/video-build/build.mjs docs/videos/00-in-browser-ai-possibilities --crf 25
```
