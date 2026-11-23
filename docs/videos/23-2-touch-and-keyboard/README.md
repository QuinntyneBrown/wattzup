# Slice 23.2 · Touch and keyboard

Every control on every screen takes a tap across at least 44 × 44 px, and 48 × 48 px on a race, a class ride or a
custom ride on a phone, whatever size it is drawn (L2-140 AC2). At a desk, Tab stops on each control in turn, each in
view with its focus ring (AC1). The first run found 34 controls a tap could miss on five screens: Settings' side nav,
segmented options, switches, ranges and select; the Class Library's "All" tab; the custom workout's ranges and switch;
the class ride's Pause and Leave; and the custom ride's header links, Full screen and view tab.

- **Film:** [`23-2-touch-and-keyboard.mp4`](23-2-touch-and-keyboard.mp4), 1920×1080, 30 fps, 1 min 56 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-140 AC1, AC2.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home with its focus ring in a browser, and Settings on a phone, over the aurora | Tap. **Tab.** |
| 0:10 | 5 | `taps` | Settings' Sound section at 390 px, then with the 44 px square each control is tapped across drawn over it | A thumb, **not a pixel.** |
| 0:23 | 5 | `found` | The spec's first run: the controls a tap missed on five screens | Thirty-four **misses.** |
| 0:36 | 5 | `ride` | The class ride at 390 px, its 48 px header, and the custom ride's 48 px squares | Forty-eight **pixels.** |
| 0:49 | 5 | `focus` | Home at 1440 px with the race button focused, and a class card's ring around its cover | Every stop, **a ring.** |
| 1:01 | 5 | `proof` | The focus style taken out for one run, failing every screen, and the spec passing again | Tapped and **tabbed.** |
| 1:14 | 4 | `widths` | Settings growing from 390 through 768 and 1024 to 1440 px | Settings, **at every width.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `found`, a wipe and a push into `focus`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) through the screens of
  `e2e/touch-and-keyboard.spec.ts` (`e2e/fixtures/screens.ts`); each phone screen is first checked to have no control a
  tap misses. The dashed squares are drawn over the page by the film, one per control in view, at the size the spec
  taps across; the app does not draw them. The fake Bluetooth stack and the API fixture stand in for the bike and the
  backend. The terminals hold the real first run of the spec and the run with the global `:focus-visible` outline taken
  out by hand, then put back.
- **What this slice adds:** `e2e/touch-and-keyboard.spec.ts`, with `AppDocument.untappable` and `AppDocument.tabStops`;
  tap areas for the side nav, segmented option, switch, ranges, select and Class Library tab; the ride target (48 px)
  for every tap area on a ride page below sm; the class ride's 48 px Pause and Leave; and the same rules in the design
  system. Every check passes.
- Not shown: hover only on buttons and links (AC3) and the skip link (AC4, `e2e/app-shell.spec.ts`); the level bars,
  exempt because the resistance stepper sets the same levels; screen readers and motion (slice 23.3).
