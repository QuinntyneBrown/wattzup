# Slice 3.1 · Decode bike notifications

Every number on a ride starts as a few bytes from the bike, and Telo Ride now reads them (L2-020 to
L2-023). An Echelon's `D2` frame carries the resistance (`F0 D2 01 0C CF` is level 12) and its `D1`
frame the cadence, big-endian in bytes 9 and 10 (80 rpm). A frame under 4 bytes, one not starting with
`F0`, one of an unknown type, a short `D1` and every `D0` are ignored, never an error. An FTMS bike's
Indoor Bike Data is read by its flags: speed, cadence, power and heart rate, with the fields between
skipped by size. An Echelon reports no speed or power, so they are estimated (80 rpm is 30.0 km/h; 95 rpm
at level 18 is 317 W); an FTMS bike's own power and speed are used as they are, and a field it leaves
out falls back to the estimate or to "—". Five seconds without cadence blanks cadence and power. No
screen shows these numbers until slice 3.2.

- **Film:** [`03-1-decode-bike-notifications.mp4`](03-1-decode-bike-notifications.mp4), 1920×1080,
  30 fps, 2 min 25 s, H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt)
  is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-020 AC1 to AC5, L2-021 AC1 to AC4, L2-022 AC1, L2-023 AC1 to AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home with the bike streaming in a browser window, over the aurora | Every number, **from bytes.** |
| 0:10 | 4 | `resistance` | A `D2` frame, byte by byte | D2 is **resistance.** |
| 0:21 | 4 | `cadence` | A `D1` frame, its cadence in bytes 9 and 10 | D1 is **cadence.** |
| 0:31 | 4 | `ignored` | The five frames ignored, as cards | Not a frame? **Ignored.** |
| 0:41 | 4 | `ftms` | The flags deciding which fields are read, drawn | The flags **decide.** |
| 0:52 | 4 | `estimate` | The speed, power and target formulas, worked | No power? **Estimated.** |
| 1:02 | 4 | `reported` | Reported power, and power left out, drawn | Reported wins, **else estimate.** |
| 1:12 | 4 | `stale` | Five seconds without cadence, on the clock | Five quiet seconds, **a dash.** |
| 1:23 | 4 | `deferred` | What slice 3.2 and 3.3 bring | Slice 3.2 **shows them.** |
| 1:33 | 4 | `shell` | Home growing from 390 through 768 and 1024 to 1440 px, Connect Bike on a phone | Every width, **the same Home.** |
| 1:43 | 4 | `proof` | The two local test runs, and two cards: what the tests prove | Forty-five new, **all green.** |
| 1:54 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `cadence`, `estimate` and `stale`, a signal wipe into `ftms`, and a zoom
through the `deferred` cards into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared
  fixture and page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density. The
  fixture's fake Bluetooth stands in for the bike, which sends a `D1` and a `D2` frame. No real bike was
  involved. Home looks the same as in slice 2.4: no screen shows telemetry until slice 3.2.
- The frames, formulas and timelines are the cases of the unit tests in `frontend/projects/domain/src/`
  (`protocol/echelon-frame-decoder.spec.ts`, `protocol/indoor-bike-data-decoder.spec.ts`,
  `engine/telemetry-models.spec.ts`, `engine/bike-telemetry.spec.ts`); the diagrams and cards are drawn.
- **What the tests prove:** forty-five new unit tests, one case per row of L2-020 to L2-023, with
  `BikeTelemetry` also run end to end on the simulated bike; 136 unit tests and the thirty behaviour
  specs all pass. Slice 3.2 adds the Playwright proof through the readouts.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/03-1-decode-bike-notifications
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/03-1-decode-bike-notifications
node tools/video-build/build.mjs docs/videos/03-1-decode-bike-notifications --crf 23
```
