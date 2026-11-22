# Slice 15.5 · Record results nobody can change

A riders-online race's result now belongs to the service. The race session ends when every
person has finished or is DNF, or 2 minutes after the first person finished, those still riding
placed by distance (L2-071 AC3). The service then keeps a session result: each seat's place, the
race second it reached the line and its output, all from the progress it received, never from a
client (L2-125 AC1); it ends the session and sends `SessionEnded`. A ride submitted with
`mode: "online"` and its `sessionId` takes its place, field, time and output from that result:
409 `result_pending` before it exists, 404 `session_not_found` for a rider with no seat in it.
The Ride app submits the race with its session and no pack, and its outbox sends a ride answered
`result_pending` again every 5 seconds for up to 3 minutes while Results shows "Recording your
ride…". Results heads the race "Live race", as the peers mock does, and draws the jersey dots of
riders online. Main stays at 277.40 kB.

- **Film:** [`15-5-record-results-nobody-can-change.mp4`](15-5-record-results-nobody-can-change.mp4),
  1920×1080, 30 fps, 1 min 43 s, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-125 AC1, L2-071 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Results of a riders-online race, recorded, at 1440 px in a browser, over the aurora | Your place, **locked by the service.** |
| 0:10 | 5 | `end` | When a race session ends, beside Results while the result is pending | When the race **is over.** |
| 0:23 | 5 | `locked` | A submission claiming the win, and what the service gave it, beside Results | Claim the win? **The service says 2nd.** |
| 0:36 | 5 | `pending` | The outbox's retry, beside Results pending and then recorded | Finished first? **Results waits.** |
| 0:49 | 5 | `widths` | Results growing from 390 through 768 and 1024 to 1440 px | Recorded, **at every width.** |
| 1:01 | 4 | `proof` | The local checks, and three cards: what the tests prove | The service **keeps the score.** |
| 1:12 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `locked`, a wipe into `pending`, a zoom out of `pending` and into
`widths`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density: a riders-online race on a 0.5 km Old Town Criterium ridden to the line, then Results
  while the API fixture answers 409 `result_pending`, and once it records the retry. The terminal
  lines are what the backend's tests and the outbox saw, written out. Results' standings are the
  app's own (the design's open question 2), so with no standings sent they all read the
  rider's time.
- **What the tests prove:** `RaceResultTests` (2 tests) race two signed-in riders through real
  SignalR clients on the in-memory server: when both have reached the line the service sends
  `SessionEnded`, and MarcoVelo's submission claiming the win and 30 minutes is recorded 2nd of
  10 in 602 seconds; a race whose first finisher crossed at second 572 answers
  `result_pending` at second 691 and ends at 692, and a rider with no seat gets
  `session_not_found`. `RaceSessionTests` cover the end rule row by row, the entries' times,
  outputs and statuses, and an ended race riding no further. `race-online-result.spec.ts`,
  written first and seen failing, submits the race with its session, waits through
  `result_pending` and shows the XP; the outbox's unit tests cover the 5-second retry, the
  3-minute limit, another conflict and its teardown. All 248 behaviour specs, the 1467 unit tests,
  the 455 backend tests and every check pass.
- Not shown, because not built here: a group class session's result (open question 1), Results
  showing the service's place (open question 2), and a cap on progress faster than 100 km/h
  (open question 3).
