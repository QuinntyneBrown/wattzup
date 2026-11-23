# Slice 10.3 · Rider levels

The rider's total XP now makes a level from 1 to 30: the highest level whose threshold the total
reaches (L2-038). `LevelTable` holds the thirty thresholds. Three are known (level 2 at 400 XP,
level 8 at 2,600 and level 19 at 10,400); the rest are provisional until open question 1 of
`docs/specs/L2.md` is settled, and keep the mocks' mid rider (1,840 XP) at level 7 and their
veteran (9,120 XP) at level 18. A recorded ride answers with the level its total reaches,
whether the ride took it there, and the next threshold and the XP to it, both `null` at level 30.
`GET /api/progress` answers the level, the total XP and the next threshold, and the app header
shows them as the level link to Profile: the gold badge, the XP bar filled to the total over the
next threshold, and "1,840 / 2,600 XP", named "Level 7, 1840 of 2600 XP" (L2-032 AC2). On a phone
only the badge shows. Profile's headline names the same level.

- **Film:** [`10-3-rider-levels.mp4`](10-3-rider-levels.mp4), 1920×1080, 30 fps, 1 min 30 s, H.264
  at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for
  a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-038 AC1 to AC3, L2-032 AC2 and AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home with the level link at 1440 px in a browser, over the aurora | XP adds up **to a level.** |
| 0:10 | 6 | `table` | The level table: the known thresholds, the provisional ones and level 30 | The highest threshold **you reach.** |
| 0:25 | 5 | `header` | The level link for the mid rider, the veteran and a new rider, Profile's headline, and the phone's badge | Level 7, **1,840 of 2,600.** |
| 0:38 | 4 | `ride` | A ride's answer: a new rider reaching level 2, and a level-30 rider staying there | Up a level, **or stay at 30.** |
| 0:48 | 4 | `proof` | The local checks, and three cards: what the tests prove | Every row, **and the header.** |
| 0:59 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a wipe into `header`, a zoom through `ride` into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390 and 1440 px at double density;
  `GET /api/progress` is answered by the fixture. The ride's answers in the `ride` scene are the
  ones `ProgressTests` receives through the API.
- **What the tests prove:** backend acceptance tests through the API (`ProgressTests`, seen
  failing first): a new rider is level 1 with 400 XP to level 2; the mid rider is level 7 with
  1,840 of 2,600; a first ride of 402 XP answers level 2 and `levelUp`, and its repeat answers the
  same; a ride short of the next threshold keeps the level; at level 30 the total grows and the
  level stays; and progress needs a session. `LevelTableTests` checks every row of the table, the
  XP to the next level of the mocks' riders, and the cap. The behaviour spec
  (`rider-level.spec.ts`, seen failing first) checks the mid rider's and a new rider's level link,
  that it opens Profile naming the level, and that it is absent when progress cannot be read;
  `toLevelView` and `RiderProgressStore` have unit tests. All 159 behaviour specs, the 241 backend
  tests, the 1307 unit tests and every check pass.
- Not shown, because not built here: the streak in the header (slice 10.4), Full screen
  (slice 24.2), Results showing the new level (journey 11), Profile's XP bar and "760 XP to level
  8" (slice 13.3), and class tiers opening by level (slice 12.2).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/10-3-rider-levels
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/10-3-rider-levels
node tools/video-build/build.mjs docs/videos/10-3-rider-levels --crf 25
```
