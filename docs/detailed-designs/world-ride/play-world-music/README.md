# Play world music

## Overview

World Ride (L1-017) gives every world a background track of its own (L2-128). The track plays while the ride runs, pauses when it pauses or ends, loops, and stops when the rider leaves. A `Music` toggle in the app bar mutes it, and the choice is kept in the browser for every world.

**world track** — the background track of one world, shipped with the app as `music/<world id>.ogg`

**music on** — the rider's kept choice; on until the rider turns it off

The tracks come from Pixabay under the Pixabay Content License. Soca goes to the Caribbean and carnival worlds first; every other world gets a genre that fits its place. No two worlds share a track. `docs/world-music.md` lists each world's track with its title, artist and Pixabay page. Each file is the Pixabay MP3 re-encoded as Opus at 48 kbps mono, cut to at most 3 minutes with a short fade at each end so the loop does not click.

## Description

### Files (`frontend/public/music/`, new)

- One `<world id>.ogg` per world of L2-101, copied into the build beside `index.html`, so a track is served from the app's own origin (L2-128 criterion 8). The Content-Security-Policy's `default-src 'self'` already allows it; nothing is added to it.
- `ngsw-config.json` gains an asset group `music`, `installMode: lazy`, `updateMode: lazy`, for `/music/**`. A track is downloaded only when its world opens, and kept once played, so it plays offline from then on.
- `staticwebapp.config.json` excludes `/music/*` from the navigation fallback and serves `.ogg` as `audio/ogg`.

### Frontend (`frontend/projects/wattzup/src/app/`, with presentation in `frontend/projects/components/`)

**Pure rules (`core/world-music.ts`, new, with `world-music.spec.ts`).**
- **`worldTrack(id)`** returns `music/<id>.ogg`, relative to the document's base.
- **`musicPlays(status, on)`** returns `true` only when `on` and `status` is `running`. Every other status (`paused`, `paused: bike disconnected`, `ended`, `ended: bike shut off`, `stopped`, none) returns `false` (L2-128 criteria 2 and 3). The spec has one case per status, with music on and off.

**Kept choice (`core/music-preference.ts`, new, with its spec).**
- **`MusicPreference`**, an injectable service, holds `on`, a signal. It reads `wattzup.music` from `localStorage` through `SafeStorage`, as `ThemeService` does. A missing or unreadable value is `on` (L2-128 criterion 5). `toggle()` flips it and writes `'on'` or `'off'`.

**Player (`core/world-music-player.ts`, new).**
- **`WorldMusicPlayer`**, provided by `WorldRidePage`, owns one `HTMLAudioElement` with `loop = true` and `volume = 0.5` (L2-128 criterion 2). Nothing else in the app creates audio for music.
- `load(id)` sets the source to `worldTrack(id)` once, when the world is known.
- `sync(shouldPlay)` calls `play()` or `pause()`. Pausing keeps the position, so `running` again carries on where it paused (criterion 3).
- When `play()` rejects with `NotAllowedError` (no interaction with the page yet), it listens once for the next `pointerdown` or `keydown` on the document and tries again (criterion 6). The toggle keeps reading on.
- `destroy()` pauses the track and drops its source; `WorldRidePage` calls it on destroy, so leaving World Ride stops the music (criterion 7).

**Presentation (`WorldRide`, `components/src/lib/world-ride/`).**
- A new input, `musicOn: boolean`, and output, `musicToggled`.
- The app bar gains a `btn btn--quiet btn--collapsible` button before Pause, named `Music`, with `aria-pressed` set from `musicOn`. Its icon is `volume` while on and `volume-off` while off, both new names in `wz-icon` drawn from the mock's paths. Its label `Music` collapses under 768 px like Pause, and it stays a 44 × 44 px target (L2-128 criterion 4, L2-103 criterion 4).

**Page (`WorldRidePage`).**
- Injects `MusicPreference` and provides `WorldMusicPlayer`.
- An effect loads the world's track once the world is shown, and another calls `sync(musicPlays(status, on))` on every state and every toggle.
- `musicToggled` calls `MusicPreference.toggle()`.

### Screen states

| Mock | State |
|---|---|
| `pages/world-ride/default` and every world | `Music` pressed, speaker icon |
| `pages/world-ride/muted` | `Music` not pressed, muted-speaker icon |

### Acceptance tests

Playwright (`frontend/e2e/`, Chromium only). The behaviour specs launch Chromium with `--autoplay-policy=no-user-gesture-required`, so the track can start without a real gesture; criterion 6 is covered by the unit test of `WorldMusicPlayer`. The page object `world-ride.page.ts` gains `musicButton` and `music`, an evaluation of the page's audio element (`src`, `paused`, `loop`, `volume`).

- Spec `e2e/world-ride.spec.ts`:
  - `plays the world's own track while the ride runs, looping at half volume` (L2-128 AC2)
  - `pauses the track while paused and carries on when running` (L2-128 AC3)
  - `mutes and unmutes with the Music toggle` (L2-128 AC4)
  - `keeps music off across a reload` (L2-128 AC5)
  - `stops the track on leaving World Ride` (L2-128 AC7)

Unit tests:
- `world-music.spec.ts`: one case per status, music on and off; `worldTrack`.
- `music-preference.spec.ts`: default on, toggle, kept, unreadable storage.
- `world-music-player.spec.ts`: play, pause, retry after `NotAllowedError` on the next press, destroy.

L2-128 criterion 1 (one track per world, none shared) is checked when the tracks are added: `docs/world-music.md` lists one row per world, and the build fails a world with no file only at runtime, so the list is the record. Criterion 8's offline behaviour belongs to the offline sweep, run when a person asks.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-128` | `L1-017` | World Ride music. Each world plays its own Pixabay track while the ride runs, pauses with the ride, loops, and stops on leaving; a `Music` toggle mutes it and the choice is kept. |
| `L2-103` | `L1-017` | World Ride app bar. The toggle joins the app bar's controls. |
| `L2-101` | `L1-017` | The scenes. One track per world. |
