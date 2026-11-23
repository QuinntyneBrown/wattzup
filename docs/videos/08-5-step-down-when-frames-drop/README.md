# Slice 8.5 · Step down when frames drop

The race's world gives up detail before smoothness (L2-159 AC4, L2-136 AC3, ADR 0030). Before
its first frame it measures the display's frame period _P_; then every 2 seconds `main`'s
`FrameBudget` takes the median frame of that window. After two windows in a row over 1.2 × _P_
the world drops one quality level for the rest of the race, or straight to Low when the second is
3 × _P_ or more, and fast frames never raise it again. The performance design's averaging
governor and L2-159 AC4 now say what `main` does.

- **Film:** [`08-5-step-down-when-frames-drop.mp4`](08-5-step-down-when-frames-drop.mp4), 1920×1080, 30 fps,
  1 min 43 s, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-159 AC4, L2-136 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | A solo race on Old Town Criterium at High, 1440 px, over the aurora | Detail gives way, **the ride never.** |
| 0:10 | 4 | `period` | The frame period measured before the first frame | Your display, **measured.** |
| 0:20 | 4 | `windows` | The race at High, then at Medium after two windows of 25 ms frames | Two slow windows, **one level.** |
| 0:30 | 4 | `far` | The budget's verdicts, and the race dropped straight to Low | Far too slow? **Straight to Low.** |
| 0:41 | 4 | `main` | main's frame budget | Down, **never up.** |
| 0:51 | 4 | `shell` | The dropped race growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **still smooth.** |
| 1:01 | 4 | `proof` | The local checks, and two cards: what the tests prove | Through the page, **all green.** |
| 1:12 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `windows`, a wipe into `far`, and a zoom through the `main` scene into
`shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. `main`'s test-only hook opens the world at High in its new judged mode, which leaves
  the frame budget to judge it as a rider's ride is judged; the paused clock's `fastForward`
  fires each animation frame once, late, so frames run slow. The browser has no WebGPU (the
  fixture's `webgl`), so the world draws with WebGL 2, in software.
- The terminal and cards are drawn from the build, the design and the code.
- **What the tests prove:** two behaviour specs (`race-world-step-down.spec.ts`), seen failing
  first while the hook still pinned the level: from Medium, one window of 25 ms frames keeps the
  level, a second drops it to Low, and a window of fast frames does not raise it; from High,
  windows of 60 ms frames drop it straight to Low, past Medium. `main`'s unit specs hold the
  rule's table of frame periods and medians. All 112 behaviour specs, the 58 backend tests, the
  1187 unit tests and every check pass.
- Not shown, because not built here: the Settings switch that turns the step-down off for a
  fixed level, and the frame rate and resolution controls (slice 20.2).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/08-5-step-down-when-frames-drop
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/08-5-step-down-when-frames-drop
node tools/video-build/build.mjs docs/videos/08-5-step-down-when-frames-drop --crf 25
```
