# Slice 16.4 · Join a group world class

A group world class now waits for its session on World loading and starts with everyone. World loading joins the
session, reads "Group · 7:39 PM · 6 of 10" and "· Group class", counts down each second in "The group starts in 9:00.",
and keeps the action off as "Starts with the group at 7:39 PM" (L2-154 AC1, AC2). At the session's start the class
ride opens for every rider at the same moment, ready or not: a world still loading rides its panorama and fades in when
it is ready, with the clock and the bike carrying on (AC3, AC4). With no bike at the start the class still starts, with
"Lost the bike" and the group's words, and it does not hold for the bike (L2-157 AC4). Connect bike now also tries a
connection that gave up. Main stays at 277.40 kB.

- **Film:** [`16-4-join-a-group-world-class.mp4`](16-4-join-a-group-world-class.mp4), 1920×1080, 30 fps,
  1 min 56 s, H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for
  a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-154 AC1 to AC4; L2-157 AC1, AC4; L2-092 AC1.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The class ride in its world, at 1440 px in a browser, over the aurora | Everyone starts together, **the world follows.** |
| 0:10 | 5 | `countdown` | World loading as the spec saw it, beside the countdown at 1440 px | The group starts **in 9:00.** |
| 0:23 | 5 | `start` | Three facts, beside the class ride started on the panorama | At the start, **everyone rides.** |
| 0:36 | 5 | `fade` | The late world as the spec saw it, beside the world faded in | Ready later? **It fades in.** |
| 0:49 | 5 | `nobike` | Three facts, beside the countdown with no bike and the class ride's lost-bike alert | No bike? **The class keeps going.** |
| 1:01 | 5 | `widths` | The countdown growing from 390 through 768 and 1024 to 1440 px | The countdown, **at every width.** |
| 1:14 | 4 | `proof` | The local checks, and three cards: what the tests prove | Together, **ready or not.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `start`, a wipe into `fade`, a push into `nobike`, a zoom into `widths`, and a push into
`proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture, its
  hub, the world-assets fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density: 30 Minute HIIT Cardio's 7:39 PM session counting down on World loading, the class ride started on the
  panorama while Old Town Criterium still loads, the world faded in once released, and the class ride started with the
  bike switched off. The terminal lines are what the specs saw.
- **What the tests prove:** `class-world-group.spec.ts` (3 tests), written first and seen failing, shows World loading
  counting down to the group's start with the action off, the class ride starting at the session's start on the
  panorama and the world fading in when it is ready with one first command, and the class ride starting with the
  lost-bike alert when there is no bike. A fourth test in `class-world-start.spec.ts` shows Connect bike reaching the
  bike after its connection failed. The group specs (`group-class-start`, `group-class-join`, `group-class-board`,
  `ride-hub`) now ride through World loading. `worldLoadView`'s unit tests cover the group's words. All 263 behaviour
  specs, the 1557 unit tests, the 455 backend tests and every check pass.
- Not shown, because not built here or not reachable yet:
  - The World music setting and the ambience under the ride sound (20.4).
  - Riders joining during the countdown: the seat count is read once, when World loading opens.
