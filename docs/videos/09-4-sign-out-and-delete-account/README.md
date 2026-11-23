# Slice 9.4 · Sign out and delete account

Profile's Settings gain "Sign out" and "Delete my account". Sign out sends
`POST /api/auth/sign-out`: cookie authentication hands the cookie's key to the session store, which
ends that one session at once and clears `__Host-telo-session`; sign-in opens, and the rider's
other devices stay signed in (L2-006 AC1). If the backend cannot be reached, the rider stays signed
in and Settings says so. "Delete my account" opens a CDK Dialog that says what is removed (email,
display name, progress and ride history) and keeps its button disabled until "delete" is typed,
in any case (AC2). `DELETE /api/riders/me` ends every session, removes the email, the display name
and the email's sign-in codes, and clears the cookie; sign-in opens with "Your account was deleted.
Its personal data is erased within 30 days." (AC3), and the same email signs in to a new, empty
account (AC4). `AccountErasureService` erases each deleted rider and its sessions once a day.

- **Film:** [`09-4-sign-out-and-delete-account.mp4`](09-4-sign-out-and-delete-account.mp4),
  1920×1080, 30 fps, 1 min 54 s, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-006 AC1 to AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Profile at 1440 px in a browser, over the aurora | Your account, **your call.** |
| 0:10 | 4 | `signout` | Settings: Display name, Sign out and Delete my account | Sign out, **at once.** |
| 0:21 | 4 | `offline` | Settings saying the sign-out could not reach the backend | No connection? **Still signed in.** |
| 0:31 | 4 | `dialog` | The delete dialog with "delete" typed, on a desktop and as a sheet on a phone | Type delete, **then delete.** |
| 0:41 | 4 | `backend` | `DELETE /api/riders/me` and `POST /api/auth/sign-out`: sessions ended, the email freed, the rider erased a day later | Gone at once, **erased in a day.** |
| 0:52 | 4 | `deleted` | Sign-in saying the account was deleted, and a deletion that failed | Deleted, **and said so.** |
| 1:02 | 4 | `shell` | Sign-in after a deletion growing from 390 through 768 and 1024 to 1440 px, and the dialog on a phone | Phone to desktop, **one calm goodbye.** |
| 1:12 | 4 | `proof` | The local checks, and three cards: what the tests prove | Through the API **and the page.** |
| 1:23 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `offline`, a wipe into `dialog`, a zoom through the `backend` scene
into `deleted`, and a push into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The backend's answers are the shared fixture's `api`, so no request leaves the machine.
- The terminals and cards are drawn from the specs, the tests and the code.
- **What the tests prove:** seven backend acceptance tests through the API (`AccountTests` and
  `AccountErasureTests`, seen failing first): sign-out answers 204, clears the cookie and the old
  cookie is then refused, while another device stays signed in; sign-out without a session still
  answers 204; deletion ends the sessions of every device and clears the cookie; the same email
  then signs in to a new account with no name; deletion without a session is 401; and a day after
  a deletion the erasure service has removed the rider and its sessions, and a second run erases
  nothing. Six behaviour specs (`account.spec.ts`, seen failing first) prove the screens. All 152
  behaviour specs, the 133 backend tests, the 1291 unit tests and every check pass.
- Not shown, because not built here: clearing rides waiting on the device (they arrive with
  journey 10), erasure from backups and how a deleted rider's past results appear to others (open
  questions in the design).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/09-4-sign-out-and-delete-account
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/09-4-sign-out-and-delete-account
node tools/video-build/build.mjs docs/videos/09-4-sign-out-and-delete-account --crf 25
```
