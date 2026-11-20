# 0020. Three.js draws the World Ride scene, in its own lazy chunk

- **Status:** Accepted, amended by [0021](0021-webgpu-renderer-with-webgl2-fallback.md)
- **Date:** 2026-11-19

## Context

World Ride (L1-017, L2-110) draws a 3D road, terrain, sky, roadside props and an effort arch
behind the HUD, for six scenes. The Magic Patterns design the scenes come from (`shared/components/
WorldScene.tsx`) draws them with Three.js. The app has no 3D library today: its only GPU code
is the power trace, drawn with raw WebGL behind a canvas fallback (ADR 0006).

Drawing six lit, fogged, textured scenes with raw WebGL means writing and keeping a scene graph,
a camera, materials, shaders, texture loading and resource disposal by hand. That is what a 3D
library is for, and Three.js is the established, maintained choice on the web, with types, a
WebGL2 renderer and a WebGPU renderer.

The initial bundle has a 300 KB gzipped budget (AGENTS.md), and the scene must load only when
World Ride opens (L2-102 criterion 8). Every asset must come from the same origin (L1-009, L2-097):
the Content-Security-Policy of ADR 0018, as amended by ADR 0019, allows the app's own origin
only, except YouTube.

## Decision

- **Three.js** (`three`, with `@types/three`) is a runtime dependency of the app, pinned to an
  exact version (`0.187.0`) and updated on purpose.
- It is imported **only** by `projects/wattzup/src/app/core/world-renderer.ts` (and files it
  imports), which `WorldScene` loads with a dynamic `import()`. The route `classes/:id/world` is
  lazy, so Three.js lands in a World Ride chunk and never in the initial bundle; the bundle check
  in `frontend/scripts/check-bundle-size.mjs` proves it on every build.
- **`WorldRenderer` is the boundary.** It exposes `start`, `resize`, `draw` and `dispose`; no other
  file names a Three.js type. Replacing the library changes that file and nothing else.
- **Assets are bundled and same-origin.** Panoramas, textures and models live under
  `frontend/public/worlds/<id>/` and are fetched from the app's own origin. No loader, decoder or
  asset is fetched from a CDN; Three.js addons that would (e.g. a Draco decoder from a CDN path)
  are served locally or not used.
- When the renderer cannot start, the page falls back to the notice of L2-110 criterion 4, as the
  power trace does under ADR 0006.

## Consequences

- The World Ride chunk is large (Three.js is several hundred KB minified). Only riders who open
  World Ride download it, once, and the browser caches it.
- Unit tests of `WorldScene` use a fake `WorldRenderer`; no test draws with Three.js or needs a GPU.
  The e2e fixture can switch WebGL off to prove the fallback.
- A WebGPU renderer, and the rendering techniques that need it, are a separate decision.
