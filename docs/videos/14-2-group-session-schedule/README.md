# Slice 14.2 · Group session schedule

Every open class now has a group session every 15 minutes, on the quarter hours, with 10 seats
(L2-083 AC1, L2-122 AC1). The backend's `GroupSessionSchedule` names each session
(`hiit-cardio-30@20261121T1945Z`), and signed-in riders read a class's next two sessions
(`GET /api/classes/{id}/sessions`) and every class's next one (`GET /api/classes/sessions`).
Class Start reads them every 30 seconds and offers the next: "7:39 PM · starts in 9 min · 6 of 10
riders", chosen, with "Riding in this session" and its riders, and "Join · starts in 9 min", which
opens the group ride with that session (L2-085 AC1–AC3). In its last minute Join reads "Join now ·
starting"; a full session offers the one after it, "Join the next session" (L2-086 AC1, AC2). Each
open card of the Class Library shows its next group, "Group in 6 min · 5/10" (L2-083 AC2). While
the sessions cannot be read, Class Start offers riding alone only and no card shows a chip. The
initial bundle is 300.22 kB.

- **Film:** [`14-2-group-session-schedule.mp4`](14-2-group-session-schedule.mp4), 1920×1080,
  30 fps, 1 min 54 s, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-083 AC1, AC2, L2-085 AC1–AC3, L2-086 AC1, AC2, L2-122 AC1.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Class Start offering the next group session at 1440 px in a browser, over the aurora | A group ride, **every fifteen minutes.** |
| 0:10 | 5 | `schedule` | The sessions the API answers at 7:30 PM, and three cards | On the quarter hours, **ten seats each.** |
| 0:23 | 5 | `roster` | The ride choice with the next session and its riders | The next session, **and who rides it.** |
| 0:36 | 5 | `full` | The ride choice with a full session, and with one starting | Full or starting, **Join says so.** |
| 0:49 | 4 | `library` | The Class Library with its chips, and one card close up | Every card, **counting down.** |
| 0:59 | 5 | `widths` | Class Start growing from 390 through 768 and 1024 to 1440 px | One session, **every screen.** |
| 1:12 | 4 | `proof` | The local checks, and three cards: what the tests prove | The next session, **always current.** |
| 1:22 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `roster`, a wipe into `full`, a zoom out of `library` and into `widths`,
and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density, with Playwright's clock at 7:30 PM (UTC). The API fixture answers the sessions as the
  backend would; the riders are the mocks'. The `schedule` scene's terminal lines are what the
  backend answers at 7:30 PM, written out.
- **What the tests prove:** `class-start-group.spec.ts` (4 tests) and
  `class-library-group.spec.ts` (2 tests), written first and seen failing on "Group sessions
  can’t be reached right now." and on a missing chip: the next session chosen with its riders and
  Join opening the group ride with it, the starting and full sessions, the chips, and both read
  again every 30 seconds as the minutes count down. The backend's tests through the API read the
  next two sessions, a session starting now as started, every class's next session, 404 for an
  unknown class and 401 without a session; a direct test of `GroupSessionSchedule` covers each
  row of the slot rule. Unit specs cover `groupSessionView()` and `groupChip()`. All 215 behaviour
  specs, the 1409 unit tests, the 350 backend tests and every check pass.
- Not shown, because not built here: taking a seat (`JoinClassSession`, slice 14.3; until then
  every seat reads free in the backend and Join opens the ride without asking the hub), the
  session refusing a full or started join, and the group ride itself (slice 14.4).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/14-2-group-session-schedule
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/14-2-group-session-schedule
node tools/video-build/build.mjs docs/videos/14-2-group-session-schedule --crf 25
```
