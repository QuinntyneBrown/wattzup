# Slice 9.2 · Verify and stay signed in

A rider enters the six digits on the code screen, typed, pasted or taken from the device's offer;
anything that is not a digit is dropped and six digits confirm at once (L2-002 AC2, AC5). A code
that does not match clears the field, marks it invalid and says so as an alert (AC3); an old or
used code has expired (AC4, AC6); after five wrong codes even the right one is refused until a
new one is sent (L2-003 AC3). `POST /api/auth/code/confirm` compares a keyed hash in fixed time,
finds or makes the rider and starts a session: a `__Host-telo-session` cookie, HttpOnly, Secure
and SameSite=Lax, holding a key whose SHA-256 the database keeps, moved forward on every use so
it lasts 365 days from the last (L2-004 AC1, AC2). Every screen but sign-in, the code screen and
not-found sends a visitor without a session to sign-in and back again (L2-001 AC1); a 401 ends
the session at the next screen (L2-004 AC3), and an unreachable backend never blocks a screen
(AC5).

- **Film:** [`09-2-verify-and-stay-signed-in.mp4`](09-2-verify-and-stay-signed-in.mp4),
  1920×1080, 30 fps, 2 min 4 s, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-001 AC1; L2-002 AC2 to AC6; L2-003 AC3; L2-004 AC1 to AC3, AC5.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The code screen at 1440 px in a browser, over the aurora | Six digits, **then ride.** |
| 0:10 | 4 | `code` | Five digits in the six cells | Type, paste **or take the offer.** |
| 0:21 | 4 | `mismatch` | A code that does not match, the field cleared and marked | Not that one? **Try again.** |
| 0:31 | 4 | `refused` | An expired code and a locked one | Ten minutes, **five tries.** |
| 0:41 | 4 | `backend` | `POST /api/auth/code/confirm`: the hash compared, the rider found or made, the cookie | One cookie, **no secrets.** |
| 0:52 | 4 | `guard` | Sign-in opened from the Class Library, then the Class Library again | Sign in, **then back.** |
| 1:02 | 4 | `session` | `GET /api/riders/me` after 364, 728 and 366 idle days, and with no backend | A year **from the last ride.** |
| 1:12 | 4 | `shell` | The code screen growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **one calm row.** |
| 1:23 | 4 | `proof` | The local checks, and three cards: what the tests prove | Through the API **and the page.** |
| 1:33 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `mismatch`, a wipe into `refused`, a zoom through the `backend` scene
into `guard`, and pushes into `session` and `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The backend's answers are the shared fixture's `api`, so no request leaves the machine.
- The terminals and cards are drawn from the specs, the tests and the code.
- **What the tests prove:** seven backend acceptance tests through the API (`SessionTests`, each
  seen failing first) and a table test of `SignInCode.Verify`: a new address makes a rider and
  the same address finds it again; the cookie is `__Host-telo-session`, HttpOnly, Secure,
  SameSite=Lax, path `/`, with an expiry; five wrong codes lock the code and the sixth, right
  or not, is `code_locked`; a code past 10 minutes, a used code and a superseded one are
  refused; a session used after 364 days and again 364 days later still answers, and one idle
  366 days is 401. Nine behaviour specs (`stay-signed-in.spec.ts`, seen failing first) prove the
  screens: the guard's way to sign-in and back, Connect Bike for a rider with no bike, a pasted
  code, the three refusals, an unreachable backend, a session that ends, and not-found without a
  session. All 137 behaviour specs, the 98 backend tests, the 1223 unit tests and every check
  pass.
- Not shown, because not built here: the display name a new rider chooses (slice 9.3), signing
  out and deleting the account (slice 9.4), and rides kept on the device while signed out
  (journey 10).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/09-2-verify-and-stay-signed-in
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/09-2-verify-and-stay-signed-in
node tools/video-build/build.mjs docs/videos/09-2-verify-and-stay-signed-in --crf 25
```
