# Slice 18.2 · Keep the ride clock true

A ride's clock comes from the monotonic clock, never from counting timer ticks (L2-133 AC1), so a tab hidden for 10
minutes is where a visible tab would be the moment it is shown again (AC2). The acceptance tests play a hidden tab as
Chrome's intensive throttling does: every timer waits for the next whole minute while the bike's notifications still
arrive each second. Shown again at 10:10, a solo race reads Recover with 1:20 left and 3.97 km, exactly as the same ride
reads in a visible tab, and a class ride reads 10:10 / 30:00 in the same recovery. The ride ticker's tick on
`visibilitychange` is what keeps them right: without it both clocks read the last throttled minute. A running race now
also asks the rider to confirm before the tab closes (AC4), as a class already did. The first bundle stays at 277.44 kB.

- **Film:** [`18-2-keep-the-ride-clock-true.mp4`](18-2-keep-the-ride-clock-true.mp4), 1920×1080, 30 fps, 1 min 56 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-133 AC1, AC2, AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The race at 10:10 after ten hidden minutes, at 1440 px in a browser, over the aurora | Away ten minutes? **No drift.** |
| 0:10 | 5 | `hidden` | How the spec plays a hidden tab, beside the race's interval and route panels at 0:10 | Timers wait, **the clock does not.** |
| 0:23 | 5 | `shown` | Three facts, beside the interval and route panels at 10:10 | Shown again, **right on time.** |
| 0:36 | 5 | `class` | The class ride at 10:10 after the same ten minutes | The class, **in step too.** |
| 0:49 | 5 | `leave` | The browser's beforeunload dialog as the spec saw it, beside the race | Close mid-race? **Asked first.** |
| 1:01 | 5 | `widths` | The race at 10:10 growing from 390 through 768 and 1024 to 1440 px | On time, **at every width.** |
| 1:14 | 4 | `proof` | The local checks, and three cards: what the tests prove | Ten minutes away, **no drift.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `shown`, a wipe into `class`, a push into `leave`, a zoom into `widths`, and a push into
`proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density: a solo race on Old Town Criterium
  at 0:10, then shown again after 600 seconds in a hidden tab whose timers waited for each whole minute while the fake
  bike notified every second; and 30 Minute HIIT Cardio's ride the same way. The terminal lines are what the specs saw.
- **What the tests prove:** `ride-clock-hidden-tab.spec.ts` (3 tests). The race's leave guard was written first and
  seen failing with no dialog. The two hidden-tab tests passed against the ticker earlier slices built; with the
  ticker's visibility tick removed they fail, the clocks at 10:00 and 9:59, so they guard it. All 275 behaviour specs,
  the 1585 unit tests, the 459 backend tests and every check pass.
- Not shown, because not built here: `ReadoutSampler` and `BoardOrder` (L2-134), which the design leaves to the screens
  that need them; the readouts already follow the bike's notifications and the boards change once a second.
