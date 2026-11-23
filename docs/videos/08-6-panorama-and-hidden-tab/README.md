# Slice 8.6 · Panorama and hidden tab

Whatever the browser can draw, the race goes on. Where neither WebGPU nor WebGL 2 can draw, the
map's panorama takes the world's place and the race still runs (L2-065 AC2, since slice 8.1).
While the tab is hidden the world draws no frame, and the race clock and telemetry carry on
(L2-065 AC3, L2-133). `main`'s frame scheduler already stopped its loop in a hidden tab, but its
`WorldScene` still drew a frame for each change of input, and the race clock changes every
second; `WorldScene` now keeps a `visible` signal and draws nothing while the tab is hidden.

- **Film:** [`08-6-panorama-and-hidden-tab.mp4`](08-6-panorama-and-hidden-tab.mp4), 1920×1080, 30 fps,
  1 min 43 s, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-065 AC2, AC3; L2-133.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | A race on Old Town Criterium drawn at Low, 1440 px, over the aurora | Whatever draws, **the race goes on.** |
| 0:10 | 4 | `panorama` | The race on the map's panorama, with neither graphics API | No 3D? **The panorama.** |
| 0:20 | 4 | `hidden` | What a hidden tab keeps and stops | Tab hidden, **nothing drawn.** |
| 0:30 | 4 | `bug` | The change to `main`'s `WorldScene` | The clock ticked, **the scene drew.** |
| 0:41 | 4 | `back` | The race back from 20 hidden seconds, drawing again | Back, **and drawing.** |
| 0:51 | 4 | `shell` | The panorama race growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **the race runs.** |
| 1:01 | 4 | `proof` | The local checks, and two cards: what the tests prove | Through the page, **all green.** |
| 1:12 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `hidden`, a wipe into `bug`, and a zoom through the `back` scene into
`shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. A hidden tab is the page's `document.hidden` set by hand with `visibilitychange` sent,
  as the fixture's `hideTab` does, since headless Chromium never hides its page.
- The terminal and cards are drawn from the specs and the code.
- **What the tests prove:** two behaviour specs (`race-world-hidden-tab.spec.ts`): with the tab
  hidden, five seconds of riding draw no frame (seen failing first, with 5 drawn) while the race
  clock moves on; shown again, the world draws. A unit case of `WorldScene` holds the same for a
  change of input. The panorama spec of slice 8.1 still passes. All 114 behaviour specs, the 58
  backend tests, the 1188 unit tests and every check pass.
- Not shown, because not built here: the ride clock kept true through a throttled tab
  (slice 18.2), and real-world scenery (slice 8.7).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/08-6-panorama-and-hidden-tab
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/08-6-panorama-and-hidden-tab
node tools/video-build/build.mjs docs/videos/08-6-panorama-and-hidden-tab --crf 25
```
