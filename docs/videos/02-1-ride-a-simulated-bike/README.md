# Slice 2.1 · Ride a simulated bike

Telo Ride can ride without a bike (L2-024). A development build opened with `?simulate` binds the
bike connection to a simulated Echelon EX-5s: pressing **Pair Echelon EX-5s** on Connect Bike pairs it
at once, with no browser chooser and no call to `navigator.bluetooth`, and moves on to Home. Once
connected it sends a `D1` and a `D2` frame every second, encoded by the same `EchelonProtocol` a real
bike's notifications are read with, and reports a new target resistance in its next `D2`. A production
build swaps the simulator's provider for an empty one at build time, so `?simulate` is ignored and
pairing goes through Web Bluetooth.

- **Film:** [`02-1-ride-a-simulated-bike.mp4`](02-1-ride-a-simulated-bike.mp4), 1920×1080, 30 fps,
  2 min 14 s, H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-024 AC1 to AC3 (simulated bike), L2-025 AC1 and AC2 (target resistance
  frame and its clamp).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Connect Bike, paired, in a browser window over the aurora | No bike? **Still a ride.** |
| 0:10 | 4 | `nobike` | Two phones: Connect Bike offering the bike, then paired | One click, **no chooser.** |
| 0:21 | 4 | `states` | Searching, Pairing, Paired and Home, drawn | Searching to **paired.** |
| 0:31 | 4 | `frames` | The simulated rider's first three seconds of `D1` and `D2` frames | The real **frames.** |
| 0:41 | 4 | `resist` | `setResistance(14)` and `(40)`: the `B1` sent and the next `D2` | Set it, **see it.** |
| 0:52 | 4 | `production` | The provider swapped by `fileReplacements`, drawn | Swapped out **at build time.** |
| 1:02 | 4 | `chooser` | The production bundle searched, and its spec | Not one byte **of simulator.** |
| 1:12 | 4 | `bundle` | The initial total beside the bike link's and Connect Bike's chunks | Loaded **when needed.** |
| 1:23 | 4 | `shell` | Connect Bike growing from 390 through 768 and 1024 to 1440 px, a phone over it | Every width, **one pair button.** |
| 1:33 | 4 | `proof` | The two local test runs, and two cards: what the tests prove | Thirty-one, **all green.** |
| 1:43 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a signal wipe into `frames`, pushes into `states`, `resist` and `production`, and a zoom
through the `bundle` chart into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running development build (`ng serve`) opened with
  `?simulate`, taken by [`shots.ts`](shots.ts) with the shared fixture and page objects of
  `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density. The fixture fails on any
  Bluetooth call; the simulator made none. The page clock holds the paired card for its shot.
- The `frames` and `resist` terminals are the real bytes `EchelonProtocol` encodes for the simulated
  rider's first three seconds and for those two commands, laid out for reading.
- The `chooser` terminal is real output against the production build of this slice, and of its
  Playwright spec; the bundle sizes are that build's.
- The diagrams are drawn.
- **What the tests prove:** seventeen unit tests (`echelon-protocol.spec.ts`,
  `simulated-bike-connection.spec.ts`; L2-024 AC1 and AC2, L2-025 AC1 and AC2) with a fake ticker,
  and fourteen behaviour specs, among them `simulated-bike.development.spec.ts` (AC1, against the
  development build) and `simulated-bike.spec.ts` (AC3, against the production build). No real bike
  was involved.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/02-1-ride-a-simulated-bike
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/02-1-ride-a-simulated-bike
node tools/video-build/build.mjs docs/videos/02-1-ride-a-simulated-bike --crf 23
```
