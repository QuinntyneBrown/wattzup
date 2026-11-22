# Slice 21.2 · Preview a custom workout

"Your ride" beside Custom workout's settings (L2-099, L2-100): the total, the resistance profile from 0:00 to the total
and the facts. GCN 30-min HIIT with a 5:00 warm-up and 6:00 cool-down expands to 17 segments of 30:00 and reads "8 ×
0:30 · 3:00 → 1:30 recover", 4:00 under load, Level 24, ~154 W and ~276 kcal; flat at level 12 for 30 min at 85 rpm
reads "Level 12 throughout", Level 12, ~205 W and ~367 kcal. Every change shows at once. Ride along to a video (L2-098)
parks a YouTube preview at the offset; "Use video's current time" takes its time, "Check" seeks to it, the offset nudges
by half a second, and a link that is not YouTube's is marked invalid. The preview's Video reads "Synced from 0:12.0",
"Off" or "Link needed".

- **Film:** [`21-2-preview-a-custom-workout.mp4`](21-2-preview-a-custom-workout.mp4), 1920×1080, 30 fps, 1 min 54 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-098 AC1 to AC5; L2-099 AC1, AC2, AC3, AC5; L2-100 AC1.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Custom workout with Your ride at 1440 px, in a browser over the aurora | Know the ride **before it starts.** |
| 0:10 | 5 | `total` | Your ride for GCN 30-min HIIT, and two facts | 30:00, **at a glance.** |
| 0:23 | 5 | `facts` | Your ride, and what the unit tests checked | ~154 W, **~276 kcal.** |
| 0:36 | 4 | `follows` | Your ride after round 1 is removed, and one fact | Every change, **at once.** |
| 0:46 | 4 | `flat` | Your ride for flat resistance, and two facts | Level 12, **throughout.** |
| 0:56 | 6 | `video` | The video section synced at 0:12.0, a link that is not YouTube's, and three facts | Synced from **0:12.0.** |
| 1:12 | 4 | `widths` | Custom workout growing from 390 through 768 and 1024 to 1440 px | Your ride, **at every width.** |
| 1:22 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `facts`, a wipe into `flat`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, through the flows of `e2e/custom-workout-preview.spec.ts` and
  `e2e/custom-workout-video.spec.ts`. The YouTube player is the fixture's stand-in, so its frame is black. The `facts`
  terminal's lines are what the plan's unit tests check.
- **What this slice adds:** `VideoSettings` in `api`; `expandCustomWorkout`, `validatePlan`, `customWorkoutPreview` and
  the video link's rules in `domain`; the `PlanPreview`, `VideoSync` and `VideoFrame` components and `ClassProfile`'s
  `xl` size; the store's plan, preview and video, and `VideoPreviewPlayer`. Its 6 acceptance tests, its unit tests,
  every behaviour spec, unit test and backend test, and every check pass.
- Not shown: Start ride and saving the workout (L2-099 AC4), and the refusal of an invalid plan at Start ride, which
  come with the ride in slice 21.3; the rules are unit-tested here.
