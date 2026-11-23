# Slice 20.2 · World quality controls

Settings' World section (L2-159, L2-160, L2-161): the graphics API this browser draws with, Quality as five cards with
Auto first and recommended, Step down when frames drop (always on with Auto, the rider's to turn off at a fixed level),
Frame rate (Match display or 30 fps), Resolution (50 to 100 %) and Graphics (Automatic or WebGL 2). Without WebGPU,
Ultra waits for it; without 3D, a notice says so and every World control rests. A race or world class then opens at the
chosen level, keeps it with step-down off, draws at most 30 frames a second when asked and scales only the world's
pixels.

- **Film:** [`20-2-world-quality-controls.mp4`](20-2-world-quality-controls.mp4), 1920×1080, 30 fps, 1 min 41 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-159 AC1 to AC6, L2-160 AC1, AC2, AC4, AC5, L2-161 AC1, AC2, AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Settings' World section at 1440 px in a browser, over the aurora | Your world, **drawn your way.** |
| 0:10 | 5 | `measure` | The World section with High chosen, and two facts about Auto | Five levels, **Auto first.** |
| 0:23 | 5 | `budget` | Three facts about the other controls, beside the section at 1024 px | Fixed level, **your call.** |
| 0:36 | 5 | `world` | A solo race opened at Medium, and what the acceptance test measured | The world **follows.** |
| 0:49 | 4 | `widths` | The World section growing from 390 through 768 and 1024 to 1440 px | The World section, **at every width.** |
| 0:59 | 4 | `proof` | The section without WebGPU and without 3D, and two cards | Honest about **this browser.** |
| 1:09 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `budget`, a wipe into `world`, a zoom into `widths`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, through the flows of `e2e/settings-world.spec.ts` and
  `e2e/race-world-settings.spec.ts`. The `world` terminal's lines are what `race-world-settings.spec.ts` checks: the
  world stays at Medium through two slow windows with step-down off, frames at 30 fps come at least 32 ms apart, and at
  50 % the drawing buffer is half the canvas's width.
- **What this slice adds:** `worldQuality()`, `GRAPHICS_SUPPORT` and `BrowserGraphicsSupport`, five new settings in
  the store, the components `WorldSettings` and `Segmented`, and a `quality` input on `main`'s `WorldScene` with
  `stepDown` and `forceWebGL` start options on `main`'s `WorldRenderer`. Its 5 acceptance tests, all 290 behaviour
  specs, the 1612 unit tests, the 459 backend tests and every check pass.
- Not shown, because deferred: a level or graphics API changed mid-ride and its toast (L2-159 AC7, L2-161 AC3), since
  Settings is not reachable from a running ride; the device check's level for Auto (slice 20.3). WebGL 2 chosen where
  WebGPU is offered is proven by a unit test, not by the film: the test browser has no real WebGPU.
