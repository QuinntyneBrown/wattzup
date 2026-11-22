# Slice 18.1 · Lose the service mid-ride

When the hub connection drops in the middle of a riders-online race or a group class, the ride carries on with the
bike, the plan and the clock; the board keeps its last standings, and a status notice under its title reads
"Reconnecting. The standings will catch up." (L2-126 AC1). When the service is back, the ride reconnects and rejoins its
session, the notice goes, and the service sends the session's standings to the rejoining rider at once, so the board
catches up within a second (AC2). A rider who never comes back is placed by the progress last received: a class keeps
the row's last output, and a race places a rider silent for 15 seconds DNF after the riders still racing, by the
distance last received (AC3, L2-124). The first bundle stays at 277.44 kB.

- **Film:** [`18-1-lose-the-service-mid-ride.mp4`](18-1-lose-the-service-mid-ride.mp4), 1920×1080, 30 fps, 1 min 56 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-126 AC1, AC2, AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | A riders-online race at 5:05 with the service lost, at 1440 px in a browser, over the aurora | Service lost? **Ride on.** |
| 0:10 | 5 | `lost` | Three facts, beside the race's board close up with the notice under its title | The board holds, **the ride rolls.** |
| 0:23 | 5 | `class` | A group class with the service lost, and its output board close up | The video rolls, **the board waits.** |
| 0:36 | 5 | `back` | The race lost, restored and rejoined as the spec saw it, beside the board with the rider into 4th | Back again, **same seat.** |
| 0:49 | 5 | `server` | Three facts, beside the backend tests' standings heard at once on a rejoin | Rejoined, **caught up at once.** |
| 1:01 | 5 | `widths` | The race with the service lost growing from 390 through 768 and 1024 to 1440 px | Riding on, **at every width.** |
| 1:14 | 4 | `proof` | The local checks, and three cards: what the tests prove | Service lost, **ride kept.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `class`, a wipe into `back`, a push into `server`, a zoom into `widths`, and a push into
`proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density: a riders-online race on Old Town
  Criterium at 5:01 with the race mock's peers board, then the service lost with every reconnect refused and the race on
  to 5:05, then the service back and the race rejoined; and 30 Minute HIIT Cardio's group ride losing the service the
  same way. The terminal lines are what the specs and the backend tests saw.
- **What the tests prove:** `lost-service.spec.ts` (2 tests), written first and seen failing on the missing status
  region, shows a race and a group class carrying on with the bike and the clock through a lost service, with no
  lost-bike alert, the last standings and the notice, then rejoining, the notice gone and the board updated by the
  standings sent. `LostServiceTests` (2 tests), seen failing with nothing heard, shows the service sending the
  standings to a rejoining connection at once, with the clock standing still. All 272 behaviour specs, the 1585 unit
  tests, the 459 backend tests and every check pass.
- Not shown, because not built here:
  - A race rider away for 30 seconds is removed (L2-124 AC4), and their rejoin is refused; telling them they are out of
    the race is not built (the design's open question 3).
  - The ride clock through hidden tabs and throttling (18.2).
