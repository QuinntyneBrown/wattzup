# Slice 23.1 · Fit every width

Every screen fits every width from 320 to 2560 px without scrolling sideways (L2-139 AC1). Fifteen screens, from Home
to a race, a class ride and a custom ride, are opened at the narrowest and the widest on every run. The one that did not
fit, the custom ride at 320 px, now wraps End under its clock. The page margin is 16 px on a phone, 24 px from sm and
32 px from lg, and content stops at 80 rem, centred (AC2). The responsive sweep through every breakpoint between is
written, and runs only when a person asks.

- **Film:** [`23-1-fit-every-width.mp4`](23-1-fit-every-width.mp4), 1920×1080, 30 fps, 1 min 53 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-139 AC1, AC2.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home at 2560 px in a browser over the aurora | 320 to **2560.** |
| 0:10 | 5 | `narrow` | Home, Map Select, Settings and Results on phones at 320 px | Nothing scrolls **sideways.** |
| 0:23 | 5 | `found` | The spec failing on the custom ride at 320 px, and its clock and buttons wrapped | Five pixels **too wide.** |
| 0:36 | 5 | `margins` | The page container measured at 320, 640, 1024 and 2560 px, and the margin mutation | 16, 24, 32, **and 80 rem.** |
| 0:49 | 4 | `wide` | Home at 2560 px, its content centred at 80 rem | Wide, **not stretched.** |
| 0:59 | 5 | `proof` | The width spec's run, and the responsive sweep a person runs | Fifteen screens, **both ends.** |
| 1:12 | 4 | `widths` | The custom ride growing from 390 through 768 and 1024 to 1440 px | The custom ride, **at every width.** |
| 1:22 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `found`, a wipe and a push into `wide`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) through the screens of
  `e2e/fit-every-width.spec.ts` (`e2e/fixtures/screens.ts`), each checked not to scroll sideways first; the fake
  Bluetooth stack and the API fixture stand in for the bike and the backend. The terminals hold the real failure of the
  spec before the fix and of the margin mutation, put in by hand for one run and taken out.
- **What this slice adds:** `e2e/fit-every-width.spec.ts` and the shared screens table; the page container's
  measurements on `AppDocument`; the responsive sweep (`e2e/sweeps/responsive.sweep.ts`,
  `playwright.sweeps.config.ts`, `npm run sweep:responsive`); and the wrapping `ride-header__end`, in the mock's design
  system and the component. Every check passes.
- Not shown: the responsive sweep's run, which waits for a person; each screen's own breakpoint changes (AC3), proved by
  its slice's specs; targets, focus and keyboard paths (slice 23.2).
