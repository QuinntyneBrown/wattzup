# Slice 5.1 · Workout engine and ride clock

A class is a plan on a clock, and Telo Ride now steps through the plan and sends each segment's level to
the bike (L2-027, L2-133, L2-134). `RideClock` is `performance.now()` since the start, less the time
paused, and never counts ticks. `RideTicker` wakes at each whole second of it and publishes the second
once, nothing while paused, and catches up at once when a hidden tab is shown again. `planStateAt` gives
the plan's segment, time left, progress and target power at any time, and `WorkoutEngine` sends a new
segment's level as the target resistance within 500 ms of its boundary. The class ride screen is slice
5.2, the video 5.3, and pause, leave or finish 5.4.

- **Film:** [`05-1-workout-engine-and-ride-clock.mp4`](05-1-workout-engine-and-ride-clock.mp4), 1920×1080,
  30 fps, 2 min 25 s, H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt)
  is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-027 AC1 and AC3, L2-133 AC1 and AC2, L2-134 AC2, L2-089 AC1 (the segment state), L2-023 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home with the bike streaming in a browser window, over the aurora | A plan **on a clock.** |
| 0:10 | 4 | `clock` | The ride clock through start, pause and resume | Monotonic, **never counted.** |
| 0:21 | 4 | `ticker` | One tick for each whole second | Every second, **once.** |
| 0:31 | 4 | `plan` | Warm-up, work and recover with their levels and aims, drawn | Warm-up, work, **recover.** |
| 0:41 | 4 | `state` | The plan's state at 7:30 | Where the plan **stands.** |
| 0:52 | 4 | `boundary` | The bike's level segment by segment | A new segment, **a new level.** |
| 1:02 | 4 | `paused` | What a pause holds, as cards | Paused? **Nothing moves.** |
| 1:12 | 4 | `hidden` | A tab hidden for ten minutes, caught up | Ten minutes away, **caught up at once.** |
| 1:23 | 4 | `deferred` | What slices 5.2 to 5.4 bring | The class ride **takes the stage.** |
| 1:33 | 4 | `shell` | Home growing from 390 through 768 and 1024 to 1440 px, Connect Bike on a phone | Every width, **the same Home.** |
| 1:43 | 4 | `proof` | The two local test runs, and two cards: what the tests prove | Twenty-four new, **all green.** |
| 1:54 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `ticker`, `state` and `hidden`, a signal wipe into `boundary`, and a zoom
through the `deferred` cards into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared
  fixture and page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density. The
  fixture's fake Bluetooth stands in for the bike. Home looks the same as in slice 4.2: no screen rides a
  plan yet.
- The clock, ticks, segments and commands are the cases of `ride-clock.spec.ts`, `ride-ticker.spec.ts`,
  `plan-state.spec.ts` and `workout-engine.spec.ts` in `domain/src/engine/` under `frontend/projects/`,
  on fake timers, with a fake resistance controller and the simulated bike; the diagram and cards are
  drawn.
- **What the tests prove:** twenty-four new unit tests; 223 unit tests and the thirty behaviour specs all
  pass. The wake lock, the leave guard and the Playwright proof come with the class ride screen (5.2).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/05-1-workout-engine-and-ride-clock
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/05-1-workout-engine-and-ride-clock
node tools/video-build/build.mjs docs/videos/05-1-workout-engine-and-ride-clock --crf 23
```
