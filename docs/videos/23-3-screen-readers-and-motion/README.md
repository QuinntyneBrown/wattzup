# Slice 23.3 · Screen readers and motion

A screen reader hears each step of a ride once, as it starts ("Work, round 1 of 8: 0:30 at level 24" on the custom
ride, "Work, 0:30" on a class ride), and the result as Results opens; the countdowns stay timers it is not read every
second (L2-141 AC2). A dialog takes the focus and keeps it, the app behind it is inert, and closing it gives the focus
back to what opened it (AC3). With reduced motion asked for, nothing on any screen moves but an opacity fade: the
interval, segment and race bars jump to their place (L2-142 AC2).

- **Film:** [`23-3-screen-readers-and-motion.mp4`](23-3-screen-readers-and-motion.mp4), 1920×1080, 30 fps,
  1 min 56 s, H.264 at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt)
  is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay ([credits](../assets/music/CREDITS.md)). 93 BPM; a
  bar is 2.58 s.
- **Requirements shown:** L2-141 AC2, AC3; L2-142 AC2.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The custom ride at its first work on a phone, over the aurora | Heard once, **not every second.** |
| 0:10 | 5 | `step` | The custom ride at 5:01, its interval card, and what the live region says | Work, **round 1 of 8.** |
| 0:23 | 5 | `result` | Results on a phone as it opens, and what the live region says | The result, **said.** |
| 0:36 | 5 | `dialog` | The leave dialog over the custom ride at 1440 px, focus inside, and the spec's steps | Focus kept, **app inert.** |
| 0:49 | 5 | `motion` | The spec failing on the interval bar's width transition under reduced motion, and the fix | Nothing **slides.** |
| 1:01 | 5 | `proof` | The spec's 19 passes and the 1842 unit tests | Heard, kept, **still.** |
| 1:14 | 4 | `widths` | Results growing from 390 through 768 and 1024 to 1440 px | Results, **at every width.** |
| 1:25 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a push into `result`, a wipe and a push into `dialog`, and a zoom into `widths`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) through the fixtures and page
  objects of `e2e/screen-readers-and-motion.spec.ts`. The "a screen reader hears" cards quote `shots/heard.json`, the
  words the app's live region held when each shot was taken. The fake Bluetooth stack and the API fixture stand in for
  the bike and the backend. The terminals hold the spec's real failure before the fix and its pass after.
- **What this slice adds:** the `Announcer` contract (`ANNOUNCER`) and `LiveRegionAnnouncer`, a polite region of its
  own; the step words (`rides/step-announcement.ts`) and Results' announcement; `provideInertBehindDialogs` on the
  routes that open dialogs, which gives the focus back; `--duration-countdown` at 0 ms under reduced motion, in the app
  and the design system. Every check passes.
- Not shown: one `h1` per screen (AC1), colour never alone (AC4) and contrast (AC5), which earlier slices built and the
  accessibility sweep, not yet written, would check; the motion durations (L2-142 AC1) and the countdown as the only
  full-screen motion (AC3).
