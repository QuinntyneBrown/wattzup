# Slice 8.2 · Draw the route world

The race's world, drawn (L2-064 AC1, L2-068 AC1, ADR 0030). `main`'s scene comes into the
`world` library as it is: the renderer, the shared kit and street table, the materials, the road
with its bend, corners and ramps, and a scene module for each world, with their unit specs. The
race draws its map's world behind the HUD, and the camera moves along the route at the rider's
virtual speed; a paused solo race holds the world still. Until slice 8.3 places the race's own
riders, the scene draws `main`'s simulated pacers around the rider.

- **Film:** [`08-2-draw-the-route-world.mp4`](08-2-draw-the-route-world.mp4), 1920×1080, 30 fps, 1 min 43 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-064 AC1 and AC5, L2-068 AC1.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | A solo race on Old Town Criterium with its world at 1440 px over the aurora | Road, terrain, **and sky.** |
| 0:10 | 4 | `road` | The same race three seconds of riding apart | Your place, **your speed.** |
| 0:20 | 4 | `worlds` | Neon Docklands, Vice City, Prairie Paceline and Dolomites at 1440 px | Each map, **its own world.** |
| 0:30 | 4 | `pause` | Two pictures of the paused world, equal | Paused, **held still.** |
| 0:41 | 4 | `main` | The files copied from main into the world library | Copied, **not rebuilt.** |
| 0:51 | 4 | `shell` | The race with its world growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **never stretched.** |
| 1:01 | 4 | `proof` | The local checks, and two cards: what the tests prove | Through the page, **all green.** |
| 1:12 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `worlds`, a wipe into `pause`, and a zoom through the `main` scene
into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The browser has no WebGPU (the fixture's `webgl`), so the world draws with WebGL 2,
  in software. A new rider has only Prairie Paceline and Old Town Criterium open, so the other
  maps' worlds are filmed by serving each in Old Town Criterium's open place, on its plan. The
  fake Bluetooth plays the bike and the API fixture serves the map catalogue, so no request
  leaves the machine.
- The terminal and cards are drawn from the build, the design and the code.
- **What the tests prove:** two behaviour specs (`race-world-scene.spec.ts`), seen failing first
  against slice 8.1's renderer, which drew nothing: two pictures of the world a second of riding
  apart differ, and two of a paused solo race a second apart are the same. `main`'s unit specs
  for the road, the kit, the materials, the pacers and the worlds run here. All 105 behaviour
  specs, the 58 backend tests, the 1183 unit tests and every check pass, and the initial bundle
  is 288.21 kB of its 292 kB budget.
- Not shown, because not built here: the race's own riders and the ghost (slice 8.3), the
  quality levels (8.4 and 8.5), the hidden tab (8.6) and real-world scenery (8.7).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/08-2-draw-the-route-world
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/08-2-draw-the-route-world
node tools/video-build/build.mjs docs/videos/08-2-draw-the-route-world --crf 25
```
