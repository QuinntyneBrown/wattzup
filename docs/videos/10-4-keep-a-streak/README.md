# Slice 10.4 · Keep a streak

The backend now keeps each rider's streak (L2-042). Every finished ride records its calendar day,
in the time zone the ride was submitted with: a second ride that day leaves the streak as it is,
the next day adds one, a gap starts it again at 1, and a ride on an earlier day, submitted late,
leaves it alone. Once a whole day passes with no ride, `GET /api/progress` reads it as 0; "today"
is taken in the time zone of the rider's latest ride. The ride's XP uses the streak after it, so
its "{n}-day streak" line, the header and Profile give one number (L2-042 AC4, L2-037 AC4). The
header shows a flame in warn and the numeral, named "4-day streak" by visually hidden text, and
leaves it out at 0 (L2-032 AC2, AC3); Profile's line under the headline reads "760 XP to level 8 ·
4-day streak".

- **Film:** [`10-4-keep-a-streak.mp4`](10-4-keep-a-streak.mp4), 1920×1080, 30 fps, 1 min 30 s, H.264
  at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for
  a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-042 AC1 to AC4, L2-037 AC4, L2-032 AC2 and AC3, L2-038 AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Profile for the mid rider at 1440 px in a browser, over the aurora | Ride every day, **keep the flame.** |
| 0:10 | 6 | `days` | Rides on Monday twice, Tuesday and Wednesday, a missed Thursday, and two Toronto rides either side of midnight | One a day, **on your calendar.** |
| 0:25 | 4 | `xp` | A first ride's XP lines with "1-day streak" +10 | Ten a day, **one number.** |
| 0:36 | 5 | `shows` | The header's flame and 4, Profile for the mid rider and a new rider, and the phone's header | The flame, **and 4 days.** |
| 0:49 | 4 | `proof` | The local checks, and three cards: what the tests prove | Every case, **across midnight.** |
| 0:59 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a wipe into `xp`, a zoom through `shows` into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390 and 1440 px at double density;
  `GET /api/progress` is answered by the fixture. The rides in the `days` scene are the ones
  `StreakTests` submits through the API, with the clock moved instead of slept.
- **What the tests prove:** backend acceptance tests through the API (`StreakTests`, seen failing
  first): three days of rides make a 3-day streak, and each ride's XP line agrees; two rides on one
  day grow it once; it reads 1 through the day after a ride and 0 once a whole day has passed; and
  23:30 and 00:30 in Toronto, one day in UTC, are two days of the streak. `StreakRuleTests` checks
  every case of recording and reading, one per row, and the calendar day in three time zones. The
  XP and level tests now expect the first ride's "1-day streak" +10. The behaviour spec
  (`streak.spec.ts`, seen failing first) checks the mid rider's streak in the header and on
  Profile, and a rider with none. All 161 behaviour specs, the 257 backend tests, the 1311 unit
  tests and every check pass.
- Not shown, because not built here: Results showing the streak line (journey 11), and the rides
  and kilometres on Profile's line (slice 13.3).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/10-4-keep-a-streak
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/10-4-keep-a-streak
node tools/video-build/build.mjs docs/videos/10-4-keep-a-streak --crf 25
```
