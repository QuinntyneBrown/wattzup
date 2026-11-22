# Slice 14.4 · Start together

A group class ride now waits for its session and starts with everyone else. The header reads
"30 Minute HIIT Cardio · Group" and a group ride has no Pause (L2-087 AC1). Until the session's
start, the clock holds at 0:00 and the video sits at its sync offset under "Starts in 9:00",
which counts down on whole seconds. The bike panel shows the warm-up ahead, with nothing sent to
the bike (L2-087 AC4). The seat `JoinClassSession` returns carries the start in server time. The
ride converts it once through the clock offset it measured from five `ServerTime` calls, so every
client's clock and video start at the same server time (L2-122 AC3, L2-121 AC3). A rider who
arrives after the start starts the ride clock from the session's start, so the clock reads the
session's time. Without a seat or an offset, when the hub cannot be reached, the ride starts at
once with the bike. The backend is unchanged. The initial bundle stays at 300.22 kB.

- **Film:** [`14-4-start-together.mp4`](14-4-start-together.mp4), 1920×1080, 30 fps,
  1 min 41 s, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-087 AC1, AC4, L2-122 AC3, L2-121 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The group ride waiting at 1440 px in a browser, over the aurora | Wait, **start as one.** |
| 0:10 | 5 | `wait` | The hub's offset and seat as the fixture saw them, beside the parked video under "Starts in 9:00" | Before the start, **hold at 0:00.** |
| 0:23 | 5 | `start` | The ride five seconds after its start, the video playing | At 7:39, **clock and video go.** |
| 0:36 | 4 | `late` | A rider who arrived two minutes late, the clock at 2:00 | Late, **still in step.** |
| 0:46 | 5 | `widths` | The waiting ride growing from 390 through 768 and 1024 to 1440 px | One countdown, **every screen.** |
| 0:59 | 4 | `proof` | The local checks, and three cards: what the tests prove | Wait, **then start as one.** |
| 1:09 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `start`, a wipe into `late`, a zoom out of `late` and into `widths`, and
a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The fixture's hub answers the connection, `ServerTime` (read from the page's installed
  clock) and `JoinClassSession` as the backend would. The terminal lines are what the fixture
  records, written out.
- **What the tests prove:** `group-class-start.spec.ts` (3 tests), written first and seen failing
  with the header reading "Solo" and no countdown. A seated ride holds at 0:00 under "Starts in
  9:00", with the warm-up ahead, no Pause, and the video loaded but not playing; a minute later it
  reads 8:00. At the session's start the countdown goes and the clock and the video start
  together. A rider who arrives two minutes after the start reads 2:00. A unit spec covers
  `RideClock.start(at)` from a moment already past. All 223 behaviour specs, the 1423 unit tests,
  the 377 backend tests and every check pass.
- Not shown, because not built here: the live board with its standings, the session's hub group
  and the bots that fill the seats at the start (slice 14.5), and leaving a session, which frees
  its seat (journey 15).
