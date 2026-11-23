# Slice 19.4 · Web vitals and frame budget

Telo Ride's speed is measured where it matters (L2-136 AC2, AC3). Two performance checks under `frontend/e2e/perf/`
run with `npm run perf` through their own Playwright config, only when a person asks and on the device being measured:
never by verify, CI or an agent. `home-vitals.perf.ts` loads Home cold on Lighthouse's mobile profile (412 × 823 at
1.75×, the CPU 4 times slower, slow 4G) and holds Largest Contentful Paint to 2.5 s and every interaction under 200 ms,
as the page's own `PerformanceObserver` reports them. `race-frames.perf.ts` opens a solo race at 1920 × 1080 on the
real clock and holds a minute of frames to 50 a second on average, never below 30 for over a second; on the reference
laptop a person runs it headed.

- **Film:** [`19-4-web-vitals-and-frame-budget.mp4`](19-4-web-vitals-and-frame-budget.mp4), 1920×1080, 30 fps,
  1 min 41 s, H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a
  player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-136 AC2, AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The solo race at 1920 × 1080 in a browser, over the aurora | Quick on a phone, **smooth in a race.** |
| 0:10 | 5 | `measure` | The phone profile the Home check loads under, beside Home at 390 px | A mid-range phone, **over 4G.** |
| 0:23 | 5 | `budget` | Three facts about Home's budgets, beside Home at 1440 px | Paint fast, **answer fast.** |
| 0:36 | 5 | `world` | The race drawing its world at 1920 × 1080, and its frame budget | 50 frames a second, **at full HD.** |
| 0:49 | 4 | `widths` | Home growing from 390 through 768 and 1024 to 1440 px | Quick, **at every width.** |
| 0:59 | 4 | `proof` | The local checks, and three cards: what this slice adds | Measured where **it matters.** |
| 1:09 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `budget`, a wipe into `world`, a zoom into `widths`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, through the flows the checks take without their thresholds: Home after the rider's
  first Tab and a tap at 390, 768, 1024 and 1440 px, and the race on the real clock at 1920 × 1080 recording three
  seconds of frames. Filming the Home flow caught that a Tab after a tap never reaches the skip link; the check now
  takes the Tab first.
- **What this slice adds:** the two checks, `playwright.perf.config.ts` and `e2e/perf/frames.ts`. They are
  type-checked, linted and listed; their first run, on a mid-range phone's profile and on the reference laptop, is a
  person's. All 278 behaviour specs, the 1585 unit tests, the 459 backend tests and every check pass, with no
  performance check among them.
- Not shown, because deferred: the backend's budgets (L2-137), whose load test, tool and instance size are still to
  be supplied.
