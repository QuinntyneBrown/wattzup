# Slice 10.2 · Earn XP

Every recorded ride now earns XP, computed by the backend (L2-037). The app's `RideRecorder`
counts the running seconds whose power was within 10 % of the target power, in a race or a
class, and the ride sends the share as `onTargetShare`. `XpCalculator` gives the lines in order:
"Finished" +100; for a bots race of more than 2 riders, "{place} of {field}" +(field − place) × 20
and, on the podium, "Podium" +75; "{p}% on target" +round(p × 0.8); and "{n}-day streak" +n × 10,
which waits for the streak (slice 10.4). A solo race or a class has no place lines, and a DNF or a
discarded ride earns none. The rider's total XP grows in the same unit of work, and the ride keeps
its lines and the total, so a repeat of its ride id answers the same and adds nothing.

- **Film:** [`10-2-earn-xp.mp4`](10-2-earn-xp.mp4), 1920×1080, 30 fps, 1 min 33 s, H.264 at
  CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a
  player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-037 AC1 to AC7, L2-125 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | A bots race on the warm-up's target at 1440 px in a browser, over the aurora | Every ride **earns XP.** |
| 0:10 | 4 | `ontarget` | The race's "On target" numbers on a desktop and a phone, the class's power on target, and the share sent | Within 10 %, **on target.** |
| 0:21 | 4 | `lines` | The XP lines the backend answers for that race, 1st of 10 and 55 % on target | Line by line, **from the backend.** |
| 0:31 | 4 | `example` | L2-037's worked example: 402 today, 442 with a 4-day streak | Second of ten: **402, then 442.** |
| 0:41 | 4 | `rules` | What earns nothing more: no place in a solo race or a class, nothing for a DNF, nothing twice | No place to win, **no double pay.** |
| 0:52 | 4 | `proof` | The local checks, and three cards: what the tests prove | Through the API **and the rule.** |
| 1:02 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a wipe into `lines`, a zoom through `example` into `rules`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390 and 1440 px at double density.
  The share in the `ontarget` scene is the one the app submitted for a race ridden 40 seconds on
  target, printed by `shots.ts`; the lines in the `lines` scene are what `XpCalculator` gives for
  that ride.
- **What the tests prove:** backend acceptance tests through the API (`XpTests`, seen failing
  first): 2nd of 10 against bots and 84 % on target earns 402; each ride adds to the total; a place
  off the podium has no podium line; a solo race has no place line; a repeat answers the same and
  adds nothing; XP in the body is not read; and a share outside 0 to 1 is refused with 400.
  `XpCalculatorTests` checks every criterion of L2-037, one case per row, including the worked
  example's 442. The behaviour spec for the share (`record-a-ride.spec.ts`, seen failing first)
  rides 40 seconds on target and checks the share sent. All 156 behaviour specs, the 201 backend
  tests, the 1300 unit tests and every check pass.
- Not shown, because not built here: the level and the XP to the next level (slice 10.3), the
  streak line (slice 10.4), and Results showing the lines (journey 11).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/10-2-earn-xp
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/10-2-earn-xp
node tools/video-build/build.mjs docs/videos/10-2-earn-xp --crf 25
```
