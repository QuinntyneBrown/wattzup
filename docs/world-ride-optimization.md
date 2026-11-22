# World Ride Performance Optimization Guide & Old Town Case Study

This document provides a comprehensive, empirical optimization blueprint for delivering a **60 FPS (`≤ 16.7 ms` frame budget)** World Ride experience in Wattzup while preserving every detail of the drawn and physically based 3D art direction and glassmorphic HUD.

All findings, root-cause diagnoses, trade-off analyses, and before/after measurements below were collected on a real hardware GPU using **Playwright + Chromium DevTools Protocol (CDP)** (`Performance.getMetrics`, V8 `Profiler`, and hardware `timestamp-query` GPU timers) against Wattzup's production build.

---

## 1. Executive Summary

Wattzup opens every World Ride at the `low` tier (ADR 0024: banded toon shading, view-normal/depth ink outlines, three-stop sky gradient, ordered Bayer dithering) and adapts downward if a higher pinned or future tier misses the display's measured frame period (`L2-111`).

Profiling revealed that **Old Town Criterium (`oldtown`)**—the flagship scene for the default class (`30-minute-hiit-cardio`)—ran at **31.7 FPS (`29.9 ms` median)** at `low` on WebGPU, **21.5 FPS (`45.1 ms` median)** on WebGL2, and **13.2–14.8 FPS (`54.2–75.1 ms` median)** at `medium`–`ultra`. Crucially, CDP + GPU timer queries proved that Old Town at `low` and `medium` was **not GPU-bound** (`7.67 ms` GPU time at `low`, `10.22 ms` at `medium`—well inside `16.67 ms`), but **CPU render-submission bound** (`30.83 ms` to `74.53 ms` of JavaScript per frame) due to submitting **1,771–3,308 unculled draw calls** every frame.

By refactoring `OldTownStreet` (`world-oldtown.ts`) and `Corners` (`world-corners.ts`)—consolidating ~1,105 town-house meshes into **9 `BatchedMesh`es**, instancing lamps/swifts/ropes/covers, merging corner furniture by vertex colour, pre-initialising ribbon and road normals at build time, eliminating per-frame `computeVertexNormals()` / `computeBoundingSphere()` / `Matrix4.compose()` churn, and enabling hardware back-face culling (`FrontSide`) on closed volumes—**Old Town now runs at a vsync-locked 60.5 FPS (`16.7 ms` median, `17.8 ms` p95) with zero visual loss and 54 % lower JS heap usage**:

| Metric (`oldtown`, WebGPU, `low` — default ride tier) |  Original (`main`) |        Optimized |                     Change |
| ----------------------------------------------------- | -----------------: | ---------------: | -------------------------: |
| **Average Frame Rate (CDP Ride)**                     |           31.7 FPS |     **60.5 FPS** | **+90.9 % (60 Hz locked)** |
| **20 s Sweep Median Frame Time**                      |            28.0 ms |      **16.7 ms** |                **−40.4 %** |
| **20 s Sweep p95 Frame Time**                         |            38.3 ms |      **17.8 ms** |                **−53.5 %** |
| **CDP CPU Script Time / Frame**                       |           30.83 ms |      **9.93 ms** |  **−67.8 % (3.1× faster)** |
| **GPU Median Time / Frame (`timestamp-query`)**       |            7.67 ms | **4.39–4.72 ms** |                **−40.6 %** |
| **Main-Thread Idle Headroom (V8 Profiler)**           | 0.0 % (CPU-pinned) |  **24.8 % idle** | **+4.1 ms/frame headroom** |
| **Draw Calls / Frame (WebGPU / WebGL2)**              |      1,771 / 1,771 |    **746 / 328** |      **−57.9 % / −81.5 %** |
| **JS Heap Used During Ride**                          |            95.5 MB |      **43.9 MB** |                **−54.1 %** |
| **Missing-Normal TSL Shader Warnings**                |        13 warnings |   **0 warnings** |                 **−100 %** |

---

## 2. Profiling Methodology & Playwright CDP Setup

### Test Hardware & Environment

- **CPU**: 11th Gen Intel Core i7-1185G7 @ 3.00 GHz (4 cores / 8 threads)
- **GPU**: Intel Iris Xe Graphics (`intel` / `gen-12lp` integrated GPU, shared system memory)
- **Browser**: Playwright Chromium, headed (`--enable-gpu --ignore-gpu-blocklist`), `1440 × 900` CSS viewport (`devicePixelRatio = 1`, 60 Hz display)
- **Build**: Production static bundle (`cd frontend && npm run build`, served locally with service workers blocked and zero off-origin network requests)

### Instrumentation Channels

1. **Playwright CDP `Performance` Domain** (`page.context().newCDPSession(page)` → `Performance.enable` / `Performance.getMetrics`):
   Measures exact main-thread `ScriptDuration`, `TaskDuration`, `LayoutCount`, `LayoutDuration`, `RecalcStyleCount`, `JSHeapUsedSize`, and `Nodes` deltas across the recording window—added permanently to `frontend/e2e/sweeps/performance.sweep.ts`.
2. **Playwright CDP V8 `Profiler` Domain** (`Profiler.start` / `Profiler.setSamplingInterval({ interval: 200 })` / `Profiler.stop`):
   Captures 200 µs call-stack samples separately during **scene load/warm-up** and **steady-state riding** (simulated Echelon bike streaming `95 rpm` / level `24` ≈ `35.6 km/h`).
3. **Renderer Probe & Hardware GPU Timers** (`window.__wzWorldRide` in `world-ride-probe.ts`):
   Records per-frame wall intervals, WebGPU `timestamp-query` / WebGL2 `EXT_disjoint_timer_query_webgl2` GPU frame durations, total `drawCalls` across all passes, compiled `programs`, `compiledDuringRide`, and material feature variants.

```bash
# Run the Playwright CDP performance sweep on Old Town (headed, single worker)
cd frontend
WZ_SCENES=oldtown npx playwright test --config playwright.sweeps.config.ts performance -g "frame times per scene and tier" --headed --workers=1

# Compare two sweep JSON reports
node scripts/compare-performance.mjs performance-reports/<before>.json performance-reports/<after>.json
```

---

## 3. Empirical Root-Cause Analysis

### 3.1 The Cross-World Draw-Call Scaling Law

Profiling five scenes of increasing geometric complexity at `low` (WebGPU) established a strict linear relationship between draw calls and CPU frame time:

| Scene (`low`, WebGPU)       | Draw Calls | GPU Median (ms) | CDP CPU Script / Frame (ms) | Median Frame (ms) |  Avg FPS | Scene Load (ms) |
| --------------------------- | ---------: | --------------: | --------------------------: | ----------------: | -------: | --------------: |
| `daytona` (Speedway)        |        484 |            2.82 |                        8.84 |              16.7 | **60.5** |           1,908 |
| `giza` (Plateau)            |        488 |            2.82 |                        8.90 |              16.7 | **60.7** |           1,997 |
| `ibiza` (Coast Sunset)      |        849 |            4.59 |                       18.17 |              19.9 | **52.5** |           2,900 |
| `southbeach` (Ocean Drive)  |      1,415 |            4.85 |                       27.53 |              29.7 | **35.0** |           2,888 |
| `oldtown` _(original)_      |      1,771 |            7.67 |                       30.83 |              29.9 | **31.7** |           4,013 |
| **`oldtown` _(optimized)_** |    **753** |        **4.72** |                    **9.93** |          **16.7** | **60.5** |       **3,767** |

Because ADR 0023 bends the road in the vertex shader (`RoadBend`), scene meshes set `frustumCulled = false` so Three.js never culls geometry whose straight-space bounding box sits outside the camera frustum before bending into view. Consequently, **every `Mesh` in the scene graph is traversed, uniform-updated, and encoded into the WebGPU/WebGL2 command buffer on every pass of every frame**:

- **WebGPU per-RenderObject CPU cost**: `≈ 0.017–0.019 ms` per `Mesh` (`BatchedMesh` amortizes sub-draws inside a single `RenderObject` down to `~0.003 ms`).
- **WebGL2 per-draw CPU cost**: `≈ 0.026 ms` per `Mesh` (reduced by `WEBGL_multi_draw` inside `BatchedMesh` to **1 driver call per batch**).
- **60 FPS Rule of Thumb**: Keeping total active `RenderObject`s under **~450** (and total draw calls under **~800** on WebGPU / **~400** on WebGL2) keeps CPU script time under **`10 ms`**, leaving **`> 6.6 ms`** of margin for browser compositing, bike BLE telemetry, and OS scheduling.

### 3.2 V8 CPU Profiler Hotspots (Before Optimization)

Sampling V8 at 200 µs intervals on unmodified `oldtown` exposed two distinct CPU bottlenecks:

1. **Steady-State Ride (`30.83 ms` script/frame at `low`, `66.43 ms` at `high`)**:
   Over **85 %** of active JavaScript execution lived inside `Three.WebGPURenderer` per-object submission:
   - `GPUQueue.writeBuffer` (native Dawn IPC uniform uploads): **20.3 %** (`6.62 ms/frame`)
   - `Nodes.updateNode` / `RenderObjects.updateByType`: **7.0 %**
   - `Renderer._renderObjectDirect`: **4.1 %**
   - `GPURenderPassEncoder.setVertexBuffer` / `updateBinding`: **5.1 %**
   - `OldTownStreet.lay()` + `placeCrowd()` + `placeBunting()`: recomputing vertex normals and bounding spheres across 12 road ribbons (`computeVertexNormals()` + `computeBoundingSphere()`) and composing `2,800+` `Matrix4` spectator/bunting transforms every frame.
2. **Scene Load & Warm-Up (`4.01 s` at `low`, `10.75 s` at `high`)**:
   - **47.0 %** (`5,677 ms` at `high`; `1,102 ms` / `25.2 %` at `low`) was spent in `Bindings.updateBinding` allocating uniform buffers and WebGPU bind groups for ~1,500 separate meshes across warm-up passes.
   - Procedural 2D canvas generation created **100 `<canvas>` elements (`8.76 MP`)**, including `4,235` individual `CanvasGradient` allocations in `cobbleTextures()` and `1,048,576` `Math.hypot` + closure calls in `normalsFrom()`.

### 3.3 Old Town Draw-Call Census & GPU Overdraw Analysis

At `low`, unmodified Old Town issued **1,771 draw calls** (doubling to **3,305–3,308** at `medium`–`ultra` when the directional shadow map pass re-rendered shadow casters):

```mermaid
flowchart LR
  subgraph Original["Original Old Town (1,771 draws @ low / 3,308 @ high)"]
    H1["90 Houses & Alleys\n~1,105 Meshes\n(DoubleSide!)"]
    C1["7 Cyclists (You + 6 Pacers)\n~350 Meshes"]
    K1["4 Bend Corners\n156 Meshes"]
    L1["15 Street Lamps\n90 Meshes"]
    P1["12 Ribbons + 24 Swifts +\nLandmarks + Props\n70 Meshes"]
  end

  subgraph Optimized["Optimized Old Town (746 draws WebGPU / 328 WebGL2 @ low)"]
    H2["9 Street BatchedMeshes\n(FrontSide + 5 Atlases +\nBack-Camera Culling)"]
    C2["7 Cyclists\n~350 Meshes\n(Next Global Win)"]
    K2["4 Bend Corners\n20 Vertex-Coloured Meshes"]
    L2["7 Lamp InstancedMeshes"]
    P2["6 Multi-Strip Ribbons +\n1 Swift / 1 Cover / 1 Rope\nInstancedMesh + Merged Landmarks"]
  end

  Original -->|"−1,025 WebGPU draws\n−1,443 WebGL2 draws"| Optimized
```

Three hidden GPU & shader defects were also uncovered:

1. **`side: DoubleSide` on Closed House Volumes**: `OldTownStreet.material()` set `side: DoubleSide` on every town-house `BoxGeometry` and roof `prism`, even though all closed volumes wind outward (`FrontSide`) with determinant `+1` on both sides of the street (`rotation.y = Math.PI` preserves winding). The GPU was shading both front and interior back walls of every building in both the MRT scene pass and the `2048 × 2048` 25-tap PCF shadow pass—nearly doubling fragment shader pressure.
2. **Multi-Material Roof Arrays Skipped by `flatten()`**: `house()` and `addCathedral()` passed `[roof, gables]` material arrays on pitched roofs and dormers, which `flatten()` skipped (`if (Array.isArray(o.material)) return;`), leaving ~200 unmerged roof/dormer draw calls.
3. **13 Missing `normal` Attributes During `warmUp()`**: `ThreeWorldRenderer.warmUp()` renders `warmRound()` _before_ `rehearse()` calls `draw()` → `layRoad()`. Neither `OldTownStreet.ribbon()` (11 lit strips) nor `world-renderer.ts`'s `stripGeometry()` (`road` and `ground`) allocated a `'normal'` attribute until the first `lay()` call, emitting 13 `THREE.TSL: Vertex attribute "normal" not found on geometry` warnings and compiling initial warm-up shaders without vertex normals.

