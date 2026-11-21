# Render the scene at a quality tier

## Overview

World Ride (L1-017) draws each class's world behind the HUD (`world-ride/draw-class-scene`). This feature makes that world look as good as the screen allows. It covers the renderer backend, the four quality tiers and the techniques each one turns on, the frame budget that lowers the tier, and how reduced motion and missing assets are handled (L2-111, ADR 0021).

**quality tier** — one of `low`, `medium`, `high` and `ultra`; each turns on the techniques of L2-111 whose _From tier_ is that tier or lower

**technique** — one of the fifty rendering techniques of L2-111, numbered as in its table, in its bike-scene form

**backend** — what the renderer draws through: WebGPU when an adapter is granted, else WebGL2

**frame period** — how long one refresh of the rider's display lasts, measured when World Ride opens: 33.3 ms at 30 Hz, 16.7 ms at 60 Hz, 6.9 ms at 144 Hz

**frame budget** — the frame period _P_; a 2-second window whose median frame is over 1.2 × _P_ (budget plus 20 %) counts as over budget

**fallback form** — what a technique draws when it is not on, or its asset is missing: the form of the next lower tier, or nothing

The tier is a property of the screen and the scene, not of the rider. Nothing about it is stored, sent to the backend or shown in a panel. The rider sees only the world; the HUD works the same at every tier (L2-111 criterion 7).

## Description

### Backend

None.

### Frontend (`frontend/projects/wattzup/src/app/core/`)

**Quality rules (`core/render-quality.ts`, new, with `render-quality.spec.ts`).** Pure code, no Three.js.

- **`Tier`**: `'low' | 'medium' | 'high' | 'ultra'`. **`Backend`**: `'webgpu' | 'webgl2'`.
- **`TECHNIQUES`**: the fifty rows of L2-111 as `{ id, name, from: Tier | null, reducedMotion: 'kept' | 'still' | 'off' }`. `from: null` marks a technique that is not built (21, 29).
- **`startTier(backend)`** returns `ultra` for `webgpu` and `high` for `webgl2` (L2-111 criterion 3).
- **`techniquesAt(tier, backend, reducedMotion)`** returns the set of technique ids drawn (criteria 2 and 5):
  - a technique is drawn when its `from` is at or below `tier`;
  - `ultra` techniques are dropped on `webgl2`;
  - with reduced motion, the `off` techniques are dropped. The `still` ones stay, and the renderer freezes their time.
- **`FrameBudget`** keeps the 2-second windows (criterion 4):
  - `new FrameBudget(tier, periodMs = 1000 / 60)` starts at the tier, judging against the period;
  - `sample(now, frameMs)` records one frame;
  - when a window closes, it takes the window's median and returns `'drop'` after the second window in a row over 1.2 × the period, else `'keep'`;
  - `setPeriod(ms)` takes a newly measured period and starts its windows afresh, so no window that straddles the change is judged; `pause()` judges nothing until the next `setPeriod` (criterion 9);
  - `'drop'` is never returned at `low`, and nothing ever returns `'raise'`.

**Frame period (`core/frame-period.ts`, new, with `frame-period.spec.ts`).** Pure code (criterion 9).

- **`estimateFramePeriod(intervals: readonly number[]): number`** leaves out the first interval and any over 100 ms, takes the median of the rest and snaps it to the nearest common refresh rate (30, 48, 50, 60, 75, 90, 120, 144, 165 or 240 Hz). With fewer than 10 intervals left, it returns 1000 / 60.

**Measuring (`core/frame-scheduler.ts`).** `FrameScheduler` stays the app's only `requestAnimationFrame` caller.

- **`measurePeriod(frames = 30): Promise<number>`** requests `frames + 1` frames back to back, draws nothing in them, and resolves `estimateFramePeriod` of their intervals. It waits while the tab is hidden.

**Who measures, and who passes the period on (`dashboard/world-scene/world-scene.ts`).**

