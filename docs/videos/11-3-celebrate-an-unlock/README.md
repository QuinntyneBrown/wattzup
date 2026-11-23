# Slice 11.3 · Celebrate an unlock

Opening a map is the biggest reward in Telo Ride's progression, and the one moment the app
celebrates with motion (L2-076, L1-013). The backend decides: `UnlockRules` gives the maps a
recorded ride opens, in unlock order, a locked map not yet opened whose goal the ride meets. A
top-3 finish against bots on its map at any pack, the stars held on its map, or rider level 10
after the ride, a class included (L2-040 AC2 to AC4). The handler opens each on the rider's map
progress (`OpenedAt`) and names the first as `openedMapId`, kept on the recorded ride so a repeat
answers the same (AC5). When the answer names a map, Results reads the catalogue, only then, and
shows a gold card first in "What you earned": "Neon Docklands is open", "A harbour city after
dark." and a gold "Ride Neon Docklands" link to Race Setup for it. The card fades in and scales
from 0.96 over 250 ms after 200 ms, and its photo comes from grey at half brightness into colour
over 250 ms after 350 ms; under reduced motion only the card fades. With nothing opened there is
no card.

- **Film:** [`11-3-celebrate-an-unlock.mp4`](11-3-celebrate-an-unlock.mp4), 1920×1080, 30 fps,
  1 min 58 s, H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt)
  is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-076 AC1 to AC3, L2-040 AC2 to AC5.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Results for 2nd of 10 with Neon Docklands open at 1440 px in a browser, over the aurora | A new map, **celebrated.** |
| 0:10 | 5 | `card` | The gold card: Neon Docklands is open, A harbour city after dark., Ride Neon Docklands | Neon Docklands **is open.** |
| 0:23 | 6 | `motion` | The card held at 300, 450 and 650 ms: fading in, its photo grey, then in colour | Fade, grow, **then colour.** |
| 0:38 | 6 | `rules` | Three cards: which goal opens which map | The backend **decides.** |
| 0:54 | 4 | `none` | What was earned with no map opened: no card | Nothing opened, **no card.** |
| 1:04 | 5 | `widths` | Results with the card growing from 390 through 768 and 1024 to 1440 px | First in **what you earned.** |
| 1:17 | 4 | `proof` | The local checks, and three cards: what the tests prove | Every rule, **every frame.** |
| 1:27 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `motion`, a wipe into `rules`, a zoom out of `none` and into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. Each Results is opened as a reload finds it, with the backend's answer and the map
  catalogue served by the fixture. The entrance frames play the card's animation again with full
  motion and hold it at 300, 450 and 650 ms.
- **What the tests prove:** backend acceptance tests through the API (`UnlocksTests`, seen
  failing first): 2nd of 10 against bots on Old Town Criterium answers `neon-docklands`, the same
  finish again `null`, and a repeat of the first ride id `neon-docklands` again; 4th place and a
  class below level 10 answer `null`; a class that takes the rider from 3,700 XP to level 10
  answers `vice-city`. `UnlockRulesTests` checks every unlock rule, one case per row (13 rows).
  The behaviour spec (`results-unlock.spec.ts`, seen failing first) shows the card's three lines
  and its link to `/race/neon-docklands`; reads the card's and photo's animations, 250 ms after
  200 ms changing opacity and scale and 250 ms after 350 ms changing the filter, then under
  reduced motion only the card's opacity; and shows no card when nothing opened, without asking
  for the catalogue. `resultsView()` has unit tests for the card, none, and a map not yet known.
  All 177 behaviour specs, the 1335 unit tests, the 288 backend tests and every check pass, and
  the initial bundle stays at 300.19 kB.
- Not shown, because not built here: Race Setup opening for the map just opened. Its guard still
  reads the `NewRiderProgress` stand-in, so the link leads to Map Select until slice 12.1 reads
  the open maps from the backend (the design's open questions). Also not shown: Home's unlock
  banner (L2-036, slice 12.1).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/11-3-celebrate-an-unlock
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/11-3-celebrate-an-unlock
node tools/video-build/build.mjs docs/videos/11-3-celebrate-an-unlock --crf 25
```
