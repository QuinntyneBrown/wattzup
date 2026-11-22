# Slice 17.3 · Offline choices

While the network is down, a riders-online race and a group class cannot be joined, and the screen says why the moment
the browser goes offline (L2-135 AC4). On Race Setup, Riders online reads "You’re offline. Riders online needs a
network." and Bots, the default, is chosen in its place; on Class Start, Ride with a group reads "You’re offline. Group
classes need a network." and Ride alone is chosen. Offline, neither screen asks the service anything; back online, both
ask again at once and the choice opens. `BrowserNetworkStatus` follows the window's `online` and `offline` events on the
screens' lazy parent route, and `multiplayerAvailability` decides open, offline or unreachable. The first bundle stays
at 277.44 kB.

- **Film:** [`17-3-offline-choices.mp4`](17-3-offline-choices.mp4), 1920×1080, 30 fps, 1 min 56 s, H.264 at CRF 25 and
  AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-135 AC4.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Race Setup offline at 1440 px in a browser, over the aurora | Offline? **Say why.** |
| 0:10 | 5 | `race` | Two facts, beside Race Setup's race modes online and offline, close up | Riders online, **closed offline.** |
| 0:23 | 5 | `class` | Two facts, beside Class Start offline and its choice close up | Group closed, **ride alone.** |
| 0:36 | 5 | `back` | Race Setup's queue as the spec saw it online, offline and online again, beside Race Setup online | Back online, **open again.** |
| 0:49 | 5 | `words` | Three facts on the rule, beside the network status as the unit tests saw it | One rule, **said in words.** |
| 1:01 | 5 | `widths` | Race Setup offline growing from 390 through 768 and 1024 to 1440 px | Offline, **at every width.** |
| 1:14 | 4 | `proof` | The local checks, and three cards: what the tests prove | Closed offline, **saying why.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `class`, a wipe into `back`, a push into `words`, a zoom into `widths`, and a push into
`proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared fixture and the
  page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density: Race Setup on Old Town Criterium for
  a level-7 rider with three riders queuing, then with the browser taken offline; and Class Start for 30 Minute HIIT
  Cardio with its next group session chosen, then offline. The terminal lines are what the specs and unit tests saw.
- **What the tests prove:** `offline-choices.spec.ts` (2 tests), written first and seen failing on the missing words,
  shows both screens closing their choice with its reason the moment the browser goes offline, falling back to Bots or
  Ride alone, and opening again online, with Race Setup asking for the queue once more at once. The unit tests show the
  network status following the window's events and stopping with its owner, and the rule's four cases. All 270
  behaviour specs, the 1585 unit tests, the 457 backend tests and every check pass.
- Not shown, because not built here:
  - A live race or group class that loses the network partway through: the hub's reconnect and leave rules (slices
    12 and 14) still apply there.
  - The update prompt for a new deploy (27.1).
