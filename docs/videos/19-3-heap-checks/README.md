# Slice 19.3 · Heap checks

Leaving a screen returns its memory, and a long ride's memory stays flat (L2-138 AC1). The slice adds the first sweep,
three heap checks under `frontend/e2e/heap/`, run with `npm run heap` through their own Playwright config and only when
a person asks: never by verify, CI or an agent (AGENTS.md). Each forces a garbage collection and reads the used heap
through the Chrome DevTools Protocol, and fails naming both readings. The race with its 3D world, and a class ride, are
each entered and left six times in one page, and may grow the heap by at most 5 MB after the first round; a three-hour
class ridden second by second may grow it by at most 50 MB from its first minute to its last.

- **Film:** [`19-3-heap-checks.mp4`](19-3-heap-checks.mp4), 1920×1080, 30 fps, 1 min 41 s, H.264 at CRF 25 and AAC.
  No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-138 AC1.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The solo race drawing its world at 1440 px in a browser, over the aurora | Leave a screen, **free its memory.** |
| 0:10 | 5 | `measure` | The three checks as Playwright lists them, beside the race | Collect, then **read the heap.** |
| 0:23 | 5 | `budget` | Three facts about the race's rounds, beside Race Setup once the race is left | Six rounds, **at most 5 MB.** |
| 0:36 | 5 | `world` | Class Start once the class ride is left, and the class and long-ride limits | The class too, **and three hours.** |
| 0:49 | 4 | `widths` | The class ride growing from 390 through 768 and 1024 to 1440 px | In and out, **at every width.** |
| 0:59 | 4 | `proof` | The local checks, and three cards: what this slice adds | Proof on **request.** |
| 1:09 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `budget`, a wipe into `world`, a zoom into `widths`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density: the screens the heap checks enter
  and leave. They are not the heap checks, which no agent runs.
- **What this slice adds:** `enter-and-leave.heap.ts` (2 checks) and `long-ride.heap.ts` (1 check), with
  `playwright.heap.config.ts` and `e2e/heap/heap.ts`. They are type-checked, linted and listed, and built only from
  flows the behaviour specs prove; filming those flows caught that a solo race's leave link is End ride, which the
  race check now uses. Their first run, and the thresholds it confirms, are a person's. All 278 behaviour specs, the
  1585 unit tests, the 459 backend tests and every check pass, with no heap check among them.
- Not shown, because deferred: Web Vitals and the frame budget on reference devices (slice 19.4).
