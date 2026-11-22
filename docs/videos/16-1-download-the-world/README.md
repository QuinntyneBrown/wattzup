# Slice 16.1 · Download the world

A solo world class now opens World loading at `/classes/:id/ride` before the class ride
(L2-151): the class over its world's panorama, with `main`'s name, route and description of the
world, and the load card with three steps. Download the world fetches the world's assets (its
panorama: `main`'s worlds are drawn by code, so the download is 0.2 MB) with the bytes received
of the total, and keeps it in Cache Storage, so the next load's step is done at once (L2-152). A
download that stops reads "Couldn’t load Old Town Criterium" and "Stopped at 0.1 of 0.2 MB",
and Try again resumes it with a `Range` request (L2-156 AC1, AC2). Build the shaders and Warm up
the first frames run `main`'s renderer on a canvas that is never shown; when it has started,
"Old Town Criterium is ready" and Start riding takes focus (L2-153 AC2). Without WebGPU or WebGL 2
the class is ready as a panorama (L2-156 AC4). The class ride waits for Start riding: its clock
and the first target resistance start then. Main stays at 277.40 kB.

- **Film:** [`16-1-download-the-world.mp4`](16-1-download-the-world.mp4), 1920×1080, 30 fps,
  1 min 56 s, H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt)
  is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-151 AC1 to AC3, AC5; L2-152 AC1 to AC3, AC6, AC7; L2-153 AC1, AC2;
  L2-156 AC1, AC2, AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | World loading, ready, at 1440 px in a browser, over the aurora | Your world, **ready before you ride.** |
| 0:10 | 5 | `download` | The download as the tests saw it, beside World loading downloading | Downloaded once, **kept on the device.** |
| 0:23 | 5 | `build` | The three steps, beside World loading ready | Shaders built, **first frames warm.** |
| 0:36 | 5 | `stopped` | Try again's `Range` request, beside the stopped download | Stopped? **Pick up where it left off.** |
| 0:49 | 5 | `panorama` | The panorama's steps, beside World loading without 3D and the class ride | No 3D here? **Ride the panorama.** |
| 1:01 | 5 | `widths` | World loading growing from 390 through 768 and 1024 to 1440 px | Ready, **at every width.** |
| 1:14 | 4 | `proof` | The local checks, and three cards: what the tests prove | The world **is ready first.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `build`, a wipe into `stopped`, a push into `panorama`, a zoom into
`widths`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture, the world-assets fixture and the page objects of `frontend/e2e/`, at 390, 768,
  1024 and 1440 px at double density: 30 Minute HIIT Cardio's World loading while the panorama's
  download is held, ready once `main`'s renderer has started (headless Chromium draws with
  WebGL 2), stopped after half the panorama, ready as a panorama with 3D taken away, and the
  class ride after Start riding. The terminal lines are what the specs and unit tests saw,
  written out.
- **What the tests prove:** `class-world-loading.spec.ts` (5 tests), written first and seen
  failing, opens World loading for a solo class and follows it through the download, `main`'s
  renderer and Start riding, which opens the ride and sends the first target resistance; reads
  the panorama-only screen; skips the download of a saved world with no request; resumes a
  stopped download from its bytes with `Range`; and aborts the download on Back to class.
  `FetchWorldDownloader`'s unit tests cover the progress, the cache, the resume, a cut-off body,
  offline and the abort; `worldLoadView`'s cover every phase's words. `main`'s unit specs for the
  bend, Caribana, the cyclist, the ink, Knicks, the ramps and the streets came with the world
  library's update. All 253 behaviour specs, the 1517 unit tests, the 455 backend tests and
  every check pass.
- Not shown, because not built here: the program counts, frame rate, slow-load warning and step
  down (slice 16.2), the world drawn in the class ride (16.3), a group world class (16.4), the
  quality fact and Quality settings (slices 20.1, 20.2) and the saved-worlds settings (20.5).
