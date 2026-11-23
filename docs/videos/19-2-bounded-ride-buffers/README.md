# Slice 19.2 · Bounded ride buffers

A long ride keeps nothing that grows with it (L2-138). The ride's trace, one speed a second, lives in `RideRecorder`'s
`Float64Array` sized for four hours, the longest ride the backend records: 115 kB, set aside once when the ride starts
(since slice 10.1). Output, top power and time on target are running sums; each standings tick replaces the boards,
and the class board forgets a rider who leaves. A new spec rides a three-hour endurance class to its end and finds the
ride submitted with exactly 10,800 speed samples, one a second, and the distance they add up to (AC2). The trace
chart's bounded series comes with the custom ride's trace view (21.3) and the ring buffer with the packet log (25.2).

- **Film:** [`19-2-bounded-ride-buffers.mp4`](19-2-bounded-ride-buffers.mp4), 1920×1080, 30 fps, 1 min 41 s, H.264
  at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-138 AC1, AC2.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The three-hour class a minute from its end, at 1440 px in a browser, over the aurora | Three hours in, **still light.** |
| 0:10 | 5 | `measure` | The recorder's buffer, beside the class at 0:01 | One sample a second, **in a fixed buffer.** |
| 0:23 | 5 | `budget` | Three facts, beside the class at 2:59:00 at 1024 px | Nothing grows **with the ride.** |
| 0:36 | 5 | `world` | The submitted ride as the spec saw it, beside Results at 3:00:00 | 10,800 samples, **one a second.** |
| 0:49 | 4 | `widths` | The class at 2:59:00 growing from 390 through 768 and 1024 to 1440 px | Hour three, **at every width.** |
| 0:59 | 4 | `proof` | The local checks, and three cards: what the tests prove | Long rides, **flat memory.** |
| 1:09 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `budget`, a wipe into `world`, a zoom into `widths`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density: a three-hour endurance class
  served by the class fixtures, at 0:01 and at 2:59:00, and Results once it finished. The terminal lines are what the
  spec saw.
- **What the tests prove:** `long-ride.spec.ts` (1 test). It passed at once against the recorder slice 10.1 built; with
  the buffer sized for two hours it fails, 7200 samples against 10,800, so it guards the bound. All 278 behaviour
  specs, the 1585 unit tests, the 459 backend tests and every check pass.
- Not shown, because deferred: the heap over a long ride (L2-138 AC1, slice 19.3, run only when a person asks), the
  trace chart's one point per pixel (AC2, slice 21.3) and the packet log's ring buffer (slice 25.2).
