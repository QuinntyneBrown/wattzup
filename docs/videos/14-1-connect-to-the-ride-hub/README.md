# Slice 14.1 · Connect to the ride hub

A group class ride now holds one connection to the backend's ride hub (L2-120). It opens when the
ride arrives with its session (`/classes/:id/ride?session=…`), carries the session cookie, and
measures the device's clock offset from five `ServerTime` calls, keeping the quickest round trip
(L2-121 AC3). When the connection drops it retries at once, then after 2, 5 and 10 seconds and
every 30 seconds after, and measures the offset again once back. Leaving the ride closes it; a
solo ride and every other screen hold none. The hub client lives behind `RIDE_HUB_CLIENT` and
imports `@microsoft/signalr` only when a session starts, so the initial bundle stays at
300.21 kB. The backend's ride hub gained `ServerTime`.

- **Film:** [`14-1-connect-to-the-ride-hub.mp4`](14-1-connect-to-the-ride-hub.mp4), 1920×1080,
  30 fps, 1 min 53 s, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-120 AC1, AC3, AC4 (AC2 by the backend's tests), L2-121 AC3 (the
  offset).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The group class ride at 7:00 at 1440 px in a browser, over the aurora | One live link, **only when it counts.** |
| 0:10 | 5 | `connect` | The hub's negotiation and connection as the fixture saw them, beside the ride | Join a group, **one connection.** |
| 0:23 | 5 | `offset` | Five ServerTime samples and the offset from the quickest | Five asks, **one clock.** |
| 0:36 | 5 | `reconnect` | The reconnect after a drop and the retry schedule, over the bike panel | Dropped, **back at once.** |
| 0:49 | 4 | `solo` | Home, which holds no connection | Solo or browsing, **no link.** |
| 0:59 | 5 | `widths` | The group ride growing from 390 through 768 and 1024 to 1440 px | One ride, **every screen.** |
| 1:12 | 4 | `proof` | The local checks, and three cards: what the tests prove | One link, **nothing left open.** |
| 1:22 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `offset`, a wipe into `reconnect`, a zoom out of `solo` and into
`widths`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The fixture's hub answers the connection and `ServerTime`, its fake Bluetooth stands in
  for the bike and its YouTube fixture for the class video. The terminal lines of the `connect`,
  `offset` and `reconnect` scenes are what the fixture records, written out; the offset's numbers
  are an example.
- **What the tests prove:** `ride-hub.spec.ts` (3 tests), written first and seen failing with no
  hub call: a group class ride negotiates once, calls `ServerTime` five times and leaving closes
  its connection; a dropped connection is negotiated again and measured again; a solo class ride,
  Home and Class Start make no hub request. The backend's hub tests connect a real SignalR client
  to the API in memory: a signed-in rider connects, one without a session is refused at
  negotiation, and `ServerTime` answers with the fake clock's time. Unit specs cover the retry
  schedule, the offset from the quickest sample and `LiveSessionStore`'s join, re-measure, refusal
  and teardown. All 209 behaviour specs, the 1397 unit tests, the 338 backend tests and every
  check pass, and the initial bundle stays at 300.21 kB.
- Not shown, because not built here: joining a session from Class Start (`JoinClassSession` and
  its seat, slice 14.3, which the store will repeat on reconnect), the group header ("· Group ·
  9 riders", slice 14.4; until then the group ride's header reads "Solo"), and the race methods
  (journey 15).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/14-1-connect-to-the-ride-hub
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/14-1-connect-to-the-ride-hub
node tools/video-build/build.mjs docs/videos/14-1-connect-to-the-ride-hub --crf 25
```
