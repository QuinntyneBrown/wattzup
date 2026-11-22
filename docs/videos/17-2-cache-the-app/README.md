# Slice 17.2 · Cache the app

Once Telo Ride has been opened, it opens again with no network and a solo race starts (L2-135 AC3). Angular's service
worker, written by the production build from `ngsw-config.json`, prefetches the shell, the styles, every script chunk
and the fonts; it keeps the map covers and photos, the bike photo, the world panoramas and the mesh decoder the first
time they are seen; and it keeps the last answer of `GET /api/progress`, so the race's open-map check reads the rider's
maps offline. The catalogues come from the copy the app already keeps (ADR 0028, ADR 0029). The worker is registered
from the first screen's lazy chunk (ADR 0032): main grows by 40 bytes, to 277.45 kB, where Angular's
`provideServiceWorker` would have added 6.3 kB. The world downloader goes past it to keep its progress and resume, and
the API never caches the worker or its manifest stale.

- **Film:** [`17-2-cache-the-app.mp4`](17-2-cache-the-app.mp4), 1920×1080, 30 fps, 1 min 56 s, H.264 at CRF 25 and
  AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-135 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | A solo race on Prairie Paceline running with no network, at 1440 px in a browser, over the aurora | No network? **Still riding.** |
| 0:10 | 5 | `cached` | The service worker's three caches as the spec saw them, beside a Map Select row | Opened once, **kept on the device.** |
| 0:23 | 5 | `offline` | Where each part of the offline race came from, beside the race and its board close up | Offline, **a solo race starts.** |
| 0:36 | 5 | `covers` | Three facts, beside Map Select opened again with no network, its covers drawn | Seen once, **shown offline.** |
| 0:49 | 5 | `light` | Three facts, beside the main chunk with Angular's registration and with the app's | Registered late, **kept light.** |
| 1:01 | 5 | `widths` | The offline race growing from 390 through 768 and 1024 to 1440 px | Offline, **at every width.** |
| 1:14 | 4 | `proof` | The local checks, and three cards: what the tests prove | Opened once, **rides offline.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `offline`, a wipe into `covers`, a push into `light`, a zoom into `widths`, and a push into
`proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running production build with its service worker, taken by
  [`shots.ts`](shots.ts) with the shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px
  at double density. Map Select is opened online twice, before and after the worker takes control, and the race's map
  photo is read once through the worker, as a ride on that map would; then the browser and the backend go offline and
  a solo race on Prairie Paceline starts, and Map Select opens again. The recorder serves a development build, which
  registers no worker, so a production build was served on its port first. The terminal lines are what the specs saw.
- **What the tests prove:** `app-cache.spec.ts` (2 tests), written first and seen failing with no worker in control,
  then on the missing progress, shows the app opened once opening again with no network and a solo race starting, and
  a map cover seen once shown offline. The backend's hosting tests show the worker and its manifest answered with
  `no-cache`; the unit tests show the registration waiting for the first screen or 30 seconds, once, telling a worker
  that takes control to set itself up and stopping with the app, and the world downloader going past the worker. All
  268 behaviour specs, the 1578 unit tests, the 457 backend tests and every check pass.
- Not shown, because not built here or not reachable yet:
  - The offline words for group and live choices (17.3), and the update prompt for a new deploy (27.1).
  - A solo class offline needs its YouTube video in the browser's own cache, outside the app's control.
