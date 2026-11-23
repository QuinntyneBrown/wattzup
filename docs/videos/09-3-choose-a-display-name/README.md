# Slice 9.3 · Choose a display name

A rider whose account has no display name is asked "What should other riders call you?" at
`/sign-in/name`, straight after the code screen or from any other screen, and then goes on to the
screen they asked for (L2-005 AC1). "Continue" waits for a name. A name outside 2 to 24
characters of letters, digits, spaces, `.`, `_` and `-` is refused at once, or by the backend,
and the field says what is allowed (AC2); the name is rendered as text, never as HTML (AC4).
`PUT /api/riders/me/display-name` trims the name and keeps it, or refuses it with
`display_name_invalid` and leaves the kept name as it was. Profile's headline uses the name, and
its Settings row changes it in a CDK Dialog that becomes a bottom sheet on a phone (AC3).

- **Film:** [`09-3-choose-a-display-name.mp4`](09-3-choose-a-display-name.mp4), 1920×1080,
  30 fps, 1 min 54 s, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-005 AC1 to AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The prompt at 1440 px in a browser, over the aurora | What should **riders call you?** |
| 0:10 | 4 | `prompt` | The prompt's panel with "Sam" typed | A name first, **then ride.** |
| 0:21 | 4 | `rule` | A name that breaks the rule, the field marked and the rule under it | Two to 24, **said plainly.** |
| 0:31 | 4 | `backend` | `PUT /api/riders/me/display-name`: kept, refused, the kept name after a refusal, no session | One rule, **kept by the backend.** |
| 0:41 | 4 | `profile` | Profile's headline, "Sam · Level 1", and its Settings row | Your name, **your level.** |
| 0:52 | 4 | `dialog` | The Display name dialog on a desktop, and as a sheet on a phone | Change it **from Settings.** |
| 1:02 | 4 | `shell` | The prompt growing from 390 through 768 and 1024 to 1440 px, and Profile on a phone | Phone to desktop, **one calm question.** |
| 1:12 | 4 | `proof` | The local checks, and three cards: what the tests prove | Through the API **and the page.** |
| 1:23 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `rule`, a zoom through the `backend` scene into `profile`, a wipe into
`dialog` and a push into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The backend's answers are the shared fixture's `api`, so no request leaves the machine.
- The terminals and cards are drawn from the specs, the tests and the code.
- **What the tests prove:** backend acceptance tests through the API (`DisplayNameTests`, each
  seen failing first) and a table test of `DisplayName.Parse`: a name is trimmed and kept, and a
  second one replaces it; six names that break the rule are refused with `display_name_invalid`
  and the kept name stays; without a session the request is 401. Nine behaviour specs
  (`display-name.spec.ts`, seen failing first) prove the screens: a new account asked before
  going on, a rider with no name sent to the prompt from any screen, "Continue" waiting for a
  name, a name that breaks the rule never sent, a refusal and a failed save, Profile's headline,
  the dialog's save, Cancel and Escape, and a refusal that keeps the dialog open. All 146
  behaviour specs, the 126 backend tests, the 1241 unit tests and every check pass.
- Not shown, because not built here: the name on rider cards in grids and boards (AC5, with the
  first screen that draws one), the rider's real level (journey 10), the rest of Profile
  (slice 13.3), and signing out and deleting the account (slice 9.4).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/09-3-choose-a-display-name
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/09-3-choose-a-display-name
node tools/video-build/build.mjs docs/videos/09-3-choose-a-display-name --crf 25
```
