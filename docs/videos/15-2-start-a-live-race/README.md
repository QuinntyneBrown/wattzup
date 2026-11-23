# Slice 15.2 · Start a live race

A race lobby now counts the start down together. From 0:03 a full-screen countdown covers the
lobby, ready or not: a timer that says "Race starts in 3" assertively, with one big numeral, 3, 2,
1 and Go, each fading and scaling in over 200 ms (fading only under reduced motion), while the
lobby behind it is inert (L2-053 AC4, L2-056 AC1, AC2). At Go the race opens. A bots race opens
against the same bots; a riders-online race opens in its session
(`/race/:mapId/ride?mode=online&session=<id>`), joins it again on its own connection with
`JoinRace` and hears the start as server time (L2-056 AC3). Its clock starts at that start less
the measured clock offset, so every rider's race clock in the session reads the same at the same
moment, however late the page opened; one opened a moment early holds at 0:00 until it (L2-121
AC3, L2-056 AC4). On the backend, `JoinRace` gives a seated rider back their seat before or after
the start, and a lost connection no longer frees it; anyone else is refused with
`session_not_found`. Main stays at 277.40 kB.

- **Film:** [`15-2-start-a-live-race.mp4`](15-2-start-a-live-race.mp4), 1920×1080, 30 fps,
  1 min 43 s, H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt)
  is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-053 AC4, L2-056 AC1–4, L2-121 AC3, L2-120 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The lobby with its countdown at 3, at 1440 px in a browser, over the aurora | Three, two, one, **start together.** |
| 0:10 | 5 | `countdown` | The countdown at 3 and at 1, with the steps as the lobby shows them | From 0:03, **ready or not.** |
| 0:23 | 5 | `join` | `JoinRace` as the hub answered it, beside the race in its session | At Go, **join the race again.** |
| 0:36 | 5 | `clock` | How the race's clock starts on server time, beside the race at 0:04 | One start, **every clock.** |
| 0:49 | 5 | `widths` | The countdown growing from 390 through 768 and 1024 to 1440 px | Full screen, **every screen.** |
| 1:01 | 4 | `proof` | The local checks, and three cards: what the tests prove | One start, **the same for all.** |
| 1:12 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `join`, a wipe into `clock`, a zoom out of `clock` and into `widths`, and
a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The fixture's hub answers the connection, `ServerTime` (read from the page's installed
  clock), `FindRace` and `JoinRace` as the backend would. Go is not filmed: the race opens in the
  same moment, so the last step shown is 1. The terminal lines are what the fixture and the
  backend's tests saw, written out.
- **What the tests prove:** the countdown specs in `race-lobby-bots.spec.ts` and
  `race-lobby-online.spec.ts`, written first and seen failing with no overlay: 3, 2, 1 and Go,
  one a second, with the timer's role, live region and name and the lobby inert behind it, then
  the race opening, online in its session whether or not the rider is ready.
  `race-online-start.spec.ts` (2 tests), seen failing with no `JoinRace`: a race opened 4.5 s
  after the start joins its session and reads 0:04, then 0:05; one opened 1.5 s early holds at
  0:00 until the start. On the backend, two `RaceLobbyTests` connect real SignalR clients to the
  in-memory server: the seat taken back on a new connection at the start and kept past it, and
  a stranger or an unknown session refused. Unit tests cover `RaceSession.Rejoin`,
  `LiveSessionStore` joining its session, and `RideTicker` publishing the second of a clock
  started in the past at once. All 243 behaviour specs, the 1456 unit tests, the 425 backend
  tests and every check pass.
- Not shown, because not built here: the riders online on the race's board and their gaps
  (slice 15.3), and riders who leave the race (slice 15.4).
