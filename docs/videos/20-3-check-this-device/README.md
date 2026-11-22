# Slice 20.3 · Check this device

Settings' "Check this device" (L2-162): a test world ridden off screen at each level from the top the graphics API
allows, about 30 seconds each, until one holds the display's frame rate. While it runs it reads the level and time
left, the percentage and what the levels tried held, with Stop the check; finished, it reads the level found, where
Auto now starts and when, and keeps the result on this device. Auto then opens a world at that level; a fixed level is
unchanged. Stopped, or with the tab hidden, the check lets go of its renderer and keeps nothing.

- **Film:** [`20-3-check-this-device.mp4`](20-3-check-this-device.mp4), 1920×1080, 30 fps, 1 min 41 s, H.264 at CRF
  25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-159 AC4, L2-162 AC1, AC2, AC3, AC4, AC6.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Settings at 1440 px with a check's result, in a browser over the aurora | How much **can it hold?** |
| 0:10 | 5 | `measure` | The check trying Medium after High held 33 fps, and two facts | Off screen, **level by level.** |
| 0:23 | 5 | `budget` | The finished check, and three facts | Holds 60 fps. **Kept here.** |
| 0:36 | 5 | `world` | A solo race opened at Medium, and what the acceptance test checked | Auto starts **there.** |
| 0:49 | 4 | `widths` | The World section with the result growing from 390 through 768 and 1024 to 1440 px | The result, **at every width.** |
| 0:59 | 4 | `proof` | The check before it runs, Settings at 1024 px, and three cards | Stopped, **nothing stays.** |
| 1:09 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `budget`, a wipe into `world`, a zoom into `widths`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, through the flows of `e2e/device-check.spec.ts`. The running check is the real
  check with 2-second trials (`shortTrials`), its frames stepped on the paused clock: 30 ms apart while High was tried,
  so High held 33 fps, then 16 ms. The `world` terminal's lines are what the acceptance tests check.
- **What this slice adds:** `DeviceCheck` and `DEVICE_CHECK` in `api`, `WorldDeviceCheck` in the world library (new on
  `main`'s frame scheduler, renderer, scene driver and held-rate measure), `DeviceCheckStore`, the `DeviceCheck`
  component, the device check's result in the ride settings, which `worldQuality()` reads for Auto, and Settings'
  own routes. Settings also announces Reset to recommended through its own status region, which brought the first
  load back to 297 kB. Its 4 acceptance tests, all 294 behaviour specs, the 1645 unit tests, the 459 backend tests and
  every check pass.
- Not shown, because deferred: the check disabled while a ride runs (L2-162 AC5), since no ride can be open beside
  Settings in the same tab.
