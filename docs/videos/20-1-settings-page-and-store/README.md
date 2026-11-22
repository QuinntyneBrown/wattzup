# Slice 20.1 · Settings page and store

Telo Ride's Settings page at `/settings` (L2-158), opened from Profile's "Ride settings" row with Profile current in
the header. It has five section landmarks (World, Sound, Motion and display, Bike, This device) and a "Settings
sections" nav that goes to each. A change applies at once with no Save and is kept in this browser for this device
only. A malformed stored setting reads as its recommended value, Reset to recommended puts every setting back, and when
the browser refuses storage a warning says so and every control still works. The first control is Keep the screen
awake, which a class ride or race follows (L2-164 AC5); slices 20.2 to 20.5 fill the other sections.

- **Film:** [`20-1-settings-page-and-store.mp4`](20-1-settings-page-and-store.mp4), 1920×1080, 30 fps, 1 min 41 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-112 AC1, L2-158 AC1, AC2, AC3, AC6, AC7, L2-164 AC5.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Settings at 1440 px in a browser, over the aurora | Tuned on this device, **applied at once.** |
| 0:10 | 5 | `measure` | Profile's Settings rows, Ride settings hovered | From Profile, **to Settings.** |
| 0:23 | 5 | `budget` | Three facts about the sections, beside Settings at 1024 px | Five sections, **one nav.** |
| 0:36 | 5 | `world` | Keep the screen awake off, and what this browser then keeps | No Save. **It just applies.** |
| 0:49 | 4 | `widths` | Settings growing from 390 through 768 and 1024 to 1440 px | One page, **at every width.** |
| 0:59 | 4 | `proof` | The warning when the browser refuses storage, and three cards | Reset, or **keep it for the tab.** |
| 1:09 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `budget`, a wipe into `world`, a zoom into `widths`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, through the flows of `e2e/settings.spec.ts`: Profile's rows, Settings at 390, 768,
  1024 and 1440 px, Keep the screen awake off and back on after Reset to recommended, and the page under refused
  storage. The wake-lock line in the `world` terminal is what the acceptance test checks: a class ride with the switch
  off asks for no lock.
- **What this slice adds:** the page, its store (`RIDE_SETTINGS`, `LocalRideSettingsStore`, `parseRideSettings`) and
  the components `Switch`, `SwitchRow`, `SideNav`, `SideNavLink`, `SettingsSection`, `Setting` and `SettingsReset`.
  Its 7 acceptance tests, all 285 behaviour specs, the 1597 unit tests, the 459 backend tests and every check pass.
- Not shown, because deferred: the World, Sound, Motion and display and This device controls of slices 20.2 to 20.5,
  and the bike row's Diagnostics (slice 25.1).