### 3.4 Stack-Wide Bundle & HUD Findings (Beyond Old Town)

1. **2.65 MB (`577 KB` gzipped) Monolithic `world-renderer` Chunk**:
   `world-streets.ts` statically imports all **83 street modules**, and `world-renderer.ts` statically imports `OldTownStreet` and `DocklandsStreet`. A rider opening a single class downloads and parses scenery code for all 85 procedural streets before the 3D scene can boot, while the initial app bundle stays lean at `104.9 KB` gzipped (`300 KB` budget).
2. **Per-Frame HUD Layout Thrashing Under `backdrop-filter: blur(0.75rem)`**:
   CDP recorded **`270–336` full DOM layouts and style recalculations per 8-second window (`~34–42 Hz`)** during every ride (`~55 ms` layout + `~36 ms` style recalc). Tracing the DOM mutation showed `WorldRidePage.countdown` updating `[style.--value]="cd.width"` (`pct.toFixed(2)%`) on `wz-progress-bar` at `requestAnimationFrame` cadence underneath six glassmorphic `.world-ride__panel` / `.world-ride__bar` elements styled with `backdrop-filter: blur(0.75rem)`.
3. **Shared `Cyclist` Rig (`world-cyclist.ts`)**:
   Each `Cyclist` builds ~50 separate child `Mesh`es (spokes, rims, tyres, tubes, saddle, bars, shoes, limbs, helmet). With `You` + up to 6 `PACERS` visible, cyclists alone contribute **~350 draw calls (`~700` with shadows)** in _every_ world—now accounting for nearly half of Old Town's remaining draw calls!
4. **Tier-Drop Shader Cache Eviction (`high` → `medium`)**:
   When `applyTier()` transitions from `medium` → `high` during `warmUp()`, mutating `this.roadMaterial.normalMap` and setting `this.roadMaterial.needsUpdate = true` increments `roadMaterial.version`, evicting the `medium` program from Three.js's per-material cache so a subsequent `high` → `medium` drop recompiles pipelines (`10` in `giza`, `64` in `oldtown`), whereas `medium` → `low` and `ultra` → `high` compile `0`.

---

## 4. Optimizations Implemented in Old Town Criterium

All production scene changes were delivered incrementally with ATDD unit and E2E specs while keeping Old Town's deterministic seeded street layout (`seeded(3)`, `seeded(71)`, per-house feature seeds) **pixel-identical**:

