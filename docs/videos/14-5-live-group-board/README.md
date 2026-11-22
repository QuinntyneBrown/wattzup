# Slice 14.5 · Live group board

A group class ride now shows a live output board. Once a second the service ranks every rider by
output, highest first, and sends the standings to the session's hub group (L2-123 AC2, AC3). The
board reads "Output" with the rider's place, "5th / 9", and lists every rider with a jersey dot,
name and whole kilojoules. The rider's own row reads "You" and carries `aria-current="true"`. When
the order changes, each moved row slides over 150 ms, and doesn't move under reduced motion
(L2-090 AC1, AC2). From 1024 px the board is a right-hand column; on a phone it sits under the
video. A solo ride has no board (L2-090 AC3, AC4). The header counts the field,
"30 Minute HIIT Cardio · Group · 9 riders". Each second of the ride clock, the ride sends its
output and power with `ReportProgress`, never twice within 500 ms; the service keeps a report
only from a seated rider (L2-123 AC1). At the first tick, a session with fewer than eight riders
gets bots that fill it to ten. They ride the pace model around the easy pack, seeded with the
session's id. The service and the app share one table of cases for that model (L2-083, L2-123
AC4). The initial bundle stays at 300.22 kB.

- **Film:** [`14-5-live-group-board.mp4`](14-5-live-group-board.mp4), 1920×1080, 30 fps,
  1 min 54 s, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-090 AC1–4, L2-123 AC1–4, L2-122 AC3, L2-087 AC1, L2-083.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The group ride with its board at 1440 px in a browser, over the aurora | Ride together, **see the field.** |
| 0:10 | 5 | `board` | The standings as the fixture sent them, beside the board close up | Output, **and your place.** |
| 0:23 | 5 | `report` | The rider's reports as the fixture heard them, beside the ride | Each second, **your output.** |
| 0:36 | 5 | `bots` | The service's tick: bots fill the seats, the pace model, the ranking | Bots fill the seats, **ranked by output.** |
| 0:49 | 4 | `reorder` | The board before and after the next standings put the rider second | Pull ahead, **slide up.** |
| 0:59 | 5 | `widths` | The ride with its board growing from 390 through 768 and 1024 to 1440 px | Beside or below, **every screen.** |
| 1:12 | 4 | `proof` | The local checks, and three cards: what the tests prove | One board, **the same for all.** |
| 1:22 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `report`, a wipe into `bots`, a zoom out of `reorder` and into `widths`,
and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The fixture's hub answers the connection, `ServerTime` (read from the page's installed
  clock) and `JoinClassSession`, and sends `StandingsUpdated` as the backend would: the Class Ride
  mock's nine riders, the rider fifth. The terminal lines are what the fixture and the backend's
  tests saw, written out.
- **What the tests prove:** `group-class-board.spec.ts` (4 tests), written first and seen failing
  with no board and no reports. The board reads "Output" and "5th / 9", lists nine riders by
  output with the rider's row as "5 You 65", and the header counts nine riders. The next
  standings reorder it to "2nd / 9". Over four seconds the ride sends between three and eight
  reports for its session, its output rising. A solo ride has no board. On the backend,
  `GroupSessionStandingsTests` (5 tests) connect real SignalR clients to the in-memory server:
  standings arrive each second ranked by output, bots fill a session to ten, reports under 500 ms
  apart or from an unseated rider are dropped, and nothing is sent before the start. Unit tests
  cover `GroupClassSession`'s rules, the shared `BotPaceModel` table in both suites,
  `LiveSessionStore.report` and `groupBoardView`. All 227 behaviour specs, the 1445 unit tests,
  the 402 backend tests and every check pass.
- Not shown, because not built here: leaving a session, a rider who stops reporting and a dropped
  connection (journey 15), and the riders-online race's standings by distance.
