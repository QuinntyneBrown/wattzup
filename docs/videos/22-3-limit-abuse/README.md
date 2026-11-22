# Slice 22.3 · Limit abuse

One rider records at most 60 rides an hour (L2-130 AC3). The 61st is refused with 429, code `rate_limited` and a
`Retry-After` of the seconds until the hour's oldest ride falls out of it (AC1). The backend counts rides recorded, not
requests, so a ride sent again still gets its first answer and another rider is not held back. On the device the ride
waits: Results says its XP is on its way, and the outbox sends it again when the `Retry-After` has passed. On the ride
hub, two progress messages a second get through, class or race; the rest are dropped without an answer, and a client
over the limit for 10 seconds is disconnected (AC2). The app sends a report at most every 500 ms. The sign-in limits
already answered this way (slice 1.x); the feedback limit comes with feedback.

- **Film:** [`22-3-limit-abuse.mp4`](22-3-limit-abuse.mp4), 1920×1080, 30 fps, 1 min 53 s, H.264 at
  CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-130 AC1, AC2, AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Results for a ride refused with 429, at 1440 px in a browser over the aurora | Enough, **no more.** |
| 0:10 | 5 | `rides` | The 61st ride in an hour refused with 429, `rate_limited` and `Retry-After: 3000` | 60 rides **an hour.** |
| 0:23 | 5 | `counted` | A repeat, another rider, and a ride after the wait, all answered | Rides counted, **not requests.** |
| 0:36 | 5 | `outbox` | Results' XP waiting, then added once the wait has passed, close up | The ride **waits its turn.** |
| 0:49 | 5 | `hub` | The progress gate's answers, one row per pattern of messages | Two a second, **then the door.** |
| 1:01 | 4 | `gate` | The gate's tests passing, and the app's 500 ms report interval | The app **keeps under it.** |
| 1:12 | 4 | `widths` | Results, waiting, growing from 390 through 768 and 1024 to 1440 px | Results, waiting, **at every width.** |
| 1:22 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `counted`, a wipe and a push into `outbox`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, through the flow of `e2e/ride-outbox.spec.ts`; the API fixture answers the ride with
  429 and then records it, so no backend ran. The terminals restate what `RideLimitTests`, `ProgressRateTests` and
  `ProgressRateGateTests` check against the API hosted in memory, and the real total of the gate's tests.
- **What this slice adds:** the hour's ride count in `SubmitRideCommandHandler`; `ProgressRateGate` and
  `ProgressRateHubFilter` in `Telo.Ride.Api`; the outbox honouring `Retry-After`; `RideLimitTests`,
  `ProgressRateTests`, `ProgressRateGateTests` and a case in `e2e/ride-outbox.spec.ts`. Every check passes.
- Not shown: the sign-in limits (5 codes per email and 20 per network an hour), built and tested with sign-in; the
  feedback limit (L2-119 AC3), which comes with the feedback endpoint.
