# Slice 9.1 · Request an email code

A rider types an email address and chooses "Send my code" (L2-001). The button reads "Sending
your code…" until the backend answers; then the code screen names the address the code went to
and counts "Send a new code" down 30 seconds (L2-002 AC1, L2-003 AC1, AC2). An address that is
not one sends nothing and is marked under the field; a failed send keeps the email; too many
codes say when to try again. `POST /api/auth/code` answers 202 whether or not the address has an
account, keeps the address normalised and the code only as a keyed hash, emails it over SMTP with
MailKit (ADR 0031), and limits codes to 5 an hour per address and 20 per network, each refusal a
429 with `Retry-After` (L2-003 AC4, AC5).

- **Film:** [`09-1-request-an-email-code.mp4`](09-1-request-an-email-code.mp4), 1920×1080,
  30 fps, 1 min 54 s, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-001 AC2 to AC6; L2-002 AC1; L2-003 AC1, AC2, AC4, AC5.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Sign-in at 1440 px in a browser, over the aurora | One email, **one code.** |
| 0:10 | 4 | `send` | Sign-in while the code is sent | Send my code, **then wait.** |
| 0:20 | 4 | `invalid` | An address that is not one, marked under the field | Not an address? **Nothing is sent.** |
| 0:30 | 4 | `code` | The code screen naming the address, "Send a new code in 0:28" | Check your email, **thirty seconds.** |
| 0:41 | 4 | `backend` | `POST /api/auth/code`: the address kept, the code hashed, sent over SMTP, 202 | The same answer **for everyone.** |
| 0:51 | 4 | `limited` | The three 429 refusals, and sign-in saying when to try again | Too many? **Come back later.** |
| 1:01 | 4 | `shell` | Sign-in growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **one calm panel.** |
| 1:12 | 4 | `proof` | The local checks, and three cards: what the tests prove | Through the API **and the page.** |
| 1:22 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `invalid`, a wipe into `code`, a zoom through the `backend` scene into
`limited`, and a push into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The backend's answers are the shared fixture's `api`, so no request leaves the machine.
- The terminals and cards are drawn from the specs, the tests and the code.
- **What the tests prove:** seven backend acceptance tests through the API (`SignInCodeTests`,
  `SignInPerAddressLimitTests`, each seen failing first) and a table test of `EmailAddress`: the
  code goes to the normalised address with 202 and no body, the same for any address; a
  malformed address is refused with `invalid_email` and nothing is mailed; a second code inside
  30 seconds is `resend_too_soon` with the seconds left; the sixth code for an address and the
  21st for a network within an hour are `rate_limited` until the oldest is an hour old; a code
  that could not be sent is not kept. Seven behaviour specs (`sign-in.spec.ts`, seen failing
  first) prove the screens. All 128 behaviour specs, the 81 backend tests, the 1214 unit tests
  and every check pass.
- Not shown, because not built here: entering the code, the session and the guard that sends a
  visitor to sign-in (slice 9.2), and a real email (the tests keep codes in a fake mailbox).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/09-1-request-an-email-code
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/09-1-request-an-email-code
node tools/video-build/build.mjs docs/videos/09-1-request-an-email-code --crf 25
```
