# Slice 21.4 · Pause, leave or end

The custom ride stops when the rider does (L2-105 to L2-108). Pause holds the clock, the plan and the readouts at 6:52,
sends no level and leaves the bike control in the rider's hands; Resume carries on (L2-105 AC1). A bike that stops
answering pauses the ride and says "Lost the bike" with Reconnect, and the ride waits for Resume (L2-105 AC2, AC3).
Opened with no bike, the ride waits at 0:00 behind Connect your bike, with Start, End and every level off; with
Bluetooth off it asks for it first (L2-106). Library pauses the ride and asks "Leave this ride?" in a popover under it:
save and open the Class Library, discard and open it, or keep riding (L2-107). End, and the plan's end, submit the
ride as a custom ride and open Profile; a ride under a minute is not kept, and Profile says so (L2-108, L2-105 AC4).

- **Film:** [`21-4-pause-leave-or-end.mp4`](21-4-pause-leave-or-end.mp4), 1920×1080, 30 fps, 1 min 56 s, H.264
  at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-105 AC1 to AC4; L2-106; L2-107 AC1 to AC4; L2-108.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The custom ride paused at 6:52 at 1440 px, in a browser over the aurora | It stops **when you do.** |
| 0:10 | 5 | `pause` | The paused ride and Resume close up, and three facts | Paused **at 6:52.** |
| 0:23 | 5 | `lost` | Lost the bike close up, over the ride it paused | Lost the bike, **saved at 6:52.** |
| 0:36 | 5 | `nobike` | The ride waiting at 0:00 behind Connect your bike, and Turn on Bluetooth | No bike, **no start.** |
| 0:49 | 5 | `leave` | Leave this ride? close up, and three facts | Leave **this ride?** |
| 1:01 | 5 | `end` | The ride's POST, and Profile after a ride under a minute | End, **then Profile.** |
| 1:14 | 4 | `widths` | Leave this ride? growing from 390 through 768 and 1024 to 1440 px | Leave this ride, **at every width.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `lost`, a wipe and a push into `leave`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, through the flows of `e2e/custom-ride-pause`, `-lost`, `-no-bike`, `-leave` and
  `-end.spec.ts`, on the fake bike and a paused clock. The terminal in `end` restates what `custom-ride-end.spec.ts`
  checks in the ride's POST; it is not a capture.
- **What this slice adds:** Pause and Resume, End and Library in the ride header; the ride overlay (connect, lost,
  Bluetooth off) and "Leave this ride?" in `components`; the waiting, paused and ended states, the save through the
  ride outbox and the leave dialog in the ride; the Profile notice for a ride too short to save; and the backend's
  `custom` ride kind. Its acceptance tests, its backend test, every behaviour spec and every check pass.
- Not shown: the needs-Chromium and needs-HTTPS panels, which are deferred; Feedback (slice 26.1); the bike's
  Diagnostics (slice 25.1).
