# Slice 7.5 · Finish, pause or leave a race

How a race ends, or doesn't (L2-068 to L2-071). A bots race's bar has Leave and no Pause; a solo
race's has Pause and End. Leave and End open Race Setup at once, with no confirmation, and submit
nothing. Pause holds a solo race's clock, distance and standings under "Paused on Cathedral
Circuit", a status card that blocks no button; Resume, or pedalling again once the rider has
stopped, carries it on. When the bike stops answering in a bots race, "Lost the bike" says so
with Reconnect, and the rider coasts, the speed falling to a stop over 15 seconds with Raise and
Lower off; a bike back in time carries the race on, and otherwise it ends as a DNF, "Did not
finish", with Back to Race Setup. A solo race parks until the bike is back. The finish line is
the map's distance: the finish time is the race clock, the place is where the rider crossed, and
Results opens with the race's result. Past the plan's end its last level holds until the line.

- **Film:** [`07-5-finish-pause-or-leave-a-race.mp4`](07-5-finish-pause-or-leave-a-race.mp4), 1920×1080, 30 fps, 2 min 14 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-068 AC1 to AC3, L2-069 AC1 and AC2, L2-070 AC1 to AC5, L2-071 AC1
  and AC2, L2-072 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | A paused solo race at 1440 px in a browser window over the aurora | Go to the line, **or not.** |
| 0:10 | 4 | `bar` | The bar's controls at 768 px: Leave in a bots race, Pause and End solo | Leave or End, **no questions.** |
| 0:20 | 4 | `pause` | A solo race paused at 1:00 under its status card | Paused, **held still.** |
| 0:30 | 4 | `pedal` | What carries a paused race on: Resume, or pedalling after a stop | Resume, **or just pedal.** |
| 0:41 | 4 | `lost` | A bots race with the bike lost: the alert, Reconnect, the coast | Lost the bike, **coasting.** |
| 0:51 | 4 | `dnf` | Fifteen seconds without the bike: Did not finish, Back to Race Setup | Fifteen seconds, **then a DNF.** |
| 1:01 | 4 | `parked` | A solo race parked by the lost bike | Solo, **parked.** |
| 1:12 | 4 | `finish` | A bots race nearing the line on a 0.5 km course, 1st of 10 | The line, **and your place.** |
| 1:22 | 4 | `shell` | The paused race growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **one pause.** |
| 1:32 | 4 | `proof` | The local checks, and two cards: what the tests prove | Through the page, **all green.** |
| 1:43 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `pause`, `pedal` and `parked`, a signal wipe into `dnf`, and a zoom
through the `finish` scene into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The fake Bluetooth plays the bike, and drops it for the lost-bike shots; the API
  fixture serves the map catalogue, with Old Town Criterium 0.5 km long for the finish, so no
  request leaves the machine. Playwright's clock moves the race.
- The terminal and cards are drawn from the specs, the design and the code.
- **What the tests prove:** eleven behaviour specs (`race-leave.spec.ts`, `race-pause.spec.ts`,
  `race-lost-bike.spec.ts`, `race-finish.spec.ts` and the bar's 48 px in `race-layout.spec.ts`)
  cover the slice's criteria, each seen failing first or failing under a mutation; unit tests
  cover the coast and the finish line, and the standings' order at the line. All 100 behaviour
  specs, the 58 backend tests, the 374 unit tests and every check pass, and the initial bundle
  is 284.50 kB of its 288 kB budget.
- Not shown, because not built here: the ride's submission (slice 10.1, after sign-in in
  journey 9) and Results itself (slice 11.1), which shows Page not found until then; riders
  online's DNF for the others (journey 15); and the mocks' development-only Finish button.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/07-5-finish-pause-or-leave-a-race
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/07-5-finish-pause-or-leave-a-race
node tools/video-build/build.mjs docs/videos/07-5-finish-pause-or-leave-a-race --crf 25
```
