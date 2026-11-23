# Slice 12.1 · Earn stars and unlock maps

Race times earn up to three stars per map, and stars and finishes open the next maps (L2-039,
L2-040, L2-041). Slices 11.2 and 11.3 taught the backend to award stars and open maps as a race
is recorded; this slice serves the rider's maps and puts them on screen. `GET /api/progress` now
answers the open maps in unlock order (those open from the start and those a ride opened), the
next unlock, and the stars held and best time on each map ridden. `UnlockRules.NextUnlock` gives
the first locked map whose prerequisite map is open or whose goal is a level. In the app,
`HttpProgressApi` reads it once for the route that binds it and replaces the new-rider stand-in
on Map Select, Race Setup and the race. The mid rider sees Prairie Paceline, Old Town Criterium and
Cliffside Coast open with their stars and bests and Neon Docklands next, which Old Town
Criterium's Race Setup names too. The veteran's next unlock is Col du Granit, by "Earn 3★ on
Dolomites". A map a ride opened opens Race Setup, from the unlock card too. A best of an hour or
more reads in minutes, as the mocks write it (71:20).

- **Film:** [`12-1-earn-stars-and-unlock-maps.mp4`](12-1-earn-stars-and-unlock-maps.mp4),
  1920×1080, 30 fps, 1 min 55 s, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-039 AC1 to AC3, L2-040 AC1, AC5, AC6, L2-041 AC1 to AC4 (Home's
  part with slice 13.2).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Map Select for the mid rider at 1440 px in a browser, over the aurora | Your maps, **from your rides.** |
| 0:10 | 5 | `stars` | The mid rider's first four rows: stars, bests and Neon Docklands next | Three stars, **never lost.** |
| 0:23 | 6 | `next` | Neon Docklands' row with its goal, and Old Town Criterium's Race Setup naming it | Next: **Neon Docklands.** |
| 0:38 | 5 | `veteran` | The veteran's Dolomites (Best 71:20), Vice City and Col du Granit next, and Dolomites' Race Setup | Then **Col du Granit.** |
| 0:51 | 4 | `opened` | Race Setup for Neon Docklands once a ride opened it, in a browser | Opened, **ready to ride.** |
| 1:01 | 5 | `widths` | Map Select growing from 390 through 768 and 1024 to 1440 px | One path, **every screen.** |
| 1:14 | 4 | `proof` | The local checks, and three cards: what the tests prove | Every map, **one source.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `next`, a wipe into `veteran`, a zoom out of `opened` and into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The riders' progress is the mocks' mid rider and veteran (`fixtures/progress.ts`),
  served by the fixture.
- **What the tests prove:** backend acceptance tests through the API (`MapStandingTests`, seen
  failing first): a new rider has Prairie Paceline and Old Town Criterium open, Cliffside Coast
  next and no stars or best; after 2nd of 10 against bots on Old Town Criterium in 30:00, Neon
  Docklands is open with 2 stars and a 1,800 s best on Old Town Criterium; the mid rider's next
  unlock is Neon Docklands and the veteran's Col du Granit. `NextUnlockTests` checks the rule, one
  case per row (8 rows). The behaviour spec (`map-progress.spec.ts`, seen failing first) checks
  the mid rider's stars, bests, open Cliffside Coast and Neon Docklands next, with Old Town
  Criterium's Race Setup naming the same goal. It checks the veteran's Col du Granit, the
  Dolomites best of 71:20 on Map Select and Race Setup, and Race Setup opening for Neon Docklands
  from its address and from Results' unlock card. `formatBest` has a unit case for each length of
  time. All 180 behaviour specs, the 1341 unit tests, the 299 backend tests and every check pass,
  and the initial bundle stays at 300.20 kB.
- Not shown, because not built here: Home's Next ride card and unlock banner (slice 13.2), and
  the class tiers that rider levels open (slice 12.2), whose routes keep the stand-in until then.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/12-1-earn-stars-and-unlock-maps
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/12-1-earn-stars-and-unlock-maps
node tools/video-build/build.mjs docs/videos/12-1-earn-stars-and-unlock-maps --crf 25
```
