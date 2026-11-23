# Slice 8.1 · Load the world library

The race's world, loaded (L2-064, L2-065, ADR 0030). The `world` library, copied from `main`,
holds the renderer, its frame scheduler and its canvas host, and loads in its own chunk only
once a race opens; Three.js never joins the initial bundle. One `WebGPURenderer` draws with
WebGPU where the browser grants an adapter and with WebGL 2 otherwise, and the race bar's tag
names it, "WebGPU" or "WebGL 2", titled "The GPU API drawing this world". With neither, the map's
panorama stays and the race runs on. Leaving the race stops the frame loop, removes the observer
and listeners and disposes the renderer. The scene itself is drawn from slice 8.2.

- **Film:** [`08-1-load-the-world-library.mp4`](08-1-load-the-world-library.mp4), 1920×1080, 30 fps, 1 min 54 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-065 AC1 and AC2, L2-064 AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | A bots race with its world at 1440 px in a browser window over the aurora | Behind every race, **a world.** |
| 0:10 | 4 | `chunk` | The build's chunks: the initial total without Three.js, the world chunk | Its own chunk, **loaded last.** |
| 0:20 | 4 | `tag` | The bar's WebGL 2 tag at 768 px, and the race at 1440 px | WebGPU, **or WebGL 2.** |
| 0:30 | 4 | `panorama` | A race where neither WebGPU nor WebGL 2 can draw: the panorama alone | Neither? **The panorama.** |
| 0:41 | 4 | `leave` | What leaving releases, and Race Setup after the race | Leave, **and it goes.** |
| 0:51 | 4 | `main` | The files copied from main into the world library | Copied, **not rebuilt.** |
| 1:01 | 4 | `shell` | The race with its world growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **one world.** |
| 1:12 | 4 | `proof` | The local checks, and two cards: what the tests prove | Through the page, **all green.** |
| 1:22 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `tag`, a wipe into `panorama`, and a zoom through
the `main` scene into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The browser has no WebGPU (the fixture's `webgl`), so the world starts on WebGL 2;
  for the panorama it has no WebGL either. The fake Bluetooth plays the bike and the API fixture
  serves the map catalogue, so no request leaves the machine.
- The terminal and cards are drawn from the build, the design and the code.
- **What the tests prove:** three behaviour specs (`race-world.spec.ts`) cover the tag, the
  panorama with the race running on, and leaving, each seen failing first; `main`'s unit specs
  run here, with new cases for the start, the unavailable world and the release on leave. All
  103 behaviour specs, the 58 backend tests, the 669 unit tests and every check pass, and the
  initial bundle is 288.10 kB of its 292 kB budget.
- Not shown, because not built here: the scene itself, its riders and ghost (slices 8.2 and
  8.3), the quality levels (8.4 and 8.5), the hidden tab (8.6) and real-world scenery (8.7). The
  WebGPU tag is drawn by the same code as WebGL 2's; the test browser grants no adapter.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/08-1-load-the-world-library
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/08-1-load-the-world-library
node tools/video-build/build.mjs docs/videos/08-1-load-the-world-library --crf 25
```
