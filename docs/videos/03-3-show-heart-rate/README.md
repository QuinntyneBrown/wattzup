# Slice 3.3 · Show heart rate

Heart rate belongs beside power, and Telo Ride now reads it, from a strap or from the bike (L2-030,
L2-031). A Heart Rate Measurement's flags decide its width: bit 0 clear is a uint8 of bpm, set is a
little-endian uint16. Choosing a strap opens the browser's chooser filtered to the Heart Rate service
(`0x180D`), subscribes to Heart Rate Measurement (`0x2A37`) and remembers the strap, so next time it
reconnects through `getDevices()` without the chooser. A dropped strap reads disconnected, its bpm goes
blank, and it is tried every 3 seconds until it is back. The strap's reading comes first, an FTMS bike's
next; with neither, the readout is "—", announced as "No heart rate", and a source quiet for 5 seconds
stops counting. Each running second adds to the ride's average and peak heart rate. Settings, which
connects a strap, comes in slice 20.1, and the heart readout with the ride screens.

- **Film:** [`03-3-show-heart-rate.mp4`](03-3-show-heart-rate.mp4), 1920×1080,
  30 fps, 2 min 25 s, H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt)
  is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-030 AC1 to AC3, L2-031 AC1 to AC5.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home with the bike streaming in a browser window, over the aurora | Your heart, **beside your power.** |
| 0:10 | 4 | `decode` | Two Heart Rate Measurements, byte by byte | Bit 0 **decides.** |
| 0:21 | 4 | `chooser` | What the fake strap recorded: the chooser's filter, the subscription | Choose it **once.** |
| 0:31 | 4 | `remembered` | How a remembered strap comes back, as cards | Next time, **no list.** |
| 0:41 | 4 | `drop` | A dropped strap retried every 3 seconds | Dropped? **Tried again.** |
| 0:52 | 4 | `source` | The strap, the bike or neither feeding the heart readout, drawn | Strap first, **then the bike.** |
| 1:02 | 4 | `quiet` | Five quiet seconds per source, on the clock | Five quiet seconds, **a dash.** |
| 1:12 | 4 | `stats` | Average and peak over running seconds | Average **and peak.** |
| 1:23 | 4 | `deferred` | What slice 20.1, the ride screens and journey 10 bring | Settings **connects it.** |
| 1:33 | 4 | `shell` | Home growing from 390 through 768 and 1024 to 1440 px, Connect Bike on a phone | Every width, **the same Home.** |
| 1:43 | 4 | `proof` | The two local test runs, and two cards: what the tests prove | Twenty-five new, **all green.** |
| 1:54 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `chooser`, `drop` and `stats`, a signal wipe into `source`, and a zoom through
the `deferred` cards into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared
  fixture and page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density. The
  fixture's fake Bluetooth stands in for the bike. Home looks the same as in slice 3.2: no screen connects
  a strap or shows heart rate yet.
- The bytes, the strap's steps and the sums are the cases of the unit tests under
  `frontend/projects/domain/src/` (`protocol/heart-rate-measurement-decoder.spec.ts`,
  `bluetooth/web-bluetooth-heart-rate-strap.spec.ts`, `engine/heart-rate-source.spec.ts`,
  `engine/heart-rate-stats.spec.ts`, and `engine/bike-telemetry.spec.ts` for the bike's heart rate), with
  a fake strap standing in for `navigator.bluetooth`; the diagram and cards are drawn.
- **What the tests prove:** twenty-five new unit tests, one case per row of L2-030 and L2-031; 181 unit
  tests and the thirty behaviour specs all pass. Slice 20.1 adds the Playwright proof from Settings.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/03-3-show-heart-rate
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/03-3-show-heart-rate
node tools/video-build/build.mjs docs/videos/03-3-show-heart-rate --crf 23
```
