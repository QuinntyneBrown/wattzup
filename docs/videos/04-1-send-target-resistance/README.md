# Slice 4.1 · Send target resistance

The plan sets the hill, and Telo Ride now sends each level as the bike's target resistance (L2-025 to
L2-028). `ResistanceController` clamps a plan's level to 1 to 32 and sends it through the connection,
which writes an Echelon's `B1` frame with response (`F0 B1 01 0C AE` for level 12) or an FTMS bike's Set
Target Resistance Level, and keeps the last command with its acknowledgement time. The target stays the
plan's level while the bike reports its own resistance, and the simulated bike reports the target back
in its next `D2` frame. With the bike away the connection keeps the target and sends it first once the
bike is back; with the bike away, or an FTMS bike refusing control, the controls cannot act. Raising and
lowering by hand is slice 4.2, the workout engine 5.1, and the steppers, level bars and "Sent to bike"
come with the ride screens.

- **Film:** [`04-1-send-target-resistance.mp4`](04-1-send-target-resistance.mp4), 1920×1080,
  30 fps, 2 min 25 s, H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt)
  is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-025 AC1, AC2 and AC4, L2-026 AC1, L2-027 AC4, L2-028 AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home with the bike streaming in a browser window, over the aurora | The plan **sets the hill.** |
| 0:10 | 4 | `frame` | Two `B1` frames, levels 12 and 32 | B1 is **the target.** |
| 0:21 | 4 | `clamp` | Targets clamped to 1 to 32 | One to **thirty-two.** |
| 0:31 | 4 | `ack` | The last command with its acknowledgement time | Acknowledged, **and timed.** |
| 0:41 | 4 | `follows` | The simulated bike reporting the target back | Sent, then **reported back.** |
| 0:52 | 4 | `apart` | Target resistance and resistance feeding the readout, drawn | Two numbers, **kept apart.** |
| 1:02 | 4 | `away` | A segment starting during a drop | Away? Kept, **then first.** |
| 1:12 | 4 | `refused` | An FTMS bike refusing control, as cards | Refused? **Read only.** |
| 1:23 | 4 | `deferred` | What slices 4.2, 5.1 and the ride screens bring | The rider **takes over.** |
| 1:33 | 4 | `shell` | Home growing from 390 through 768 and 1024 to 1440 px, Connect Bike on a phone | Every width, **the same Home.** |
| 1:43 | 4 | `proof` | The two local test runs, and two cards: what the tests prove | Eleven new, **all green.** |
| 1:54 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `clamp`, `follows` and `refused`, a signal wipe into `apart`, and a zoom
through the `deferred` cards into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared
  fixture and page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density. The
  fixture's fake Bluetooth stands in for the bike. Home looks the same as in slice 3.3: no screen sets a
  target yet.
- The frames, clamps and commands are the cases of `domain/src/engine/resistance-controller.spec.ts` and
  `domain/src/bluetooth/web-bluetooth-bike-connection.spec.ts` under `frontend/projects/`, with a fake
  connection, a fake Echelon and the simulated bike; the diagram and cards are drawn.
- **What the tests prove:** eleven new unit tests (ten for `ResistanceController`, one for a level asked
  for during a drop); 192 unit tests and the thirty behaviour specs all pass. The `B1` frame and the FTMS
  mapping were proved in slice 2.3.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/04-1-send-target-resistance
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/04-1-send-target-resistance
node tools/video-build/build.mjs docs/videos/04-1-send-target-resistance --crf 23
```
