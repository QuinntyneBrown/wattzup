# Slice 20.4 · Sound, motion and display

Settings' Sound and Motion and display (L2-163, L2-164). Ride sound is made in the browser from the pedalling (chain,
freewheel, tyres and wind) at a volume the rider sets, with no audio context at all while it is off; World music plays
each world's track; and ride sound goes quiet under a playing class video. Reduce motion follows the device or the
rider's choice, and On makes every transition instant and the world still. The theme matches the device or holds the
rider's pick. Large ride numbers make power, the clock and the target a quarter bigger on every ride screen. Keep the
screen awake holds a wake lock while a ride runs, and Go full screen when a ride starts enters full screen on the start
press.

- **Film:** [`20-4-sound-motion-and-display.mp4`](20-4-sound-motion-and-display.mp4), 1920×1080, 30 fps, 1 min 56 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-163 AC1, AC2, AC3; L2-164 AC1, AC2, AC3, AC4, AC5, AC6.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Settings at 1440 px, in a browser over the aurora | An hour **in the saddle.** |
| 0:10 | 5 | `sound` | The Sound section at 55 %, and two facts | Made as **you pedal.** |
| 0:23 | 5 | `music` | Settings at 1024 px, and three facts | Quiet under **the video.** |
| 0:36 | 5 | `motion` | Motion and display, with this device asking for reduced motion, and two facts | Still, **when you ask.** |
| 0:49 | 5 | `numbers` | A race on a phone with Standard and with Large ride numbers, and two facts | Bigger **numbers.** |
| 1:02 | 4 | `widths` | Sound and Motion and display growing from 390 through 768 and 1024 to 1440 px | Sound and display, **at every width.** |
| 1:12 | 5 | `proof` | Settings in the light theme, and what the acceptance tests checked | Your theme, **full screen.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `music`, a wipe into `motion`, a push into `numbers`, a zoom into `widths`, and a cut into
`proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, through the flows of `e2e/settings-sound-display.spec.ts`. The races are real solo
  races on Old Town Criterium, ridden 12 seconds at 80 rpm on the warm-up's level 8 (143 W). The `proof` terminal's
  lines are what the acceptance tests check.
- **What this slice adds:** the Sound and Motion and display fields of the ride settings; `RIDE_SOUND` and
  `DISPLAY_PREFERENCES` in `api`; `WebAudioRideSound` (after `main`'s `RideSound`), `BrowserDisplayPreferences`,
  `main`'s ride sound rules and `enterFullScreenOnStart` in `domain`; the `SoundSettings` and `DisplaySettings`
  components; the `--ride-number-scale` token on the race's and the class ride's readouts; and one input,
  `reducedMotion`, on the world library's `WorldScene`. Its 11 acceptance tests, every behaviour spec, unit test and
  backend test, and every check pass.
- Not shown, because not built: a sound change heard mid-ride from a ride screen (L2-163 AC2 is proven by a unit test,
  since Settings and a ride never show together); world ambience and cue ducking, which `main`'s ride sound has.
