# Slice 2.2 · Check browser support

Telo Ride reaches the bike through Web Bluetooth, so the browser and the page decide whether a ride
can happen (L2-007 to L2-009). Connect Bike now lists the bikes it works with: four Echelon models at
full control and other FTMS smart bikes in beta. In a browser without `navigator.bluetooth` an alert
replaces the device card and says to open Telo Ride in Chrome or Edge, with **Try again**; on a plain
`http` page, where Chromium hides Bluetooth too, the alert offers the same address over HTTPS. In
production the API redirects every plain `http` request to `https` and sends
`Strict-Transport-Security` for a year. Class Start, Custom workout and Custom ride bring their own
notices when they are built (slices 6.3, 21.1 and 21.3).

- **Film:** [`02-2-check-browser-support.mp4`](02-2-check-browser-support.mp4), 1920×1080, 30 fps,
  2 min 25 s, H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-007 AC1 and AC4 (Works with), L2-008 AC1 and AC4 (unsupported
  browser), L2-009 AC2 to AC4 (HTTPS).

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Connect Bike's unsupported-browser alert in a browser window, over the aurora | Wrong browser? **Told why.** |
| 0:10 | 4 | `works` | The Works with list on a phone | Four Echelons, **FTMS in beta.** |
| 0:21 | 4 | `unsupported` | The alert in a browser without Web Bluetooth, on a phone | Safari, Firefox: **Chrome or Edge.** |
| 0:31 | 4 | `retry` | The alert, then the pair button back after Try again | Read again, **pair again.** |
| 0:41 | 4 | `order` | The secure context checked before the browser, drawn | Secure first, **then the browser.** |
| 0:52 | 4 | `https` | The alert on a plain http page, on a phone | Same page, **over HTTPS.** |
| 1:02 | 4 | `redirect` | `curl -i` of a plain http request: 308 to https | Plain http, **sent on.** |
| 1:12 | 4 | `hsts` | `curl -i` of an https request: `Strict-Transport-Security` | A year **of https.** |
| 1:23 | 4 | `deferred` | The ride screens still to bring their notices | The ride screens **bring their own.** |
| 1:33 | 4 | `shell` | Connect Bike growing from 390 through 768 and 1024 to 1440 px, a phone over it | Every width, **the same list.** |
| 1:43 | 4 | `proof` | The two local test runs, and two cards: what the tests prove | Forty-five, **all green.** |
| 1:54 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `unsupported`, `order` and `redirect`, a signal wipe into `https`, and a zoom
through the `deferred` cards into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared
  fixture and page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density. The
  fixture's fake Bluetooth stands in for the browser's: removed for the unsupported browser, and
  removed with `isSecureContext` false for the plain http page. No real bike, Safari or http host
  was involved.
- The `redirect` and `hsts` terminals are real output of `curl -i` against the API built from this
  slice (`dotnet run --no-launch-profile`, `ASPNETCORE_ENVIRONMENT=Production`) with no database
  running, trimmed: the date and server lines are left out and the policy is cut to one directive.
  `Host: ride.telo.test` stands for the site's address, since HSTS leaves `localhost` out.
- The diagram and the cards are drawn.
- **What the tests prove:** seventeen behaviour specs, three of them for this slice
  (`frontend/e2e/browser-support.spec.ts`: L2-007 AC1 and AC4, L2-008 AC1 and AC4, L2-009 AC3 and
  AC4), and twenty-eight backend tests, two of them for this slice
  (`backend/tests/Telo.Ride.Api.Tests/TransportSecurityTests.cs`: L2-009 AC2).

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/02-2-check-browser-support
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/02-2-check-browser-support
node tools/video-build/build.mjs docs/videos/02-2-check-browser-support --crf 23
```
