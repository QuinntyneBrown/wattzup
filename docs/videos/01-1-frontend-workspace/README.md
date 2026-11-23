# Slice 1.1 · Frontend workspace

Telo Ride starts here: one Angular workspace in `frontend/` with the libraries `api`, `domain` and
`components` and the application `ride`, depending in one direction that lint enforces. The ride
app opens **Home** in the app shell, with the TELO Ride lockup and the main navigation, Home
current. Every colour is a token of the design system and the faces are bundled with the app. An
address that matches no screen shows **Page not found** with **Back to Home**; the first Tab
reaches **Skip to content**. Every screen loads on demand, inside a tight bundle budget.

- **Film:** [`01-1-frontend-workspace.mp4`](01-1-frontend-workspace.mp4), 1920×1080, 30 fps,
  2 min 14 s, H.264 at CRF 23 and AAC, 13 MB. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-146 (frontend workspace), L2-145 (Page not found).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home in a browser window, over the aurora | The ride **starts here.** |
| 0:10 | 4 | `workspace` | The four projects and their arrows, drawn | Four projects, **one way.** |
| 0:21 | 4 | `lint` | A terminal: lint failing on a wrong import and on Web Bluetooth | Lint holds **the line.** |
| 0:31 | 4 | `home` | Home at 1440 px; close-ups of the header and the current item | Home, in **the shell.** |
| 0:41 | 4 | `tokens` | The ink and signal tokens; the three bundled faces | Built from **the system.** |
| 0:52 | 4 | `notfound` | Page not found in a browser window with a phone over it; Back to Home | No dead **ends.** |
| 1:02 | 4 | `keyboard` | Home with Skip to content focused, and its close-up | Tab, then **Enter.** |
| 1:12 | 4 | `sizes` | Page not found growing from 390 through 768 and 1024 to 1440 px | Phone to **desktop.** |
| 1:23 | 4 | `budget` | A terminal: the production build's initial and lazy chunks | Only what **is needed.** |
| 1:33 | 4 | `proof` | Two cards: what the tests prove | Six specs, **all green.** |
| 1:43 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a signal wipe into `home`, a push from `tokens` into `notfound`, and a zoom through
the browser window from `keyboard` into `sizes`.

## What it proves, and what it does not

- Every app picture is a screenshot of the running Angular app, taken by [`shots.ts`](shots.ts)
  with the shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px
  at double density. The fixture fails on any page error or request off this machine. No backend,
  no Bluetooth and no bike ran.
- The diagram, the type specimens and the two terminals are drawn. The lint terminal is the real
  output of `npm run lint` against two files written on purpose to break the rules (a `domain`
  file importing `@telo/components`, and a `ride` file reading `navigator.bluetooth`) and deleted
  afterwards; the paths are shortened to the workspace. The build terminal is the real output of
  `npm run build`, with the budget line from `angular.json` marked as a comment.
- **What the tests prove:** six behaviour specs run against the production build
  (`frontend/e2e/app-shell.spec.ts`, `frontend/e2e/not-found.spec.ts`; L2-146, L2-145): Home with
  the header and Home current, the skip link moving focus, the bundled wordmark face served by
  the app, the design-system colours, Page not found with no current item, and Back to Home.
- The dependency rules are lint, not tests, as ADR 0013 and ADR 0024 decide.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/01-1-frontend-workspace
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/01-1-frontend-workspace
node tools/video-build/build.mjs docs/videos/01-1-frontend-workspace --crf 23
```
