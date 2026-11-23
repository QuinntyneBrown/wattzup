# 0030. World Ride's rendering is carried from `main` into a lazy `world` library

- **Status:** Accepted
- **Date:** 2026-11-21
- **Amends:** [0020](0020-three-js-for-world-ride.md), [0021](0021-webgpu-renderer-with-webgl2-fallback.md)

## Context

ADRs 0020 and 0021 were written for `main`, where World Ride's renderer lives in the single
`wattzup` application (`projects/wattzup/src/app/core/world-renderer.ts`) and is reached from a
class's World Ride route. Telo Ride is a multi-project workspace (ADR 0024), and its race draws a
map's world behind the race HUD (L2-064, L2-065). AGENTS.md says World Ride's rendering and all
the logic behind it are copied from `main`, kept as `main` has it, and put in a `world` library,
with the types it shares in `api`.

Three things in that copy need a decision of their own: where each part goes, how the race loads
it without growing the initial bundle, and what Telo Ride adds to `main`'s contract.

## Decision

- **A `world` library** (`frontend/projects/world`, alias `@telo/world`) holds every file that
  draws a world: from slice 8.1 `main`'s `frame-period.ts`, `frame-scheduler.ts`,
  `motion-preference.ts`, `render-quality.ts`, `scene-driver.ts`, `world-ride-probe.ts`,
  `worlds.ts`, `world-renderer-loader.ts`, `world-renderer.ts` and the canvas host
  `world-scene.ts`, with their unit specs. Three.js (`three` and `@types/three`, `0.187.0`, as
  `main` pins them) is imported only by `world-renderer.ts` and the files it imports. The
  dependency rule gains `ride → world` and `world → api`, in AGENTS.md and the ESLint boundaries.
- **Shared types go to `api`.** `main`'s `world-renderer-port.ts` becomes the `WorldRenderer`
  contract and `WORLD_RENDERER` token in `api` (`world/world-renderer.ts`), with `World`,
  `WorldId` and `Backend` (`world/world.ts`). `render-quality.ts` and `worlds.ts` re-export the
  types they used to declare.
- **Two dynamic imports, no `@defer`.** The race route binds `WORLD_RENDERER` to a function that
  imports `@telo/world` and calls its `loadWorldRenderer`, which imports Three.js. The race page's
  `RaceWorld` directive imports `@telo/world` and creates `WorldScene` with `setInput`. Neither
  the world library nor Three.js enters the race's chunk or the initial bundle. `@defer`, creation
  bindings and `main`'s `afterNextRender` each pulled more of Angular's core into the initial
  chunk, so the host starts in `ngAfterViewInit` instead (L72).
- **What Telo Ride changes in `main`'s code**, and nothing else:
  - import paths and `@telo/*` aliases;
  - `WorldRenderer.backend`, the GPU API the renderer chose, for the race bar's tag (L2-065 AC1);
  - `WorldScene` takes the map's `worldId` and resolves it with `worldForMap` (Vice City, a Telo
    Ride map, draws South Beach Sunrise), emits `started(backend)`, and hides its canvas from
    assistive technology, because the race scene around it is the one image (the race mock); its
    busy state is the `world-scene--busy` modifier rather than `aria-busy`;
  - `worlds.ts`'s grades are keyed by the specs' segment kinds (`warm-up`, `recover`,
    `cool-down`, not `main`'s `warmup`, `rest`, `cooldown`);
  - `main`'s segments carry their start second: the contract's scene segments are `TimedSegment`
    (`api`), which `WorldScene` makes from the plan with `timedSegments` (slice 8.2), and
    `main`'s pacers module names its board row `WorldRidePacer` from `api`;
  - the renderer's `backend` field is public, for the tag;
  - the race's riders (slice 8.3): `SceneFrame.riders` carries the field, which the renderer
    draws with the cyclist kit in `--jersey-<jersey>` colours in place of `main`'s pacers, the
    ghost new in translucent gold; the rider wears `--jersey-you`; the pacers' placement is one
    `ride` method both share; and the test-only probe reports the riders drawn;
  - type-only imports where the workspace's lint asks for them (`consistent-type-imports`);
  - the panoramas live in `projects/ride/public/worlds/<id>/`, the ride app's public folder;
  - the specs follow: `world-scene.spec.ts` adds start and leave cases, `scene-driver.spec.ts`
    uses Telo Ride's `Segment`, and `worlds.spec.ts`'s bend cases come with `scene-bend.ts`.
- **The renderer arrives over two slices.** Slice 8.1 carries `world-renderer.ts` as far as the
  library needs to load: the `WebGPURenderer` with `forceWebGL`, the backend it chose, the size,
  the frame budget and `dispose()`, each as `main` has it. Slice 8.2 replaces it with `main`'s
  whole file, which builds and draws the scene.
- **The initial bundle's warning budget rises from 288 kB to 292 kB.** The parts of Angular's core
  that the world library first uses (signal view queries, untracked reads) live in the shared core
  chunk, which is initial: 284.50 kB became 288.10 kB. The error budget stays at 300 kB.

## Consequences

- The world chunk is large (`three/webgpu` and TSL, about 830 kB raw, 182 kB transferred). Only a
  race downloads it, once.
- `main`'s unit specs run in the workspace's unit tests; the e2e fixture `webgl` takes WebGPU, or
  WebGPU and WebGL, away from the browser to prove the tag and the panorama (L2-065 AC1, AC2).
- A later change to `main`'s rendering is copied again from the latest `origin/main`, through
  these same files.
