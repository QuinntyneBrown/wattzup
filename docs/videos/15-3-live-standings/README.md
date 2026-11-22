# Slice 15.3 · Live standings

A riders-online race now shares one board. Each second the race reports the distance the rider
has ridden and their power to its session with `ReportRaceProgress`, never more than twice a
second (L2-123 AC1). The service rides the bots seated at 10 seconds to the start on the pace
model around the medium pack, at the virtual speed of their power (AC4), holds every distance at
the route's length, ranks furthest first with a tie to whoever reached it first (AC2), and sends
`RaceStandingsUpdated` to every rider once a second: position, seat, name, jersey, level, kind,
distance and the gap to the leader in seconds, timed from the leader's trace of the last 600
seconds (AC3). The race draws its board, its place and the gaps ahead and behind from the latest
message: the service's places, the rider's row found by seat as "You", and each gap the rider's
gap to the leader less the row's (L2-060 AC1, AC2). Until the first standings the board lists
the start grid. Main stays at 277.40 kB.

- **Film:** [`15-3-live-standings.mp4`](15-3-live-standings.mp4), 1920×1080, 30 fps, 1 min 43 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-123 AC1–4, L2-060 AC1, AC2, AC5.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The race at 5:01 with the service's board, at 1440 px in a browser, over the aurora | One board, **every second.** |
| 0:10 | 5 | `board` | The board with the rider 5th, then 4th after passing Pacer Atlas, beside the rows as the hub sent them | Every rider, **each gap to you.** |
| 0:23 | 5 | `report` | `ReportRaceProgress` as the hub heard it, beside the race | Each second, **your distance.** |
| 0:36 | 5 | `rank` | How the race session rides the bots, ranks and times each gap, beside the race at 4th | The service ranks, **the board follows.** |
| 0:49 | 5 | `widths` | The race growing from 390 through 768 and 1024 to 1440 px | From a phone, **to the full board.** |
| 1:01 | 4 | `proof` | The local checks, and three cards: what the tests prove | One ranking, **the same for all.** |
| 1:12 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `report`, a wipe into `rank`, a zoom out of `rank` and into `widths`, and
a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The fixture's hub answers the connection, `ServerTime` (read from the page's installed
  clock) and `JoinRace`, and sends `RaceStandingsUpdated` with the race mock's peers board on the
  session's grid (Pacer Atlas in kenji.cyc's place). The terminal lines are what the fixture and
  the backend's tests saw, written out.
- **What the tests prove:** `race-online-standings.spec.ts` (2 tests), written first and seen
  failing with no board and no reports: the board ranks the session as the service sends it, the
  rider 5th with gaps from +0:07 to −0:05, then 4th on the next second's standings; and the race
  reports its distance and power each second, at most twice a second. On the backend,
  `RaceStandingsTests` (3 tests) connect real SignalR clients to the in-memory server and saw no
  standings at all before the change: every rider receives the same standings ranked by the
  distance reported, each gap in seconds; the bots ride the pace model at the virtual speed; a
  report within half a second of the last is ignored. `RaceSessionTests` cover the route-length
  hold and the tie, the report rules and the 600-second trace; `VirtualSpeedModelTests` run the
  Ride app's table of cases. Unit tests cover `LiveSessionStore`'s race reports and standings and
  `liveRaceStandings`. All 245 behaviour specs, the 1461 unit tests, the 439 backend tests and
  every check pass.
- Not shown, because not built here: riders who leave the race marked DNF (slice 15.4), and the
  tamper-proof results (slice 15.5).
