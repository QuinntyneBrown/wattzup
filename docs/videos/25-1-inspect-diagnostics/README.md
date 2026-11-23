# Slice 25.1 · Inspect diagnostics

Diagnostics opens as a modal dialog from Profile's bike row, once a bike is paired, and from the custom ride's bike
status; the app behind it is inert, and Escape or "Close diagnostics" gives the focus back (L2-113 AC1). With a bike
connected it reads the browser, Web Bluetooth, the page, the bike and its link, the last command and its
acknowledgement, the reconnects this ride, the rides waiting to send and the app version (AC2). With no bike picked the
link facts step aside (AC3); with Bluetooth off it says so and when the bike was last seen (AC4). Everything is read in
the browser and stays on the device (AC5).

- **Film:** [`25-1-inspect-diagnostics.mp4`](25-1-inspect-diagnostics.mp4), 1920×1080, 30 fps, 1 min 46 s, H.264 at
  CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-113 AC1 to AC5.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The custom ride at 1440 px with Diagnostics open, in a browser window, over the aurora | What the browser **sees.** |
| 0:10 | 5 | `open` | A close-up of the custom ride's bike status, and Profile on a phone | The status **opens it.** |
| 0:23 | 6 | `facts` | A close-up of the facts of a connected bike: browser, Web Bluetooth, page, bike, connection, last command, reconnects, rides waiting, app version | Every fact, **read here.** |
| 0:38 | 5 | `missing` | The facts with no bike picked, and Profile on a phone with Bluetooth off and the bike last seen 2 days ago | No bike, **no adapter.** |
| 0:51 | 5 | `proof` | The spec's 4 failures before the change, its 4 passes after, and the unit tests' 1885 passes | Failing first, **passing now.** |
| 1:04 | 4 | `widths` | Diagnostics over Profile growing from 390 through 768 and 1024 to 1440 px | Diagnostics, **at every width.** |
| 1:14 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `facts`, a push into `missing`, a wipe into `proof`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) through the page objects of
  `e2e/diagnostics.spec.ts`. The fake Bluetooth stack and the API fixture stand in for the bike and the backend, so the
  browser reads "Chromium" and the commit "dev". The terminals hold the spec's real run before the change and after, and
  the unit tests' run.
- **What this slice adds:** the `Diagnostics`, `ConnectionHistory` and `BUILD_INFO` contracts in `api`;
  `diagnosticsFacts()`, `BrowserDiagnostics` and `BikeConnectionHistory` in `domain`; `DiagnosticsPanel` in
  `components`; `DiagnosticsDialog` and `openDiagnostics()` in `ride`; the custom ride's bike status as a button; the
  Profile and Settings bike rows as buttons once a bike is paired; `RememberedBike.lastSeen()`. Every check passes.
- Not shown: Signal, which no browser this app runs in reports for a connected bike; the packet log, which is slice
  25.2's.
