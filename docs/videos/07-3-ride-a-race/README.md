# Slice 7.3 · Ride a race

The race at `/race/:mapId/ride` (L2-058 to L2-063, L2-072), full screen with no app header, for
an open map and the remembered bike. The scene is the map's photo, framed where the camera puts
the world, until journey 8 draws it. The top bar holds the lockup, "Old Town Criterium" with
"Cathedral Circuit · vs Bots, medium" (or "· vs your best"), the bike and the clock ("5:01 /
30:00"). The power panel reads the rider's place, power against the segment's target ("371 W",
"Target 418 W", "-47 W", or "On target") and Cadence, Heart and Speed, the virtual speed from
power. The interval panel names the segment, its round of eight, the time left and the next
segment; each segment's level goes to the bike as it starts. The route panel is `main`'s route
profile, copied into `domain`: the grade, coloured by how the road reads, the metres climbed, the
distance ridden, and the profile as one image with the rider's place. The resistance panel's
Lower and Raise send the next level as the rider's own. Until the opponents join (slice 7.4) the
field is the rider alone, "1st / 1".

- **Film:** [`07-3-ride-a-race.mp4`](07-3-ride-a-race.mp4), 1920×1080, 30 fps, 2 min 14 s,
  H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-058 AC1, AC2 and AC4, L2-059 AC1 to AC3, L2-061 AC1 to AC3,
  L2-062 AC1 to AC3, L2-063 AC1 to AC3, L2-064 AC4, L2-072 AC1 to AC3, L2-028 AC1 and AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The race at 1440 px in a browser window over the aurora | The bike, **on the course.** |
| 0:10 | 4 | `bar` | The race on Old Town Criterium at 5:01, with its top bar | The top bar, **full screen.** |
| 0:20 | 4 | `power` | A close-up of the power panel | Power first, **then the rest.** |
| 0:30 | 4 | `interval` | A close-up of the interval panel | Work, 1 of 8, **0:29 left.** |
| 0:41 | 4 | `level` | The target resistance written as each segment starts | Each segment, **its level.** |
| 0:51 | 4 | `route` | A close-up of the route panel, and its grade and climb | The road, **as main draws it.** |
| 1:01 | 4 | `speed` | The virtual speed from power, and the distance ridden | Power is **speed.** |
| 1:12 | 4 | `resist` | A close-up of the resistance panel | Your hand **on the level.** |
| 1:22 | 4 | `shell` | The race growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **one race.** |
| 1:32 | 4 | `proof` | The local checks, and two cards: what the tests prove | Through the page, **all green.** |
| 1:43 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `power`, `interval` and `route`, a signal wipe into `speed`, and a zoom
through the `resist` scene into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The fake Bluetooth plays the bike: a warm-up at 80 rpm, then the first effort at
  87 rpm on level 24. The API fixture serves the map catalogue, so no request leaves the machine.
  Playwright's clock moves the race, stepping one frame at a time while a shot is taken.
- The terminals and cards are drawn from the specs and the code.
- **What the tests prove:** ten behaviour specs (`race.spec.ts`, `race-interval.spec.ts`,
  `race-power.spec.ts`, `race-route.spec.ts`, `race-resistance.spec.ts`, `race-layout.spec.ts`
  and the locked race address in `race-setup-locked.spec.ts`) cover the slice's criteria; the
  backend's acceptance test reads each map's plan and terrain through the API; unit tests cover
  `main`'s route profile, the grade's tone, the virtual speed and the spoken countdown. All 82
  behaviour specs, the 58 backend tests, the 318 unit tests and every check pass, and the initial
  bundle is unchanged at 284.48 kB of its 288 kB budget.
- Not shown, because not built here: the opponents, the standings board and the gaps
  (slice 7.4), Leave, Pause, End and the finish (slice 7.5), the drawn world and its renderer tag
  (journey 8), Full screen (slice 24.2) and a heart-rate strap.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/07-3-ride-a-race
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/07-3-ride-a-race
node tools/video-build/build.mjs docs/videos/07-3-ride-a-race --crf 23
```