- At open, `WorldScene` awaits `frames.measurePeriod()` alongside the renderer's import, before `start`, so the scene's own work does not slow the measurement. Once `start` resolves `true`, it calls `renderer.setFramePeriod(period)`.
- On `visibilitychange` to visible, and on a change of `matchMedia('(resolution: <devicePixelRatio>dppx)')` (the window moved to another screen), it calls `renderer.pauseBudget()`, holds the scene's picture (draws no frame) and measures again; then it calls `renderer.setFramePeriod(period)` and draws on.
- `WorldRenderer` (`core/world-renderer-port.ts`) gains `setFramePeriod(ms)` and `pauseBudget()`, which hand the period to its `FrameBudget` and pause it.

**Renderer (`core/world-renderer.ts`).** It moves to `WebGPURenderer` from `three/webgpu` (ADR 0021).

- `start(canvas, world)` becomes `Promise<boolean>`. It awaits `renderer.init()`, which picks the backend: WebGPU, else WebGL2.
- On each `draw`, it feeds `FrameBudget`. On `'drop'`, it rebuilds its pass chain for the lower tier. Until `setFramePeriod` is first called, the budget judges against 60 Hz.
- It builds the scene and the post-processing chain from `techniquesAt(...)`. Each technique is one module under `core/world-render/` that is told whether it is on. When it is off, or its asset is missing, it draws its fallback form (criterion 6).
- **Pass order:**
  1. depth and velocity pre-pass (7, 33);
  2. shadow cascades (12, 37);
  3. opaque geometry, with clustered lights (4, 9, 14, 15, 38, 39);
  4. sky and atmosphere (11, 25, 40), then volumetrics (26);
  5. transparent geometry and water (20, 27, 30);
  6. GTAO (36), SSR or ray-traced reflections (10, 45), then GI (13, 46, 47, 48);
  7. auto exposure (35), glare (49), heat haze (50), motion blur (33, 34);
  8. TAA or FXAA (7), then AgX tone mapping (17).

  Techniques 3, 5, 18, 19, 22, 23, 24, 32, 41, 42, 43 and 44 shape the geometry, the materials and the assets, not the passes.

- **Reduced motion.** `SceneFrame.reducedMotion` drops the `off` techniques and holds the clock of the `still` ones (L2-111 criterion 5; L2-110 criterion 6).

