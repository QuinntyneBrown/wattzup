# Slice 17.1 · Ride outbox

A finished ride now waits on the device until the backend has it. The outbox writes each ride to IndexedDB (the store
`rides-waiting` of the database `telo-ride`) before it sends it, so a ride that finishes without a network, or with the
backend out of reach, is kept with its id and Results shows its XP pending (L2-135 AC1, L2-074 AC3). Waiting rides are
sent one at a time, oldest first, when the app opens, when the browser is back online and on a retry timer: 30 seconds,
then a minute, doubling up to an hour. Each is removed from the device once the backend has recorded it (L2-135 AC2). A
ride the backend refuses for good is dropped as not recorded. Main grows by 9 bytes, to 277.41 kB.

- **Film:** [`17-1-ride-outbox.mp4`](17-1-ride-outbox.mp4), 1920×1080, 30 fps, 1 min 56 s, H.264 at CRF 25 and AAC. No
  captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-135 AC1, AC2; L2-074 AC3, AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Results with the ride recorded, at 1440 px in a browser, over the aurora | Finished offline, **recorded later.** |
| 0:10 | 5 | `pending` | The device as the spec saw it, beside Results with its XP pending and a close-up of the XP panel | No network? **XP pending.** |
| 0:23 | 5 | `order` | Three facts, beside two rides sent oldest first as the spec saw them | Back online, **oldest first.** |
| 0:36 | 5 | `retry` | The retry timer as the spec saw it, beside Results with its XP pending | Still out of reach? **Try again, slower.** |
| 0:49 | 5 | `recorded` | Three facts, beside Results with the ride recorded and a close-up of its XP | Recorded, **then removed.** |
| 1:01 | 5 | `widths` | Results with its XP pending growing from 390 through 768 and 1024 to 1440 px | XP pending, **at every width.** |
| 1:14 | 4 | `proof` | The local checks, and three cards: what the tests prove | Kept, **then sent.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `order`, a wipe into `retry`, a push into `recorded`, a zoom into `widths`, and a push into
`proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density: Results of a solo race on Old Town
  Criterium that finished with no answer from the backend, its ride kept on the device, and the same Results once the
  browser is back online and the ride recorded. The terminal lines are what the specs saw.
- **What the tests prove:** `ride-outbox.spec.ts` (3 tests), written first and seen failing, shows a ride finished
  without a network kept in IndexedDB with its XP pending, then sent and removed when the app opens online; two waiting
  rides sent oldest first by when they finished; and a ride the backend answers 503 sent again after 30 seconds, then a
  minute, and recorded. `DeviceRideOutbox`'s unit tests cover each status that keeps a ride (no answer, 500, 503, 429,
  401) or drops it (422, 400, 409), the delays up to an hour, the stop at the first ride that does not reach the
  backend, and the race whose result is pending. All 266 behaviour specs, the 1572 unit tests, the 455 backend tests and
  every check pass.
- Not shown, because not built here or not reachable yet:
  - The cached app shell and catalogues (17.2) and the offline words for group and live choices (17.3).
  - A ride kept after a session ends (L2-004 AC4) is kept and tried again on the timer; sending it the moment the rider
    signs in again is not built.
