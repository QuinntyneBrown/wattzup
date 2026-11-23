# Slice 13.2 · Choose the next ride

Home fills in (L2-033 to L2-036). It greets the rider by the time of day, or welcomes a new rider.
Its Next ride card offers the map the backend chose: the race that opens the next map, the map it
opens with its place, and the rider's best there. A level goal reads the levels still to climb,
and with every map open the card asks for one more star on the map with the fewest. The Race
door counts the open maps and stars and has tiles for the first four maps; an open tile opens
Race Setup and a locked one opens Map Select. The Classes door features the first open class on
the 30 min shelf, 30 Minute HIIT Cardio, with Ride alone. When a ride has opened a map, a gold
banner announces it once; Home tells the backend it was seen. The backend gained the map to
offer, the unannounced unlock, `POST /api/progress/unlocks/{mapId}/seen`, and a level goal's
level in the map catalogue.

- **Film:** [`13-2-home-next-ride.mp4`](13-2-home-next-ride.mp4), 1920×1080, 30 fps, 2 min 6 s,
  H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside
  it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-033 AC1 to AC6, L2-034, L2-035 AC1, AC2 and AC3 (Ride alone), AC4,
  L2-036.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Home for the mid rider at 1440 px in a browser, over the aurora | What to ride, **next.** |
| 0:10 | 5 | `card` | The Next ride card: top 3 on Old Town Criterium opens Neon Docklands, best 27:10 | Your next ride, **chosen.** |
| 0:23 | 5 | `newrider` | A new rider's welcome and Prairie Paceline; a level goal, 3 to go | New or levelling, **a way on.** |
| 0:36 | 5 | `race` | The Race door: 3 of 7 maps, 5 of 21 stars, four tiles, one locked | Four maps, **one glance.** |
| 0:49 | 4 | `classes` | The Classes door: 30 Minute HIIT Cardio with Ride alone | A class, **ready to ride.** |
| 0:59 | 5 | `banner` | The gold banner for Neon Docklands, over Home with the card on Cliffside Coast | A new map, **announced once.** |
| 1:12 | 5 | `widths` | Home growing from 390 through 768 and 1024 to 1440 px | One Home, **every screen.** |
| 1:25 | 4 | `proof` | The local checks, and three cards: what the tests prove | The right ride, **every rider.** |
| 1:35 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `newrider`, a wipe into `race`, a zoom out of `banner` and into
`widths`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density, with the clock at 7:30 PM. The rider is the mocks' mid rider, "Sam", served by the
  fixture with a remembered bike.
- **What the tests prove:** four behaviour specs, each written first and seen failing on an
  empty Home:
  - `home-next-ride.spec.ts` (6 tests): the evening greeting and the mid rider's card with Race
    Old Town Criterium opening Race Setup in Bots; morning and afternoon; the new rider's welcome
    with Prairie Paceline and no best; a level goal "Reach rider level 10 · 3 to go"; every map
    open, "Earn 2★ on Dolomites"; the 3 : 2 split at lg and no overflow on a phone.
  - `home-race-door.spec.ts` (4 tests): the counts, the four tiles and their stars, an open tile
    to Race Setup; All maps to Map Select; a locked tile's name and its link; four across from
    sm and two on a phone.
  - `home-classes-door.spec.ts` (3 tests): the featured class with Ride alone opening Class
    Start with alone chosen; All classes to the Class Library; the doors side by side at lg and
    stacked below.
  - `home-unlocked-banner.spec.ts` (2 tests): the banner above a card that has moved on, Ride
    it to Race Setup, and the seen request; no banner on the next visit.

  The backend's acceptance tests through the API cover the map to offer for each kind of rider,
  the unannounced unlock and marking it seen, and the catalogue's level; `NextRideRuleTests`
  covers the rule row by row. Unit specs cover the greeting, the card's words, the Race door,
  the featured class, the banner's words and the store's seen-once rule. All 201 behaviour
  specs, the 1371 unit tests, the 335 backend tests and every check pass, and the initial
  bundle stays at 300.21 kB.
- Not shown, because not built here: group sessions on Home ("Next group class starts in 9 min",
  the seats and Join group), which slice 14.2 brings; until then the Classes door follows
  `docs/mocks/pages/home/no-groups.html`.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/13-2-home-next-ride
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/13-2-home-next-ride
node tools/video-build/build.mjs docs/videos/13-2-home-next-ride --crf 25
```
