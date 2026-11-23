# Slice 5.2 · Class ride screen

Pick a class and ride it: Telo Ride now has the class ride at `/classes/:id/ride`, ridden solo
(L2-087, L2-089). It loads the class from `GET /api/classes/{id}` and starts the ride the moment it
arrives. The header names the class and "Solo" with the clock as a timer ("7:00 / 30:00"); the segment
card counts the plan down with its kind, progress bar and resistance profile; Power reads "On target"
within 10 % of the segment's target power or the signed gap; Cadence reads its aim; and the stepper shows
the bike's resistance, or a dash, and nudges it, off while the bike is away. The first use of
`HttpClient` costs about 5 kB transferred in the initial bundle, so its budget grew. The video is slice
5.3, pause, leave or finish 5.4, and the catalogue API 6.1.

- **Film:** [`05-2-class-ride-screen.mp4`](05-2-class-ride-screen.mp4), 1920×1080,
  30 fps, 2 min 25 s, H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt)
  is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-087 AC1 and AC3, L2-089 AC1 to AC4, L2-026 AC1 and AC3, L2-027 AC1, L2-028 AC1 and AC4, L2-133 AC2.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The class ride at 7:00 in a browser window, over the aurora | Pick a class, **ride it.** |
| 0:10 | 4 | `header` | Close-ups of the class name and the clock, with three cards | The class, **on the clock.** |
| 0:21 | 4 | `segment` | Close-ups of the segment card at 0:00 and at 7:00 | Where you are **in the plan.** |
| 0:31 | 4 | `power` | Close-ups of Power on target and under it, and Cadence | On target, **or the gap.** |
| 0:41 | 4 | `stepper` | Close-ups of the stepper before and after the bike reports | Your hand **on the hill.** |
| 0:52 | 4 | `sent` | The `B1` writes of the ride | Each boundary, **one level.** |
| 1:02 | 4 | `source` | The class request feeding the store and the engine, drawn | One request, **then ride.** |
| 1:12 | 4 | `bundle` | The initial bundle before and after `HttpClient` | HttpClient, **paid for once.** |
| 1:23 | 4 | `deferred` | What slices 5.3, 5.4 and 6.1 bring | The class **comes alive.** |
| 1:33 | 4 | `shell` | The class ride growing from 390 through 768 and 1024 to 1440 px, on a phone too | Two columns, **then one row.** |
| 1:43 | 4 | `proof` | The two local test runs, and two cards: what the tests prove | Four new specs, **all green.** |
| 1:54 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `segment`, `stepper` and `bundle`, a signal wipe into `sent`, and a zoom
through the `deferred` cards into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared
  fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density. The
  fixture's fake Bluetooth stands in for the bike and its API fixture answers the class; Playwright's
  clock starts the ride at a known time and moves it to 7:00, as `e2e/class-ride.spec.ts` does.
- The writes and the bundle sizes come from that spec and from `ng build ride`; the diagram and cards
  are drawn.
- **What the tests prove:** four new behaviour specs and fifteen new unit tests (`formatClock` and
  `PowerModel.onTarget`); 238 unit tests and the 34 behaviour specs all pass.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/05-2-class-ride-screen
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/05-2-class-ride-screen
node tools/video-build/build.mjs docs/videos/05-2-class-ride-screen --crf 23
```
