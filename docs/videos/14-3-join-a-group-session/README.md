# Slice 14.3 · Join a group session

Join on Class Start now takes a seat. It opens the group ride, which connects to the ride hub,
measures the clock offset and calls `JoinClassSession` for its session (L2-085 AC3). The backend
seats the rider until the session starts, while fewer than 10 are seated, each seat in the next
jersey of a ten-colour palette (L2-122 AC1), and Class Start's sessions and the library's chips
now count those seats. A full session refuses with `session_full` and a started one with
`session_started`. The ride then goes back to Class Start, which reads the sessions again and
offers the next one (L2-122 AC2, L2-086 AC2, AC3); a class above the rider's level
(`class_locked`) goes to the Class Library. After a reconnect the ride asks again and keeps the
same seat (L2-120 AC3). The sessions live in the API's memory, bounded to each class's next two
slots and those still riding. The initial bundle stays at 300.22 kB.

- **Film:** [`14-3-join-a-group-session.mp4`](14-3-join-a-group-session.mp4), 1920×1080,
  30 fps, 1 min 54 s, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-085 AC3, L2-122 AC1, AC2, L2-086 AC2, AC3, L2-120 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Class Start before Join at 1440 px in a browser, over the aurora | Your seat, **or the next one.** |
| 0:10 | 5 | `join` | The hub's connection and seat as the fixture saw them, beside the group ride | Press Join, **take a seat.** |
| 0:23 | 5 | `full` | `session_full`, and Class Start offering the 7:54 PM session | Ten seated, **the next one.** |
| 0:36 | 4 | `started` | `session_started`, and Class Start offering the 7:39 PM session | Too late, **the next session.** |
| 0:46 | 5 | `rejoin` | The reconnect and the same seat, over the group ride | Dropped, **same seat.** |
| 0:59 | 5 | `widths` | The group ride growing from 390 through 768 and 1024 to 1440 px | One seat, **every screen.** |
| 1:12 | 4 | `proof` | The local checks, and three cards: what the tests prove | A seat, **or the next session.** |
| 1:22 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `full`, a wipe into `started`, a zoom out of `rejoin` and into
`widths`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The fixture's hub answers the connection, `ServerTime` and `JoinClassSession` as the
  backend would; its API fixture answers the sessions. The terminal lines are what the fixture
  records, written out.
- **What the tests prove:** `group-class-join.spec.ts` (5 tests), written first and seen failing
  with no `JoinClassSession` call (all but the `class_locked` test, written after its code): Join
  opens the group ride, which asks for a seat in that session once and stays; `session_full` and
  `session_started` bring the rider back to Class Start offering the next session; `class_locked`
  goes to the Class Library; a reconnect asks for the same seat. The backend's tests through the
  hub sign real riders in and connect a real SignalR client with each session cookie: a seat with
  its jersey that Class Start's sessions then list, the same seat on a second join after the
  start, `session_full` for the eleventh rider with the next session offered, `session_started`,
  `class_locked` and `session_not_found`. Direct tests cover `GroupClassSession.TrySeat` and the
  session id's parse, row by row; unit specs cover `seatFrom()` and `LiveSessionStore`'s join,
  rejoin and refusal. All 220 behaviour specs, the 1422 unit tests, the 377 backend tests and
  every check pass.
- Not shown, because not built here: waiting for the start and starting together (slice 14.4,
  with the session's hub group and its bots), the group header ("· Group · 9 riders"; until then
  the group ride's header reads "Solo"), the live board (slice 14.5) and leaving a session, which
  frees its seat (journey 15).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/14-3-join-a-group-session
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/14-3-join-a-group-session
node tools/video-build/build.mjs docs/videos/14-3-join-a-group-session --crf 25
```
