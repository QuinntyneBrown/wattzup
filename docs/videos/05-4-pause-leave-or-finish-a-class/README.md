# Slice 5.4 · Pause, leave or finish a class

A solo class ride now pauses, waits for a lost bike, leaves and finishes (L2-091, L2-092 AC4,
L2-093). The header's Pause holds the ride clock, the plan and the video at the same second, draws
"Paused" over the picture and becomes Resume, which carries on from there with the video sought back
onto the clock; the stepper stays on. When the bike stops answering, an alert reads "Lost the bike"
and "Your ride is paused. Pedal to wake the bike and it carries on from here.", with Reconnect, and the
ride holds until the bike is back. Leave goes to Class Start at once, with no confirmation; at the
class length the clock stops and Results opens (Class Start and Results come with slices 6.3 and
11.1). The screen stays awake through the ride, and closing or reloading the tab mid-ride asks first
(L2-133 AC3, AC4).

- **Film:** [`05-4-pause-leave-or-finish-a-class.mp4`](05-4-pause-leave-or-finish-a-class.mp4),
  1920×1080, 30 fps, 2 min 25 s, H.264 at CRF 23 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-091 AC1 and AC2, L2-088 AC3, L2-092 AC4, L2-017 AC4, L2-093 AC1 and
  AC2, L2-133 AC3 and AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The class ride paused at 7:00 in a browser window, over the aurora | Pause, leave **or finish.** |
| 0:10 | 4 | `pause` | A close-up of the paused video, with three cards: clock, video, stepper | Everything holds, **together.** |
| 0:21 | 4 | `resume` | Pause, ten seconds, Resume: the clock and the video time | Resume, from **the same second.** |
| 0:31 | 4 | `lost` | The class ride with the bike lost, and a close-up of the alert | The ride waits **for the bike.** |
| 0:41 | 4 | `back` | The drop, Reconnect, initialising and the level sent again | Back, and **carrying on.** |
| 0:52 | 4 | `beat` | The app's second beat driving the store's check and the ride clock, drawn | A beat of **its own.** |
| 1:02 | 4 | `leave` | What Leave does: the address, no confirmation, the video, the next level | Leave, **no questions.** |
| 1:12 | 4 | `finish` | What the finish does: the clock, the video, the address | Thirty minutes, **then Results.** |
| 1:23 | 4 | `awake` | The wake lock and the leave guard | Awake, and **asked first.** |
| 1:33 | 4 | `shell` | The paused ride growing from 390 through 768 and 1024 to 1440 px, and the lost bike on a phone | An icon on a phone, **then its label.** |
| 1:43 | 4 | `proof` | The two local test runs, and two cards: what the tests prove | Six new specs, **all green.** |
| 1:54 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `resume`, `lost` and `leave`, a signal wipe into `lost`, and a zoom through
the `awake` cards into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared
  fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density. The
  fixture's fake Bluetooth stands in for the bike and drops it for the lost-bike pictures, its API
  fixture answers the class, and its YouTube fixture answers the IFrame API with a fake player over the
  cover. Playwright's clock moves the ride to 7:00, as `e2e/class-pause-leave.spec.ts` does.
- The writes, times and addresses come from that spec; the wake-lock cases from
  `browser-screen-wake-lock.spec.ts`; the diagram and cards are drawn.
- **What the tests prove:** six new behaviour specs and seven new unit cases; 253 unit tests and the
  43 behaviour specs all pass. No real bike, YouTube video or screen lock is used in a test or in the
  film.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/05-4-pause-leave-or-finish-a-class
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/05-4-pause-leave-or-finish-a-class
node tools/video-build/build.mjs docs/videos/05-4-pause-leave-or-finish-a-class --crf 23
```
