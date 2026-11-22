# Slice 24.1 · Switch theme

Telo Ride is dark unless the device asks for light, and now each device sees its theme from the first paint, before
the app's scripts run: the served page no longer forces dark (L2-143 AC1, AC2). Every text role (fg, muted, faint and
each `-fg` accent) reads at 4.5:1 or more on ink, panel and raised in both themes (L2-141 AC5); three pairs read 4.48
and two tokens moved. Colours come only from role tokens (AC3).

- **Film:** [`24-1-switch-theme.mp4`](24-1-switch-theme.mp4), 1920×1080, 30 fps, 1 min 40 s, H.264
  at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-143 AC1, AC2, AC3; L2-141 AC5; L2-164 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home on a phone that asks for dark and one that asks for light, over the aurora | Dark beside the bike, **light when asked.** |
| 0:10 | 5 | `first` | The spec failing on a light device's dark first paint, the index.html change, and Home in light | Light from **the first paint.** |
| 0:23 | 5 | `contrast` | The three text pairs at 4.48:1 on raised, and the two token changes that bring them past 4.5 | 4.5 : 1, **both themes.** |
| 0:36 | 5 | `choice` | Settings' Theme choice in light on a phone | Match device, **Dark or Light.** |
| 0:49 | 4 | `ride` | The custom ride in light at 1440 px, overlapped by Home in dark on a phone | A ride, **in light.** |
| 0:59 | 4 | `widths` | Home in light growing from 390 through 768 and 1024 to 1440 px | Home in light, **at every width.** |
| 1:09 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `contrast`, a wipe and a push into `choice`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) through the fixtures and page
  objects of `e2e/theme.spec.ts`, with the device's colour scheme emulated. The fake Bluetooth stack and the API fixture
  stand in for the bike and the backend. The terminals hold the spec's real failures before the fix.
- **What this slice adds:** `index.html` without `data-theme`; `--palette-signal-bright` (#ff5233) as dark
  `--color-volt-fg`; `--palette-green-deep` at #04704f; the same in the design system's tokens, `tokens.json` and its
  contrast table (raised rows); `e2e/theme.spec.ts` with `AppDocument.firstPaint` and `lowContrast`. Every check passes.
- Not shown: "no preference" itself, which Chromium reports as light (L2-143 AC1 now reads "asks for dark, or the
  browser cannot tell"); a stored Dark or Light choice opposite to the device still paints the device's theme until
  the app runs.
