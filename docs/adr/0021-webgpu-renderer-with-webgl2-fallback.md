# 0021. World Ride draws with Three.js's WebGPU renderer, falling back to WebGL2

- **Status:** Accepted, amended by [0023](0023-bend-the-road-in-the-vertex-stage.md) and [0030](0030-world-library-carried-from-main.md)
- **Date:** 2026-11-19
- **Amends:** [0020](0020-three-js-for-world-ride.md)

## Context

L2-111 puts fifty rendering techniques in scope for the World Ride scene, grouped into quality
tiers. About a third of them need what WebGL2 does not give: compute shaders and storage buffers.
They are BVH ray-traced reflections, DDGI, ReSTIR, SVGF denoising, Gaussian splatting, virtual
texturing, froxel fog and GPU-simulated water. Most of the rest are post-processing passes
(TAA, SSR, GTAO, motion blur, glare, auto exposure) that Three.js offers as nodes for its
WebGPU renderer.

ADR 0020 chose Three.js and its `WebGLRenderer`, and left WebGPU to a later decision. WebGPU now
ships in Chromium, Safari and Firefox, but not on every device a rider may use, and the scene
must still draw where it is missing (L2-110 criterion 4).

Three.js's `WebGPURenderer` (`three/webgpu`) draws through WebGPU when an adapter is granted and
through its own WebGL2 backend otherwise. Its materials and passes are written once in TSL, the
Three Shading Language, and compiled for either backend.

## Decision

- The scene draws with **`WebGPURenderer`** from `three/webgpu`, at the version ADR 0020 pins.
  When no WebGPU adapter is granted, the same renderer runs on its **WebGL2 backend**. When that
  fails too, the scene reports itself unavailable, as before.
- Materials and post-processing are written in **TSL node materials and passes**, not in GLSL
  strings, so one source serves both backends.
- **`ultra` is WebGPU only.** Its techniques need compute. With WebGL2 the highest tier is
  `high`, and each `ultra` technique falls back to its `high` form (L2-111 criterion 6).
- Tier selection, the frame budget and the per-tier technique table are **pure code**
  (`core/render-quality.ts`) with unit tests. The renderer reads the table; it holds no rule
  about which tier is in force.
- **No new runtime dependency** comes with this decision. A technique that would need one
  (for example a BVH builder for ray tracing, or a splat sorter) is built inside the renderer's
  files, or added under an amendment of this ADR that names the package and pins it.
- Captured and baked assets (photogrammetry, scans, lightmaps, probes, impostor atlases, splats,
  virtual-texture pages) are made offline, bundled under `frontend/public/worlds/<id>/`, and
  served from the same origin (ADR 0020). The scene never fetches one from elsewhere.

## Amendment: the 3D Tiles loader (2026-11-21, slice 8.7)

Real-world scenery (L2-066) streams Google's photorealistic 3D Tiles, which no renderer file can
reasonably parse alone: a 3D Tiles tileset, its level-of-detail traversal and the session the
Map Tiles API hands out. The renderer takes **`3d-tiles-renderer` 0.5.4** (NASA-AMMOS, Apache
2.0), pinned exactly in `package.json`, with its `TilesRenderer`, `GoogleCloudAuthPlugin`,
`GLTFExtensionsPlugin` and `ReorientationPlugin`. It is imported dynamically only when a rider
presses "Stream it", so neither the initial bundle nor the world chunk carries it. Its tiles are
Draco-compressed glTF, so Three.js's own `DRACOLoader` decodes them with the decoder files of the
pinned `three` package, copied to the app's own origin (`/draco/`) at build time; nothing is
fetched from a CDN. The tiles come from Google with the rider's key (ADR 0020's same-origin rule
does not cover them: they are the one foreign asset, admitted by L2-131).

## Consequences

- The World Ride chunk grows: `three/webgpu` and the TSL passes are larger than
  `WebGLRenderer` alone. The initial bundle is unaffected, and the bundle check still proves it.
- A rider on a screen without WebGPU gets `high` at best. That is by design: the scene still
  draws, and every HUD panel works the same.
- `WebGPURenderer` initialises asynchronously (`await renderer.init()`). `WorldRenderer.start`
  becomes asynchronous, and `WorldScene` awaits it before drawing.
- The e2e fixture's `FakeWebGl` still proves the fallback notice. It also hides `navigator.gpu`,
  so neither backend can start.
- Rendering quality is judged by eye and by the visual sweep, which a person runs. No automated
  test reads pixels; the tier policy and the technique table are unit-tested.
