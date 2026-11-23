# Slice 8.4 · Quality levels

The race's world at four quality levels (L2-065 AC4, AC5, ADR 0021, ADR 0030). `main`'s table
of techniques gives each level its own: Low is the drawn look, with toon shading, ink outlines
and a flat sky, which no level above draws; Medium brings physically based materials and
shadows; High adds reflections, ambient occlusion and temporal anti-aliasing; Ultra needs
WebGPU, and with WebGL 2 a world asked for at Ultra draws at High. Every race opens at Low on
both graphics APIs, as `main`'s World Ride does, so the requirement (L2-065, L2-159's Auto,
L2-152's examples), the designs and the Settings and World loading mocks now say the same.

- **Film:** [`08-4-quality-levels.mp4`](08-4-quality-levels.mp4), 1920×1080, 30 fps, 1 min 43 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-065 AC4 and AC5.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | A solo race on Old Town Criterium at High, 1440 px, over the aurora | One world, **four levels.** |
| 0:10 | 4 | `low` | The same race at Low, the drawn look | Every race **opens at Low.** |
| 0:20 | 4 | `levels` | The race at Medium and at High | Medium, then **High.** |
| 0:30 | 4 | `cap` | The race asked for at Ultra with WebGL 2, drawn at High | Ultra needs **WebGPU.** |
| 0:41 | 4 | `main` | main's table, its cap and its start level | main's table, **main's start.** |
| 0:51 | 4 | `shell` | The race at Low growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **the drawn look.** |
| 1:01 | 4 | `proof` | The local checks, the broken cap seen red, and two cards | Through the page, **all green.** |
| 1:12 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `levels`, a wipe into `cap`, and a zoom through the `main` scene into
`shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. No rider option picks a level until Settings (slice 20.2), so `main`'s test-only hook
  pins each level. The browser has no WebGPU (the fixture's `webgl`), so the world draws with
  WebGL 2, in software. The fake Bluetooth plays the bike and the API fixture serves the map
  catalogue, so no request leaves the machine.
- The terminal and cards are drawn from the build, the design and the code.
- **What the tests prove:** three behaviour specs (`race-world-quality.spec.ts`) read from
  `main`'s hook the level the renderer drew and whether it drew the drawn look: Low with it,
  Medium without, and Ultra with WebGL 2 drawn at High. The levels and the cap came with the
  renderer copied in slice 8.2, so the specs passed at once; with the cap broken on purpose the
  Ultra spec failed ("high" expected, "ultra" received). `main`'s unit specs prove the table and
  the opening level. All 110 behaviour specs, the 58 backend tests, the 1186 unit tests and every
  check pass.
- Not shown, because not built here: dropping a level when frames run slow (slice 8.5), the
  rider's choice of level (20.2), the device check (20.3), and Ultra itself, which needs a WebGPU
  adapter the test browser does not grant.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/08-4-quality-levels
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/08-4-quality-levels
node tools/video-build/build.mjs docs/videos/08-4-quality-levels --crf 25
```
