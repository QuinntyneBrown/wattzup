# Slice 27.1 · Installable app

Chrome and Edge can install Telo Ride (L2-150 AC1). `index.html` links a web app manifest that names the app "Telo
Ride", opens it at `/` in its own window (`standalone`), sets the dark ink `#0a0b0d` as its theme and background colour,
and lists PNG icons of 192 px and 512 px and a maskable one of 512 px, drawn from the logo mark on ink. The page's
`theme-color` is the same ink, the service worker prefetches the manifest and icons with the app shell, and the API
that hosts the build answers both with their types.

- **Film:** [`27-1-installable-app.mp4`](27-1-installable-app.mp4), 1920×1080, 30 fps, 1 min 30 s, H.264 at CRF 25
  and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-150 AC1.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home at 1440 px in a browser window, over the aurora, after Chromium found the app installable | One tap **from the bike.** |
| 0:10 | 5 | `manifest` | The web app manifest, from `cat`, with its icons' sizes shortened | Named, **and dressed in ink.** |
| 0:23 | 5 | `icons` | The three icons the manifest lists: 192 px, 512 px, and 512 px maskable shown in a circle mask | The mark, **at every mask.** |
| 0:36 | 5 | `check` | The install spec failing before the manifest and passing after, and the hosting tests passing | Chromium says: **installable.** |
| 0:49 | 4 | `widths` | Home growing from 390 through 768 and 1024 to 1440 px | Home, **at every width.** |
| 0:59 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `icons`, a wipe and a push into `check`, and a zoom into `widths`.

## What it proves, and what it does not

- The Home pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) after it asked Chromium, through
  the page object of `e2e/install.spec.ts`, for the app's installability errors and got none. The icons are the
  committed PNGs, copied as they are. The terminals hold real outputs: the manifest (its icon list shortened with
  "…"), and the install spec and hosting tests before the change and after.
- **What this slice adds:** `manifest.webmanifest`, the three icons and their SVG sources with
  `tools/icons/render-icons.mjs`, the manifest link and `theme-color` in `index.html`, the manifest and icons in the
  service worker's prefetched `app` group, and the design system's App icon section. Every check passes.
- Not shown: the browser's own install prompt and the installed window, which a headless browser cannot open; the
  offer to reload into a new version, which is slice 27.2.
