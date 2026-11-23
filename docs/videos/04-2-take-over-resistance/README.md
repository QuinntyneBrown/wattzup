# Slice 4.2 · Take over resistance

The plan sets the hill, but the legs are the rider's: Telo Ride now lets the rider take over the
resistance (L2-028). "Raise resistance" and "Lower resistance" move the target one level, clamped to 1
to 32 and sent as the rider's own; before any target a nudge starts from the resistance the bike
reports. Picking "Level N" sets N. A change by hand lasts until the segment ends; the next segment's plan
level applies again. With the bike away, or an FTMS bike refusing control, nothing is sent by hand.
The steppers ("Resistance 12 of 32") and the 32 level bars come with the ride screens.

- **Film:** [`04-2-take-over-resistance.mp4`](04-2-take-over-resistance.mp4), 1920×1080,
  30 fps, 2 min 25 s, H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt)
  is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-028 AC1 to AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home with the bike streaming in a browser window, over the aurora | Your legs, **your call.** |
| 0:10 | 4 | `raise` | The target, press by press | One level **at a time.** |
| 0:21 | 4 | `limits` | Raise at 32 and lower at 1 | Never past **the ends.** |
| 0:31 | 4 | `frombike` | A nudge from the bike's reported resistance | No target yet? **Start from the bike.** |
| 0:41 | 4 | `pick` | A "Level N" bar setting the target | Pick a level, **get that level.** |
| 0:52 | 4 | `plan` | Plan, rider, plan across two segments, drawn | The next segment, **the plan again.** |
| 1:02 | 4 | `away` | What a press does with the bike away, as cards | Bike away? **Hands off.** |
| 1:12 | 4 | `source` | The last command with its source and acknowledgement | Who asked, **and how fast.** |
| 1:23 | 4 | `deferred` | What the ride screens bring | The ride screens **bring the controls.** |
| 1:33 | 4 | `shell` | Home growing from 390 through 768 and 1024 to 1440 px, Connect Bike on a phone | Every width, **the same Home.** |
| 1:43 | 4 | `proof` | The two local test runs, and two cards: what the tests prove | Seven new, **all green.** |
| 1:54 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `limits`, `pick` and `source`, a signal wipe into `plan`, and a zoom through
the `deferred` cards into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared
  fixture and page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density. The
  fixture's fake Bluetooth stands in for the bike. Home looks the same as in slice 4.1: no screen has a
  stepper yet.
- The presses, picks and refusals are the cases of `domain/src/engine/resistance-controller.spec.ts` under
  `frontend/projects/`, with a fake connection and a fake `BikeTelemetry`; the diagram and cards are
  drawn.
- **What the tests prove:** seven new unit tests, one case per row of L2-028 AC1 to AC4; 199 unit tests
  and the thirty behaviour specs all pass.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/04-2-take-over-resistance
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/04-2-take-over-resistance
node tools/video-build/build.mjs docs/videos/04-2-take-over-resistance --crf 23
```
