# 00 · Meet Telo Ride

The pitch. Where every other film walks through one slice, this one is written to make someone want
to ride with Telo Ride: another evening staring at the wall, pairing in one press, live 3D courses
and the best worlds built so far, Classes, unified progression, custom workouts, what comes next
with free in-browser AI, and the purpose. It is the film to put in front of someone who has never
heard of Telo Ride.

- **Film:** [`00-meet-telo-ride.mp4`](00-meet-telo-ride.mp4), 1920×1080, 30 fps, 3 min 11 s, H.264
  at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 92.99 BPM; a bar is 2.58 s.
- **Tone:** a pitch, so it speaks to the rider's want rather than naming requirements. The close
  quotes the purpose from `AGENTS.md` word for word, as every Telo Ride film does.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The lockup and the Echelon EX-5s photograph over the aurora | Same wall, **same numbers.** |
| 0:10 | 4 | `problem` | Three dull numbers, drawn | No reason **to come back.** |
| 0:21 | 4 | `meet` | The lockup on signal; Connect Bike on a phone | TELO Ride |
| 0:31 | 5 | `pair` | Connect Bike pairing on a phone, and the Paired card | One press. **Paired.** |
| 0:44 | 5 | `everywhere` | Connect Bike growing from 390 to 1440 px | Chrome or Edge, **any screen.** |
| 0:57 | 6 | `race` | Ibiza Sunset Strip 3D Blender course in WebGPU | Chase **your ghost.** |
| 1:12 | 8 | `worlds` | Six worlds: Ibiza, Neon Docklands, Vice City, Cliffside Coast, Cinque Terre, Haleakalā | Best worlds **created so far.** |
| 1:33 | 5 | `classes` | Two class photographs with live group board & synced resistance | Ride along, **together.** |
| 1:46 | 5 | `progress` | Results & map-unlock celebration screenshot (`11-3`) + confetti | Level up. **Unlock more.** |
| 1:59 | 5 | `custom` | Custom workout live ride dashboard screenshot (`21-3`) | Your own **intervals.** |
| 2:12 | 9 | `ai` | *Coming next.* Free in-browser Hugging Face & Chrome AI features | Local AI. **Zero cloud bills.** |
| 2:35 | 14 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a bone wipe into `meet`, a zoom from `everywhere` into `race`, a signal wipe into
`progress`, and an ink wipe into `ai`. The brand mark sits in the corner between the opening and
the close.

## Where the pictures come from

Every screenshot is of the running app or a built 3D course—nothing is taken from `docs/mocks/`.

| Source | Pictures |
|---|---|
| Slice 2.3, [Pair a bike](../02-3-pair-a-bike/README.md) | `default-xs`, `pairing-xs`, `pairing-m`, `pairing-l`, `pairing-xl`, `paired-card` |
| Slice 8.2, [Draw the route world](../08-2-draw-the-route-world/README.md) | `neon-docklands-xl`, `vice-city-xl` |
| Slice 11.3, [Celebrate an unlock](../11-3-celebrate-an-unlock/README.md) | `unlock-xl` |
| Slice 21.3, [Ride a custom workout](../21-3-ride-a-custom-workout/README.md) | `ride-xl` |
| Built 3D courses, `docs/screenshots/` | `courses/ibiza/sky-01-strip`, `courses/realism-on-coast`, `cinqueterre/course-032-path-crossings`, `haleakala/course-028-fruit-stands` |
| The design system's photographs, `docs/design-system/assets/images/` | `machines/echelon-ex5s`, `classes/power-20`, `classes/threshold-20` |

## Build it again

From the repository root:

```shell
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/00-meet-telo-ride
node tools/video-build/build.mjs docs/videos/00-meet-telo-ride --crf 25
```
