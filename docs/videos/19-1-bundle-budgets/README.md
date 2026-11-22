# Slice 19.1 · Bundle budgets

The ride app's first load stays small (L2-136 AC1). After every production build, `npm run bundle:size` gzips exactly
what the built `index.html` loads before the first screen renders and fails above 300 KB: it measures 89.77 kB, `main`
and the global styles. `node tools/verify/verify.mjs` runs it after the build, and CI's build job after the ride app's.
The raw `initial` budget in `angular.json` tightens to warn at 302 kB and fail at 305 kB, from 304 and 310, over the
300.26 kB the bundle measures. Every route already loads lazily; a new spec proves Home opens without a byte of
Three.js and the world's code arrives only when a race draws it.

- **Film:** [`19-1-bundle-budgets.mp4`](19-1-bundle-budgets.mp4), 1920×1080, 30 fps, 1 min 41 s, H.264 at CRF 25 and
  AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-136 AC1.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home's first load at 1440 px in a browser, over the aurora | First load: **90 kB.** |
| 0:10 | 5 | `measure` | The gzipped check's output, beside Home at 1440 px | Measured gzipped, **after every build.** |
| 0:23 | 5 | `budget` | The build's initial sizes and three facts about the raw budget | A tight **raw budget.** |
| 0:36 | 5 | `world` | A solo race on Old Town Criterium drawing its world with WebGL 2 | The world waits **for the race.** |
| 0:49 | 4 | `widths` | Home growing from 390 through 768 and 1024 to 1440 px | Light, **at every width.** |
| 0:59 | 4 | `proof` | The local checks, and three cards: what the tests prove | Light to open, **rich to ride.** |
| 1:09 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `budget`, a wipe into `world`, a zoom into `widths`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running production build, taken by [`shots.ts`](shots.ts) with the shared
  fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density: Home with a
  remembered Echelon, and a solo race drawing its world with WebGL 2 where WebGPU is missing. The terminal lines are
  what `npm run bundle:size` and `ng build ride` printed.
- **What the tests prove:** `initial-bundle.spec.ts` (2 tests). They passed at once, since the world was already
  lazy; with Three.js imported statically into `main`, the raw budget refused the build, and with that budget lifted
  the Home test failed on the world's code. The gzipped check failed before it existed and fails at a 70 kB limit.
  All 277 behaviour specs, the 1585 unit tests, the 459 backend tests and every check pass.
- Not shown, because deferred: Home's Web Vitals on a mid-range phone (L2-136 AC2, slice 19.4), the race's frame rate
  on the reference laptop (AC3), and the backend's budgets (L2-137).
