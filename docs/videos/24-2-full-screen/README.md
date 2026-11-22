# Slice 24.2 · Full screen

Every page header the mocks draw now offers Full screen, which fills the display and then reads "Exit full screen"
(L2-144 AC1): the race, the class ride, Class Start, Race Setup, Results and Connect Bike join Home, the shell's pages,
the race lobby and the custom ride and workout. Where the browser has no Fullscreen API no header offers it (AC2); the
custom ride and workout used to show it anyway.

- **Film:** [`24-2-full-screen.mp4`](24-2-full-screen.mp4), 1920×1080, 30 fps, 1 min 40 s, H.264 at
  CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-144 AC1, AC2.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | A race at 1440 px in a browser window, over the aurora | Fill the screen, **from any page.** |
| 0:10 | 5 | `race` | Close-ups of the race bar's end: Full screen, then Exit full screen in full screen | Full screen, **then Exit.** |
| 0:23 | 5 | `everywhere` | A class ride at 1440 px, and Results, Connect Bike and Class Start on phones | Every header **the mocks draw.** |
| 0:36 | 5 | `absent` | The spec's 9 failures before the change, two of them the custom ride and workout showing it without the API | No API, **no button.** |
| 0:49 | 4 | `proof` | The spec's 28 passes | Pressed in, **pressed out.** |
| 0:59 | 4 | `widths` | Race Setup growing from 390 through 768 and 1024 to 1440 px | Race Setup, **at every width.** |
| 1:09 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `everywhere`, a wipe and a push into `absent`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) through the shared screens table
  and `AppDocument`, the page object of `e2e/full-screen-everywhere.spec.ts`. The fake Bluetooth stack and the API
  fixture stand in for the bike and the backend. The terminals hold the spec's real run before the change and after.
- **What this slice adds:** `FullscreenButton` (`wz-fullscreen-button`) in the `ride` application, projected into the
  race bar, the class header, Class Start's and Race Setup's headers and Results' header (which gains an end slot);
  Connect Bike's header with the lockup; `fullscreenAvailable` on the custom ride's and workout's headers. Every check
  passes.
- Not shown: sign-in, whose mock has no Full screen; the world loading screen, which is not yet in the screens table.
