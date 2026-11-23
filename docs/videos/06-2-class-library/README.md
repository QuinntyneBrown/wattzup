# Slice 6.2 · Class library

The Class Library at `/classes` (L2-081, L2-082). It reads "Classes" and its lead, then one
shelf per length band (20 min, 30 min, 60 min endurance) with its tagline, holding the
catalogue's classes in order. An open card links to its Class Start and shows the cover, the
length, a resistance profile drawn from the plan, the title and "{channel} · {focus}"; it
shows no group chip until group sessions can be read (journey 14). The Class length tabs show
one shelf or all of them, by pointer or by the arrow keys, Home and End. The rider level comes
from `PROGRESS_API`; until the backend keeps progress (journey 10) every rider is a new rider at
level 1, so Tempo Paceline reads "Opens at level 5", Vice City Pyramid and Dolomites Endurance
"Opens at level 10" and Coastal Endurance + Surges "Opens at level 20". A locked card is a
button with `aria-disabled="true"` that stays focusable and leads nowhere. With no catalogue to
read and none kept, the library says so and offers Try again.

- **Film:** [`06-2-class-library.mp4`](06-2-class-library.mp4), 1920×1080, 30 fps, 2 min 25 s,
  H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-080 AC1, L2-081 AC1 to AC4, AC6 and AC7, L2-082 AC2 and AC3,
  L2-043 AC2.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The library at 1440 px in a browser window over the aurora | Every class, **one shelf away.** |
| 0:10 | 4 | `head` | The library's head and its first shelf | Classes, **either way.** |
| 0:21 | 4 | `shelves` | Three cards, one per shelf, and the library at 1024 px | Three shelves, **by length.** |
| 0:31 | 4 | `card` | A close-up of 30 Minute HIIT Cardio's card | One card, **the whole class.** |
| 0:41 | 4 | `link` | An open card's link, cover and missing chip | Open, **it leads on.** |
| 0:52 | 4 | `tabs` | The 30 min tab chosen, and a close-up of the tabs after an arrow key | One length, **or all.** |
| 1:02 | 4 | `locked` | Three cards of levels and a close-up of a locked card | Locked, **and says why.** |
| 1:12 | 4 | `focus` | A locked card's button, name and Enter | Locked, **still heard.** |
| 1:23 | 4 | `unavailable` | The library with no catalogue, and a close-up of the warning | Nothing kept, **try again.** |
| 1:33 | 4 | `shell` | The library growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **one to three.** |
| 1:43 | 4 | `proof` | The local checks, and two cards: what the tests prove | Through the page, **all green.** |
| 1:54 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `shelves`, `link` and `locked`, a signal wipe into `link`, and a zoom
through the `unavailable` scene into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The API fixture serves the catalogue (or 503 for the unavailable state); the YouTube
  fixture serves the mocks' covers by video id in place of YouTube's thumbnails, so no request
  leaves the machine. In the running app, the six classes with stand-in videos show those
  videos' thumbnails (ADR 0028).
- The terminals and cards are drawn from the specs and the code.
- **What the tests prove:** five behaviour specs (`class-library.spec.ts`,
  `class-library-unavailable.spec.ts`) cover ten acceptance criteria; all 49 behaviour specs, the
  unit tests and every check pass, and the initial bundle is 284.42 kB of its 288 kB budget.
- Not shown, because not built here: the group chip (journey 14), the mid rider's locks of
  L2-082 AC1 (journeys 10 and 12), and the redirect from a locked class's address (slice 6.3).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/06-2-class-library
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/06-2-class-library
node tools/video-build/build.mjs docs/videos/06-2-class-library --crf 23
```
