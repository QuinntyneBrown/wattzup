# Slice 10.1 · Record a ride

A finished ride now reaches the backend, once. A race or a class gives its ride an id when it
starts, and its `RideRecorder` keeps the speed of each second ridden (a race's virtual speed, a
class's bike speed) and adds the power to the output. As the ride ends, the app sends
`POST /api/rides` with the ride's facts: a race's map, mode, pack, place and field, or the class;
its seconds, distance, output, highest power and speed, the speed samples the distance adds up to,
the finish instant and the device's time zone. It sends no XP, stars or unlocks (L2-044 AC4).
The backend records the ride once for its ride id: 201 the first time, and 200 with the same
answer for a repeat, even when two first submissions race and the key refuses one (L2-125 AC3).
A ride no one could have ridden is refused with 422 `ride_not_plausible` (AC2), and a body that is
not a ride with 400 `validation_failed`.

- **Film:** [`10-1-record-a-ride.mp4`](10-1-record-a-ride.mp4), 1920×1080, 30 fps, 1 min 43 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-044 AC2 and AC4, L2-125 AC2 and AC3, L2-022.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | A bots race nearing the line at 1440 px in a browser, over the aurora | Cross the line, **and it’s recorded.** |
| 0:10 | 4 | `race` | The race's numbers and standings, and the ride it submitted at the line | At the line, **the facts go.** |
| 0:21 | 4 | `class` | HIIT Cardio in its last seconds, on a desktop and a phone | A class too, **at the bike’s speed.** |
| 0:31 | 4 | `once` | One ride id sent three times: 201, then 200 with the first answer | Recorded once, **answered the same.** |
| 0:41 | 4 | `plausible` | Rides no one could ride refused with 422, a body that is not a ride with 400 | Only rides **that could be ridden.** |
| 0:52 | 4 | `facts` | What a ride never carries: XP, stars and unlocks | Facts only. **The backend does the rest.** |
| 1:02 | 4 | `proof` | The local checks, and three cards: what the tests prove | Through the API **and the ride.** |
| 1:12 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `class`, a wipe into `once`, a zoom through `plausible` into `facts`,
and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390 and 1440 px at double density.
  The ride in the `race` scene is the one the app submitted at the line, printed by `shots.ts`;
  the shared fixture records it, so no request leaves the machine.
- The other terminals and the cards are drawn from the specs, the tests and the code.
- **What the tests prove:** backend acceptance tests through the API (`RideTests`,
  `ConcurrentRideTests`, seen failing first): a race and a class are recorded with 201; a repeat
  answers 200 with the first answer; two first submissions at once answer with the ride that
  landed first; each rider records the same ride id once; XP, stars and unlocks in a body are not
  read; each way a ride cannot be ridden is refused with 422, and the ride is then recordable with
  its true facts; each malformed fact is refused with 400 naming it; and without a session the
  request is 401. `RidePlausibilityRuleTests` checks the rule's table, one case per row, and
  `AccountErasureTests` that erasing an account erases its rides. Three behaviour specs
  (`record-a-ride.spec.ts`, seen failing first) prove that a finished race and a finished class
  submit their facts once, with no XP, stars or unlocks. All 155 behaviour specs, the 175 backend
  tests, the 1298 unit tests and every check pass.
- Not shown, because not built here: XP, levels and the streak (slices 10.2 to 10.4), what
  Results shows of the answer (journey 11), keeping a ride on the device until it is recorded
  (L2-135), and whether a DNF or a class left early counts as a ride (an open question in the
  design).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/10-1-record-a-ride
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/10-1-record-a-ride
node tools/video-build/build.mjs docs/videos/10-1-record-a-ride --crf 25
```
