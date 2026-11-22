# Slice 16.3 · Start a solo world class

A solo world class now starts in its world. Start riding turns on only when the world is ready and the bike is
connected. With no bike, World loading keeps loading, reads "No bike", and says "Your bike isn’t connected." with
Connect bike (L2-157). Pressing Start riding hands the renderer World loading built and warmed up, and its canvas, to
the class ride. `main`'s `WorldScene` draws with it, so no second renderer starts and nothing is compiled again, and the
world fades in over 200 ms, at once with reduced motion (L2-153 AC3, AC5). The world fills the class ride's stage over
its panorama, and the class video plays in its corner with its own sound. When the video cannot play, `main`'s world
music plays the world's own track (L2-163 AC1). Main stays at 277.40 kB.

- **Film:** [`16-3-start-a-solo-world-class.mp4`](16-3-start-a-solo-world-class.mp4), 1920×1080, 30 fps,
  1 min 56 s, H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for
  a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-153 AC2, AC3, AC5; L2-157 AC1 to AC3; L2-163 AC1.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The class ride in its world, at 1440 px in a browser, over the aurora | Press Start riding, **the world fades in.** |
| 0:10 | 5 | `gate` | World loading as the spec saw it, beside the world ready with no bike | No bike? **The world keeps loading.** |
| 0:23 | 5 | `start` | Three facts, beside World loading ready with Start riding focused | Ready and connected, **Start riding.** |
| 0:36 | 5 | `handover` | Start riding as the spec saw it, beside the class ride in its world | Warmed once, **ridden at once.** |
| 0:49 | 5 | `music` | Three facts, beside the world with its video and the panorama without one | The video in the corner, **or the world’s track.** |
| 1:01 | 5 | `widths` | The class ride in its world growing from 390 through 768 and 1024 to 1440 px | In its world, **at every width.** |
| 1:14 | 4 | `proof` | The local checks, and three cards: what the tests prove | One renderer, **faded in.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `start`, a wipe into `handover`, a push into `music`, a zoom into `widths`, and a push into
`proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture, the
  world-assets fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density:
  30 Minute HIIT Cardio's World loading ready with no bike and then with the bike connected, the class ride in Old Town
  Criterium after Start riding, and the class ride on the panorama with YouTube blocked. The terminal lines are what
  the specs saw.
- **What the tests prove:** `class-world-start.spec.ts` (4 tests), written first and seen failing, shows that Start
  riding waits for the bike while the world loads, with the alert and Connect bike. It shows that Start riding hands the
  warm world to the class ride: the canvas on the stage over its panorama, faded in over 0.2 s with no second graphics
  context, the video in the corner and the first target resistance sent. It shows the world coming in at once with
  reduced motion, and the world's track playing when the class video cannot. `worldLoadView`'s unit tests cover the
  bike's words and the gate; `main`'s copied specs cover the world music, its player and the ambience table. All 260
  behaviour specs, the 1556 unit tests, the 455 backend tests and every check pass.
- Not shown, because not built here or not reachable yet:
  - A group world class (16.4): a group ride still rides the video alone.
  - The World music setting and the ambience under the ride sound (20.4): the track is on until then.
  - Connect bike reaching a bike that answers: the spec connects the bike by pushing its frame, as a bike that wakes
    does.
