# Slice 11.2 · XP, stars and personal best

Results now shows what the ride earned (L2-074, L2-075, L2-077). The backend answers a race with
its stars on the map, held and earned, and its best time, the best before it and whether it is new:
`MapProgress` keeps each rider's stars and best on a map, and `StarRules` gives "Finish the race",
"Top 3 against the medium pack" (medium or hard bots, places 1 to 3) and "Beat your best time",
never on a first finish (L2-039). The recorded ride keeps them, so a repeat answers the same; a
class has neither. In the app, the race or class hands its ride to an outbox on the screens'
parent route, which sends a ride id once and follows it: sending, recorded, waiting offline (sent
again when the browser is back online) or not recorded. Results submits the ride from the
navigation's state too, so after a reload the backend's repeat answer fills the panels. "XP earned"
waits with "Recording your ride…", then shows the total and each line in the order returned;
"Stars on Old Town Criterium" shows "2 of 3 stars" and "+1 new star" only when one was earned; a
solo race reads "New personal best" and "Best before: 27:10", or "You finished" and "Best: 26:38".

- **Film:** [`11-2-xp-stars-and-personal-best.mp4`](11-2-xp-stars-and-personal-best.mp4),
  1920×1080, 30 fps, 2 min, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-074 AC1 to AC4, L2-075 AC1 to AC3, L2-077 AC1, AC3 and AC4, L2-039
  AC1 to AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Results for 2nd of 10 with its XP and stars at 1440 px in a browser, over the aurora | What the ride **earned.** |
| 0:10 | 6 | `xp` | The XP panel: +442 and its five lines | +442, **line by line.** |
| 0:25 | 5 | `stars` | Stars on Old Town Criterium, 2 of 3 and +1 new star, and a class's XP with no stars panel | 2 of 3, **+1 new star.** |
| 0:38 | 5 | `best` | A new personal best of 26:38 with Best before 27:10, its third star, and a slower 27:32 with Best 26:38 | A new best, **or your best.** |
| 0:51 | 6 | `states` | The XP panel recording, offline and not recorded | Recording, **offline, refused.** |
| 1:07 | 5 | `widths` | Results for 2nd of 10 growing from 390 through 768 and 1024 to 1440 px | Below, **then beside.** |
| 1:20 | 4 | `proof` | The local checks, and three cards: what the tests prove | Every star, **every state.** |
| 1:30 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `stars`, a wipe into `best`, a zoom out of `states` and into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. Each Results is opened as a reload finds it, with the backend's answer served by the
  fixture; the XP lines are the mocks'.
- **What the tests prove:** backend acceptance tests through the API (`StarsAndBestTests`, seen
  failing first): a first 2nd of 10 against the medium pack answers 2 of 3 stars, both new, and a
  first best with no previous one; a faster solo race then a new best and the third star; a slower
  one the best kept and no new star; a class neither; and a repeat of a ride id the same stars and
  best after a later ride. `StarRulesTests` checks every case of the star rule, one per row, and
  the best through three finishes. The ride-claims test now checks the stars are the backend's,
  not the body's. The behaviour spec (`results-earned.spec.ts`, seen failing first) races Old Town
  Criterium against bots with the answer held, sees "Recording your ride…", then +415 line by line
  and "+2 new stars"; and, opened as after a reload, a new personal best, a slower solo race, a
  first finish, a class with no stars panel, the offline note filling once the browser is back
  online, and a refused ride. `SessionRideOutbox` and `resultsView()` have unit tests for every
  state. All 174 behaviour specs, the 1332 unit tests, the 272 backend tests and every check pass.
- Not shown, because not built here: the unlock card (slice 11.3), the new level beside the XP when
  a ride levels up (L2-038 AC3, no mock yet), keeping rides on the device across a closed tab
  (L2-135), and the group class's board (the multiplayer slices).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/11-2-xp-stars-and-personal-best
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/11-2-xp-stars-and-personal-best
node tools/video-build/build.mjs docs/videos/11-2-xp-stars-and-personal-best --crf 25
```