**Compile-time technique features (`core/material-features.ts`, #680).** World Ride draws through `WebGPURenderer` on both backends, so every material is a node material on WebGPU and on WebGL2 alike, and three's node builder emits code only for the features a material has. That makes each per-material technique a compile-time switch:
- clear-coat frame paint (15) compiles in only while `clearcoat > 0`, which is from `medium`;
- the wet road (14) is roughness and colour uniforms, and its sky reflection compiles in only while the road has an `envMap`, which is only in a wet scene from `medium`;
- the layered road (9) swaps the texture its map reads, which is a uniform, not a program;
- the setts' relief (3) compiles in with the `normalMap`.

`defines` and `customProgramCacheKey` belong to the classic `WebGLRenderer`, which World Ride does not use. `compiledFeatures(material)` names the features that decide a program; on a tier change, the renderer sets `needsUpdate` only on a material whose key changed, so a drop rebuilds only the programs it must. The bend (L2-111 criterion 8) stays in every material's vertex stage, unchanged. The performance sweep's material variants include `env-map`, so a run shows which materials carry the wet-surface code.

**Compile ahead (L2-111 AC10, #682).** A program compiled the first time a mesh appears costs a long frame, which the budget reads as slowness. So `ThreeWorldRenderer.start` ends with a warm-up, while the canvas is still empty. It sizes the renderer to the canvas, then draws the scene through the tier's pass chain over three frames. Every part is drawn, with hidden parts made visible and frustum culling off. Then everything is put back and the warm-up waits for the GPU queue. Three details matter:
- Lights are left as they are, because the lights a material is compiled for are part of its program.
- Three frames are needed: the scene pass runs once per animation frame, the pass chain's history takes its programs from the second frame, and TRAA's depth copy waits for the first frame at the drawing buffer's full size.
- The frames come from `FrameScheduler.nextFrame()`, passed into `start`, so the scheduler stays the only `requestAnimationFrame` caller.

`renderer.compileAsync(scene, camera)` was tried first and rejected. It compiles for drawing straight to the screen, while World Ride draws the scene into the pass chain's render targets, so the first frame compiled its own set as well (112 programs instead of 70). The probe's `programsBeforeRide` is the count when `start` resolves; the sweep checks that the count stays there at a pinned tier, and reports `compiledDuringRide` for every scene.

**Compile the next-lower tier too, and rehearse the first frames (L2-111 AC10, #882).** The warm-up first draws the scene at the tier a drop would lead to (`nextLower`), then at the tier the ride starts at, so the ride inherits the starting tier's history. Three things keep a drop from compiling anything:
- **Shared pass chains.** Pass chains are kept, keyed by the techniques `buildPipeline` reads (7, 33, 36, 49, 50, 52). Tiers that draw the same passes share one chain: `ultra` and `high` do, since no ultra-only technique is built yet. This matters for GTAO, whose instances share one full-screen quad in three. Two chains each with an AO pass would release each other's program.
- **The sky's light, made once.** The image-based light from the physical sky (6) is made once per scene. Remade at every tier change, it compiled PMREM's programs again and gave every lit material a new environment.
- **Built once at load.** The flat sky's node (53) is built once. So is the arch's banner mesh, made with the arch: a new effort swaps only its texture, where a new mesh compiled at the current tier mid-ride.

**Fall once, start clean (L2-111 AC4, AC10, AC12, #896).** A drop is a visible change of look, so a scene far over budget falls straight to `low` instead of a tier per four seconds: when the second window's median is 3 × _P_ or more, `FrameBudget` drops to `low`. The warm-up therefore draws `low` as well as `nextLower` (one round each, lower tiers first). Each pass chain's TRAA node is kept beside it; after the warm-up's rounds, and whenever a different chain is swapped in, its history is restarted by sizing it to 1 × 1, which makes `TRAANode` copy the next frame's own picture in as its history. The warm-up draws hidden parts from a camera no frame has placed yet (the camera is placed by `draw`), so the first rehearsal frame jumps the whole view and smears; the history is therefore restarted after that first rehearsal frame, and the remaining rehearsals build it from a still camera. The warm-up frames were also on screen while the scene loaded: that was the smeared, pale frame of #896 at about a second. `WorldScene` now keeps its canvas `aria-busy="true"`, at `opacity: 0`, until `start` has resolved and the driver exists, so the rider first sees a clean rehearsal frame. The road keeps its pattern at `low`: the drawn look's toon twin takes the layered road map (the setts on a cobbled world), not the plain one, so a cobbled street still reads as cobbles in bands.

Last, the ride's own frame (laying the road, placing riders, scenery and the arch) is rehearsed four times at the start line with the ride's segments. Its first run cost 30 to 48 ms of script. The rehearsal is hidden from the probe and the frame budget. The probe counts every program and render pipeline the backend creates (`compiled`). A test-only `drop` request lowers the tier one step (`FrameBudget.lower`), so the sweep can check a drop.

Measured on the reference laptop (Adreno X1-85, headed):
- **Drops.** A drop compiled 49 to 99 programs on WebGPU before. It now compiles none: Old Town, South Beach, Times Square and Stelvio, from `medium`, `high` and `ultra`, on WebGPU and WebGL2 (24 of 24).
- **First 5 s.** On WebGPU, across runs, Stelvio has no frame over 50 ms at `low`, `medium` and `ultra`, and 0 or 1 at `high` (it had 1 at every tier before). Times Square has none at `low` and `medium` (it had 1 or 2), and 1 to 4 at `high` and `ultra`, its first frame landing near 50 ms. Old Town (every tier) and South Beach (`medium` and up) draw over 50 ms in steady state on this laptop, so the 50 ms bar cannot be met there without a faster scene.

**Shared surface materials (`core/world-materials.ts`, #681).** `SurfaceMaterials` hands a scene one `MeshStandardMaterial` per look, keyed by every parameter (textures by identity, colours by value), and disposes each once with the scene. A shared material is never changed after it is handed out; a part that changes its material as it draws (Times Square's flashing ball facets) makes its own. Times Square's street asks it for every standard surface. Measured with the sweep, that took Times Square from 318 to 316 distinct materials with the same programs and no change in frame time beyond noise: three already shares one program between materials alike, and most of the scene's materials are per-texture billboards that cannot be shared. Other scenes move over only when a profile shows near-duplicate materials worth sharing.

**The bend at every tier (L2-111 criterion 8, ADR 0023).** The road's bend is a vertex-stage `positionNode` on every material, not a technique: it is on at every tier and on both backends, and no tier turns it off. Its cost is a few arithmetic steps per vertex and one 2 KB upload a frame; frustum culling is off for bent meshes. The frame budget is the same as on a straight road, so a screen that cannot hold its tier on a bending road drops one as it would for any other load (`world-ride/draw-class-scene`, The bending road).

**Test-only tier hook (`core/world-ride-probe.ts`, #672).** The performance sweep (`frontend/e2e/sweeps/performance.sweep.ts`) must draw every tier on demand. Its fixture, `e2e/fixtures/world-ride-probe.ts`, sets `window.__wzWorldRide = { tier, backend }` before the app boots; `backend: 'webgl2'` builds the renderer with `forceWebGL`, so the sweep can profile the WebGL2 fallback on a WebGPU screen (#679). `readWorldRideProbe` reads it when the renderer starts. The scene then opens at that tier (`ultra` draws at `high` on WebGL2), and its `FrameBudget` is built `pinned`, so no window lowers it. The renderer keeps `__wzWorldRide.report` current: `{ tier, backend, frames, gpuMs, drawCalls, programs, materials }`, the time between each drawn frame and the last frame's draw calls (counted across every pass, so `info.autoReset` is off while the hook is set) and the programs alive (`renderer.info`, #674). `gpuMs` is each frame's GPU time from timer queries: while the hook is set the renderer is built with `trackTimestamp`, which uses WebGPU's `timestamp-query` feature or WebGL2's `EXT_disjoint_timer_query_webgl2`, and resolves the time after each frame. Where `hasFeature('timestamp-query')` is false, `gpuMs` is `null`, written rather than omitted. A rider's renderer is built without timer queries (#675). `materials` counts the scene's distinct materials by type and features (`materialVariants`: transparent, double-sided, map, normal map, emissive map, alpha test, vertex colours, clear-coat, transmission), refreshed every 120 frames: where program variants come from. The sweep also counts first-use stalls, frames over 50 ms in the first 5 s (#679). The sweep rides each scene's first class at each pinned tier, skips 3 s, records 20 s and attaches the median and p95 frame time with the counts; it judges no number. The hook is not a rider option and is not in the README; nothing in the app sets the global, only the lazy World Ride chunk reads it, and the behaviour specs never use it.

**Scene component.** `WorldScene` awaits `start`. It emits `unavailable` when `start` resolves `false` or rejects (L2-111 criterion 1).

**Assets (`frontend/public/worlds/<id>/`).** Captured and baked assets are made offline from each scene's capture, then bundled. A scene lists what it has in `worlds/<id>/manifest.json`; a technique whose asset is not listed draws its fallback form. The assets are:

- photogrammetry meshes (1);
- scans and material maps (2, 3);
- lightmaps (5);
- probes (13, 40);
- impostor atlases (43);
- splats (44);
- virtual-texture pages (41).

### The drawn look at `low` (criterion 11, ADR 0024, #663)

At `low`, techniques 51 to 54 replace physically based shading with a deliberately drawn look. Each is built in its own sub-issue, in this order:

1. **Banded toon shading (51, #691).** `applyTier` gives every lit surface a toon node material at `low`. It keeps the surface's colour map, alpha and the road bend's `positionNode`, so the bend (ADR 0023) is unchanged. Diffuse light falls into three bands with `smoothstep` edges (three's toon lighting samples a 64-texel ramp built from `toonShade`), and a rim term is coloured by the scene's sky. The rim fades on surfaces facing up, so the road and ground, seen edge-on, do not wash out. `ToonLook` (`core/world-toon.ts`) makes one toon twin per original material, so sharing is kept, and puts the originals back above `low`. The bend sweep swaps anything that joins the scene later. The test-only hook reports the scene's material types and how many materials lack the bend. Because `WebGPURenderer` compiles node materials for both backends, one material serves WebGPU and WebGL2. The pure rule (`core/drawn-look.ts`) owns the band thresholds and the rim colour, with unit tests one row per band.
2. **Ink outlines (52, #692).** At `low`, the scene pass writes two more targets beside the colour: the view normal (`directionToColor(normalView)`) and an `ink` mask, 0 by default. The rider's and pacers' toon twins set `mrtNode` to write 1 (`ToonLook.inkWarm`). Twins exist only at `low`, so no other tier's output is touched. One full-screen pass (`inkOutline`, `core/world-ink.ts`) compares each pixel with its four neighbours: the relative jump in view depth and the turn of the normal, by `edgeAmount`'s thresholds (`drawn-look.ts`, unit-tested). It then mixes in the scenery's ink, or the warmer riders' ink where the mask is set. It runs before FXAA. The HUD is HTML over the canvas, so it is never outlined. Measured at `low` against toon shading alone, the pass costs 0 to 4.5 % of the median frame time; the drawn look as a whole stays within about 1 % of the `low` it replaced.
3. **Flat sky gradient and dithered foliage (53, 54, #693).**
   - **Sky:** at `low`, `scene.backgroundNode` is `flatSky` (`world-toon.ts`): the scene's sky colour in the middle, 20 % deeper at the top and 35 % paler at the horizon, in straight lines down the screen (`skyStops`, `skyAt` in `drawn-look.ts`). The fog takes the horizon stop. Scenes with a photographed panorama show it only above the panorama's fading top.
   - **Cut-outs:** every alpha-tested toon twin (leaves, flags, crowds) cuts against its own `alphaTest` moved by a 4 × 4 Bayer threshold (`BAYER_4`, ±0.2, kept within 0.02 to 0.98: `ditherThreshold`). The threshold is read from a 4 × 4 nearest-filtered texture tiled one texel per screen pixel, so it holds still while the camera does. No tier draws alpha-to-coverage (technique 32 is not built yet), so the dither stands in for it at `low`.
   - **Tests:** the test-only hook reports `skyGradient` and the number of dithered materials. A behaviour spec pauses a `low` ride under reduced motion and checks that two frames 1.5 s apart are identical.

Nothing in the drawn look animates on its own, so reduced motion needs no rule of its own. The performance sweep (`e2e/sweeps/`) compares the drawn look's median frame time with today's `low`, on both backends.

### Screen states

No new screen state. The scene looks better or plainer, or drawn at `low`; the HUD mocks `pages/world-ride/*` hold at every tier. The drawn look has no mock: it is a look of the 3D scene, so it is reviewed from screenshots (`docs/screenshots/<world>/drawn-low.png`) once #692 lands.

### Acceptance tests

No backend test: this feature has no backend part.

Playwright (`frontend/e2e/world-ride.spec.ts`):

- `shows This screen can't draw 3D worlds when WebGL is off, and the HUD still works`, already there (L2-111 AC1). The `FakeWebGl` switch also hides `navigator.gpu`.

Unit tests (`render-quality.spec.ts`):

- `startTier` for each backend (AC3);
- `techniquesAt`: one case per tier on each backend, and with reduced motion. Each checks the techniques drawn against the table, with 21 and 29 never drawn and `ultra` only on WebGPU (AC2, AC5);
- `FrameBudget`: two windows over budget drop one tier, or straight to `low` at 3 × _P_ or more, in one drop; one window over budget keeps it; nothing drops below `low`; no window ever raises it (AC4). One case per row of 30 Hz at 34, 45 and 100 ms, 60 Hz at 18, 25, 49 and 85 ms, and 144 Hz at 8, 18 and 21 ms (AC4); while paused and across `setPeriod`, no window is judged (AC9).
- `estimateFramePeriod`: one case per row of 30, 60, 120 and 144 Hz, jittery intervals, a long first interval and gaps over 100 ms left out, and too few intervals falling back to 60 Hz (AC9).
- `FrameScheduler.measurePeriod`: driven by a fake `requestAnimationFrame` clock, never a sleep (AC9).
- `FrameScheduler.nextFrame`: resolves on the next frame and asks for no frame after it (AC10).

Performance sweep (`frontend/e2e/sweeps/performance.sweep.ts`, run only when a person asks): `compiles every program before the first frame, at a pinned tier` rides the default class for 20 s at `high` and expects the program count to stay at `programsBeforeRide` (AC10).

A behaviour spec cannot set the refresh rate of the rider's display: the headless browser always reports its own. The unit tests prove the rules; the e2e specs prove World Ride still opens and draws.

How each tier looks (AC2), and the fallback form of each technique when its asset is missing (AC6), are judged by eye and by the visual sweep, which runs only when a person asks. That the HUD stays responsive (AC7) holds because the HUD is DOM and the scene draws on the app's frame loop.

### Baseline profile (#679)

Recorded before any shader work (#680 to #682) with the performance sweep, headed, one worker, at commit `1fcf211a`, on a Microsoft Surface Laptop 7 (Snapdragon X Elite X1E80100, Adreno X1-85), Playwright 1.65.1's bundled Chromium at 1440 × 900. `webgl2` rows force three's WebGL2 backend on the same machine. Times compare runs on this machine only.

| Scene | Tier | Drawn at | Backend | Frames | Median (ms) | p95 (ms) | GPU median (ms) | Draw calls | Programs | Stalls in first 5 s |
|---|---|---|---|---|---|---|---|---|---|---|
| timessquare | low | low | webgpu | 1048 | 18.8 | 24.7 | 6.8 | 860 | 36 | 5 |
| timessquare | medium | medium | webgpu | 782 | 25.2 | 31.7 | 9.1 | 1078 | 63 | 6 |
| timessquare | high | high | webgpu | 704 | 27.4 | 32.8 | 11.5 | 1086 | 71 | 8 |
| timessquare | ultra | ultra | webgpu | 723 | 27.1 | 34.6 | 11.5 | 1086 | 71 | 8 |
| timessquare | low | low | webgl2 | 793 | 24.3 | 31.6 | 23.0 | 860 | 36 | 3 |
| timessquare | medium | medium | webgl2 | 509 | 39.4 | 43.9 | 37.3 | 1078 | 65 | 1 |
| timessquare | high | high | webgl2 | 457 | 43.7 | 53.9 | 41.0 | 1086 | 73 | 1 |
| timessquare | ultra | high | webgl2 | 463 | 42.9 | 50.7 | 41.1 | 1086 | 73 | 12 |
| bigsur | low | low | webgpu | 1217 | 16.7 | 17.6 | 3.5 | 264 | 13 | 2 |
| bigsur | medium | medium | webgpu | 1205 | 16.7 | 17.9 | 5.8 | 477 | 34 | 4 |
| bigsur | high | high | webgpu | 1209 | 16.6 | 17.7 | 7.5 | 485 | 42 | 6 |
| bigsur | ultra | ultra | webgpu | 1215 | 16.7 | 17.8 | 7.5 | 485 | 42 | 6 |
| bigsur | low | low | webgl2 | 1213 | 16.6 | 17.6 | 8.8 | 264 | 13 | 1 |
| bigsur | medium | medium | webgl2 | 808 | 24.7 | 29.5 | 21.1 | 477 | 34 | 2 |
| bigsur | high | high | webgl2 | 813 | 24.8 | 28.4 | 20.9 | 485 | 42 | 3 |
| bigsur | ultra | high | webgl2 | 811 | 24.8 | 28.4 | 21.2 | 485 | 42 | 4 |
| galibier | low | low | webgpu | 1210 | 16.7 | 17.9 | 4.7 | 728 | 20 | 3 |
| galibier | medium | medium | webgpu | 650 | 31.1 | 35.4 | 7.0 | 1316 | 45 | 6 |
| galibier | high | high | webgpu | 611 | 31.6 | 42.3 | 8.5 | 1324 | 53 | 6 |
| galibier | ultra | ultra | webgpu | 602 | 32.6 | 43.4 | 7.9 | 1324 | 53 | 10 |
| galibier | low | low | webgl2 | 878 | 22.7 | 27.0 | 20.8 | 728 | 20 | 4 |
| galibier | medium | medium | webgl2 | 473 | 43.1 | 50.1 | 38.3 | 1316 | 45 | 20 |
| galibier | high | high | webgl2 | 451 | 45.1 | 52.1 | 40.7 | 1324 | 53 | 20 |
| galibier | ultra | high | webgl2 | 451 | 45.3 | 53.2 | 40.9 | 1324 | 53 | 27 |

Sources of program variants, most first:

1. **The tier's techniques, not the material count.** Programs grow by 21 to 27 from `low` to `medium` in every scene (shadow maps, clear-coat frame paint, the medium-tier techniques), while the materials stay the same. Times Square draws about 290 distinct materials through 36 programs at `low`.
2. **Mapped standard materials.** `MeshStandardMaterial+map` (22 to 29 per scene) and plain `MeshStandardMaterial` (11 to 27) are the most shared variants; Times Square's signs and glass add `+emissive-map+alpha-test` (33).
3. **Per-texture basic materials.** Times Square's 199 `MeshBasicMaterial+map` billboards share one program but cost a draw call each: 860 to 1,086 draw calls against Big Sur's 264 to 485.

The WebGL2 backend takes 2.5 to 5 times the GPU time of WebGPU for the same scene and programs, and first-use stalls cluster there: Galibier on WebGL2 has 20 to 27 frames over 50 ms in its first 5 s.

### Open questions

- **The drawn look's review.** ADR 0024 chose to replace PBR at `low`, with no rider option and no per-class override. A person reviews the first screenshots of the drawn look before the ADR is accepted.

- Times Square compiled three small full-screen programs on its first frame after the warm-up (#682). Since #882 the sweep shows none compiled during the ride at any tier. The cause was not isolated; the likeliest is GTAO's module-level quad, now that one chain serves every tier drawing the same passes. Whether a faster Old Town and South Beach can meet the first-5 s bar at `medium` and above is open.
- **Captured assets.** The photogrammetry, scans, splats and baked data of each scene are <TO SUPPLY>. Until they exist, techniques 1, 2, 3, 5, 13, 40, 41, 43 and 44 draw their fallback forms.
- **Ray-tracing builder.** Techniques 45 to 48 need a BVH over the scene. Building it in-house or adding a package (an amendment of ADR 0021) is <TO SUPPLY>.
- **World Ride chunk budget.** Only the initial bundle has a budget. A budget for the World Ride chunk and each scene's assets is <TO SUPPLY>.

## Requirements

| L2 ID    | Refines (L1) | Requirement                                                                                                                                                                                                                                                                                             |
| -------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `L2-111` | `L1-017`     | World Ride rendering quality. The scene draws with WebGPU or WebGL2 at a quality tier that turns on the techniques of the table, starts high and drops on a frame budget of the display's measured frame period, compiles its programs while it loads, honours reduced motion, falls back when an asset is missing, and never blocks the HUD. |
| `L2-110` | `L1-017`     | World Ride scene rendering. The fallback notice, the hidden tab and reduced motion apply at every tier.                                                                                                                                                                                                 |
| `L2-101` | `L1-017`     | The scenes. Every captured or baked asset is bundled and served from the same origin.                                                                                                                                                                                                                   |

## Diagrams

### Components

`WorldScene` starts `WorldRenderer`, which asks `render-quality.ts` which tier and techniques are in force, and builds its passes from the answer.

![C4 component view for rendering the scene at a quality tier](diagrams/c4-component.png)

### Class structure

`TECHNIQUES` is the table of L2-111. `techniquesAt` reads it for a tier, a backend and reduced motion. `FrameBudget` turns frame times into `keep` or `drop`, judged against the frame period that `estimateFramePeriod` measured.

![Class diagram for rendering quality](diagrams/class-structure.png)

### Behaviour — drop a tier on the frame budget

Before the first frame, `WorldScene` measures the display's frame period and hands it to the renderer (L2-111 criterion 9). Each frame then feeds the budget. After two windows in a row over 1.2 × the period, the renderer drops one tier, or straight to `low` when the window is 3 × the period or more, and swaps in that tier's passes with a fresh history (criterion 4). When the tab returns or the window changes screen, the budget pauses while the period is measured again.

![Sequence diagram for dropping a tier](diagrams/sequence-drop-tier.png)
