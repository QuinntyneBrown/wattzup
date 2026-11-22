# Slice 22.1 · Authenticate every request

Every endpoint and the ride hub need a signed-in rider by default (L2-127). The anonymous endpoints are a short list,
each marked where it is mapped: send code, confirm code and sign out; the public class and map catalogues and the
map's queue count (ADR 0028, ADR 0029); the health checks; and the app's own files. Everything else answers 401 as
ProblemDetails with code `unauthenticated`, never a redirect, and a new test asks every endpoint the API maps to prove
it (L2-127 AC1). A change, a sign-in code or a hub connection that the browser marks as coming from another origin is
refused with 403 and code `cross_origin` before it reaches the endpoint (L2-127 AC2, ADR 0033).

- **Film:** [`22-1-authenticate-every-request.mp4`](22-1-authenticate-every-request.mp4), 1920×1080, 30 fps, 2 min 3 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-127 AC1, AC2.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The public Class Library at 1440 px, in a browser over the aurora | Signed in, **by default.** |
| 0:10 | 5 | `list` | The anonymous endpoints and why each needs no session | A short, **written list.** |
| 0:23 | 4 | `refused` | The built API answering `POST /api/rides` without a session | No session, **401.** |
| 0:33 | 5 | `every` | The new test failing when rides are marked anonymous by mistake, then passing | Every endpoint, **asked.** |
| 0:46 | 5 | `origin` | Sign-in on a phone, and three facts about the browser's mark | From Telo Ride, **or not at all.** |
| 0:59 | 5 | `forged` | The built API refusing a rename and a hub negotiation from another site | Another site, **403.** |
| 1:12 | 4 | `widths` | Sign-in growing from 390 through 768 and 1024 to 1440 px | Sign-in, **at every width.** |
| 1:22 | 4 | `proof` | The backend's test run, and what it proves | 488 tests, **all green.** |
| 1:32 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `refused`, a wipe and a push into `origin`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`; the fixture answers the API. The terminals in `refused` and `forged` hold the real
  answers of the built API, run in Development on `localhost:5310` with no database (the headers of L2-131 are left
  out). The terminal in `every` holds the real output of `AnonymousEndpointsTests` with `[AllowAnonymous]` put on
  `RidesController` by hand, then taken off.
- **What this slice adds:** `SameOriginRequests` ahead of authentication, `AnonymousEndpointsTests` and
  `SameOriginTests`, ADR 0033, and the anonymous list in L2-127 and the design. The fallback policy, the health
  checks and the session's refusal after sign-out (L2-127 AC3, AC4) were built by slices 1.2 and 9.4.
- Not shown: owner scoping and random ids (L2-128, slice 22.4), validation (slice 22.2), rate limits (slice 22.3).
