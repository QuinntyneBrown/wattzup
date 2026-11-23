# Slice 3.2 · Show live metrics

A live number is gone in a second, so Telo Ride now keeps the ride's totals (L2-022, L2-023). Each running
second adds the speed in km/h ÷ 3600 to distance and the power ÷ 1000 to output in kJ; a paused ride has
no running seconds, so its totals hold. Average power is output over running seconds, and energy follows
from it: 208 W for 760 s is 157 kcal. Every readout shows its value to fixed decimals, or "—" when it is
unknown, and distance with two decimals in km ("2.24 km"). The readouts themselves are drawn by the
screens that host them (the class ride's tiles in 5.2, the race power panel in 7.3, the custom ride's
dashboard in 21.3), and slice 5.1's ride clock ticks the totals.

- **Film:** [`03-2-show-live-metrics.mp4`](03-2-show-live-metrics.mp4), 1920×1080,
  30 fps, 2 min 25 s, H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt)
  is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-020 AC5, L2-022 AC2 to AC4, L2-023 AC2, AC4 and AC5, L2-024.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home with the bike streaming in a browser window, over the aurora | Every second, **kept.** |
| 0:10 | 4 | `distance` | Distance after 1, 600 and 3600 s at 30 km/h | Speed becomes **distance.** |
| 0:21 | 4 | `paused` | What a pause does, as cards | Paused? **Nothing grows.** |
| 0:31 | 4 | `output` | Output after 10 s at 200 W and 1 s at 300 W | Power becomes **output.** |
| 0:41 | 4 | `energy` | The energy formula, worked | Work becomes **energy.** |
| 0:52 | 4 | `unknown` | `formatMetric` and `formatDistance`, worked | Unknown? **A dash.** |
| 1:02 | 4 | `shared` | One source feeding the three readout families, drawn | One source, **three screens.** |
| 1:12 | 4 | `simulated` | A minute on the simulated bike, from frames to totals | A minute **on the simulator.** |
| 1:23 | 4 | `deferred` | What slices 5.1, 5.2 and 3.3 bring | The ride screens **show them.** |
| 1:33 | 4 | `shell` | Home growing from 390 through 768 and 1024 to 1440 px, Connect Bike on a phone | Every width, **the same Home.** |
| 1:43 | 4 | `proof` | The two local test runs, and two cards: what the tests prove | Twenty new, **all green.** |
| 1:54 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `paused`, `energy` and `simulated`, a signal wipe into `shared`, and a zoom
through the `deferred` cards into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared
  fixture and page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density. The
  fixture's fake Bluetooth stands in for the bike. Home looks the same as in slice 3.1: the first screen
  to show readouts and totals is slice 5.2's Class Ride, which brings the Playwright proof.
- The sums, formulas and formats are the cases of the unit tests `domain/src/engine/ride-totals.spec.ts`,
  `domain/src/engine/energy-model.spec.ts` and `components/src/metric/format-metric.spec.ts` under
  `frontend/projects/`; the diagram and cards are drawn.
- **What the tests prove:** twenty new unit tests, one case per row of L2-022 AC2 to AC4 and L2-023 AC4
  and AC5, with `RideTotals` also run end to end on the simulated bike; 156 unit tests and the thirty
  behaviour specs all pass.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/03-2-show-live-metrics
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/03-2-show-live-metrics
node tools/video-build/build.mjs docs/videos/03-2-show-live-metrics --crf 23
```
