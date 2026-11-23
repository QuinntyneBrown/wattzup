# Slice 12.2 · Open class tiers

Rider levels open the longer classes (L2-043). A class opens at level 1, 5, 10 or 20. The
backend now refuses any other tier: `ClassTierRules` holds the four, and `ClassPlanRules` leaves
a class at another level out of `GET /api/classes`, so its address is `404 class_not_found`. The
catalogue reads the same for every rider. The Class Library and Class Start routes now bind
`HttpProgressApi` (from slice 12.1) in place of the new-rider stand-in, so a class opens once the
rider's level from `GET /api/progress` reaches its tier. A new rider has the three level-1
classes open. At level 7, 30 Min Tempo Paceline (level 5) is open and its Class Start opens. At
level 18 only 60 Min Coastal Endurance + Surges (level 20) is still locked. The stand-in,
`NewRiderProgress`, has no user left and is gone.

- **Film:** [`12-2-open-class-tiers.mp4`](12-2-open-class-tiers.mp4), 1920×1080, 30 fps,
  1 min 52 s, H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt)
  is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-043 AC1 to AC3, L2-044 AC1 (the level), L2-082 AC2 to AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The Class Library for the mid rider at 1440 px in a browser, over the aurora | Level up, **ride longer.** |
| 0:10 | 5 | `level1` | The 30 and 60 min shelves for a new rider, and the header's level 1 | Level 1: **three open.** |
| 0:23 | 5 | `level7` | The same shelves at level 7: Tempo Paceline open | Level 7: **Tempo opens.** |
| 0:36 | 5 | `level18` | The same shelves at level 18: only the level-20 class locked | Level 18: **one to go.** |
| 0:49 | 4 | `opened` | Class Start for 30 Min Tempo Paceline, in a browser | Opened, **ready to ride.** |
| 0:59 | 5 | `widths` | The Class Library growing from 390 through 768 and 1024 to 1440 px | Every tier, **every screen.** |
| 1:12 | 4 | `proof` | The local checks, and three cards: what the tests prove | Four tiers, **one level.** |
| 1:22 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a cut into `level7`, a wipe into `level18`, a zoom out of `opened` and into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The riders' progress is a new rider and the mocks' mid rider and veteran
  (`fixtures/progress.ts`), served by the fixture with the catalogue.
- **What the tests prove:** an acceptance test through the API (`ClassTierTests`, seen failing
  first) shows that a class at tier 7 is not listed and that its address is 404
  `class_not_found`. `ClassTierRulesTests` checks the rule for each level from 0 to 21, and only
  1, 5, 10 and 20 are tiers. The behaviour spec (`class-tiers.spec.ts`, seen failing first)
  covers level 7: the four classes of levels 1 and 5 are open, the level-10 and level-20 classes
  are locked with their levels, and Tempo Paceline's card opens its Class Start. It also covers
  level 18: only the level-20 class is locked, and Dolomites Endurance's Class Start opens. All
  182 behaviour specs, the 1341 unit tests, the 322 backend tests and every check pass, and the
  initial bundle stays at 300.20 kB.
- Not shown, because not built here: keeping the catalogue on the device for offline reading
  (L2-135), and a level-up toast on Results (L2-038 AC3).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/12-2-open-class-tiers
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/12-2-open-class-tiers
node tools/video-build/build.mjs docs/videos/12-2-open-class-tiers --crf 25
```
