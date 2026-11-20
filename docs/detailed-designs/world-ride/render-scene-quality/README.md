# Render the scene at a quality tier

## Overview

World Ride (L1-017) draws each class's world behind the HUD (`world-ride/draw-class-scene`). This feature makes that world look as good as the screen allows. It covers the renderer backend, the four quality tiers and the techniques each one turns on, the frame budget that lowers the tier, and how reduced motion and missing assets are handled (L2-111, ADR 0021).

**quality tier** — one of `low`, `medium`, `high` and `ultra`; each turns on the techniques of L2-111 whose *From tier* is that tier or lower

**technique** — one of the fifty rendering techniques of L2-111, numbered as in its table, in its bike-scene form

**backend** — what the renderer draws through, the `Backend` of `render-quality.ts`: WebGPU when an adapter is granted, else WebGL2

**frame budget** — 16.7 ms per frame; a 2-second window over 20 ms (budget plus 20 %) counts as over budget

**fallback form** — what a technique draws when it is not on, or its asset is missing: the form of the next lower tier, or nothing

The tier is a property of the screen and the scene, not of the rider. Nothing about it is stored, leaves the page or is shown in a panel. The rider sees only the world; the HUD works the same at every tier (L2-111 criterion 7).

## Description

### Contracts

None. The tier and the techniques are the renderer's own; no contract call or state field carries them.

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
  - `sample(now, frameMs)` records one frame;
  - when a window closes, it takes the window's median and returns `'drop'` after the second window in a row over 20 ms, else `'keep'`;
  - `'drop'` is never returned at `low`, and nothing ever returns `'raise'`.

**Renderer (`core/world-renderer.ts`).** It moves to `WebGPURenderer` from `three/webgpu` (ADR 0021).
- `start(canvas, world)` becomes `Promise<boolean>`. It awaits `renderer.init()`, which picks the backend: WebGPU, else WebGL2.
- On each `draw`, it feeds `FrameBudget`. On `'drop'`, it rebuilds its pass chain for the lower tier.
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

**Scene component.** `WorldScene` awaits `start`. It emits `unavailable` when `start` resolves `false` or rejects (L2-111 criterion 1).

**Assets (`frontend/public/worlds/<id>/`).** Captured and baked assets are made offline from each scene's capture, then bundled. A scene lists what it has in `worlds/<id>/manifest.json`; a technique whose asset is not listed draws its fallback form. The assets are:
- photogrammetry meshes (1);
- scans and material maps (2, 3);
- lightmaps (5);
- probes (13, 40);
- impostor atlases (43);
- splats (44);
- virtual-texture pages (41).

### Screen states

No new screen state. The scene looks better or plainer; the HUD mocks `pages/world-ride/*` hold at every tier.

### Acceptance tests

This feature has no contract part, so it has no contract test.

Playwright (`frontend/e2e/world-ride.spec.ts`, Chromium only):
- `shows This screen can't draw 3D worlds when WebGL is off, and the HUD still works`, already there (L2-111 AC1). The `webgl` fixture (`fake-webgl.ts`) hides `navigator.gpu` and makes `getContext('webgl' | 'webgl2')` return `null`, so neither backend can start.

Unit tests (`render-quality.spec.ts`):
- `startTier` for each backend (AC3);
- `techniquesAt`: one case per tier on each backend, and with reduced motion. Each checks the techniques drawn against the table, with 21 and 29 never drawn and `ultra` only on WebGPU (AC2, AC5);
- `FrameBudget`: two windows over budget drop one tier; one window over budget keeps it; nothing drops below `low`; no window ever raises it (AC4).

How each tier looks (AC2), and the fallback form of each technique when its asset is missing (AC6), are judged by eye and by the visual sweep, which runs only when a person asks. That the HUD stays responsive (AC7) holds because the HUD is DOM and the scene draws on the app's frame loop.

### Open questions

- **Captured assets.** The photogrammetry, scans, splats and baked data of each scene are <TO SUPPLY>. Until they exist, techniques 1, 2, 3, 5, 13, 40, 41, 43 and 44 draw their fallback forms.
- **Ray-tracing builder.** Techniques 45 to 48 need a BVH over the scene. Building it in-house or adding a package (an amendment of ADR 0021) is <TO SUPPLY>.
- **World Ride chunk budget.** Only the initial bundle has a budget. A budget for the World Ride chunk and each scene's assets is <TO SUPPLY>.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-111` | `L1-017` | World Ride rendering quality. The scene draws with WebGPU or WebGL2 at a quality tier that turns on the techniques of the table, starts high and drops on a 16.7 ms frame budget, honours reduced motion, falls back when an asset is missing, and never blocks the HUD. |
| `L2-110` | `L1-017` | World Ride scene rendering. The fallback notice, the hidden tab and reduced motion apply at every tier. |
| `L2-101` | `L1-017` | The six scenes. Every captured or baked asset is bundled and served from the same origin. |

## Diagrams

### Components

`WorldScene` starts `WorldRenderer`, which asks `render-quality.ts` which tier and techniques are in force, and builds its passes from the answer.

![C4 component view for rendering the scene at a quality tier](diagrams/c4-component.png)

### Class structure

`TECHNIQUES` is the table of L2-111. `techniquesAt` reads it for a tier, a backend and reduced motion. `FrameBudget` turns frame times into `keep` or `drop`.

![Class diagram for rendering quality](diagrams/class-structure.png)

### Behaviour — drop a tier on the frame budget

Each frame feeds the budget. After two windows in a row over 20 ms, the renderer drops one tier and rebuilds its passes (L2-111 criterion 4).

![Sequence diagram for dropping a tier](diagrams/sequence-drop-tier.png)
