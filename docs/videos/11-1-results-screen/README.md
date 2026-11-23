# Slice 11.1 · Results screen

Results opens when a race or class ends (L2-073, L2-078, L2-079). The race hands it the map's name
and the final standings: every rider with a finish time, the second they crossed the line or, for
one still riding, the rider's time plus their gap. The class hands it its title, length, output and
share on target. Until the outbox keeps finished rides (L2-135), the result travels in the
navigation's history state, which a reload keeps; Results with no result sends the rider Home.
Against bots it reads "You finished", the place in volt on the podium, "of 10" and "26:38 · on the
podium" or "27:32 · 18 s off the podium", over the "Final standings" list with the rider's row
`aria-current="true"` and each bot marked by an icon named "Bot". A solo race shows the time; a
solo class "30:00" and "342 kJ · 84% on target". "Done" goes Home; "Race it again" opens Race Setup
with the same mode and pack preselected; "Ride it again" opens Class Start.

- **Film:** [`11-1-results-screen.mp4`](11-1-results-screen.mp4), 1920×1080, 30 fps, 1 min 56 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it
  for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-073 AC1 to AC3, L2-078 AC1, L2-079 AC1.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Results for a bots race, 2nd of 10, at 1440 px in a browser, over the aurora | Cross the line, **see where you finished.** |
| 0:10 | 6 | `place` | The result, the top three of the standings and the phone at 390 px | 2nd of 10, **on the podium.** |
| 0:25 | 5 | `widths` | Results for 2nd of 10 growing from 390 through 768 and 1024 to 1440 px | One column, **then two from 1024.** |
| 0:38 | 5 | `off` | Results for 6th of 10 in a browser | 6th, **18 s off the podium.** |
| 0:51 | 5 | `solo` | A solo race's 26:38 and a solo class's 30:00 with its kJ and share on target | Your time, **or your class.** |
| 1:04 | 4 | `next` | Done and Race it again, and where each action goes | Done, **or again.** |
| 1:15 | 4 | `proof` | The local checks, and three cards: what the tests prove | Real rides, **every line.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `widths`, a wipe into `off`, a zoom through `solo` and into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density.
  Each result is set in the navigation's state as a finished ride leaves it, with the mocks' field,
  and the page reloaded, which keeps it.
- **What the tests prove:** the behaviour spec (`results.spec.ts`, seen failing first) races Old
  Town Criterium, served 0.5 km long, against bots to 1st of 10 on the podium over ten standings in
  time order, the rider's row current and every other row marked Bot; waits two minutes so every bot
  finishes first and reads 10th with the seconds off 3rd; races solo and reads the time, then Done
  goes Home; rides 30 Minute HIIT Cardio to its end and reads its time, kJ and share on target, then
  Ride it again opens Class Start; Race it again opens Race Setup with Bots and medium, and Race
  Setup preselects `?mode=bots&pack=hard` and `?mode=solo` (seen failing first without the change);
  and Results with no ride goes Home. Unit tests check every line of `resultsView()` (2nd and 6th
  of 10, a solo race, a solo class, an hour) and the final standings' finish times. The race-finish
  and class-finish specs now see Results instead of Page not found. All 167 behaviour specs, the
  1318 unit tests, the 257 backend tests and every check pass.
- Not shown, because not built here: the personal best, XP and stars (slice 11.2), the unlock card
  (11.3), "· Live race" and the group class's standings (the multiplayer slices), and Full screen
  (24.2).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/11-1-results-screen
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/11-1-results-screen
node tools/video-build/build.mjs docs/videos/11-1-results-screen --crf 25
```
