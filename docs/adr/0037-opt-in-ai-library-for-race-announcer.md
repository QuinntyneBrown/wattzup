# 0037. An opt-in `ai` library runs on-device race commentary in a Web Worker

- **Status:** Accepted
- **Date:** 2026-11-23
- **Amends:** [0024](0024-telo-ride-workspace.md)

## Context

`L1-028` (`L2-168` to `L2-175`) adds an optional, on-device play-by-play race announcer (**Arcade
Race Energy**) that speaks race events using a quantized `Kokoro-82M` ONNX text-to-speech model
(~85 MB) stored in the browser's Origin Private File System (OPFS).

Telo Ride's top frontend priority is lazy loading and memory management over hour-long rides on
tablets (`AGENTS.md`, `L2-136`, `L2-138`). Shipping ONNX Runtime Web or announcer logic in the
initial bundle would violate the `302 kB` initial warning budget, and running neural inference on
the main thread would drop 3D course frames. At the same time, `L1-021` requires that no model
weights be fetched from third-party CDNs and no audio, telemetry, or rider names leave the device.

## Decision

- **A lazy `ai` library** (`frontend/projects/ai`, alias `@telo/ai`) holds all on-device AI
  concerns: the OPFS voice-pack store (`OpfsVoicePackStore`), deterministic callout director
  (`RaceAnnouncerDirector`), input sanitizer (`CalloutSanitizer`), dedicated Web Worker
  (`ai.worker.ts`) and client (`KokoroWorkerClient`), Web Audio ducking mixer
  (`WebAudioAnnouncerMixer`), thermal auto-governor (`BrowserThermalGovernor`), and `LocalRaceAnnouncer`.
- **Dependency direction:** `ride` → `ai` (via dynamic `import('@telo/ai')` only, never in the
  initial chunk); `ai` → `api` only; `ai` never imports `ride`, `domain`, `components`, `video`,
  or `world`. ESLint enforces these boundaries.
- **Contracts in `api`:** `RACE_ANNOUNCER`, `VOICE_PACK_STORE`, `THERMAL_GOVERNOR`, and a
  zero-cost `NoopRaceAnnouncer` live in `frontend/projects/api/src/ai/`. Initial bundle impact
  stays within 2 KB gzipped.
- **Same-origin weights & SHA-256 verification:** The voice pack manifest and quantized ONNX
  weights are served from `/models/voice-announcer/` on Telo Ride's own origin under strict CSP
  (`connect-src 'self'`). `OpfsVoicePackStore` verifies every file's SHA-256 hash before committing
  to OPFS and requests `navigator.storage.persist()`.
- **Worker execution & browser compatibility:** `ai.worker.ts` runs `onnxruntime-web` off the main
  thread, preferring WebNN (NPU) → single-threaded WASM SIMD (CPU) → WebGPU so it runs identically
  on stable Chrome and Edge without Chrome Canary or `COEP` header changes. Multi-threaded WASM via
  `COEP: credentialless` is deferred to a future ADR.
- **Deterministic tests:** Automated unit and Playwright tests never download real weights or call
  external networks; they use a deterministic `FakeAiWorker` fixture and fake clocks.

## Consequences

- Riders who never opt in to the race announcer download zero model bytes and zero `ai` chunks.
- Adding future on-device AI features (voice cockpit, semantic search, fatigue forecasting) reuses
  `@telo/ai`, OPFS pack storage, `BrowserThermalGovernor`, and the `FakeAiWorker` test harness.
