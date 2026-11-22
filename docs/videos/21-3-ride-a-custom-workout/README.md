# Slice 21.3 · Ride a custom workout

The custom ride at `/profile/custom/ride` (L2-101 to L2-104): Start ride saves the workout to the account (L2-099 AC4)
and opens the ride, which sends level 8 at once and every interval's level as it starts. At 6:52 of GCN 30-min HIIT it
reads Recover, round 1 of 8, 1:38 left, "Next: Work 0:30 at level 24", and 107 W on a 107 W target at 72 rpm (L2-102).
Power vs. plan draws each interval's target as a block under the rider's watts to 600 W, with ticks every 5:00
(L2-103 AC3); with a video, the YouTube player plays locked to the ride clock at the offset above the plan's progress
strip (L2-103 AC2, L2-088). The aside raises, lowers or picks one of 32 levels until the next interval, and "Sent to
bike" logs every command (L2-028, L2-029). Flat resistance holds level 12 for the whole ride. A plan Telo Ride refuses
leaves Start ride off with its reason (L2-100 AC3), and Custom workout opens on the last workout saved (L2-094 AC3).

- **Film:** [`21-3-ride-a-custom-workout.mp4`](21-3-ride-a-custom-workout.mp4), 1920×1080, 30 fps, 2 min 6 s, H.264
  at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-028; L2-029; L2-094 AC3; L2-099 AC4; L2-100 AC2, AC3; L2-101 AC1, AC2; L2-102 AC1 to
  AC3; L2-103 AC1 to AC3; L2-104.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The custom ride at 6:52 at 1440 px, in a browser over the aurora | The plan **takes the bike.** |
| 0:10 | 5 | `interval` | The readouts and interval card close up, and three facts | Recover, **round 1 of 8.** |
| 0:23 | 5 | `trace` | Power vs. plan close up, and what the specs checked | Power **against the plan.** |
| 0:36 | 5 | `video` | The ride with its video at 6:52, and three facts | In sync, **at your offset.** |
| 0:49 | 5 | `control` | The bike control after level 20 is picked, and Sent to bike | Yours, **until the next interval.** |
| 1:02 | 4 | `flat` | The flat ride at level 12, and two facts | Level 12, **the whole ride.** |
| 1:12 | 5 | `saved` | Start ride off under a 0:05 plan, and the save's answers | Saved **for next time.** |
| 1:25 | 4 | `widths` | The custom ride growing from 390 through 768 and 1024 to 1440 px | The custom ride, **at every width.** |
| 1:35 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `trace`, a wipe into `control`, a push into `saved`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, through the flows of `e2e/custom-ride*.spec.ts` and
  `e2e/custom-workout-save.spec.ts`, on the fake bike and a paused clock. The YouTube player is the fixture's stand-in.
  The bike control reads 6 after level 20 is picked because the fake bike does not report the new level back; the
  level is the bike's reported resistance. Its "ack 0ms" is the fake's instant answer.
- **What this slice adds:** the ride's components in `components` (header, readouts, interval card, Power vs. plan,
  progress strip, video, metrics, bike control); `PowerTrace`, the sent log, `intervalPlace`, `traceMaxWatts` and
  `restoreCustomWorkout` in `domain`; `CustomWorkoutApi` and its HTTP client in `api`; the ride page and its store; and
  the backend's custom workout (`PUT`/`GET /api/riders/me/custom-workout`, `WorkoutPlanRules`). Its acceptance tests,
  its unit and backend tests, every behaviour spec and every check pass.
- Not shown: Library, Pause, End, the overlays when the bike is missing or lost, and the plan's end, which are slice
  21.4's; Feedback (slice 26.1); the bike's Diagnostics (slice 25.1).
