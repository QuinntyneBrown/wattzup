# Slice 7.1 · Browse maps

Map Select at `/race` (L2-046, L2-045, L2-040 AC1 and AC6, L2-041 AC1). It reads "Maps" and
"Each map opens the next. Race well on the ones you have to unlock the rest." above the unlock
path of every map in unlock order, beside "Stars on every map". The backend serves the
catalogue from an embedded file, public and kept on the device (ADR 0029), and writes each
locked map's goal from its rule. Until the backend keeps progress (journey 10) every rider is a
new rider: Prairie Paceline and Old Town Criterium are open, linked to Race Setup with their
thumbnail, "18.4 km · 90 m climbing · Easy" and "0 of 3 stars"; Cliffside Coast, the next
unlock, is a disabled button ringed gold with its facts and "Finish top 3 vs Bots on Prairie
Paceline"; the rest are disabled buttons, greyed with a lock and their goal. Hidden text says
", locked" or ", locked, your next unlock". With no catalogue to read and none kept, Map
Select says so and offers Try again.

- **Film:** [`07-1-browse-maps.mp4`](07-1-browse-maps.mp4), 1920×1080, 30 fps, 2 min 25 s,
  H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-045 AC1, L2-046 AC1 to AC5 and AC7, L2-040 AC1 and AC6, L2-041 AC1,
  L2-039, L2-135 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Map Select at 1440 px in a browser window over the aurora | Every map, **one path.** |
| 0:10 | 4 | `head` | Map Select and the new rider's two open maps | Each map **opens the next.** |
| 0:20 | 4 | `catalogue` | The seven maps `GET /api/maps` serves without sign-in | Seven maps, **one file.** |
| 0:30 | 4 | `open` | A close-up of Prairie Paceline's row | Open, **it leads on.** |
| 0:41 | 4 | `next` | A close-up of Cliffside Coast, the next unlock | Next, **ringed gold.** |
| 0:51 | 4 | `locked` | Three goals and a close-up of a locked row | Locked, **one goal each.** |
| 1:01 | 4 | `heard` | What a screen reader hears for an open, a next and a locked map | Locked, **in words.** |
| 1:12 | 4 | `aside` | A close-up of "Stars on every map" | Three stars, **every map.** |
| 1:22 | 4 | `offline` | Map Select with no catalogue, and a close-up of the warning | Kept, **or try again.** |
| 1:32 | 4 | `shell` | Map Select growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **one path.** |
| 1:43 | 4 | `proof` | The local checks, and two cards: what the tests prove | Through the page, **all green.** |
| 1:53 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `catalogue`, `open` and `next`, a signal wipe into `catalogue`, and a
zoom through the `offline` scene into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The API fixture serves the map catalogue (or 503 for the unavailable state), so no
  request leaves the machine. The row close-ups are taken at 390 px, where a row fills the width.
- The terminals and cards are drawn from the specs and the code.
- **What the tests prove:** seven behaviour specs (`map-select.spec.ts`,
  `map-select-offline.spec.ts`) cover eleven acceptance criteria; the backend's acceptance tests
  read the catalogue through the API and a table checks each goal; four unit tests cover the
  kept catalogue. All 63 behaviour specs, the 56 backend tests, the unit tests and every check
  pass, and the initial bundle is 284.44 kB of its 288 kB budget.
- Not shown, because not built here: stars earned, best times and the mid rider's and veteran's
  paths, which need the progress the backend keeps (journeys 10 to 12), and Race Setup behind
  each open map (slice 7.2).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/07-1-browse-maps
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/07-1-browse-maps
node tools/video-build/build.mjs docs/videos/07-1-browse-maps --crf 23
```
