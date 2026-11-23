# Slice 8.3 · Draw riders and ghost

The race's riders in its world (L2-064 AC3, ADR 0030). The race hands the world its field each
second, and the renderer draws each rider within view at their place on the route, on a line of
their own across the road, with `main`'s cyclist kit in their design-system jersey colour
(`--jersey-<jersey>`), the colour of their dot on the standings. The ghost of a solo race is the
kit's rider in one translucent gold material, drawn new since `main` has none. `main`'s simulated
pacers ride no race. The rider wears the board's You jersey.

- **Film:** [`08-3-draw-riders-and-ghost.mp4`](08-3-draw-riders-and-ghost.mp4), 1920×1080, 30 fps, 1 min 43 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-064 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | A bots race on Old Town Criterium at 1440 px over the aurora | Everyone you race, **on the road.** |
| 0:10 | 4 | `bots` | The nine bots in their jerseys, beside the standings | Nine bots, **nine jerseys.** |
| 0:20 | 4 | `ghost` | A solo race with the translucent gold ghost beside the rider | Your best, **in gold.** |
| 0:30 | 4 | `places` | The bots in Neon Docklands' world | A line **each.** |
| 0:41 | 4 | `main` | What the slice adds to the world library | One kit, **every rider.** |
| 0:51 | 4 | `shell` | The bots race growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **the field ahead.** |
| 1:01 | 4 | `proof` | The local checks, and two cards: what the tests prove | Through the page, **all green.** |
| 1:12 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `ghost`, a wipe into `places`, and a zoom through the `main` scene
into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The browser has no WebGPU (the fixture's `webgl`), so the world draws with WebGL 2,
  in software. Neon Docklands is filmed in Old Town Criterium's open place, on its plan. The fake
  Bluetooth plays the bike and the API fixture serves the map catalogue, so no request leaves
  the machine.
- The terminal and cards are drawn from the build, the design and the code.
- **What the tests prove:** two behaviour specs (`race-world-riders.spec.ts`), seen failing
  first, read what the renderer drew from `main`'s test hook, never a pixel: in a bots race the
  bots in view, each in its jersey colour, from furthest ahead, and no pacer; in a solo race the
  ghost, gold and translucent, and no pacer. All 107 behaviour specs, the 58 backend tests, the
  1186 unit tests and every check pass, and the initial bundle is 288.21 kB of its 292 kB
  budget.
- Not shown, because not built here: riders online (journey 15), the quality levels (8.4 and
  8.5), the hidden tab (8.6) and real-world scenery (8.7).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/08-3-draw-riders-and-ghost
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/08-3-draw-riders-and-ghost
node tools/video-build/build.mjs docs/videos/08-3-draw-riders-and-ghost --crf 25
```
