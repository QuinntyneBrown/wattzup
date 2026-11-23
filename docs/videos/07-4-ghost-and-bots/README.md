# Slice 7.4 · Ghost and bots

The race's opponents (L2-060, L2-059 AC1, AC4 and AC5, L2-067 AC1, AC2 and AC4, L2-050 AC4). A
bots race runs nine bots at the pack strength's pace, each with its own seeded drift and swing, so
the same map and pack ride the same way. Each tick ranks the field with the rider: the standings
board, from md up, lists the ten by place with each bot's gap to the rider in seconds and the
rider's row current; the power panel reads the place, "5th / 10", with the gaps to the riders
either side. When places swap the board reorders at most once a second and each row slides over
150 ms, without the slide under reduced motion. A solo race is the rider against the ghost of
their best on the map, "You vs your best", and the panel reads "Ahead" or "Behind" with the
ghost's gap as "Best"; until rides are recorded (10.1) and a best's trace kept (11.2), the ghost
rides the medium pace, 190 W. Bots and the ghost run in the browser, so with the catalogue kept on
the device a race starts and rides without a network.

- **Film:** [`07-4-ghost-and-bots.mp4`](07-4-ghost-and-bots.mp4), 1920×1080, 30 fps, 2 min 14 s,
  H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-060 AC1 to AC5, L2-059 AC1, AC4 and AC5, L2-067 AC1, AC2 and AC4,
  L2-050 AC4, L2-135 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The bots race at 1440 px in a browser window over the aurora | Nine bots, **and your ghost.** |
| 0:10 | 4 | `pack` | The bot pace model: the pack's base, drift, swing and seed | A pack, **paced and seeded.** |
| 0:20 | 4 | `board` | A close-up of the standings board, ten riders by place | Ten riders, **by place.** |
| 0:30 | 4 | `place` | A close-up of the power panel: 5th of 10, the gaps either side | 5th of 10, **gaps either side.** |
| 0:41 | 4 | `slide` | The board reordering on the race's tick, rows sliding | Places swap, **rows slide.** |
| 0:51 | 4 | `ghost` | A close-up of the solo board, You vs your best | You, **against your best.** |
| 1:01 | 4 | `behind` | A close-up of the power panel: Behind, Best +0:21 | Ahead **or behind.** |
| 1:12 | 4 | `offline` | The backend out of reach, and the race from the kept catalogue | No network, **still a race.** |
| 1:22 | 4 | `shell` | The bots race growing from 390 through 768 and 1024 to 1440 px, and on a phone | The board, **from a tablet up.** |
| 1:32 | 4 | `proof` | The local checks, and two cards: what the tests prove | Through the page, **all green.** |
| 1:43 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `board`, `place` and `ghost`, a signal wipe into `behind`, and a zoom
through the `offline` scene into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The fake Bluetooth plays the bike: a warm-up at 90 rpm on level 10 (the pack's pace)
  for the bots race, 80 rpm on level 8 for the solo race, then the first effort at 87 rpm on
  level 24. The API fixture serves the map catalogue, so no request leaves the machine.
  Playwright's clock moves the race, stepping one frame at a time while a shot is taken.
- The terminals and cards are drawn from the specs, the design and the code; the `slide`
  terminal illustrates a swap rather than replaying one.
- **What the tests prove:** seven behaviour specs (`race-bots.spec.ts`, `race-ghost.spec.ts`,
  `race-board-motion.spec.ts`, `race-offline.spec.ts`) and the board's place in
  `race-layout.spec.ts` cover the slice's criteria, each seen failing, or failing under a
  mutation where the code it needed was already there; unit tests cover the seeded random, the
  pace model, the pack, the ghost's replay and the standings and gaps. All 89 behaviour specs, the
  58 backend tests, the 361 unit tests and every check pass, and the initial bundle is unchanged
  at 284.48 kB of its 288 kB budget.
- Not shown, because not built here: a recorded best and its trace (slices 10.1 and 11.2), riders
  online and the backend's bot pace (journey 15), Leave, Pause, End and the finish (slice 7.5),
  and the drawn world (journey 8).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/07-4-ghost-and-bots
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/07-4-ghost-and-bots
node tools/video-build/build.mjs docs/videos/07-4-ghost-and-bots --crf 23
```
