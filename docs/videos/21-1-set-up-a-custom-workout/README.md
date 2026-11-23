# Slice 21.1 · Set up a custom workout

Custom workout at `/profile/custom` (L2-094 to L2-097): the training header, "Set up your ride" and the training mode.
HIIT intervals starts from GCN 30-min HIIT, eight 0:30 efforts with recoveries from 3:00 down to 1:30, beside Tabata,
40 / 20, Minute on and Long climbs. Each round's effort steps by 0:05 and its recovery by 0:15 within their bounds;
rounds are added, removed and made the same, and the plan then reads edited. Work and recover resistance slide from 1
to 32; warm-up and cool-down step by 1:00. Flat resistance holds one level for a duration at a cadence goal.

- **Film:** [`21-1-set-up-a-custom-workout.mp4`](21-1-set-up-a-custom-workout.mp4), 1920×1080, 30 fps, 1 min 41 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-094 AC1, AC2, AC3; L2-095 AC1 to AC7; L2-096 AC1, AC2; L2-097 AC1, AC2.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Custom workout at 1440 px on GCN 30-min HIIT, in a browser over the aurora | Your ride, **your way.** |
| 0:10 | 5 | `plans` | Tabata chosen, and two facts | GCN 30-min HIIT, **or four more.** |
| 0:23 | 5 | `ladder` | The plans and ladder after round 1's effort went to 0:35 and round 2's recovery to 2:15, and three facts | Every round, **yours.** |
| 0:36 | 4 | `levels` | The level sliders, and what the unit tests checked | Work 24, **recover 6.** |
| 0:46 | 5 | `flat` | Flat resistance at 1440 and 390 px, and two facts | One level, **held.** |
| 0:59 | 4 | `widths` | Custom workout growing from 390 through 768 and 1024 to 1440 px | Custom workout, **at every width.** |
| 1:09 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `ladder`, a wipe into `flat`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, through the flows of `e2e/custom-workout-setup.spec.ts`. The `levels` terminal's
  lines are the bounds the rules' unit tests check.
- **What this slice adds:** `CustomWorkoutDraft` in `api`; the plans, steps and bounds of `engine/custom-workout.ts` in
  `domain`; the `TrainingHeader`, `TrainingClose`, `TrainingModes`, `PresetChips`, `IntervalLadder`, `LevelSlider` and
  `TrainingStepper` components; `CustomWorkoutStore` and the page at `/profile/custom`. Its 5 acceptance tests, 19
  unit tests, every behaviour spec, unit test and backend test, and every check pass.
- Not shown: the "Your ride" preview and Start ride (slice 21.2); the video section, opening from the last saved
  workout, and the ride (slice 21.3).
