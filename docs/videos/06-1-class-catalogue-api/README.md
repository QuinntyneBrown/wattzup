# Slice 6.1 · Class catalogue API

The class catalogue now comes from the backend (L2-080). `GET /api/classes` serves the shelves and
the seven classes of L2-080 AC1 in order, each with its channel, focus, length, opening level,
summary, world, YouTube video, sync offset and plan; `GET /api/classes/{id}` serves one, and an id
it does not hold is 404 `class_not_found`. Both are public, by an explicit `[AllowAnonymous]`.
`ClassPlanRules` leaves out a class whose level is outside 1 to 32, whose plan does not total its
length, or whose video id is not a YouTube id. The catalogue is `Catalogue/classes.json`, embedded
in the backend and read once through `IClassCatalogue` (ADR 0028). In the app, `CachedClassesApi`
keeps every catalogue it is served in `localStorage`, and the class ride finds its class there, so a
solo class starts when the backend cannot be reached (L2-135 AC3). The Class Library screen is
slice 6.2.

- **Film:** [`06-1-class-catalogue-api.mp4`](06-1-class-catalogue-api.mp4), 1920×1080, 30 fps,
  2 min 25 s, H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-080 AC1 to AC5, L2-081 AC3 (the shelves), L2-135 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The class ride opened from the kept catalogue, in a browser window over the aurora | Served once, **kept close.** |
| 0:10 | 4 | `seven` | The seven classes as `GET /api/classes` lists them | Seven classes, **in order.** |
| 0:21 | 4 | `every` | Three cards and a close-up of the segment card drawn from the served plan | Every class, **complete.** |
| 0:31 | 4 | `rules` | Four rows of `ClassPlanRules`' table | Break a rule, **left out.** |
| 0:41 | 4 | `one` | One class by its id, an unknown id and a class left out | One class, **by its id.** |
| 0:52 | 4 | `public` | The catalogue without a session, and everything else | Open to **every rider.** |
| 1:02 | 4 | `file` | `classes.json` to `IClassCatalogue` to `GET /api/classes`, drawn | A file, **read once.** |
| 1:12 | 4 | `kept` | The class ride to `CachedClassesApi` to `localStorage`, drawn | Kept on **the device.** |
| 1:23 | 4 | `offline` | Three cards and the class ride opened with the backend answering 503 | No backend, **still riding.** |
| 1:33 | 4 | `shell` | That ride growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **no backend.** |
| 1:43 | 4 | `proof` | The three local test runs, and two cards: what the tests prove | Through the API, **all green.** |
| 1:54 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `every`, `rules` and `file`, a signal wipe into `rules`, and a zoom through
the `offline` scene into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared
  fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density. The
  API fixture serves the catalogue once and then answers 503, and the page is reloaded, so the ride in
  every picture was opened from the catalogue the app kept, as `e2e/class-catalogue.spec.ts` does.
- The listing, the rule rows and the answers by id come from the backend's acceptance tests
  (`ClassCatalogueTests`, `InvalidClassTests`, `ClassPlanRulesTests`); the diagrams and cards are drawn.
- **What the tests prove:** eight new acceptance tests through the API and twelve rule cases, one new
  behaviour spec and six unit cases; every backend test, the 44 behaviour specs and 259 unit tests
  pass. No real backend, database or network is used in a test or in the film.
- Six of the seven classes play GCN Training stand-in videos until their own are published (ADR 0028);
  the film shows only 30 Minute HIIT Cardio, whose video is its own.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/06-1-class-catalogue-api
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/06-1-class-catalogue-api
node tools/video-build/build.mjs docs/videos/06-1-class-catalogue-api --crf 23
```
