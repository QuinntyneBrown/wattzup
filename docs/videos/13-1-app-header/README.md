# Slice 13.1 · App header

Home, Map Select, the Class Library, Profile and Page not found share one header (L2-032). Earlier
slices built the lockup, the navigation "Main", the bike status, the streak and the level link.
This slice adds Full screen at the end of the header (L2-144). `FullscreenToggle` draws the
mocks' edge icon button. It reads "Full screen" with the expand corners, and "Exit full screen"
with the minimize corners while the app is in full screen; a new mock,
`docs/mocks/pages/home/full-screen.html`, shows that state. The main shell shows the button only
where the browser has the Fullscreen API. It calls `BrowserFullscreen`, bound on the shell's
route, whose `active` follows `fullscreenchange`, so leaving with Esc is noticed too. A new spec
also checks that each shell page marks its own item current, and checks the phone layout of
L2-032 AC4. The Home mocks' streaks now carry over to the mid rider's and veteran's fixtures.

- **Film:** [`13-1-app-header.mp4`](13-1-app-header.mp4), 1920×1080, 30 fps, 1 min 50 s, H.264
  at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for
  a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-032 AC1, AC2, AC4, L2-144 AC1, AC2.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Map Select for the mid rider at 1440 px in a browser, over the aurora | One header, **every page.** |
| 0:10 | 5 | `fullscreen` | The header's end with Full screen, and in full screen with Exit full screen | Full screen, **one press.** |
| 0:23 | 5 | `current` | The header on Map Select, the Class Library and Profile, each with its item current | Where you are, **marked.** |
| 0:36 | 4 | `level` | The header's end: bike, 4-day streak, level 7 and its XP | Level 7, **4-day streak.** |
| 0:46 | 4 | `phone` | The header at 390 px: the navigation on its own row, the badge alone | On a phone, **its own row.** |
| 0:56 | 5 | `widths` | Map Select growing from 390 through 768 and 1024 to 1440 px | One header, **every screen.** |
| 1:09 | 4 | `proof` | The local checks, and three cards: what the tests prove | Full screen, **everywhere.** |
| 1:19 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `current`, a wipe into `level`, a zoom out of `phone` and into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The rider is the mocks' mid rider, served by the fixture with a remembered bike.
- **What the tests prove:** the behaviour spec (`app-header.spec.ts`) has four tests:
  - Full screen enters full screen; the button then reads Exit full screen, and pressing it
    leaves. This test failed first, because the button was missing.
  - Where `document.fullscreenEnabled` is false, the button is absent.
  - Map Select, the Class Library and Profile each mark their own item current and offer Full
    screen. This test failed first.
  - On a phone the navigation sits on its own row of four equal items under the lockup, and the
    level shows only its badge.

  `BrowserFullscreen`'s unit spec covers five cases: available or not, enter and exit, active
  following the browser, a refused request, and no listening once its owner goes. All 186
  behaviour specs, the 1346 unit tests, the 322 backend tests and every check pass, and the
  initial bundle stays at 300.20 kB.
- Not shown, because not built here: Full screen in the page headers outside the shell (Race
  Setup, Class Start, Results and the rides), which slice 24.2 adds, and Home's next ride (slice
  13.2), which is why the widths scene grows Map Select.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/13-1-app-header
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/13-1-app-header
node tools/video-build/build.mjs docs/videos/13-1-app-header --crf 25
```
