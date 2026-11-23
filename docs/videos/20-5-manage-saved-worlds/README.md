# Slice 20.5 · Manage saved worlds

Settings' This device (L2-165): Saved worlds reads how many worlds this device keeps, the space they take and their
names ("3 worlds · 61 MB"), with Clear saved worlds. Clearing deletes them; the row reads None saved and a toast says
how much was freed, closing after 6 seconds or with ×. Keep worlds after a ride, on by default, saves each world a
class downloads; off, nothing new is saved and the next ride downloads it again. A world the browser evicted to free
space downloads again in World loading, and nothing fails.

- **Film:** [`20-5-manage-saved-worlds.mp4`](20-5-manage-saved-worlds.mp4), 1920×1080, 30 fps, 1 min 43 s, H.264 at CRF
  25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-165 AC1, AC2, AC3, AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Settings at 1440 px open at This device, in a browser over the aurora | Worlds, **kept here.** |
| 0:10 | 5 | `saved` | This device with three saved worlds, and two facts | Three worlds, **61 MB.** |
| 0:23 | 5 | `clear` | After Clear saved worlds, with its toast, at 1440 and 390 px, and three facts | Cleared, **61 MB freed.** |
| 0:36 | 5 | `keep` | World loading with Old Town Criterium downloaded and saved, and what the acceptance tests checked | Keep worlds, **or not.** |
| 0:49 | 4 | `widths` | This device growing from 390 through 768 and 1024 to 1440 px | This device, **at every width.** |
| 0:59 | 5 | `proof` | Settings at 1024 px, and three facts | Evicted? **No harm.** |
| 1:12 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `clear`, a wipe into `keep`, a zoom into `widths`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, through the flows of `e2e/settings-saved-worlds.spec.ts`. The three saved worlds are
  put on the device the way the app keeps them (`saveWorlds`); World loading downloads Old Town Criterium's panorama,
  answered by the spec. The `keep` terminal's lines are what the acceptance tests check.
- **What this slice adds:** `keepWorlds` in the ride settings; `SAVED_WORLDS` in `api`; `CacheStorageSavedWorlds`, and
  the world downloader saving each world's name and size only while the rider keeps worlds, in `domain`; the
  `DeviceSettings`, `Toast` and `ToastRegion` components; `SavedWorldsStore` and its words on Settings. Its 6
  acceptance tests, every behaviour spec, unit test and backend test, and every check pass.
- Not shown: World loading's "18.9 MB" without "saved on this device" with Keep worlds off, which only a 3D world load
  reads, proven by its view's unit test.
