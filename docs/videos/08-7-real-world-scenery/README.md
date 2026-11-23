# Slice 8.7 · Real-world scenery

Old Town Criterium follows a real place, the streets of Bruges. While its world draws, the race
offers to stream the real Bruges, Steenstraat to the Markt, as Google's photorealistic 3D Tiles
with the rider's own Google Maps Platform key (L2-066). The key stays in this browser and goes
only to Google's Map Tiles API, never to Telo Ride's backend. A refused key leaves the built-in
world and the panel says so; accepted, the tiles stream beside the world and the panel credits
Google. A stored key fills the field on the next race, and nothing streams until "Stream it".
`main` has no tiles, so the layer is new: `3d-tiles-renderer` 0.5.4 (ADR 0021's amendment),
imported only on "Stream it", with Three.js's own Draco decoder served from the app.

- **Film:** [`08-7-real-world-scenery.mp4`](08-7-real-world-scenery.mp4), 1920×1080, 30 fps,
  1 min 43 s, H.264 at CRF 25 and AAC. No captions in the picture;
  [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-066 AC1 to AC5, AC7 to AC9; L2-131 AC1.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | A solo race on Old Town Criterium offering the real Bruges, 1440 px, over the aurora | A real place, **your own key.** |
| 0:10 | 4 | `offer` | The scenery panel over the drawn world | Ride the real **Bruges.** |
| 0:20 | 4 | `key` | Where the key goes: this device and Google's tiles, never the backend | Your key goes **to Google only.** |
| 0:30 | 4 | `refused` | The panel after Google refused the key, the world still drawn | Refused? **The world stays.** |
| 0:41 | 4 | `streaming` | The panel streaming, crediting Google | Streaming, **credited.** |
| 0:51 | 4 | `shell` | The offer growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **clear of the HUD.** |
| 1:01 | 4 | `proof` | The local checks, and three cards: what the tests prove | Through the page, **all green.** |
| 1:12 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `key`, a wipe into `refused`, and a zoom through the `streaming` scene
into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. Google's Map Tiles API is the shared fixture's `mapTiles`, which accepts the key with a
  root tileset holding no tiles, or refuses it with 403, so no request leaves the machine and no
  real tile is drawn.
- The terminal and cards are drawn from the specs, the build and the code.
- **What the tests prove:** six behaviour specs (`race-scenery.spec.ts`), each seen failing
  first: the offer's words, the field and "Stream it" disabled while empty; no panel on a map
  with no real place or over the panorama; streaming sends the key to `tile.googleapis.com` and
  stores it on this device, with no other request carrying it, and credits Google; a refusal
  marks the field invalid and keeps the world; a stored key fills the field and nothing streams.
  The catalogue's real place and the widened Content Security Policy are proved through the API.
  All 120 behaviour specs, the 59 backend tests, the 1195 unit tests and every check pass.
- Not shown, because not built here: real tiles of Bruges (the specs stop at Google's root
  tileset), and lining the tiles' streets up with the built-in road, which the design leaves
  open.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/08-7-real-world-scenery
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/08-7-real-world-scenery
node tools/video-build/build.mjs docs/videos/08-7-real-world-scenery --crf 25
```
