# Slice 6.3 · Class Start

Class Start at `/classes/:id` (L2-084, L2-085, L2-082 AC4), between the Class Library and the
class ride. Its header holds the lockup and "← Classes", back to the library. The class video
waits parked at its sync offset (0:12 for 30 Minute HIIT Cardio) with YouTube's controls, and
its player goes when the rider leaves. Under it: "GCN Training · 30 min · HIIT", the title and
the summary, then "What the bike will do" with the length, the resistance profile as an image,
and `PlanSummary`'s line "8 × 0:30 · 3:00 → 1:30 recover · ~154 W average", the average being
each segment's target power weighted by its duration. "Video link and sync", collapsed at first,
shows the class on YouTube in a new tab and "Synced from 0:12.0". "How do you want to ride?" has
Ride alone chosen; until group sessions exist (slices 14.2 and 14.3) the group option cannot be
chosen and reads "Group sessions can’t be reached right now." Start class opens the class ride
alone. A locked class's address, or one for a class the catalogue does not hold, opens the
Class Library instead.

- **Film:** [`06-3-class-start.mp4`](06-3-class-start.mp4), 1920×1080, 30 fps, 2 min 25 s,
  H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-084 AC1 to AC3, L2-085 AC1, AC4 and AC5, L2-082 AC4, L2-099 AC3.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Class Start at 1440 px in a browser window over the aurora | One look, **then ride.** |
| 0:10 | 4 | `head` | The class's facts and its back link | Its page, **its facts.** |
| 0:20 | 4 | `plan` | A close-up of "What the bike will do" | What the bike **will do.** |
| 0:30 | 4 | `watts` | Each segment's target power and the weighted average | Weighted, **not guessed.** |
| 0:41 | 4 | `video` | The parked player's video, start, controls and teardown | Parked, **and waiting.** |
| 0:51 | 4 | `sync` | A close-up of "Video link and sync" opened | The link, **the sync.** |
| 1:01 | 4 | `choice` | A close-up of "How do you want to ride?" | Alone, **for now.** |
| 1:12 | 4 | `start` | The class ride Start class opens | Start class, **straight in.** |
| 1:22 | 4 | `locked` | Three addresses and where the guard sends them | Locked, **back to the library.** |
| 1:32 | 4 | `shell` | Class Start growing from 390 through 768 and 1024 to 1440 px, and on a phone | Phone to desktop, **one to two.** |
| 1:43 | 4 | `proof` | The local checks, and two cards: what the tests prove | Through the page, **all green.** |
| 1:53 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `plan`, `watts` and `choice`, a signal wipe into `watts`, and a zoom
through the `locked` scene into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at
  double density. The API fixture serves the catalogue, the Bluetooth fixture the remembered
  bike, and the YouTube fixture the mocks' covers and a fake player, so no request leaves the
  machine. In the running app, 30 Minute HIIT Cardio plays its own GCN video; six other classes
  use stand-in videos (ADR 0028).
- The terminals and cards are drawn from the specs and the code.
- **What the tests prove:** seven behaviour specs (`class-start.spec.ts`,
  `class-start-locked.spec.ts`) cover seven acceptance criteria and nine unit tests cover
  `PlanSummary`; all 56 behaviour specs, the unit tests and every check pass, and the initial
  bundle is 284.44 kB of its 288 kB budget.
- Not shown, because not built here: group sessions, Join and the full and starting-soon states
  (slices 14.2 and 14.3), Full screen (slice 24.2), and the needs-Chromium and needs-HTTPS
  notices, deferred to Connect Bike's own explanation.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/06-3-class-start
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/06-3-class-start
node tools/video-build/build.mjs docs/videos/06-3-class-start --crf 23
```
