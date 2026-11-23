# Slice 2.4 · Keep the bike connected

A ride lasts from twenty minutes to an hour or more, so Telo Ride keeps the bike's link alive, brings
it back after a drop, and shows the rider whether it is connected (L2-016 to L2-019). Once an Echelon
is paired, it writes the keepalive `F0 A0 01 01 92` about once a second, timed from the clock rather
than by counting ticks. When the bike drops, the keepalives stop, the header's status turns red, and
every 3 seconds Telo Ride tries the same bike again without the browser's list; once it is back, it
initialises again and sends the last target resistance before anything else. **Reconnect** tries at
once, and every Web Bluetooth error goes to the console as its name and message. With the computer's
Bluetooth off, Connect Bike says so, and **Try again** finds it back on. From lg, the app header names
the bike with the hidden text " connected", or turns red, titled "Bike not connected".

- **Film:** [`02-4-keep-the-bike-connected.mp4`](02-4-keep-the-bike-connected.mp4), 1920×1080, 30 fps,
  2 min 25 s, H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-016 AC1 to AC3 (keepalive), L2-017 AC1 to AC5 (drop and recovery),
  L2-018 AC1, AC3 and AC4 (Bluetooth off on Connect Bike), L2-019 AC1 and AC2 (the header's status).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home with the bike connected in a browser window, over the aurora | An hour long. **Still connected.** |
| 0:10 | 4 | `status` | A close-up of the header's bike status, connected | The bike, **by name.** |
| 0:21 | 4 | `offline` | A close-up of the status before the bike connects | Not connected? **Said three ways.** |
| 0:31 | 4 | `keepalive` | The keepalives the fake bike recorded, one a second | Once a second, **by the clock.** |
| 0:41 | 4 | `drop` | Home after the bike drops, in a browser window | Dropped? **Tried again.** |
| 0:52 | 4 | `back` | The writes after the bike is switched on again: initialisation, the target, the keepalive | Back, **target first.** |
| 1:02 | 4 | `retry` | Reconnect and an error, drawn | Try now, **say why.** |
| 1:12 | 4 | `radio` | Connect Bike with Bluetooth off, on a phone | Bluetooth off? **Said plainly.** |
| 1:23 | 4 | `deferred` | What the ride screens and slice 18.2 bring | The ride screens **bring their own.** |
| 1:33 | 4 | `shell` | Home growing from 390 through 768 and 1024 to 1440 px, the status appearing from 1024 | From a laptop’s width, **the bike.** |
| 1:43 | 4 | `proof` | The two local test runs, and two cards: what the tests prove | A hundred and twenty-one, **all green.** |
| 1:54 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `offline`, `keepalive` and `back`, a signal wipe into `radio`, and a zoom
through the `deferred` cards into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared
  fixture and page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density. The
  fixture's fake Bluetooth stands in for the bike (remembered, connected, dropped and switched off)
  and for the radio (switched off). No real bike or radio was involved.
- The `keepalive` and `back` terminals show the writes `frontend/e2e/keep-the-bike-connected.spec.ts`
  asserts from the fake bike's log, with Playwright's clock moving time on. The target resistance
  sent first after a reconnect is proved by the connection's unit test, since no screen sets a target
  until journey 4.
- The diagram and the cards are drawn.
- **What the tests prove:** thirty behaviour specs, five of them for this slice
  (`frontend/e2e/keep-the-bike-connected.spec.ts`: L2-016 AC1 and AC3, L2-017 AC1 and AC2;
  `frontend/e2e/bike-status.spec.ts`: L2-019 AC1 and AC2; Bluetooth off in
  `frontend/e2e/browser-support.spec.ts`: L2-018 AC1, AC3 and AC4), and ninety-one unit tests,
  twenty-nine of them for this slice (the bike status table, the keepalive's timing, the reconnector,
  and the connection's drop, retry, resend and error text).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/02-4-keep-the-bike-connected
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/02-4-keep-the-bike-connected
node tools/video-build/build.mjs docs/videos/02-4-keep-the-bike-connected --crf 23
```
