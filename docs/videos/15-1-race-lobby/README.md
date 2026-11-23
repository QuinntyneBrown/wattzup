# Slice 15.1 · Race lobby

A race against bots or riders online now starts from a lobby at `/race/:mapId/lobby`. A bots lobby
runs in the browser: You in seat 1 and nine bots, none ready, the clock held at 0:05 until "I'm
ready", which readies every bot and runs it to 0:00, where the race opens (L2-053 AC3). A
riders-online lobby asks the ride hub for a seat with `FindRace`. The service seats the rider in
the open session on the map with the most riders, or opens one that starts 30 seconds later
(L2-121 AC1). The lobby draws the session's grid, You first at your level, the riders online by
seat, then the open seats (L2-052), and counts down to the session's start on server time,
corrected by the measured clock offset (L2-051 AC5). Each `SeatsChanged` replaces the grid: a
rider joining takes an open seat, a rider leaving opens theirs with the notice "MarcoVelo left.
Their seat is open again." (L2-055), and at 0:10 the service's tick fills every open seat with
bots, so the rider is "On the start line" and the first stretch's level goes to the bike (L2-054,
L2-051 AC4). "I'm ready" sends `SetReady`; Leave sends `LeaveRace` and returns to Race Setup with
Riders online, and a connection lost for 10 seconds frees its seat (L2-057). From level 3, Race
Setup reads "5 riders queuing now. 8–10 per race, empty seats go to bots." from
`GET /api/maps/{mapId}/queue`, asked every 10 seconds, and "Find a race" opens the lobby (L2-048
AC3, L2-050 AC3). Main stays at 277.40 kB.

- **Film:** [`15-1-race-lobby.mp4`](15-1-race-lobby.mp4), 1920×1080, 30 fps, 1 min 56 s, H.264
  at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a
  player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-048 AC1, AC3, L2-050 AC3, L2-051, L2-052, L2-053 AC1, AC3, L2-054,
  L2-055 AC1, AC3, L2-057, L2-121 AC1, AC2, AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The riders-online lobby at 1440 px in a browser, over the aurora | Race riders online, **start together.** |
| 0:10 | 5 | `setup` | The queue request as Race Setup sends it, beside Race Setup with Riders online | Riders online, **from level 3.** |
| 0:23 | 5 | `seat` | `FindRace` as the hub answered it, beside the lobby waiting at 0:24 | The fullest race, **or a new one.** |
| 0:36 | 5 | `follow` | `SeatsChanged` for a join and a leave, beside the lobby after MarcoVelo leaves | Come and go, **seats follow.** |
| 0:49 | 5 | `fill` | The service's tick filling the seats, beside the lobby on the start line | At 0:10, **the race starts full.** |
| 1:01 | 5 | `widths` | The lobby growing from 390 through 768 and 1024 to 1440 px | Beside or below, **every screen.** |
| 1:14 | 4 | `proof` | The local checks, and three cards: what the tests prove | One grid, **the same for all.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `seat`, a wipe into `follow`, a zoom out of `fill` and into `widths`, and
a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The fixture's hub answers the connection, `ServerTime` (read from the page's installed
  clock) and `FindRace`, and sends `SeatsChanged` as the backend would: the Race Lobby mock's five
  riders and the rider. The terminal lines are what the fixture and the backend's tests saw,
  written out.
- **What the tests prove:** `race-lobby-online.spec.ts` (6 tests), written first and seen failing
  with the bots grid where the hub's was expected: the grid, status, hint and clock from
  `FindRace`, a join, a leave with its notice, the bot fill with the resistance write, `SetReady`,
  and `LeaveRace` with the return to Race Setup. `race-lobby-bots.spec.ts` (5 tests) proves the
  bots lobby's hold at 0:05, ready, unready and the open race at 0:00, and `race-setup.spec.ts`
  the queue line and Find a race. On the backend, `RaceLobbyTests` (9 tests) connect real
  SignalR clients to the in-memory server: a session 30 seconds out that the next rider joins, a
  new session within 10 seconds of the start, ready for everyone, the bot fill at 0:10, a leave
  before 0:10 and one after, a lost connection freed after 10 seconds, the queue count and an
  unknown map refused. Unit tests cover `RaceSession`'s rules, `LocalLobby` and `LiveSessionStore`'s race
  side. All 239 behaviour specs, the 1453 unit tests, the 422 backend tests and every check pass.
- Not shown, because not built here: the 3, 2, 1, Go overlay and the shared start (slice 15.2);
  until then an online lobby rests at 0:00. Riders' countries, which the service does not hold
  yet.
