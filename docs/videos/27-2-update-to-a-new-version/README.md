# Slice 27.2 · Update to a new version

An installed app keeps the version it last loaded. When a new version is deployed, the service worker finds it as the
app opens, and a toast on every screen reads "A new version is ready" and "Reload to use it now, or it opens next
time.", with Reload, which switches to the new version and loads the app again (L2-150 AC2). While a race, class or
custom ride is in progress the toast waits, and nothing reloads; it shows when the ride ends. It stays until Reload or
×.

- **Film:** [`27-2-update-to-a-new-version.mp4`](27-2-update-to-a-new-version.mp4), 1920×1080, 30 fps, 1 min 30 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-150 AC2.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home at 1440 px offering a new version, in a browser window, over the aurora | Every version, **between rides.** |
| 0:10 | 5 | `offer` | A close-up of the toast: "A new version is ready", with Reload | A new version, **offered.** |
| 0:23 | 5 | `ride` | A custom ride with the new version ready and no toast, then Profile after End, with the toast | Never **mid-ride.** |
| 0:36 | 5 | `check` | The update spec failing before the change and passing after, failing again with the ride's hold taken out, and the unit spec passing | The real worker, **a real deploy.** |
| 0:49 | 4 | `widths` | Home with the offer, growing from 390 through 768 and 1024 to 1440 px | The offer, **at every width.** |
| 0:59 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `ride`, a wipe and a push into `check`, and a zoom into `widths`.

## What it proves, and what it does not

- The pictures are screenshots of the production build with its real service worker, taken by [`shots.ts`](shots.ts)
  through the page objects of `e2e/app-update.spec.ts`; a new version is the build's own `ngsw.json` with a change the
  worker sees, as in the spec. The recorder's development server has no worker, so the production build was served on
  its port for the shots. The terminal holds real outputs: the spec before and after, the spec with
  `this.activity.begin()` taken out of the custom ride, and the unit spec.
- **What this slice adds:** `APP_UPDATES` and `RIDE_ACTIVITY` in `api`, `RideInProgress` in `domain`, `SwAppUpdates`,
  `UpdatePrompt` and `provideAppUpdates` on the screens' lazy parent route, the ride stores' `begin` and `end`, the Toast
  component's action, and the Home `update-ready` mock.
- Not shown: a real deploy to a host, and the unrecoverable state, which shows the same toast.
