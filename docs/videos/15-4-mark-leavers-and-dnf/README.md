# Slice 15.4 · Mark leavers and DNF

A riders-online race now marks the riders who leave or drop out. Once the race has started, a
rider who presses Leave keeps their seat, marked DNF at the distance they reached, and every rider
in the session receives the new standings at once, without waiting for the next second (L2-124
AC1). A racing rider who sends no progress for 15 seconds is marked DNF (AC2); one whose
connection has been gone for 30 seconds is removed from the session, DNF on the board and refused
a rejoin (AC4). A rider held at the line is finished and never marked. Every DNF ranks after the
rest, and the race board shows the row faint with "DNF" in place of the gap (the race mock's new
`someone-left` state); the gaps beside the power read "DNF" too. The race's own Leave sends
`LeaveRace` before it goes to Race Setup. The board's jersey dots now cover riders online, whose
rows drew none in slice 15.3. Main stays at 277.40 kB.

- **Film:** [`15-4-mark-leavers-and-dnf.mp4`](15-4-mark-leavers-and-dnf.mp4), 1920×1080, 30 fps,
  1 min 43 s, H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt)
  is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-124 AC1, AC2, AC4, L2-060 AC1.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | MarcoVelo marked DNF on the race's board, at 1440 px in a browser, over the aurora | Left the race? **DNF, for all.** |
| 0:10 | 5 | `board` | The board with MarcoVelo 8th, then last and DNF, beside the rows as the hub sent them | Eighth, then **DNF, last.** |
| 0:23 | 5 | `leave` | `LeaveRace` as the hub heard it, beside the race | Leave, **and everyone knows.** |
| 0:36 | 5 | `silence` | The silence and lost-connection rules, beside the race | Silent or gone, **still counted.** |
| 0:49 | 5 | `widths` | The race growing from 390 through 768 and 1024 to 1440 px | From a phone, **to the full board.** |
| 1:01 | 4 | `proof` | The local checks, and three cards: what the tests prove | Who left, **everyone sees.** |
| 1:12 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `leave`, a wipe into `silence`, a zoom out of `silence` and into
`widths`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The fixture's hub answers the connection, `ServerTime` (read from the page's installed
  clock) and `JoinRace`, and sends `RaceStandingsUpdated`: the race mock's peers board, then its
  someone-left board. The terminal lines are what the fixture and the backend's tests saw, written
  out.
- **What the tests prove:** `race-online-dnf.spec.ts` (2 tests), written first and seen failing
  with "−0:05" where "DNF" was due and no `LeaveRace`: a rider the service marks DNF shows last,
  faint, "DNF" in place of the gap; and Leave tells the session before Race Setup. On the backend,
  `RaceDnfTests` (3 tests) connect real SignalR clients to the in-memory server: a leaver DNF for
  everyone at once, a rider silent 15 seconds DNF (riding at 14), a rider gone 30 seconds removed
  and refused a rejoin. `RaceSessionTests` cover the kept seat, the silence threshold, the finished
  rider and the removal. All 247 behaviour specs, the 1462 unit tests, the 447 backend tests and
  every check pass.
- Not shown, because not built here: the results the service settles and locks (slice 15.5), a
  group class rider removed after 30 seconds gone (the design's open question 1), and the rider's
  own race hearing that the service marked them DNF (open question 3).
