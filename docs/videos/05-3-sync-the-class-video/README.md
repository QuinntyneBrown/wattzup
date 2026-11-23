# Slice 5.3 · Sync the class video

The class video now rides along (L2-088). The class ride plays the class's YouTube video from
YouTube's privacy-enhanced domain, without controls and out of the tab order, at the ride clock plus
the class's sync offset: 7:12 at 7:00 with a 0:12 offset. On each tick `VideoClockSync` checks the
drift and seeks the video back when it is more than 1.5 s off. When YouTube is blocked or the player
fails, the cover stays, a notice says "The video can't play. The bike will still follow the class.",
and the clock and plan carry on. The player lives in a new `video` library, loaded only when a ride
plays its video; the initial bundle did not grow. Pausing the video with the ride is slice 5.4.

- **Film:** [`05-3-sync-the-class-video.mp4`](05-3-sync-the-class-video.mp4), 1920×1080,
  30 fps, 2 min 25 s, H.264 at CRF 23 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt)
  is beside it for a player.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Requirements shown:** L2-088 AC1, AC2, AC4 and AC5, L2-027 AC1.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The class ride at 7:00 with its video in a browser window, over the aurora | Video, **in sync.** |
| 0:10 | 4 | `offset` | A close-up of the video frame, with three cards: clock, offset, video time | The clock leads, **the video follows.** |
| 0:21 | 4 | `privacy` | What the player is asked: host, video, controls, tab index | No cookies, **no controls.** |
| 0:31 | 4 | `drift` | Four rows of `VideoClockSync`'s table | One and a half **seconds, then seek.** |
| 0:41 | 4 | `unavailable` | The class ride with YouTube blocked, and a close-up of the frame and the notice | The cover stays, **and says so.** |
| 0:52 | 4 | `carry` | The blocked ride reaching 7:00 and sending the recovery's level | The bike **still follows.** |
| 1:02 | 4 | `library` | The store importing the video library, which loads the IFrame API, drawn | Loaded only **when it plays.** |
| 1:12 | 4 | `bundle` | The initial bundle with `effect` and `viewChild`, without them, and the lazy library | Not a kilobyte **more up front.** |
| 1:23 | 4 | `fake` | What the shared fixture fakes | A fake player, **a real clock.** |
| 1:33 | 4 | `shell` | The class ride growing from 390 through 768 and 1024 to 1440 px, and the blocked ride on a phone | Sixteen by nine, **then the column.** |
| 1:43 | 4 | `proof` | The two local test runs, and two cards: what the tests prove | Four new specs, **all green.** |
| 1:54 | 12 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: pushes into `privacy`, `unavailable` and `bundle`, a signal wipe into `unavailable`, and a
zoom through the `fake` cards into `shell`.

## What it proves, and what it does not

- The app pictures are screenshots of the running app, taken by [`shots.ts`](shots.ts) with the shared
  fixture and the page object of `frontend/e2e/`, at 390, 768, 1024 and 1440 px at double density. The
  fixture's fake Bluetooth stands in for the bike, its API fixture answers the class, and its YouTube
  fixture answers the IFrame API with a fake player and the cover with the mocks' picture, so the frame
  shows the cover where YouTube would play. Playwright's clock moves the ride to 7:00, as
  `e2e/class-video.spec.ts` does.
- The player's options, the writes and the drift table come from that spec and from
  `video-clock-sync.spec.ts`; the bundle sizes from `ng build ride`; the diagram and cards are drawn.
- **What the tests prove:** four new behaviour specs and eight new unit cases; 246 unit tests and the
  38 behaviour specs all pass. No real YouTube video plays in a test or in the film.

## Build it again

From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/05-3-sync-the-class-video
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/05-3-sync-the-class-video
node tools/video-build/build.mjs docs/videos/05-3-sync-the-class-video --crf 23
```
