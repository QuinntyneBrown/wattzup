# Slice 13.3 · Show the profile

Profile fills in (L2-109, L2-112 AC1, AC2). Its headline is the level disc beside "Sam · Level 7",
an XP bar named "1,840 of 2,600 XP" and the line "760 XP to level 8 · 23 rides · 412 km · 4-day
streak"; a new rider reads level 1, 0 rides and 0 km. Settings lists the paired bike with its
state and "diagnostics", "Ride settings" with "Quality, sound and display" and "Custom workout"
with "Build your own intervals", before the display name, Sign out and Delete my account. With
no bike paired the row reads "No bike yet" and goes to Connect Bike. From lg (1024 px) Settings
sits beside the rider in a 340 px column. The backend's progress gained the rider's ride count
and kilometres.

- **Film:** [`13-3-show-the-profile.mp4`](13-3-show-the-profile.mp4), 1920×1080, 30 fps, 1 min
  51 s, H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is
  beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-109 AC1, AC2, L2-112 AC1, AC2.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | Profile for the mid rider at 1440 px in a browser, over the aurora | Your record, **one place.** |
| 0:10 | 5 | `headline` | The headline: level 7, the XP bar, 23 rides, 412 km, a 4-day streak | Level 7, **23 rides.** |
| 0:23 | 4 | `newrider` | A new rider's headline: level 1, 0 rides, 0 km | Level 1, **no rides yet.** |
| 0:33 | 5 | `settings` | Settings with the connected bike, and its first three rows | Your bike, **your settings.** |
| 0:46 | 4 | `nobike` | The bike row with no bike paired | No bike yet, **pair one.** |
| 0:56 | 5 | `widths` | Profile growing from 390 through 768 and 1024 to 1440 px | One Profile, **every screen.** |
| 1:09 | 4 | `proof` | The local checks, and three cards: what the tests prove | Every number, **every row.** |
| 1:20 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `newrider`, a wipe into `settings`, a zoom out of `nobike` and into
`widths`, and a push into `proof`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the
  shared fixture and the page objects of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double
  density. The rider is the mocks' mid rider, "Sam", served by the fixture with a remembered bike
  that Home connects before Profile opens.
- **What the tests prove:** two behaviour specs, each written first and seen failing on the old
  Profile, and an updated one:
  - `profile-headline.spec.ts` (3 tests): the mid rider's headline, the XP bar's name and the
    line with rides and kilometres; a new rider's "0 of 400 XP" and 0 rides, 0 km; the 340 px
    Settings column beside the rider at lg and stacked below.
  - `profile-settings.spec.ts` (2 tests): the six rows in order, the bike "Not connected ·
    diagnostics" then "Connected · diagnostics", Ride settings to `/settings` and Custom workout
    to `/profile/custom`; with no bike, "No bike yet" with "Pair your bike" to Connect Bike.
  - `streak.spec.ts` reads the line with the rides and kilometres.

  The backend's acceptance tests through the API cover a new rider's 0 rides and 0 km and the
  totals after races and a class. Unit specs cover the line, the XP bar's name and the bike row's
  words. All 206 behaviour specs, the 1380 unit tests, the 337 backend tests and every check
  pass, and the initial bundle stays at 300.21 kB.
- Not shown, because not built here: the Maps and Recent rides sections (L2-110, L2-111), which
  no slice names yet; the Diagnostics dialog the bike row opens once a bike is paired (slice
  25.1); and the Settings and Custom workout screens (20.1, 21.1), which open Page not found
  until then.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/13-3-show-the-profile
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/13-3-show-the-profile
node tools/video-build/build.mjs docs/videos/13-3-show-the-profile --crf 25
```
