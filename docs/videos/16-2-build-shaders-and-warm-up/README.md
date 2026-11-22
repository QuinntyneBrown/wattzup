# Slice 16.2 · Build shaders and warm up

World loading now shows how the world is being built. The renderer builds the scene's programs with three's own
`compileAsync` before `main`'s warm-up. three compiles them in batches and yields to each frame, and the shader step
counts them: "41 of 143 programs for WebGL 2" (L2-152 AC4). The build goes into the scene pass's render target and MRT,
so the warm-up then builds only its passes. Once warmed up, the card reads the frame rate the warm-up held at its level
("Holding 60 fps at Low", AC5), and the facts gain "Auto quality · Low" (AC7). After 20 seconds without the world being
ready, a warning reads "This is taking longer than usual." and offers Start at Low quality and Ride with the panorama
(L2-155). A build that fails at a level steps down to the one below, then to the panorama (L2-156 AC3). Main stays at
277.40 kB.

- **Film:** [`16-2-build-shaders-and-warm-up.mp4`](16-2-build-shaders-and-warm-up.mp4), 1920×1080, 30 fps,
  1 min 56 s, H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for
  a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-152 AC4, AC5, AC7; L2-155 AC1 to AC4; L2-156 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | World loading, ready, at 1440 px in a browser, over the aurora | Every shader counted, **every frame warm.** |
| 0:10 | 5 | `build` | The build as a probe saw it, beside World loading building its programs | Built in batches, **each one counted.** |
| 0:23 | 5 | `warm` | Three facts, beside World loading ready with the frame rate held | Warmed up, **frame rate held.** |
| 0:36 | 5 | `slow` | The slow load as the spec saw it, beside the warning | Twenty seconds? **It says so.** |
| 0:49 | 5 | `choices` | Low, the panorama and the step down, beside the warning and the class ride | Low, the panorama, **or keep waiting.** |
| 1:01 | 5 | `widths` | The warning growing from 390 through 768 and 1024 to 1440 px | A way out, **at every width.** |
| 1:14 | 4 | `proof` | The local checks, and three cards: what the tests prove | Built, warm, **or a way out.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `warm`, a wipe into `slow`, a push into `choices`, a zoom into `widths`, and a push into
`proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture, the
  world-assets fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density:
  30 Minute HIIT Cardio's World loading while its programs build, ready with the frame rate held, slow once
  Playwright's clock has jumped 20 seconds with the download held, and the class ride after Ride with the panorama.
  The build's terminal lines are what a one-off probe of three's program count read (68 programs from the batched
  build, 4 more in the warm-up). The test lines are what the specs and unit tests saw.
- **What the tests prove:** `class-world-build.spec.ts` (3 tests), written first and seen failing, reads the programs
  built for the API the world is drawn with, the frame rate held at Low and the quality fact. It shows the warning
  after 20 seconds, and that Start at Low quality hides it and builds the world at Low. It also shows that Ride with
  the panorama stops the download and starts the class. `worldLoadView`'s unit tests cover every phase's words and the
  seconds a slow build adds; `startStepping`'s cover the step down; `heldFps`'s the frame rate. All 256 behaviour
  specs, the 1533 unit tests, the 455 backend tests and every check pass.
- Not shown, because not built here or not reachable yet:
  - Start at Low quality rebuilding a world built above Low: `main` starts every world at Low, so Settings (slices
    20.1 and 20.2) must offer a higher start first.
  - A real failed build stepping down: the step down is proved by unit tests, since no spec can make three's compile
    fail.
  - The world drawn in the class ride (16.3) and a group world class (16.4).
