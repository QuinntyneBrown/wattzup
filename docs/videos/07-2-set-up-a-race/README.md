# Slice 7.2 · Set up a race

Race Setup at `/race/:mapId` (L2-047 to L2-050), with its own header: the small lockup and
"Maps" back to Map Select. The map column shows the map's 21:9 photo, its name and route line
("Route 9 Wind Farm · Open farmland at golden hour"), Distance, Climbing and Rated (Your best
joins them once the rider has one) and "Stars here" with its three rules, an earned one struck
through with the hidden text " (earned)". The ride column opens with the gold goal line on the
map that holds the next unlock ("Finish top 3 vs Bots on Prairie Paceline to open Cliffside
Coast."), then "Race against": a "Race mode" radio group of Your best time, Bots (chosen) and
Riders online, locked with "Opens at level 3."; against bots, "Pack strength" (easy, medium,
hard) with its note; and the start button. "Go to the start line" opens the race with the bots
and the chosen pack; "Start ride" opens it solo, at once. A locked map's address opens Map
Select. Until the backend keeps progress (journey 10) every rider is a new rider.

- **Film:** [`07-2-set-up-a-race.mp4`](07-2-set-up-a-race.mp4), 1920×1080, 30 fps, 2 min 25 s,
  H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-047 AC1 to AC6, L2-048 AC1, AC2 and AC4, L2-049 AC1 to AC3,
  L2-050 AC1 and AC2, L2-039.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Race Setup at 1440 px in a browser window over the aurora | Your map, **your rivals.** |
| 0:10 | 4 | `head` | Race Setup on Prairie Paceline, with its facts | The map, **in three facts.** |
| 0:20 | 4 | `stars` | A close-up of "Stars here" | Stars here, **three rules.** |
| 0:30 | 4 | `goal` | A close-up of the gold goal line | Your next unlock, **in gold.** |
| 0:41 | 4 | `modes` | The three modes, and a close-up of "Race mode" | Race against **whom?** |
| 0:51 | 4 | `keys` | The radio group and what the arrow keys do | One group, **the arrow keys.** |
| 1:01 | 4 | `pack` | The three strengths, and a close-up of the pack with hard chosen | Pack strength, **their pace.** |
| 1:12 | 4 | `start` | The route each start button opens | One button, **two starts.** |
| 1:22 | 4 | `locked` | What `openMapGuard` does with an open, a locked and an unknown map | Locked, **back to Maps.** |
| 1:32 | 4 | `shell` | Race Setup growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **one setup.** |
| 1:43 | 4 | `proof` | The local checks, and two cards: what the tests prove | Through the page, **all green.** |
| 1:53 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `stars`, `goal` and `pack`, a signal wipe into `start`, and a zoom
through the `locked` scene into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The API fixture serves the map catalogue, so no request leaves the machine. The
  close-ups are taken at 390 px, where each block fills the width.
- The terminals and cards are drawn from the specs and the code.
- **What the tests prove:** nine behaviour specs (`race-setup.spec.ts`,
  `race-setup-locked.spec.ts`) cover thirteen acceptance criteria; the backend's acceptance tests
  read each map's photo and the map its goal is earned on through the API; unit tests cover
  `RaceStartPlanner`'s table and the arrow keys' `radioStep`. All 72 behaviour specs, the 57
  backend tests, the unit tests and every check pass, and the initial bundle is 284.48 kB of its
  288 kB budget.
- Not shown, because not built here: the race behind each start (slice 7.3), the lobby between
  Bots and the race (slice 15.1), Riders online's queue count and "Find a race" (journey 15), and
  a best or earned stars, which need the progress the backend keeps (journey 10).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/07-2-set-up-a-race
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/07-2-set-up-a-race
node tools/video-build/build.mjs docs/videos/07-2-set-up-a-race --crf 23
```