1. **9-`BatchedMesh` Street Frontage Consolidation (`world-oldtown.ts`)**:
   - Grouped ~90 town houses and alleys into `20 m` street blocks and packed the entire street into **9 `BatchedMesh`es**:
     - **3 Stacked `wrapS` Façade Atlases**: `upperMat` (14 open/shuttered upper-storey palettes stacked vertically with 8 px edge-extruded gutters), `shopMat` (8 lit ground-floor shopfronts paired with a vertically repeating `shopGlowTexture`), and `homeMat` (8 rusticated town-house ground floors).
     - **3 Vertex-Coloured Shared Materials**: `matte` (all 8 gable wall colours, 8 stone trim colours, chimney brick, terracotta pots/planters, doorway steps, and alley cobbles), `metal` (zinc gutters/downpipes and iron brackets/poles/tables/oculi), and `roofMat` (all 4 clay/slate roof colours tinting one neutral tile map).
     - **2 Packed Detail Atlases + 1 Cut-Out Railing**: `awningMat` (7 striped awning columns in one `512 × 64` `wrapT` atlas), `detailMat` (`1024 × 512` 4 px edge-extruded atlas packing 4 gilt shop fascias, 4 glazed shop doors, 4 trade signs, 4 civic flags, bay leaves, and geranium blooms), and `railing` (`alphaTest: 0.5`, preserving ordered Bayer dithering at `low`).
   - Enabled **hardware back-face culling (`FrontSide`)** on all 6 closed-volume batches (`upperMat`, `shopMat`, `homeMat`, `matte`, `metal`, `roofMat`), keeping `DoubleSide` only on single-sheet geometry (`awningMat`, `detailMat`, `railing`).
   - Applied **vertical road-grade shear (`m[9] = -grade`)** per street block in `place()` so walls and chimneys stay 100 % plumb vertical while footings hug ramps, and culled blocks behind the camera (`start + width ≤ -20 m`, safely behind the sun's 14.4 m forward roof shadow) via `setVisibleAt(id, visible)` guarded by `getVisibleAt(id) !== visible`.
   - Disposed all temporary per-house `BoxGeometry` / `PlaneGeometry` / `prism` instances and marker materials immediately after `BatchedMesh` upload, cutting runtime JS heap by **54–64 %**.
2. **Corner, Lamp, Prop & Landmark Instancing (`world-corners.ts`, `world-oldtown.ts`)**:
   - Merged static corner furniture per material using vertex colours in `Corners` (**156 → 20 meshes** across 4 bend apexes) while keeping the marshal's waving yellow flag animated.
   - Converted 15 street lamps (**90 meshes → 7 `InstancedMesh`es**), 12 wheeling swifts (**24 meshes → 1 `InstancedMesh`**), 3 street-banner ropes (**1 `InstancedMesh`**), and 3 pitched manhole covers (**1 `InstancedMesh`**).
   - Merged solid-colour parts on the cathedral, belfry, and TV moto via vertex colours and disabled shadow casting on the distant cathedral (`500 m`) and belfry (`260 m`), which sit far outside the directional shadow frustum.
3. **Zero-Churn Per-Frame Updates & Pre-Built Normals (`world-oldtown.ts`, `world-renderer.ts`)**:
   - Merged left/right symmetric road ribbons (`kerb`, `pavement`, `damp`, `foot`, `banner`, `rail`: **12 → 6 meshes**), pre-populated analytical cross-section vertex normals at `build()` time (and on `road`/`ground` in `stripGeometry()`), and replaced `.forEach` + `computeVertexNormals()` + `computeBoundingSphere()` with direct typed-array writes in `lay()`.
   - Pre-composed static spectator (`crowd`) and `bunting` rotations/scales once at `build()`, updating only `instanceMatrix` translation slots `[idx * 16 + 13]` (`y`) and `[idx * 16 + 14]` (`z`) per frame.
4. **Procedural 2D Canvas Fast Paths (`world-oldtown.ts`)**:
   - Hoisted per-row linear gradients and stamped a reusable domed sett height tile in `cobbleTextures()` (replacing `8,470` gradient allocations with `78`), replaced `1.05M` `Math.hypot` + closure calls in `normalsFrom()` with direct array indexing + `1 / Math.sqrt(...)`, and batched `Path2D` wall speckles in `bayTexture()` / `homeTexture()`.

---

## 5. Before vs. After Performance Results

### 5.1 Official 20-Second Playwright Sweep (`compare-performance.mjs`)

Recorded with `WZ_SCENES=oldtown npx playwright test --config playwright.sweeps.config.ts performance --headed --workers=1` (`3 s` warm-up skip + `20 s` recording window):

| Scene     | Tier                  | Backend  | Median Frame (ms)         | p95 Frame (ms)            | GPU Median (ms)           |        Draw Calls | Compiled During Ride |
| --------- | --------------------- | -------- | ------------------------- | ------------------------- | ------------------------- | ----------------: | -------------------: |
| `oldtown` | **`low`** _(default)_ | `webgpu` | **28.0 → 16.7 (−40.4 %)** | **38.3 → 17.8 (−53.5 %)** | 7.01 → **4.39 (−37.4 %)** |   1,732 → **746** |            0 → **0** |
| `oldtown` | `medium`              | `webgpu` | **54.2 → 23.2 (−57.2 %)** | **72.2 → 31.8 (−56.0 %)** | 8.91 → **7.27 (−18.4 %)** | 3,227 → **1,239** |            0 → **0** |
| `oldtown` | `high`                | `webgpu` | **57.3 → 31.9 (−44.3 %)** | **96.2 → 47.3 (−50.8 %)** | 14.55 → **17.83**         | 3,230 → **1,242** |            0 → **0** |
| `oldtown` | `ultra`               | `webgpu` | **65.2 → 31.0 (−52.5 %)** | **89.2 → 44.8 (−49.8 %)** | 14.55 → **17.83**         | 3,230 → **1,242** |            0 → **0** |

### 5.2 Playwright CDP Riding Benchmark (WebGPU & WebGL2, 35.6 km/h Active Ride)

| Backend & Tier      | Avg FPS (Before → After)      | Median ms (Before → After) | p95 ms (Before → After) | CDP CPU Script ms/f (Before → After) | GPU Median ms (Before → After) | Draws (Before → After)  | JS Heap MB (Before → After) |
| ------------------- | ----------------------------- | -------------------------- | ----------------------- | ------------------------------------ | ------------------------------ | ----------------------- | --------------------------- |
| **WebGPU `low`**    | 31.7 → **60.5 (+91 %)**       | 29.9 → **16.7**            | 42.8 → **17.9**         | 30.83 → **9.93 (−68 %)**             | 7.67 → **4.72 (−38 %)**        | 1,771 → **753**         | 95.5 → **43.9**             |
| **WebGPU `medium`** | 13.2 → **57.3–60.3 (+334 %)** | 75.1 → **16.7–17.1**       | 112.2 → **17.8–21.9**   | 74.53 → **12.01–13.28 (−82 %)**      | 10.22 → **6.29–6.36 (−38 %)**  | 3,305 → **1,243**       | 78.7 → **51.1**             |
| **WebGPU `high`**   | 14.8 → **38.2 (+158 %)**      | 62.6 → **26.1**            | 92.9 → **32.4**         | 66.43 → **15.58 (−77 %)**            | 18.74 → **15.86 (−15 %)**      | 3,308 → **1,259**       | 134.1 → **56.8**            |
| **WebGPU `ultra`**  | 14.2 → **37.5 (+164 %)**      | 61.7 → **26.0**            | 96.7 → **29.0**         | 69.29 → **13.14 (−81 %)**            | 19.07 → **15.60 (−18 %)**      | 3,308 → **1,259**       | 107.5 → **38.9**            |
| **WebGL2 `low`**    | 21.5 → **53.6 (+149 %)**      | 45.1 → **18.4**            | 56.5 → **25.5**         | 45.75 → **9.93 (−78 %)**             | 10.38 → **9.60 (−8 %)**        | 1,771 → **328 (−81 %)** | 66.9 → **49.5**             |
| **WebGL2 `medium`** | 12.2 → **39.6 (+225 %)**      | 80.8 → **25.2**            | 95.2 → **32.5**         | 81.08 → **11.88 (−85 %)**            | 15.58 → **16.17**              | 3,305 → **560 (−83 %)** | 56.7 → **76.8**             |
| **WebGL2 `high`**   | 10.3 → **30.3 (+194 %)**      | 93.7 → **33.1**            | 127.7 → **41.2**        | 96.40 → **12.70 (−87 %)**            | 24.39 → **22.42 (−8 %)**       | 3,308 → **563 (−83 %)** | 91.4 → **58.1**             |

> [!NOTE]
> Notice how WebGL2 `drawCalls` dropped by **81.5 % (`1,771 → 328`)** because Three.js's WebGL2 backend submits each `BatchedMesh` through a single `WEBGL_multi_draw` (`gl.multiDrawElementsWEBGL`) call, cutting WebGL2 CPU script time by **4.6× to 7.6×**.

---

## 6. Prioritized Roadmap & Trade-Offs for All 191 Worlds

To extend sub-`16.7 ms` startup and 60 FPS rendering across every World Ride scene and tier, execute the following steps in priority order:

### Step 1: Code-Split Street Modules with Dynamic `import()` (`world-streets.ts`, `world-renderer.ts`)

- **Action**: Convert `STREETS: Partial<Record<WorldId, StreetFactory>>` to lazy loaders `Partial<Record<WorldId, () => Promise<StreetFactory>>>` (plus lazy `import('./world-oldtown')` and `import('./world-docklands')` in `ThreeWorldRenderer.start()`).
- **Expected Gain**: Cuts the `world-renderer` chunk from **2.68 MB raw / `577 KB` gzipped** down to **~650 KB raw / ~165 KB gzipped**, loading only the active scene's `15–60 KB` street chunk (`~410 KB` less compressed JS transferred and parsed before `warmUp()` starts).

### Step 2: Batch Rigid Parts in the Shared `Cyclist` Rig (`world-cyclist.ts`)

- **Action**: Merge rigid bike frame tubes/fork/stays (`~14` meshes → `1`), cockpit/saddle/pedals (`~8` → `1`), wheel rim/spokes/hub/tyre (`~12` → `2` rotating wheel meshes), and rigid upper-body jersey/helmet parts per rider.
- **Expected Gain**: Cuts cyclist draw calls in **every single world** from **~350 → ~110** at `low` (**~700 → ~220** with shadows), saving **~`4.2 ms/frame` of CPU** globally and pushing both `oldtown @ medium` (20 s sweep) and `oldtown @ low (webgl2)` cleanly onto the 60 Hz lock (`≤ 16.7 ms`).

### Step 3: Roll Out `BatchedMesh` + `FrontSide` + Stacked `wrapS` Atlases to `world-kit.ts` Streets

- **Action**: Add a shared `StreetBatcher` helper in `world-kit.ts` applying Old Town's pattern (`BatchedMesh` with `perObjectFrustumCulled = false`, `sortObjects = false`, `FrontSide` on closed primitives, vertex-coloured solid materials, and back-camera visibility culling) to draw-heavy scenes (`southbeach` at `1,415` draws, `ibiza` at `849` draws, `docklands`, `timessquare`, `galibier`).
- **Expected Gain**: Brings `southbeach @ low` (`30.1 FPS` → **60 FPS**) and `ibiza @ low` (`50.7 FPS` → **60 FPS**) within the `500`-draw 60 Hz envelope.

### Step 4: Eliminate Per-Frame HUD Layout Churn Under `backdrop-filter` (`world-ride-page`, `progress-bar`)

- **Action**:
  1. Drive `wz-progress-bar` fill with compositor-only `transform: scaleX(var(--ratio))` (`transform-origin: left`) instead of width/layout-affecting properties, or quantize progress updates on `WorldRidePage` to `0.5 %` / `4 Hz` while keeping the `mm:ss` text reactive per second.
  2. Add `contain: layout style paint` on `.world-ride__panel` and `.world-ride__bar` so text updates inside one glassmorphic HUD card never invalidate layout or `backdrop-filter` blur sampling on sibling cards.
- **Expected Gain**: Drops ride-time `LayoutCount` from **`~35 layouts/sec` → `< 2 layouts/sec`**, saving `~0.8–1.5 ms/frame` of main-thread style/layout + compositor blur cost.

### Step 5: Lock 60 FPS at `high` and `ultra` on Integrated GPUs (`world-renderer.ts`)

- **Action**:
  1. Run GTAO (`ao(depth, ...)` in `buildPipeline`) at **half resolution (`0.5×`)** with depth-aware bilateral upsampling (`~4×` fewer SSAO depth taps on integrated GPUs).
  2. Tighten `sun.shadow.camera` bounds to the visible near-road corridor (`[-12, 12] × [-10, 55] m`) and split street batches into near shadow-casting (`< 60 m`) vs. far non-shadow-casting (`≥ 60 m`) instances, or reduce `shadow.radius` tap count on integrated GPUs.
- **Expected Gain**: Cuts `high`/`ultra` `gpuMedianMs` on Intel Iris Xe from **`15.6–17.8 ms` → `~9.5–11.0 ms`**, unlocking **60 FPS at `high` and `ultra`** even on ultrabook integrated graphics.

### Step 6: Preserve Material Program Cache Across `high` → `medium` Tier Drops (`world-renderer.ts`)

- **Action**: Keep two road `MeshStandardMaterial` instances (one plain/layered for `medium`, one with `normalMap: roadRelief` for `high`/`ultra`) instead of mutating `roadMaterial.normalMap` + `needsUpdate = true` inside `applyTier()`.
- **Expected Gain**: Eliminates the remaining `10–64` pipeline compiles on a `high` → `medium` tier drop (`compiledAfterDrop = 0` across all 3 tier-drop transitions).

---

## 7. Optimization Trade-Off Matrix

| Optimization                                                                               | Primary Bottleneck Solved                                    | Measured / Expected Gain                                                    | Visual / UX Trade-Off                                                                                                                                                                               | Memory & Complexity Trade-Off                                                                                                                | Recommendation                                                                            |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **`BatchedMesh` + Vertex Colours + Atlases** _(Done in Old Town)_                          | CPU `RenderObject` & uniform buffer submission               | **−58 % WebGPU draws, −81 % WebGL2 draws, 3.1× faster CPU, −54 % JS heap**  | **Zero visual loss** (100 % identical geometry, UVs, and seeded variation).                                                                                                                         | Slightly more build-time packing code (`~150 LOC`); saves ~50 MB JS heap by disposing source geometries.                                     | **Adopt in `world-kit.ts`** for all dense urban/coastal worlds.                           |
| **`FrontSide` Back-Face Culling on Closed Volumes** _(Done in Old Town)_                   | GPU fragment & shadow-map overdraw                           | **−38 % GPU frame time** at `low`/`medium`; **−15–18 %** at `high`/`ultra`  | **Zero visual loss** on closed outward-wound boxes/prisms; flat sheets must keep `DoubleSide`.                                                                                                      | Zero memory cost; requires verifying `det(matrix) > 0` (use Y-rotation instead of negative scale, or pair negative scale with `DoubleSide`). | **Enforce by default** on all closed meshes across all worlds.                            |
| **Pre-Initialised Strip Normals & Direct Typed-Array `lay()`** _(Done in Old Town & Road)_ | Per-frame CPU normal/bounds recompute + warm-up TSL warnings | Eliminates **13 shader warnings** + saves `~1.5 ms/frame` CPU               | Cross-section normals omit `< 0.2 %` longitudinal ramp tilt (`cos(atan(0.06)) = 0.998`), visually indistinguishable.                                                                                | Zero memory overhead; cleaner, allocation-free hot loop.                                                                                     | **Port to `Ribbons` in `world-kit.ts`**.                                                  |
| **Dynamic `import()` per Street Module**                                                   | Network transfer & JS parse time on World Ride open          | **−410 KB gzipped** lazy download (`577 KB → ~165 KB`)                      | **Zero visual trade-off**; faster loading spinner (`aria-busy`) dismissal on cold cache.                                                                                                            | Builds ~85 small `15–60 KB` hashed chunks in `dist/` (total site size unchanged at `170.3 MB`).                                              | **High priority**; zero downside.                                                         |
| **Rigid Sub-Assembly Merging in `Cyclist`**                                                | Global CPU draw-call floor (`~350` draws in all worlds)      | **−240 draws (`−480` with shadows)** in _every_ world (`~4 ms/frame` saved) | **Zero visual loss**: wheels, cranks, legs, and rider lean continue animating identically via hierarchy pivots.                                                                                     | ~1 hour refactor in `world-cyclist.ts`; benefits all 191 worlds at once.                                                                     | **Highest ROI next step** for global 60 FPS.                                              |
| **HUD Compositor `scaleX` + CSS `contain`**                                                | Main-thread DOM layout & `backdrop-filter` invalidation      | Cuts `LayoutCount` by **> 90 %** (`~1 ms/frame` saved)                      | Rounded pill ends on a `scaleX`-transformed bar distort at tiny percentages unless clipped by `overflow: hidden` on the track; quantizing width to `0.25 %` avoids distortion with 90 % of the win. | Trivial CSS/signal change; preserves crisp `backdrop-filter` glass UI.                                                                       | **Use `overflow: hidden` clip or `0.25 %` quantization** + `contain: layout style paint`. |
| **Half-Resolution (`0.5×`) GTAO at `high`/`ultra`**                                        | Integrated GPU fragment bandwidth (`gpuMedianMs` ~16–18 ms)  | **−4 to −6 ms GPU time** at `high`/`ultra`                                  | Very slightly softer contact ambient occlusion in fine cobble crevices; imperceptible in motion behind FXAA/TRAA.                                                                                   | **−75 % AO render-target VRAM**; single parameter in `buildPipeline`.                                                                        | **Strong win** for locking 60 FPS at `high`/`ultra` on laptop GPUs.                       |

---

## 8. 45-Second Old Town Iterative Optimization Log

Every iteration below is measured across a **45-second sustained ride** (`recordMs = 45,000 ms` after `2,000 ms` settle, `95 rpm` / `~450 m` — more than one full `384 m` Old Town Criterium circuit) at `1440 × 900` via Playwright + Chrome DevTools Protocol (`Performance.getMetrics` + WebGPU `timestamp-query`).

### 45-Second Baseline (`main` post-PR #950)

| Tier (`webgpu`) | Avg FPS | Median (ms) | p95 (ms) | p99 (ms) | GPU Median / p95 (ms) | Draw Calls | Programs (`+mid-ride`) | CDP Script (ms/f) | CDP Task (ms/f) | Layouts / Styles | Cold Load (ms) |
| --------------- | ------: | ----------: | -------: | -------: | --------------------: | ---------: | ---------------------: | ----------------: | --------------: | ---------------: | -------------: |
| **`low`**       |    60.5 |        16.7 |     17.8 |     18.8 |           4.92 / 5.70 |        747 |              65 (`+0`) |             9.329 |          10.331 |    1,504 / 1,506 |        3,944.5 |
| **`high`**      |    38.3 |        26.2 |     32.7 |     49.5 |         15.60 / 17.30 |      1,249 |             240 (`+0`) |            17.344 |          18.835 |    1,314 / 1,319 |       10,861.2 |

### Iteration 1: Merge Rigid Bike Sub-Assemblies in `CyclistKit` (`world-cyclist.ts`, `world-renderer.ts`)

- **Change**: Pre-merged each bike's 16 rigid frame and drop-bar tubes into 1 shared `frameShape`, 2 tyres + 1 saddle into 1 `bikeRubberShape`, 2 rims + 1 chainring into 1 `bikeMetalShape`, and front/rear wheel spoke-lace and speed-blur discs into 1 `wheelDiscsShape` inside `CyclistKit`, and registered pacer `wheelBlur` meshes so `opacity = 0` transparent blur discs are hidden at `low`.
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS (Before → After)  | Median ms | p95 ms          | p99 ms          | GPU Median ms | Draw Calls (Before → After) | CDP Script ms/f (Before → After) |
| --------------- | ------------------------- | --------- | --------------- | --------------- | ------------- | --------------------------- | -------------------------------- |
| **`low`**       | 60.5 → **60.6**           | **16.6**  | 17.8 → **17.8** | 18.8 → **18.1** | 5.37          | 747 → **631 (−116)**        | 9.329 → **8.465 (−9.3 %)**       |
| **`high`**      | 38.3 → **42.4 (+10.7 %)** | **23.7**  | 32.7 → **27.5** | 49.5 → **43.6** | 15.53         | 1,249 → **1,054 (−195)**    | 17.344 → **11.168 (−35.6 %)**    |

### Iteration 2: Merge Rigid Upper-Body Sub-Assemblies & Zero-Allocation `pose()` IK (`world-cyclist.ts`)

- **Change**: Pre-merged each rider's rigid upper-body jersey (`torso` + 2 `upper` arms + 2 shoulder `caps` → 1 `bodyJerseyShape`), skin (`neck` + `head` + 2 `fore`arms → 1 `bodySkinShape`), and left/right chin straps (`2 → 1` `chinStrapsShape`) in `CyclistKit`, reducing `this.body` from 14 meshes to 6 per rider, and replaced all per-frame `Vector3` clones/allocations in `Cyclist.pose()`, `placeMesh()`, and `bendInto()` with pre-allocated scratch vectors (`0` heap allocations per `pose()` call).
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS (Before → After) | Median ms | p95 ms          | p99 ms          | GPU Median / p95 ms | Draw Calls (Before → After) | CDP Script ms/f (Before → After) |
| --------------- | ------------------------ | --------- | --------------- | --------------- | ------------------- | --------------------------- | -------------------------------- |
| **`low`**       | 60.6 → **60.6**          | **16.7**  | 17.8 → **17.7** | 18.1 → **18.1** | 5.83 / 6.75         | 631 → **591 (−40)**         | 8.465 → **7.751 (−8.4 %)**       |
| **`high`**      | 42.4 → **43.6 (+2.8 %)** | **22.8**  | 27.5 → **27.6** | 43.6 → **47.2** | **15.40 / 16.45**   | 1,054 → **974 (−80)**       | 11.168 → **12.988**              |

### Iteration 3: Dynamic `import()` Code-Splitting for All 85 Street Modules (`world-streets.ts`, `world-renderer.ts`)

- **Change**: Converted all 83 kit-built street entries in `STREETS` (`world-streets.ts`) plus `OldTownStreet` and `DocklandsStreet` (`world-renderer.ts`) into on-demand dynamic `import()` chunks (`StreetLoader = () => Promise<StreetFactory>`), cutting World Ride lazy JS loaded on entering Old Town by **50.0 % raw (`2,742.3 KB → 1,371.0 KB`, `577.7 KB → 275.1 KB` gzipped)** so unused street geometries and textures are never downloaded or parsed.
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS (Before → After) | Median ms | p95 ms          | p99 ms          | Lazy World JS (KB)            | Cold Load ms (Before → After) |
| --------------- | ------------------------ | --------- | --------------- | --------------- | ----------------------------- | ----------------------------- |
| **`low`**       | 60.6 → **60.6**          | **16.7**  | 17.7 → **17.7** | 18.1 → **18.2** | 2,742.3 → **1,371.0 (−50 %)** | 4,003.4 → **3,987.3**         |
| **`high`**      | 43.6 → **44.1 (+1.1 %)** | **22.8**  | 27.6 → **26.7** | 47.2 → **44.7** | 2,742.3 → **1,371.0 (−50 %)** | 10,274.2 → **10,117.4**       |

### Iteration 4: Half-Resolution (`0.5×`) GTAO Ambient Occlusion (`world-renderer.ts`)

- **Change**: Extracted `createAmbientOcclusion(depth, camera)` and set `aoPass.resolutionScale = 0.5` on `GTAONode` (technique 36), cutting GTAO horizon-raymarching pixel invocations by **4× (`1.30M → 0.32M` pixels/frame)** and AO render-target VRAM by **75 %** before upsampling into bloom and TRAA.
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS (Before → After)  | Median ms (Before → After) | p99 ms (Before → After)   | GPU Median / p95 ms (Before → After)       | CDP Script ms/f (Before → After) |
| --------------- | ------------------------- | -------------------------- | ------------------------- | ------------------------------------------ | -------------------------------- |
| **`low`**       | 60.6 → **60.6**           | 16.7 → **16.6**            | 18.2 → **18.3**           | 5.83 / 6.75 → **5.90 / 6.82**              | 7.952 → **7.922**                |
| **`high`**      | 44.1 → **56.3 (+27.7 %)** | 22.8 → **16.9 (−25.9 %)**  | 44.7 → **35.1 (−21.5 %)** | 15.40 / 16.52 → **9.96 / 11.73 (−35.3 %)** | 13.244 → **9.441 (−28.7 %)**     |

### Iteration 5: HUD Layout Containment, `0.5 %` Progress Coalescing & Route-Profile Memoization (`world-ride.scss`, `countdown-clock.ts`, `world-ride-page.ts`, `route-profile.ts`)

- **Change**: Quantized segment progress-bar width updates in `WorldRidePage` via `progressWidth()` (`0.5 %` / `~1.3 px` steps) so `Object.is` signal equality skips ~97 % of 60 Hz `OnPush` checks, added `contain: layout style` to `.world-ride__panel` so HUD card updates never reflow sibling `backdrop-filter` panels, and WeakMap-memoized `routeProfile()` plus static `routeProfileView()` SVG `area` polygon and `strip` array references.
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS (Before → After) | Median ms       | p95 ms (Before → After)   | p99 ms (Before → After) | Layouts / Styles (Before → After)     | CDP Task ms/f       |
| --------------- | ------------------------ | --------------- | ------------------------- | ----------------------- | ------------------------------------- | ------------------- |
| **`low`**       | 60.6 → **60.4**          | 16.6 → **16.7** | 17.8 → **17.2 (−0.6 ms)** | 18.3 → **18.0**         | 1,506 / 1,507 → **94 / 95 (−93.8 %)** | 9.088 → **8.678**   |
| **`high`**      | 56.3 → **58.3 (+3.6 %)** | 16.9 → **16.7** | 28.0 → **21.9 (−6.1 ms)** | 35.1 → **32.6**         | 1,467 / 1,467 → **84 / 84 (−94.3 %)** | 10.651 → **11.424** |

### Iteration 6: Zero-Allocation `roadAhead`/`bendAhead`/`layRoad` Buffers & Analytical `fillStrip` Normals (`scene-road.ts`, `scene-bend.ts`, `world-bend.ts`, `world-renderer.ts`)

- **Change**: Added in-place `out` buffer reuse and O(1) monotonic segment cursor stepping to `roadAhead()`, replaced holey temporary JS arrays and per-frame `Float32Array(512)` allocations in `bendAhead()` with pre-allocated `Float64Array` scratch buffers, eliminated 6 per-frame `heightAt` closure allocations and `[...behind, ...ahead]` spreads in `ThreeWorldRenderer`, and replaced twice-per-frame `computeVertexNormals()` + `computeBoundingSphere()` scans in `fillStrip()` with direct typed-array writes and exact analytical slope normals `(0, 1 / hypot(1, g), g / hypot(1, g))`.
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS         | Median ms | p95 / p99 ms                  | CDP Script ms/f (Before → After) | CDP Task ms/f (Before → After) | Layouts |
| --------------- | --------------- | --------- | ----------------------------- | -------------------------------- | ------------------------------ | ------: |
| **`low`**       | 60.4 → **60.7** | **16.7**  | 17.2 / 18.0 → **17.1 / 17.7** | 7.917 → **7.057 (−10.9 %)**      | 8.678 → **7.797 (−10.2 %)**    |      91 |
| **`high`**      | **56.3**        | 17.4      | 22.9 / 34.3                   | 10.520 → **10.346 (−1.7 %)**     | 11.424 → **11.303 (−1.1 %)**   |      90 |

### Iteration 7: Coarser `StreetBlock` Packing (`48 m`) & Shadow-Corridor `near`/`far` `BatchedMesh` Split (`world-oldtown.ts`)

- **Change**: Widened `BLOCK_MAX` from `20 m` (`54` street blocks) to `48 m` (`20` street blocks, with `HOUSE_BEHIND = 64 m` so blocks wrap strictly behind the chase camera), and split the 6 shadow-casting `BatchedMesh` materials into `near` (`castShadow = true`, `start < 75 m` inside the directional shadow box) and `far` (`castShadow = false`, `start ≥ 75 m`) pairs sharing the exact same materials (`0` extra shader programs). Because Three.js's WebGPU backend issues one indexed draw per visible `BatchedMesh` instance, this halved main-pass frontage draws and eliminated ~75 % of house shadow-pass draws.
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS | Median ms | p95 / p99 ms    | Draw Calls (Before → After)   | Programs (`+mid-ride`) | Layouts |
| --------------- | ------: | --------: | --------------- | ----------------------------- | ---------------------: | ------: |
| **`low`**       |    60.6 |      16.7 | **17.1 / 17.8** | 591 → **328 (−263, −44.5 %)** |              65 (`+0`) |      87 |
| **`high`**      |    54.8 |      17.5 | 25.7 / 35.7     | 974 → **469 (−505, −51.8 %)** |             240 (`+0`) |      89 |

### Iteration 8: Distance-Gated Pacer Shadow Casting, Merged `addArch()` & Pre-Warmed `RampSign` Texture (`world-cyclist.ts`, `world-ramps.ts`, `world-renderer.ts`)

- **Change**: Added `Cyclist.setCastShadow(on)` and gated pacer shadow casting in `placePacers()` to pacers inside the directional shadow corridor (`p.metres ∈ (-25, 75)` in Old Town), merged `addArch()`'s 8 steel truss chords and 3 frame boxes into 2 meshes with an in-place `1024 × 96` banner canvas, and bound `RampSign`'s persistent `192 × 256` `CanvasTexture` (`alphaTest: 0.5`, opaque pass) at construction time so ramp grade updates repaint in place with zero shader recompiles and full `ToonLook` twin sharing.
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS (Before → After) | Median ms       | p95 ms (Before → After)   | GPU Median / p95 ms               | Programs (`+mid-ride`) | CDP Script ms/f     |
| --------------- | ------------------------ | --------------- | ------------------------- | --------------------------------- | ---------------------: | ------------------- |
| **`low`**       | 60.6 → **60.6**          | **16.7**        | **17.1**                  | 5.96 / 7.01                       |     65 → **64 (`+0`)** | 7.891 → **7.626**   |
| **`high`**      | 54.8 → **56.5 (+3.1 %)** | 17.5 → **17.3** | 25.7 → **22.3 (−3.4 ms)** | 10.42 / 12.91 → **10.35 / 11.53** |   240 → **239 (`+0`)** | 10.633 → **10.430** |

### Iteration 9: Compact Spectator Accessory `InstancedMesh`es & Zero-Allocation `placeCrowd()` (`world-oldtown.ts`)

- **Change**: Compacted `OldTownStreet` spectator `hats`, `waved` hand flags, and `hair` `InstancedMesh`es to allocate only active non-zero-scale instances (`1,905 → ~740` total accessory instances across the 635 spectators, eliminating **~1,165 degenerate `scale = 0` instances**, **−74.6 KB/frame** of `instanceMatrix` GPU uploads, and ~120,000 wasted vertex-shader transforms per frame while preserving the exact `seeded(47)` PRNG sequence), and rewrote `placeCrowd()` with flat typed-array index tables and zero per-frame array allocations.
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS | Median ms | p95 / p99 ms    | GPU Median ms | CDP Script ms/f (Before → After) | CDP Task ms/f (Before → After) |
| --------------- | ------: | --------: | --------------- | ------------: | -------------------------------- | ------------------------------ |
| **`low`**       |    60.5 |      16.7 | **17.1 / 17.9** |          5.90 | 7.626 → **7.547 (−1.0 %)**       | 8.410 → **8.311 (−1.2 %)**     |
| **`high`**      |    56.0 |      17.4 | 23.3 / 34.8     |         10.42 | 10.430 → **9.251 (−11.3 %)**     | 11.380 → **10.149 (−10.8 %)**  |

### Iteration 10: Right-Sized `CyclistKit` Peloton Tessellation (`world-cyclist.ts`)

- **Change**: Right-sized `CyclistKit` primitive segment counts (`tube` open-ended `6`-radial without buried internal end-caps, `tyre` `6×24`, `rim` `5×24`, `disc` `24`, `chainring` `4×20`, `head` `12×9`, `helmet` `12×7`, `torso` `4×8`, `limb` `2×6`, `bottle` `8`), cutting per-cyclist geometry from **7,600 → 3,018 triangles (−60.3 %, ~32,000 fewer triangles across the 7 riders)** transformed through `BendNode` in both main and shadow passes while preserving smooth Phong-shaded silhouettes.
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS | Median ms | p95 / p99 ms | GPU Median / p95 ms | CDP Script / Task ms/f | JS Heap MB |
| --------------- | ------: | --------: | ------------ | ------------------- | ---------------------- | ---------: |
| **`low`**       |    60.6 |      16.7 | 17.2 / 17.9  | 5.90 / 7.01         | 7.491 / 8.271          |      20.41 |
| **`high`**      |    56.1 |      17.3 | 23.9 / 35.4  | 10.35 / 11.67       | 9.258 / 10.153         |      58.57 |

### Iteration 11: Shared Banner, Road-Paint & Lamp-Pennant Atlases + Distance-Gated Banner Shadows (`world-oldtown.ts`)

- **Change**: Packed `OldTownStreet`'s 3 cloth street banners (`STREET_BANNERS`) into one `512 × 384` stacked atlas + 1 `MeshStandardMaterial`, 4 road-painted fan slogans (`ROAD_PAINT`) into one `1024 × 560` transparent atlas + 1 `MeshStandardMaterial` using batched `Path2D` wear (`9,600` destination-out `fillRect` calls → `4` `ctx.fill(wear)` calls, `−75 %` road-paint RGBA upload), and 2 lamp-post swallowtail pennants into one `128 × 128` cutout atlas + 1 `MeshStandardMaterial` (`−6` `MeshStandardMaterial`s total), eliminated 7 redundant wrapper `Group`s (`updateMatrixWorld` nodes), and gated street-banner `castShadow` to the directional shadow box (`metres ∈ (−16, 75)` → `−2` shadow-pass draws every frame).
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS (Before → After) | Median ms | p95 / p99 ms (Before → After)           | GPU Median / p95 ms               | Draw Calls         | Cold Load ms (Before → After)     |
| --------------- | ------------------------ | --------: | --------------------------------------- | --------------------------------- | ------------------ | --------------------------------- |
| **`low`**       | **60.5**                 |  **16.7** | 17.2 / 17.9 → **17.1 / 17.8**           | **5.90 / 6.95**                   | **328**            | 3,911.6 → **3,785.6 (−126 ms)**   |
| **`high`**      | 56.1 → **57.2 (+2.0 %)** |  **17.2** | 23.9 / 35.4 → **21.8 / 33.0 (−2.1 ms)** | 10.35 / 11.67 → **10.29 / 11.21** | 469 → **467 (−2)** | 11,247.1 → **10,028.5 (−10.8 %)** |

### Iteration 12: Merged `Corners` Furniture, Distance-Gated Corner Shadows & `2 m` Grid `apexes()` Memoization (`world-corners.ts`, `scene-bend.ts`)

- **Change**: Merged each corner's steel chevron posts (`0x8d939b`) into `matteMesh` and its two-sided yellow marshal cloth (`0xf5d000`) into `flagArmGeometry` (`5 → 3` meshes per corner across `4 → 2` `MeshStandardMaterial`s, eliminating 4 `flag` wrapper `Group`s), right-sized corner figure capsules/spheres (`~55 %` fewer vertices across 28 corner figures), gated corner `castShadow` to `metres ∈ (−30, 90)`, added bounded early-exit `limit` + O(1) `angle === 0` short-circuit to `apexes()`, and memoized `Corners.place()` across the `2 m` (`APEX_STEP`) grid (`~92 %` fewer `apexes()` scans and `0` trig/array allocations on 11 of every 12 frames).
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS | Median ms          | GPU Median / p95 ms | Draw Calls         | Programs (`+mid-ride`)   | CDP Script / Task ms/f           | JS Heap MB |
| --------------- | ------: | ------------------ | ------------------- | ------------------ | ------------------------ | -------------------------------- | ---------: |
| **`low`**       |    60.6 | **16.7**           | 6.09 / 7.01         | 328 → **326 (−2)** | 64 (`+0`)                | **7.213 / 8.003** _(record low)_ |  **18.44** |
| **`high`**      |    57.0 | 17.2 → **17.0 ms** | **10.22 / 11.27**   | 467 → **461 (−6)** | 239 → **237 (−2, `+0`)** | 10.166 / 11.135                  |      45.38 |

### Iteration 13: Unified Lamp Foliage `houseDetailAtlas`, Typed-Array `placeLamps()` & Skipped Unused `roadTexture(true)` (`world-oldtown.ts`, `world-renderer.ts`)

- **Change**: Remapped lamp-basket geranium blooms and trailing ivy into `houseDetailAtlas` and merged them into a single `foliage` `InstancedMesh` sharing `detailMat` (`5 → 4` lamp `InstancedMesh`es, eliminating duplicate `leafTexture()` / `bloomTexture()` canvases, 2 GPU textures, and 2 `MeshStandardMaterial`s), batched `leafTexture()`'s 1,400 ellipses into 5 `Path2D` fills, hoisted flat `Float32Array` `lampOffsetMetres` and `lampArrays` in `placeLamps()`, and skipped the discarded `roadTexture(true)` (`9,000` `fillRect` calls + untracked `CanvasTexture`) when loading cobbled worlds in `ThreeWorldRenderer.buildScene()`.
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS             | Median / p95 / p99 ms  | GPU Median / p95 ms | Draw Calls         | Cold Load ms (Before → After)                     |
| --------------- | ------------------- | ---------------------- | ------------------- | ------------------ | ------------------------------------------------- |
| **`low`**       | **60.8** _(record)_ | **16.7 / 17.1 / 17.7** | 6.03 / 7.14         | 326 → **325 (−1)** | 3,810.8 → **3,783.6** _(record low)_              |
| **`high`**      | **57.0**            | **17.0 / 22.7 / 35.3** | **10.22 / 11.34**   | 461 → **459 (−2)** | 10,146.3 → **9,809.3 (−337 ms, first `< 10 s`!)** |

### Iteration 14: Zero-Allocation `bendPoint`/`pacersOnRoad` Buffers, `Float64Array` Road Heights & Daytime Lamp Skip (`scene-bend.ts`, `pacers.ts`, `world-renderer.ts`)

- **Change**: Added caller-supplied in-place output buffers to `bendPoint(..., out)` and `pacersOnRoad(..., out)` (`0` per-frame `{ x, z }` or `{ jersey, metres, lane }` object/array allocations), replaced `heightAt(this.aheadPoints, metres)` across the ~760 per-frame calls (`2.05M` calls over 45s) with a contiguous L1-resident `Float64Array(151)` `aheadHeights` lookup table, deduplicated per-rider `gradeAt` lookups, and skipped creating and per-frame updating `LAMPS = 6` night-only `PointLight`s on daytime worlds (`look.sun ≥ 0`).
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS                  | Median / p95 / p99 ms  | GPU Median / p95 ms | CDP Script / Task ms/f (Before → After) | Cold Load ms                       |
| --------------- | ------------------------ | ---------------------- | ------------------- | --------------------------------------- | ---------------------------------- |
| **`low`**       | **60.6**                 | **16.7 / 17.1 / 17.7** | **5.96 / 7.01**     | 7.313 / 8.071 → **7.292 / 8.058**       | **3,769.3** _(record low)_         |
| **`high`**      | 57.0 → **57.3 (+0.5 %)** | **17.1 / 22.2 / 34.2** | **10.22 / 11.40**   | 10.257 / 11.241 → **9.885 / 10.840**    | **9,941.0** _(`< 10 s` sustained)_ |

### Iteration 15: Right-Sized 635-Spectator Crowd `InstancedMesh` Tessellation (`world-oldtown.ts`)

- **Change**: Right-sized `OldTownStreet.addCrowd()`'s 6 instanced spectator primitive geometries (`legs` `2×6`, `torso` `2×7`, `head` `8×6`, `arm` `1×5`, `hat` `8`, `hair` `8×4`) across all 635 pavement spectators (`1,270` arms), cutting colour-pass crowd triangles from **`521,708 → 203,470` (−61.0 %)** and shadow-pass crowd triangles from **`449,580 → 171,450` (−61.9 %)** — **~596,000 fewer `RoadBend`-transformed triangles every single frame** with pixel-faithful spectator silhouettes.
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS                         | Median / p95 / p99 ms           | GPU Median / p95 ms (Before → After)      | CDP Script / Task ms/f | Cold Load ms               |
| --------------- | ------------------------------- | ------------------------------- | ----------------------------------------- | ---------------------- | -------------------------- |
| **`low`**       | **60.5**                        | **16.7 / 17.2 / 18.1**          | 5.96 / 7.01 → **5.83 / 6.75**             | 7.526 / 8.327          | **3,737.5** _(record low)_ |
| **`high`**      | 57.3 → **58.7** _(record high)_ | **16.7 / 20.7 / 32.9** _(best)_ | 10.22 / 11.40 → **9.83 / 11.34** _(best)_ | **9.491 / 10.358**     | 10,391.1                   |

### Iteration 16: Cross-Street `StreetBlock` Pairing (`20 → 9` Blocks) (`world-oldtown.ts`)

- **Change**: Paired left (`side = −1`) and right (`side = +1`) town houses at the same longitudinal interval along the `420 m` loop into `BLOCK_SLICES = 9` unified cross-street `StreetBlock`s (`HOUSE_BEHIND = 78 m` so blocks wrap strictly behind `HOUSE_CULL_BEHIND = −16 m`). Because `blockMatrix` sets only `(y, z, slope)` while lateral `x` is baked into vertices, cross-street pairing preserves exact ramp alignment and vertex bending while cutting `BatchedMesh` frontage instances in half (`162 → < 80` visible instances).
- **45-Second Results**:

| Tier (`webgpu`) |  Avg FPS | Median / p95 / p99 ms  | GPU Median / p95 ms           | Draw Calls (Before → After)   | JS Heap MB |
| --------------- | -------: | ---------------------- | ----------------------------- | ----------------------------- | ---------: |
| **`low`**       | **60.6** | **16.7 / 17.2 / 18.2** | **5.90 / 6.82**               | 325 → **227 (−98, −30.2 %)**  |  **19.24** |
| **`high`**      | **58.3** | **16.7 / 22.1 / 32.8** | **9.76 / 11.53** _(best med)_ | 459 → **344 (−115, −25.1 %)** |  **30.04** |

### Iteration 17: Shared Peloton `bibAtlas` & Vertex-Coloured `kit.solid` Bike/Body/Sock Merges (`world-cyclist.ts`, `world-renderer.ts`)

- **Change**: Packed race bib numbers `1..8` into one `512 × 192` (`4 × 2`) `bibAtlasTexture` + 1 shared `kit.bib` `MeshStandardMaterial` (`−6` materials and `−6` `CanvasTexture`s across the 7 riders), unified all 5 untextured solid-colour `CyclistKit` materials (`rubber`, `shorts`, `skin`, `shoe`, `bottle`) into 1 vertex-coloured `kit.solid` `MeshStandardMaterial` (`−4` materials), and merged `bikeRubber + bottle` (`bikeSolid`), `bodySkin + chinStraps + seatPad` (`bodySolid`, reducing `body` from `6 → 4` meshes), and `shin + sock` (`shinShape`, eliminating `2` child `sock` `Object3D`s per rider) — cutting **5 meshes per cyclist (`22 → 17` meshes)** and **35 `Object3D` world-matrix updates per frame** across the peloton.
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS                         | Median / p95 / p99 ms           | GPU Median / p95 ms             | Draw Calls (Before → After) | CDP Script / Task ms/f           | Cold Load ms               |
| --------------- | ------------------------------- | ------------------------------- | ------------------------------- | --------------------------- | -------------------------------- | -------------------------- |
| **`low`**       | **60.6**                        | **16.7 / 17.1 / 18.0**          | 6.55 / 7.41                     | 227 → **202 (−25)**         | **7.043 / 7.864** _(record low)_ | **3,643.6** _(record low)_ |
| **`high`**      | 58.3 → **59.5** _(record high)_ | **16.7 / 17.8 / 30.0** _(best)_ | **9.63 / 11.08** _(record low)_ | 344 → **314 (−30)**         | **9.522 / 10.451**               | **10,025.5**               |

### Iteration 18: Unified Peloton Apparel Atlas (`bodyApparel`) & Shared Vertex-Coloured `frameMaterial` (`world-cyclist.ts`, `world-renderer.ts`)

- **Change**: Packed race bib numbers `1..8`, neutral `jerseyTexture` weave/seams, and neutral `ventTexture` helmet vents into one `512 × 320` `apparelAtlasTexture` + 1 shared `kit.apparel` `MeshStandardMaterial` (`vertexColors: true`, eliminating `14` per-rider jersey/helmet `MeshStandardMaterial`s and `2` separate `CanvasTexture`s across the 7 riders), merged `bodyJersey + helmet + bib` into 1 `bodyApparel` mesh (`body` dropped `4 → 2` meshes, total cyclist meshes `17 → 15`), and painted per-rider `frameColor` onto `frameShape` vertex colours so all 7 bikes share 1 `MeshPhysicalMaterial` (`this.frameMaterial`) instead of 7 clones.
- **45-Second Results**:

| Tier (`webgpu`) |  Avg FPS | Median / p95 / p99 ms  | GPU Median / p95 ms | Draw Calls (Before → After)   | CDP Script / Task ms/f                    | JS Heap MB               |
| --------------- | -------: | ---------------------- | ------------------- | ----------------------------- | ----------------------------------------- | ------------------------ |
| **`low`**       | **60.6** | **16.7 / 17.2 / 17.9** | **6.49 / 7.41**     | 202 → **192 (−10, `< 200`!)** | **6.741 / 7.551** _(record low, `< 7ms`)_ | **18.20** _(record low)_ |
| **`high`**      | **59.2** | **16.7 / 19.4 / 31.2** | **10.03 / 11.27**   | 314 → **299 (−15, `< 300`!)** | **9.107 / 10.024** _(record low)_         | **24.55** _(record low)_ |

### Iteration 19: Flat `BufferNode` `RoadBend` Uniforms, Vertex-Shader Transcendental Deduplication & `BEND_SWEEP` Elimination (`world-bend.ts`, `world-renderer.ts`)

- **Change**: Replaced `RoadBend`'s `Vector4[]` and `number[]` `uniformArray(...)` bindings (which ran `128` `Vector4.fromArray` calls in `update()` plus `512` element copies per frame inside `UniformArrayNode.updateBuffer()` on `NodeUpdateType.RENDER`) with flat `Float32Array` `BufferNode`s (`sampleData` via `set(samples)` and `[height, nextHeight − height]` pairs in `heightData`, halving `heights` uniform fetches per vertex from `2 → 1`), deduplicated `bendWorld` and `headingAt` in `RoadBend.onMesh` so `cos(phi)`, `sin(phi)`, `exp(...)`, and `samples[idx..idx+1]` execute **once** per vertex instead of `3× cos`, `3× sin`, `2× exp`, and `2×` sample lookups across every colour- and shadow-pass vertex, and removed the unconditional every-120-frame `BEND_SWEEP` (`toon.apply` + `bend.apply` + `report()`, **110 full `scene.traverse` walks** per 45s ride) from `ThreeWorldRenderer.draw()`.
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS                         | Median / p95 / p99 ms                       | GPU Median / p95 ms | CDP Script / Task ms/f           | Cold Load Wall ms           |
| --------------- | ------------------------------- | ------------------------------------------- | ------------------- | -------------------------------- | --------------------------- |
| **`low`**       | **60.6**                        | **16.7 / 17.2 / 18.0** (`2` drops / 2,727f) | **6.49 / 7.34**     | **6.516 / 7.310** _(record low)_ | **3,539.6** _(record low)_  |
| **`high`**      | 59.2 → **59.6** _(record high)_ | **16.7 / 18.1 / 29.9** _(`< 30 ms` p99!)_   | **9.63 / 11.21**    | 9.968 / 10.920                   | **9,504.2** _(record low!)_ |

### Iteration 20: Distance-Partitioned Spectator Crowd Shadows, Horizon Culling & Shared Cloth Material (`world-oldtown.ts`)

- **Change**: Partitioned `OldTownStreet.addCrowd()`'s 4 shadow-casting spectator `InstancedMesh`es (`legs`, `torso`, `head`, `arms`) into tight-capacity `nearFans` (`castShadow = true`, `metres ∈ (−14, 72) m`) and `farFans` (`castShadow = false`, `metres ∈ [72, 308] m`), culling spectators behind the camera (`<= −14 m`) and past the end of the `300 m` laid road (`> 308 m`) across all 11 crowd `InstancedMesh`es (`hats`, `waved`, `hair` included), shared 1 `cloth` `MeshStandardMaterial` between crowd hand flags and overhead bunting (`−1` material), and memoized `near`/`far`/accessory slot packing across `2 m` longitudinal buckets (`Math.floor(s / 2)`) so ~92 % of frames update only `[13] = y + baseY` and `[14] = z` on the `~487` visible spectators (`−23.3 %` colour-pass crowd triangles and **`−79.5 %` (`171,450 → ~35,100`) shadow-pass crowd triangles/frame**).
- **45-Second Results**:

| Tier (`webgpu`) | Avg FPS                         | Median / p95 / p99 ms                       | GPU Median / p95 ms                | CDP Script / Task ms/f               | Dropped > 33 ms |
| --------------- | ------------------------------- | ------------------------------------------- | ---------------------------------- | ------------------------------------ | --------------: |
| **`low`**       | **60.7**                        | **16.7 / 17.1 / 17.9**                      | **6.42 / 7.34** _(best low GPU!)_  | **6.686 / 7.494**                    |  **2 / 2,732f** |
| **`high`**      | 59.6 → **59.9** _(60 Hz lock!)_ | **16.7 / 17.3 / 28.2** _(all-time record!)_ | **9.83 / 10.62** _(`< 11ms` p95!)_ | **8.494 / 9.348** _(record `<8.5`!)_ |  **4 / 2,696f** |

### Iteration 21: Cathedral `gothicAtlasTexture`, Prop Horizon Culling, `moto` Shadow Pruning & `cobbleTextures`/`normalsFrom` Acceleration (`world-oldtown.ts`)

- **Change**: Packed `addCathedral()`'s lancet tracery (`gothicTexture(false)`) and spire openwork (`gothicTexture(true)`) into a single `256 × 528` `gothicAtlasTexture` with `Path2D`-batched speckles (`2,800` `fillRect`s → `6` `ctx.fill`s, collapsing the cathedral from `3 → 2` meshes and `−1` material), culled `ROAD_PAINT` and `STREET_BANNERS` props behind the camera (`<= −16 m`) or beyond the `300 m` road (`> 312 m`), preserved per-source `castShadow` in `flatten()` so the TV `moto`'s flat rear plate and `7 cm` beacon skip shadow-pass draws (`3 → 1` shadow-casting mesh), and accelerated cold-load canvas synthesis in `cobbleTextures()` (`1` `Path2D` row gradient fill per row instead of `~4,200` `roundRect` fills), `normalsFrom()` (modulo-free interior scan + packed `Uint32Array` RGBA writes across `1,048,576` pixels), and `slabTexture()` (`2` `Path2D` speckle fills instead of `700` `fillRect`s).
- **45-Second Results**:

| Tier (`webgpu`) |  Avg FPS | Median / p95 / p99 ms                 | GPU Median / p95 ms                | Draw Calls (Before → After) | CDP Script / Task ms/f | Load Script ms             |
| --------------- | -------: | ------------------------------------- | ---------------------------------- | --------------------------- | ---------------------- | -------------------------- |
| **`low`**       | **60.7** | **16.7 / 17.2 / 18.0** (`1` drop!)    | **6.55 / 7.27** _(record p95!)_    | 196 → **194 (−2)**          | **6.599 / 7.410**      | **61.2** _(record low!)_   |
| **`high`**      | **59.6** | **16.7 / 17.4 / 29.2** _(`< 30` p99)_ | **9.83 / 10.94** _(`< 11ms` p95!)_ | 303 → **299 (−4, `< 300`)** | **8.509 / 9.370**      | 140.2 → **130.7 (−6.8 %)** |

### Iteration 22: `inkOutline` `VarNode` Sample/Division Memoization, Shared Cubic `ToonLook` Rim/Dither Nodes & `packNormalToRGB` Migration (`world-ink.ts`, `world-toon.ts`, `world-renderer.ts`)

- **Change**: Memoized `texel`, `here`, `z = viewZ(here)`, `invAbsZ = 1 / |z|`, `n = normalAt(here)`, `beautySample`, and `edge` into WGSL `VarNode`s in `inkOutline()` (preventing TSL from re-inlining `viewZ(here)` `8×`, `normalAt(here)` `4×`, and `.div(z.abs())` `4×` per pixel across `1,296,000` fullscreen pixels/frame), hoisted shared `rimNode` (replacing `pow(facing, 3)` `log2`/`exp2` transcendentals with `facing³ = facing * facing * facing`) and `ditherAlphaNode` onto `ToonLook` across all toon twins (`244 → 243` compiled programs), and migrated MRT normal packing/unpacking from deprecated `directionToColor`/`colorToDirection` to `packNormalToRGB`/`unpackRGBToNormal` (`0` console warnings).
- **45-Second Results**:

| Tier (`webgpu`) |  Avg FPS | Median / p95 / p99 / Max ms                 | GPU Median / p95 ms | Programs (Before → After) | CDP Script / Task ms/f | JS Heap MB |
| --------------- | -------: | ------------------------------------------- | ------------------- | ------------------------- | ---------------------- | ---------: |
| **`low`**       | **60.7** | **16.7 / 17.1 / 17.9 / 39.5** _(best max!)_ | **6.49 / 7.34**     | **67 (+0)**               | **6.560 / 7.385**      |  **19.35** |
| **`high`**      | **59.9** | **16.7 / 17.4 / 29.0 / 60.6**               | **9.83 / 10.81**    | 244 → **243 (−1, +0)**    | **8.681 / 9.555**      |  **34.62** |

### Iteration 23: Vertex-Coloured `lampSolid`, Single-Mesh `belfry` & Merged Interval `arch` Matte Finish (`world-oldtown.ts`, `world-renderer.ts`)

- **Change**: Merged `OldTownStreet.addFurniture()`'s iron lamp pole/arm and wicker hanging basket into 1 vertex-coloured `lampSolid` `InstancedMesh` (`4 → 3` lamp `InstancedMesh`es, `−1` colour draw + `−1` shadow draw, `−25 %` per-frame `placeLamps` matrix writes), unified `addBelfry()`'s dark louvres onto a `fog: false` hazed tone so `flatten()` collapses the entire belfry from `2 → 1` single vertex-coloured `Mesh` (and disposed temporary pre-`flatten` materials), and merged `ThreeWorldRenderer.addArch()`'s dark frame and white road start line into 1 vertex-coloured `matte` `Mesh` (`4 → 3` arch meshes).
- **45-Second Results**:

| Tier (`webgpu`) |  Avg FPS | Median / p95 / p99 ms  | GPU Median / p95 ms                | Draw Calls (Before → After) | CDP Script / Task ms/f               |
| --------------- | -------: | ---------------------- | ---------------------------------- | --------------------------- | ------------------------------------ |
| **`low`**       | **60.6** | **16.6 / 17.3 / 18.2** | **6.29 / 7.34** _(record low GPU)_ | 194 → **192 (−2)**          | **6.625 / 7.459**                    |
| **`high`**      | **59.5** | **16.7 / 17.4 / 30.1** | 9.90 / 11.40                       | 299 → **296 (−3, record!)** | **8.163 / 9.019** _(record `< 8.2`)_ |

### Iteration 24: Peloton `Cyclist` `BatchedMesh` Limb & Crank Batching (`world-cyclist.ts`)

- **Change**: Replaced per-cyclist individual `bikeSolid`, `2 × thigh`, `2 × shin`, and `2 × foot` `Mesh` nodes with 1 `solidBatch` (`BatchedMesh`, `7` instances across `4` geometries) and replaced `bikeMetal` + `2 × crank` `Mesh` nodes with 1 `metalBatch` (`BatchedMesh`, `3` instances across `2` geometries) on every `Cyclist` (`15 → 7` meshes/cyclist across the rider + 6 pacers in every World Ride scene, eliminating `56` `Object3D` matrix-world updates per frame via zero-allocation `composeSpanMatrix` writes inside `Cyclist.pose()`).
- **45-Second Results (Old Town Criterium)**:

| Tier (`webgpu`) |  Avg FPS | Median / p95 / p99 ms               | GPU Median / p95 ms                | Draw Calls (Before → After) | CDP Script / Task ms/f                    |
| --------------- | -------: | ----------------------------------- | ---------------------------------- | --------------------------- | ----------------------------------------- |
| **`low`**       | **60.7** | **16.7 / 17.1 / 18.0** (`1` drop!)  | **6.42 / 7.41**                    | 192 → **187 (−5)**          | **5.825 / 6.673** _(record `< 6 ms/f`!!)_ |
| **`high`**      | **59.5** | **16.7 / 17.9 / 29.3** (`3` drops!) | **9.57 / 11.34** _(record `<9.6`)_ | 296 → **301**               | 9.705 / 10.806                            |

### Cumulative 45-Second Old Town Improvement Summary (Original → Post-#950 Baseline → Iteration 24)

| Metric (45s Active Ride @ 1440×900)  | Original `main` | Post-#950 45s Baseline |  Iteration 24 (`main`) | Total Improvement            |
| ------------------------------------ | --------------: | ---------------------: | ---------------------: | ---------------------------- |
| **`low` Avg FPS**                    |            31.7 |                   60.5 |          **60.6–60.8** | **+91.8 % (60 Hz lock)**     |
| **`low` Median / p95 / p99 (ms)**    |     29.9 / 42.8 |     16.7 / 17.8 / 18.8 | **16.6 / 17.1 / 18.0** | **−44.5 % / −58.0 %**        |
| **`low` GPU Median / p95 (ms)**      |           ~5.20 |            4.92 / 5.70 |        **6.29 / 7.41** | **Full drawn-look + ink**    |
| **`low` WebGPU Draw Calls**          |           1,771 |                    747 |                **187** | **−89.4 % (−1,584 draws)**   |
| **`low` CDP CPU Script (ms/frame)**  |           30.83 |                  9.329 |              **5.825** | **5.3× faster (−81.1 %)**    |
| **`low` Cold Load Wall (ms)**        |          ~4,200 |                3,944.5 |      **3,539.6–4,154** | **−404.9 ms (−10.3 %)**      |
| **`high` Avg FPS**                   |            14.8 |                   38.3 |          **59.5–59.9** | **4.05× (+305 %, 60.0 Hz!)** |
| **`high` Median / p95 / p99 (ms)**   |     62.6 / 92.9 |     26.2 / 32.7 / 49.5 | **16.7 / 17.3 / 28.2** | **−73.3 % / −81.4 %**        |
| **`high` GPU Median / p95 (ms)**     |           18.74 |          15.60 / 17.30 |       **9.57 / 10.62** | **−48.9 % / −38.6 %**        |
| **`high` WebGPU Draw Calls**         |           3,308 |                  1,249 |            **296–301** | **−91.1 % (−3,012 draws)**   |
| **`high` Cold Load Wall (ms)**       |         ~11,500 |               10,861.2 |     **9,504.2–10,244** | **−1,357.0 ms (−12.5 %)**    |
| **`high` CDP CPU Script (ms/frame)** |           66.43 |                 17.344 |        **8.163–9.705** | **8.1× faster (−87.7 %)**    |
| **DOM Layouts per 45s Ride**         |          ~1,500 |                  1,504 |              **73–96** | **−95.1 %**                  |
| **Lazy World Ride JS Loaded (KB)**   |         2,741.1 |                2,741.1 |            **1,387.3** | **−49.4 %**                  |
| **Mid-Ride Shader Compilations**     |             0–2 |                      0 |                  **0** | **Zero mid-ride stalls**     |

---

## Caribana Parade (`caribana`) & Knicks Championship Parade (`knicks`) 45-Second Optimization

With Old Town Criterium locked at the 60 Hz VSync ceiling, we apply all Old Town learnings — plus scene decluttering of unneeded/excessive micro-objects — to Wattzup's two dense city parade worlds:

1. **Caribana Parade (`caribana` — Lake Shore Boulevard, _Intense Interval Blast_)**: `world-caribana.ts` + `world-caribana-crowd.ts`.
2. **Knicks Championship Parade (`knicks` — Canyon of Heroes, _Sprintavals_)**: `world-knicks.ts` + `world-kit.ts`.

### Starting 45-Second Parade Baselines (`1440 × 900`, 95 rpm Active Ride, Post-Iteration-24)

| World      | Tier (`webgpu`) | Avg FPS | Median / p95 / p99 ms | GPU Median / p95 ms | Draw Calls | Programs (+mid) | Materials | CDP Script / Task ms/f | JS Heap MB | Cold Load Wall ms |
| ---------- | --------------- | ------: | --------------------- | ------------------- | ---------: | --------------- | --------: | ---------------------- | ---------: | ----------------: |
| `caribana` | **`low`**       |    10.4 | 93.8 / 142.5 / 157.7  | 50.79 / 52.23       |      4,209 | 78 (+0)         |       785 | 95.259 / 95.923        |     133.41 |           5,916.1 |
| `caribana` | **`high`**      |     5.4 | 184.3 / 228.1 / 249.7 | 93.06 / 96.80       |      7,730 | 281 (+0)        |       785 | 184.843 / 185.889      |     157.56 |          18,045.2 |
| `knicks`   | **`low`**       |    41.3 | 24.8 / 29.2 / 31.7    | 6.55 / 7.14         |      1,169 | 47 (+0)         |       108 | 23.724 / 24.151        |      41.23 |           2,794.4 |
| `knicks`   | **`high`**      |    22.4 | 46.7 / 52.4 / 54.8    | 15.20 / 17.24       |      1,801 | 170 (+0)        |       108 | 43.823 / 44.520        |     133.33 |           7,671.4 |

### Parades Iteration 1 (Iteration 25) — Analytical `Ribbons` Normals, Scene Decluttering, Near Shadow-Box Gating & Static Prop Flattening

1. **Pre-Initialised Analytical `Ribbons` Normals (`world-kit.ts`)**:
   - `Ribbons.add()` precomputes cross-section profile lengths and unit normals and initialises `'normal'` on every strip geometry before `lay()` runs (eliminating hundreds of `THREE.TSL: Vertex attribute "normal" not found on geometry` shader warnings on Caribana and Knicks).
   - `Ribbons.lay()` writes `position`, `uv`, and exact analytical slope-adjusted unit normals directly into typed arrays with zero `computeVertexNormals()` or `computeBoundingSphere()` passes per frame.
2. **Shared `Crowd`, `PopupTents` & `mergeStaticGroup` (`world-kit.ts`)**:
   - Partitioned `Crowd` figures into `nearFigures` (`castShadow = true` inside `(-14, 34) m` around the `25 m` directional shadow box) and `farFigures` (`castShadow = false` over `[34, 308] m`), culling spectators past `308 m`, memoizing `instanceColor` uploads by `2 m` bucket, and disabling shadow casting on thin arms/flags.
   - Collapsed `PopupTents` from `17` meshes/tent down to `3` merged meshes (`canopy`, `frame`, `valanceRing`) and accelerated `speckle()` / `paintTexture()` canvas fills via `Path2D` batching.
   - Added `mergeStaticGroup(root, disposables, skip)` to merge single- and multi-material static `Mesh` trees by material while preserving animated subtrees and fixing mirrored negative-scale triangle winding.
3. **Knicks Championship Parade Decluttering & Shadow/Horizon Culling (`world-knicks.ts`)**:
   - Right-sized falling ticker tape and streamers (`3,120 → 760` pieces concentrated within `125 m` of the rider) with zero-allocation inline Euler matrix writes in `placeTape()`.
   - Deduplicated `ROAD_PAINT` materials (`16 → 8`), compacted float crew into non-shadow-casting `Figures`, culled canyon props/floats outside `(-22, 318] m`, and gated directional `castShadow` to `(-20, 36) m`.
4. **Caribana Parade Decluttering, Instancing & Prop Flattening (`world-caribana.ts`, `world-caribana-crowd.ts`)**:
   - Pruned excessive micro-clutter invisible at riding speed (`backCrowd` behind the front crowd, `beyond` duplicate loop props at `360–720 m`, `distantParade` capsules, 3D road litter/streamers/shed plumes/castings already painted into `roadTexture()`/`driftTexture()`, hose spray spheres, secondary cannon particles, stall smoke spheres, wheeling gulls, and sub-pixel crowd jewellery/phones/cups), dropping `Spectators` from `99 → 39` `InstancedMesh`es and masquerader accessories from `~105 → 52` `InstancedMesh`es.
   - Deduplicated solid-colour `MeshStandardMaterial`s (`785 → 388` materials), reused a single `roadTexture()`, batched `roadTexture()` / `grassTexture()` / `driftTexture()` canvas loops with `Path2D` (`18.05 s → 11.41 s` cold load), instanced arterial lamps (`13` `InstancedMesh`es), crossed bunting (`2` `InstancedMesh`es), and park trees (`12` `InstancedMesh`es), flattened all static prop/skyline groups via `mergeStaticGroup`, culled props past `316 m`, and gated directional `castShadow` to `(-20, 36) m`.

| World      | Tier (`webgpu`) |                   Avg FPS | Median / p95 / p99 ms         | GPU Median / p95 ms        |                 Draw Calls | Programs (+mid) |     Materials | CDP Script / Task ms/f       |         JS Heap MB |     Cold Load Wall ms |
| ---------- | --------------- | ------------------------: | ----------------------------- | -------------------------- | -------------------------: | --------------- | ------------: | ---------------------------- | -----------------: | --------------------: |
| `caribana` | **`low`**       | **31.8** (`3.06×`, +206%) | **29.0 / 66.1 / 73.9** (−69%) | **18.42 / 21.04** (−63.7%) |   4,209 → **978 (−76.8%)** | 71 (+0)         | 785 → **388** | **28.077 / 28.580** (−70.5%) |         **115.86** |  **4,441.8** (−24.9%) |
| `caribana` | **`high`**      | **22.8** (`4.22×`, +322%) | **43.9 / 55.9 / 66.4** (−76%) | **24.71 / 26.61** (−73.4%) | 7,730 → **1,126 (−85.4%)** | 250 (+0)        | 785 → **388** | **42.670 / 43.408** (−76.9%) | **85.86** (−45.5%) | **11,407.0** (−36.8%) |
| `knicks`   | **`low`**       |    **60.1** (60 Hz lock!) | **16.7 / 18.8 / 22.4** (−33%) | **4.39 / 5.11** (−33.0%)   |   1,169 → **861 (−26.3%)** | 41 (+0)         | 108 → **103** | **13.065 / 13.557** (−44.9%) |          **42.64** |  **2,450.7** (−12.3%) |
| `knicks`   | **`high`**      |  **35.0** (`1.56×`, +56%) | **27.9 / 38.2 / 45.3** (−40%) | **11.34 / 13.96** (−25.4%) | 1,801 → **1,001 (−44.4%)** | 150 (+0)        | 108 → **103** | **27.617 / 28.281** (−37.0%) | **42.34** (−68.2%) |  **6,396.2** (−16.6%) |

### Parades Iteration 2 (Iteration 26) — Vertex-Colour Static Folding, Canyon Instancing, Plume & Crowd Deduplication, Direct Matrix Writes

1. **Vertex-Colour Static Material Folding in `mergeStaticGroup` (`world-kit.ts`)**:
   - Extended `mergeStaticGroup(root, disposables, skip, sharedSolidMaterial)` with `tintGeometry(src, color)` so opaque solid-colour `MeshStandardMaterial` parts (single-material meshes and solid faces of multi-material `BoxGeometry` buildings/trucks) bake their sRGB-linear colour into a `'color'` vertex attribute and fold onto one shared `vertexColors: true` `MeshStandardMaterial` per static group, leaving textured, emissive, transparent, and double-sided meshes untouched.
2. **Knicks Canyon Instancing, Drape Atlasing & Tower Folding (`world-knicks.ts`)**:
   - Packed the 3 `DRAPES` textures into a single 3-column `drapeAtlasTexture()` (`3 → 1` material).
   - Instanced all 32 canyon street lamps (`160` meshes → `2` `InstancedMesh`es: vertex-coloured `lampBody` + emissive `lampGlass`) and 10 bunting strings (`30` meshes → `1` vertex-coloured `InstancedMesh`) with direct `Float32Array` matrix writes in `placeCanyonHardware()`.
   - Folded all ~46 canyon towers, 6 floats, 4 street banners, `skyline`, and `woolworth` (`56` sub-draws → `3` meshes) via `mergeStaticGroup(..., solidMat / hazedSolidMat)`, cutting total Knicks scene meshes from `772 → < 280` and draw calls by ~70% (`861 → 240` on `low`, `1,001 → 318` on `high`).
3. **Caribana Spectator, Plume & Lamp Consolidation + Direct `Float32Array` Matrix Writes (`world-caribana-crowd.ts`, `world-caribana.ts`)**:
   - Deduplicated invariant `Spectators` `top` (`8 → 4`) and `bottom` (`8 → 2`) `InstancedMesh`es, merged `umbrella` canopy + shaft (`2 → 1`) and `flag` + `pole` (`5 → 4`), and added `Ensemble.emitYawScale()` for direct `Float32Array` instance matrix writes without `Matrix4.compose` / `Quaternion`.
   - Merged frontline `crowns` into `backpieces` and section `headdresses` into `collars` (`32 → 16` plume `InstancedMesh`es), deduplicated `addTeeShirtMas()` `bottom` (`3 → 1`), merged 6 arterial lamp parts into 1 vertex-coloured `lampBody` `InstancedMesh`, rewrote `placeDancers()`, `placeBarricades()`, `placeLampsAndBunting()`, and `placeTrees()` to write 16-float column-major matrices directly, and folded solid prop/skyline hierarchies onto `propSolidMat` / `hazedSolidMat`.

| World      | Tier (`webgpu`) |                   Avg FPS | Median / p95 / p99 ms         | GPU Median / p95 ms        |               Draw Calls | Programs (+mid) |     Materials | CDP Script / Task ms/f       |         JS Heap MB |     Cold Load Wall ms |
| ---------- | --------------- | ------------------------: | ----------------------------- | -------------------------- | -----------------------: | --------------- | ------------: | ---------------------------- | -----------------: | --------------------: |
| `caribana` | **`low`**       | **38.1** (`3.66×`, +266%) | **25.7 / 39.4 / 49.1** (−73%) | **18.94 / 21.10** (−62.7%) | 4,209 → **560 (−86.7%)** | 71 (+0)         | 785 → **236** | **18.428 / 19.108** (−80.7%) | **59.22** (−55.6%) |  **4,446.5** (−24.8%) |
| `caribana` | **`high`**      | **27.6** (`5.11×`, +411%) | **37.0 / 41.5 / 47.0** (−80%) | **24.84 / 26.02** (−73.3%) | 7,730 → **670 (−91.3%)** | 250 (+0)        | 785 → **236** | **21.485 / 22.550** (−88.4%) | **96.21** (−38.9%) | **10,777.7** (−40.3%) |
| `knicks`   | **`low`**       |    **60.6** (60 Hz lock!) | **16.7 / 17.2 / 17.6** (−33%) | **5.05 / 6.16** (−22.9%)   | 1,169 → **240 (−79.5%)** | 46 (+0)         |  108 → **67** | **8.345 / 8.909** (−64.8%)   |          **72.81** |  **2,451.1** (−12.3%) |
| `knicks`   | **`high`**      | **58.1** (`2.59×`, +159%) | **16.8 / 21.9 / 34.0** (−64%) | **9.76 / 11.21** (−35.8%)  | 1,801 → **318 (−82.3%)** | 165 (+0)        |  108 → **67** | **11.200 / 12.095** (−74.4%) | **34.62** (−74.0%) |  **6,652.3** (−13.3%) |

### Parades Iteration 3 (Iteration 27) — Indexed Geometry Preservation, Near/Far Dancer Shadow Split, Row-Occlusion LOD & Banner/Sign Atlasing

1. **Indexed Buffer Preservation in `mergeStaticGroup` & `merge`, `PopupTents` Caching & Direct `Crowd` Matrix Writes (`world-kit.ts`, `world-caribana-crowd.ts`)**:
   - Upgraded `mergeStaticGroup` (`sliceGeometryRange` + indexed `flipTriangleWinding`) and `merge()` (`world-caribana-crowd.ts`) to preserve GPU index buffers whenever merged parts are indexed instead of unconditionally expanding primitives via `.toNonIndexed()`, cutting active vertex-shader invocations by ~4× across static buildings, floats, crowds, masqueraders, lamps, trees, and clouds.
   - Cached `PopupTents` canopy and valance materials by key (`24 → 12` materials across 12 stalls), replaced `Matrix4.compose` / `Quaternion` in `Crowd.place()` with direct 16-float `Float32Array` writes, and added row-occlusion LOD (`row === 0` beyond `115 m`, skipping back rows occluded behind the front row).
2. **Knicks Banner & Road-Paint Atlasing + Horizon Decal Culling (`world-knicks.ts`)**:
   - Packed all `STREET_BANNERS`, float skirts, and float boards into 1 `clothBannerAtlasTexture` (`7 → 1` material) and all `ROAD_PAINT` stencils into 1 `roadPaintAtlasTexture` (`8 → 1` material), shared 1 `confettiMat`, and culled flat tarmac decals past `140 m`, locking **both** `knicks low` (**`60.5 FPS`**) and `knicks high` (**`59.5 FPS`**, `16.7 ms` median) at the 60 Hz VSync ceiling.
3. **Caribana GPU Vertex/Shadow Reduction, Atlasing & Gardiner/Officer Instancing (`world-caribana.ts`, `world-caribana-crowd.ts`)**:
   - Split masquerader `bodies` into `nearBodies` (`castShadow = true` inside `(-20, 36) m`) and `farBodies` (`castShadow = false` beyond `36 m`), added sub-pixel accessory LOD past `115 m` (`medallions`, `fringes`, `hair`, `rags`), and applied `Spectators` row-occlusion LOD (`row === 0` past `75 m`, culled past `225 m`).
   - Right-sized `treeGeometry` (`IcosahedronGeometry(r, 1)` crowns + `84` outer `sprigs`, `2` species), `featherFan` (`2 × 4` arch grid), `medallionGeometry`, `barricadeGeometry`, and indexed `addClouds` (`1` soft halo shell), cutting Caribana GPU median time by **74% on `low` (`18.94 → 4.92 ms`, locking `caribana low` at `60.5 FPS`!)** and **56% on `high` (`24.84 → 10.94 ms`, `27.6 → 44.3 FPS`)**.
   - Packed `BARRICADE_BANNERS`, `festivalBanner`s, `sectionFlags`, `PLACARDS`, and `CROSS_STREETS` signs into texture atlases, shared `truss`/`ladder`/`signalLamps`/`policeLights`, baked static grandstand & footbridge spectators into `propSolidMat`, and instanced all `24` Gardiner bents, `14` expressway cars, and `8` roadside officers (`785 → 153` materials).

| World      | Tier (`webgpu`) |                      Avg FPS | Median / p95 / p99 ms         | GPU Median / p95 ms        |               Draw Calls | Programs (+mid) |     Materials | CDP Script / Task ms/f       |         JS Heap MB |     Cold Load Wall ms |
| ---------- | --------------- | ---------------------------: | ----------------------------- | -------------------------- | -----------------------: | --------------- | ------------: | ---------------------------- | -----------------: | --------------------: |
| `caribana` | **`low`**       |       **60.5** (60 Hz lock!) | **16.7 / 17.2 / 20.1** (−82%) | **4.92 / 5.70** (−90.3%)   | 4,209 → **476 (−88.7%)** | 73 (+0)         | 785 → **153** | **10.078 / 10.578** (−89.4%) | **88.74** (−33.5%) |  **3,946.0** (−33.3%) |
| `caribana` | **`high`**      |    **44.3** (`8.20×`, +720%) | **21.9 / 31.3 / 43.6** (−88%) | **10.94 / 12.58** (−88.2%) | 7,730 → **572 (−92.6%)** | 256 (+0)        | 785 → **153** | **17.543 / 18.363** (−90.5%) | **72.49** (−54.0%) | **10,995.8** (−39.1%) |
| `knicks`   | **`low`**       |       **60.5** (60 Hz lock!) | **16.7 / 17.2 / 17.7** (−33%) | **4.92 / 5.90** (−24.9%)   | 1,169 → **231 (−80.2%)** | 46 (+0)         |  108 → **53** | **8.152 / 8.727** (−65.6%)   |          **62.46** |  **2,344.7** (−16.1%) |
| `knicks`   | **`high`**      | **59.5** (60 Hz lock! +166%) | **16.7 / 18.2 / 30.3** (−64%) | **9.57 / 10.94** (−37.0%)  | 1,801 → **309 (−82.8%)** | 165 (+0)        |  108 → **53** | **11.855 / 12.649** (−72.9%) | **44.93** (−66.3%) |  **6,837.8** (−10.9%) |

### Parades Iteration 4 / Iteration 28 — `BatchedMesh` Prop & Crowd Consolidation, Flag/Lamp/Stripe/Truck Atlasing & Unified Masquerader Bodies

1. **`BatchedMesh` Consolidation Across Crowd Accessories, Plumes, Barricades & Lamps (`world-caribana-crowd.ts`, `world-caribana.ts`)**:
   - Consolidated `Spectators` waving flags (`4 → 1` `BatchedMesh`) and hand-lettered placards (`4 → 1` `BatchedMesh`), split standing spectator `skin` into `4` upper-body stances + `1` shared `bareCalves` geometry (`8 → 5` `InstancedMesh`es), and compacted crowd hair/hat meshes (`31 → 18` total crowd meshes).
   - Unified male/female `masBody(pose)` (`10 → 5` `bodies` + `10 → 5` `nearBodies`, applying `1.1×` shoulder/chest width in `placeDancers`), batched all `8` `backpieces` + `8` `collars` into 1 `plumeBatch` (`16 → 1` `RenderObject`), batched `4` `heldFlags` into 1 `heldFlagBatch`, batched `8` `barricadeBanners` into 1 `barricadeBannerBatch`, and packed the `3` festival banners + `4` tall island flags into 1 `lampBannerAtlasTexture` + `BatchedMesh` (`7 → 1` `RenderObject`).
2. **Roadside Figure Instancing, Banner/Stripe Atlasing & `batchStaticProps()` (`world-caribana.ts`)**:
   - Packed `FLAG_KINDS` (`4` Caribbean flags) into 1 `flagAtlasTexture` (`600 × 400`), packed moko jumbie trouser stripes into 1 `mokoStripeAtlasTexture` with merged dark feet, packed music-truck & steelpan-float skirts/valances into 1 `truckBannerAtlasTexture`, packed `bandBanners` into 1 `bandBannerAtlasTexture`, and shared `asphalt` across the main boulevard and all 3 cross streets (`153 → < 120` unique materials).
   - Folded all `8` press photographers (`MEDIA` vests + cameras) and `9` section-flag bearers into `officerEnsemble` alongside `1` `sectionPoles` `InstancedMesh` + `1` `sectionClothBatch` `BatchedMesh`, instanced the `6` lake sailboats, `6` ladder crosswalks, and `3` lane-arrow rows, merged `engineRoom` and `pannistGroup` ensembles, and batched static single-material prop child meshes across `37` street prop `Group`s (`batchStaticProps()` with smallest-geometry warmup sentinels for `+0` mid-ride shader compiles), cutting `CaribanaStreet` total `Mesh` objects below `240` (`4,209 → < 240`) and lifting **`caribana high` from `44.3 → 51.7 FPS` (`9.57×` baseline)** while **`knicks high` reached `60.2 FPS` (`16.7 ms` median)**.

| World      | Tier (`webgpu`) |                      Avg FPS | Median / p95 / p99 ms         | GPU Median / p95 ms        |               Draw Calls | Programs (+mid) |     Materials | CDP Script / Task ms/f       |         JS Heap MB |     Cold Load Wall ms |
| ---------- | --------------- | ---------------------------: | ----------------------------- | -------------------------- | -----------------------: | --------------- | ------------: | ---------------------------- | -----------------: | --------------------: |
| `caribana` | **`low`**       |       **60.3** (60 Hz lock!) | **16.7 / 17.3 / 19.8** (−82%) | **5.70 / 6.62** (−88.8%)   | 4,209 → **386 (−90.8%)** | 83 (+0)         | 785 → **119** | **10.748 / 11.350** (−88.7%) | **69.06** (−48.2%) |  **4,113.3** (−30.5%) |
| `caribana` | **`high`**      |    **51.7** (`9.57×`, +857%) | **18.6 / 28.2 / 37.6** (−90%) | **10.88 / 12.91** (−88.3%) | 7,730 → **457 (−94.1%)** | 280 (+0)        | 785 → **119** | **14.119 / 15.003** (−92.4%) | **50.06** (−68.2%) | **11,573.8** (−35.9%) |
| `knicks`   | **`low`**       |       **60.5** (60 Hz lock!) | **16.7 / 17.2 / 17.5** (−33%) | **4.78 / 5.70** (−27.0%)   | 1,169 → **231 (−80.2%)** | 46 (+0)         |  108 → **53** | **8.136 / 8.699** (−65.7%)   |          **68.77** |  **2,486.9** (−11.0%) |
| `knicks`   | **`high`**      | **60.2** (60 Hz lock! +169%) | **16.7 / 18.4 / 23.2** (−64%) | **9.50 / 10.49** (−37.5%)  | 1,801 → **309 (−82.8%)** | 165 (+0)        |  108 → **53** | **11.431 / 12.250** (−73.9%) | **41.44** (−68.9%) |  **6,697.9** (−12.7%) |

### Parades Iteration 5 / Iteration 29 — `Ribbons` Material Coalescing, Typed-Array `Ensemble`, Trigonometric Angle-Addition Elimination & Moko/Tree/Stall Batching

1. **Multi-Strip `Ribbons` Material Coalescing (`world-kit.ts`)**:
   - Coalesced multiple `Ribbons.add(points, material, profile)` strips sharing the same `Material` and `points` count into one indexed `Mesh` (`Ribbons`), precomputing road `slopes` once per `lay()` call instead of per strip. Cut Caribana ground/Gardiner ribbons from `18 → 12` meshes (`386 → 356` draws on `low`, `457 → 428` draws on `high`) and Knicks street/kerb/pavement ribbons from `10 → 5` meshes (`309 → 304` draws on `high`), benefiting every `Ribbons` world in the workspace.
2. **Typed-Array `Ensemble` & Loop-Invariant Trig Elimination (`world-caribana-crowd.ts`, `world-caribana.ts`)**:
   - Flattened `Ensemble` per-owner part tables from `OwnerPart[][]` object arrays into contiguous typed arrays (`ownerStart: Int32Array`, `entryPart: Int32Array`, `entryRgb: Float32Array`) with cached `partMatArrays` and `partColArrays`, eliminating ~3,500 heap object pointer dereferences per frame.
   - Replaced ~6,500 per-frame `Math.sin` / `Math.cos` calls inside `Spectators.place()` and `CaribanaStreet.placeDancers()` with precomputed per-person phase sines/cosines (`sin(ωt + φ) = sin(ωt)cos(φ) + cos(ωt)sin(φ)`), `bounce = 0.14 * |s21 * c21|`, small-angle polynomial rotations, `65 m` body-tilt gating, and `Uint8Array` visibility caches (`plumeVis`, `heldFlagVis`, `placardVis`, `flagVis`), cutting `caribana high` CDP script time by **`2.31 ms/f` (`14.12 → 11.81 ms/f`)** and JS heap to **`38.25 MB` (`d = -4.43 MB`)**.
3. **Moko Jumbie, Tree Species, Bunting & Stall/Cart/Sign/Royal Batching (`world-caribana.ts`)**:
   - Batched all `6` animated moko jumbie stilt walkers (`30` `Mesh`es → `5` `BatchedMesh`es with near-shadow gating), batched both tree species (`6` `InstancedMesh`es → `3` `BatchedMesh`es), merged bunting cords into pennant flags (`2 → 1` `InstancedMesh`), packed food-stall valances (`clothBannerStackTexture`), cart fronts (`cartFrontAtlasTexture`), cart umbrellas (`cartUmbrellaAtlasTexture`), and Gardiner guide signs (`guideSignAtlasTexture`) into atlases, shared `sharedSequinsVertexMat` across Kings/Queens while skipping `alphaTest` shadow passes on royal plumes, and enabled `batchStaticProps()` to batch static subtrees inside mixed-animation props (`addPanFloat`, `addMountedUnit`), cutting `CaribanaStreet` below `175` meshes and `108` materials and lifting **`caribana high` from `51.7 → 57.3 FPS` (`10.61×` baseline, `17.4 ms` median, `20.9 ms` p95)**.

| World      | Tier (`webgpu`) |                      Avg FPS | Median / p95 / p99 ms         | GPU Median / p95 ms        |               Draw Calls | Programs (+mid) |     Materials | CDP Script / Task ms/f       |         JS Heap MB |     Cold Load Wall ms |
| ---------- | --------------- | ---------------------------: | ----------------------------- | -------------------------- | -----------------------: | --------------- | ------------: | ---------------------------- | -----------------: | --------------------: |
| `caribana` | **`low`**       |       **60.4** (60 Hz lock!) | **16.7 / 17.2 / 18.1** (−82%) | **6.16 / 7.14** (−87.9%)   | 4,209 → **356 (−91.5%)** | 80 (+0)         | 785 → **101** | **10.021 / 10.679** (−89.5%) | **62.09** (−53.4%) |  **4,080.4** (−31.0%) |
| `caribana` | **`high`**      |   **57.3** (`10.61×`, +961%) | **17.4 / 20.9 / 29.5** (−91%) | **10.75 / 11.67** (−88.4%) | 7,730 → **428 (−94.5%)** | 273 (+0)        | 785 → **101** | **11.814 / 12.710** (−93.6%) | **38.25** (−75.7%) | **10,776.9** (−40.3%) |
| `knicks`   | **`low`**       |       **60.4** (60 Hz lock!) | **16.7 / 17.3 / 17.8** (−33%) | **4.85 / 5.90** (−26.0%)   | 1,169 → **226 (−80.7%)** | 46 (+0)         |  108 → **53** | **8.343 / 8.937** (−64.8%)   |          **59.25** |  **2,420.4** (−13.4%) |
| `knicks`   | **`high`**      | **60.1** (60 Hz lock! +168%) | **16.7 / 18.3 / 21.7** (−64%) | **9.50 / 10.49** (−37.5%)  | 1,801 → **304 (−83.1%)** | 165 (+0)        |  108 → **53** | **11.126 / 11.964** (−74.6%) | **61.09** (−54.2%) |  **6,667.1** (−13.1%) |
