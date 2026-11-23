# 00 · Meet Telo Ride

The pitch. Where every other film walks through one slice, this one is written to make someone want
to ride with Telo Ride: another evening staring at the wall, what Telo Ride does today, what comes
next, and the purpose. It follows the arc of the pitch in the owner's sibling repository `popkin`
(`docs/videos/00-meet-popkin/`): a hook, the problem, *meet*, one scene a feature, everywhere it
runs, the close. It is the film to put in front of someone who has never heard of Telo Ride.

- **Film:** [`00-meet-telo-ride.mp4`](00-meet-telo-ride.mp4), 1920×1080, 30 fps, 2 min 19 s, H.264
  at CRF 25 and AAC. No captions in the picture; [`captions.vtt`](captions.vtt) is beside it.
- **Voice:** Kokoro-82M (`af_heart`) from Hugging Face, run locally.
- **Music:** *Beautiful Boom Bap* by Music_Unlimited, from Pixabay
  ([credits](../assets/music/CREDITS.md)). 93 BPM; a bar is 2.58 s.
- **Tone:** a pitch, so it speaks to the rider's want rather than naming requirements; it has no
  requirement kickers and no "what the tests prove" card. The close quotes the purpose from
  `AGENTS.md` word for word, as every Telo Ride film does.

## Run sheet

| At | Bars | Scene | Picture | Headline |
|---|---|---|---|---|
| 0:00 | 4 | `hook` | The lockup and the Echelon EX-5s photograph over the aurora | Same wall, **same numbers.** |
| 0:10 | 4 | `problem` | Three dull numbers, drawn | No reason **to come back.** |
| 0:21 | 4 | `meet` | The lockup on signal; Connect Bike on a phone | TELO Ride |
| 0:31 | 5 | `pair` | Connect Bike pairing on a phone, and the Paired card | One press. **Paired.** |
| 0:44 | 5 | `everywhere` | Connect Bike growing from 390 to 1440 px | Chrome or Edge, **any screen.** |
| 0:57 | 5 | `race` | *Coming next.* Old Town's photograph, three cards | Chase **your ghost.** |
| 1:10 | 4 | `classes` | *Coming next.* Two class photographs | Ride along, **together.** |
| 1:20 | 5 | `progress` | *Coming next.* XP, levels, stars and unlocks, drawn; confetti | Level up. **Unlock more.** |
| 1:33 | 4 | `custom` | *Coming next.* An interval workout, drawn as its blocks | Your own **intervals.** |
| 1:43 | 14 | `close` | The lockup and Telo Ride's purpose over the aurora | TELO Ride |

Act changes: a bone wipe into `meet`, a zoom from `everywhere` into `race` (the act of what comes
next), and a signal wipe into `progress`. The brand mark sits in the corner between the opening and
the close.

## Where the pictures come from

Every screenshot is of the running app. Like popkin's pitch, this film takes none of its own and
has no `shots.ts`: `film.js` reads the pictures from the folder of the film that saved them, so a
film that re-records its shots changes this one too.

| Source | Pictures |
|---|---|
| Slice 2.3, [Pair a bike](../02-3-pair-a-bike/README.md), saved by its `shots.ts` with the shared fixture's fake Bluetooth | `default-xs`, `pairing-xs`, `pairing-m`, `pairing-l`, `pairing-xl`, `paired-card` |
| The design system's photographs, `docs/design-system/assets/images/` | `machines/echelon-ex5s`, `worlds/oldtown`, `classes/power-20`, `classes/threshold-20` |

Race, Classes, the progression and the custom workout are not built on this branch, so they have
no screenshot. Their act is said as what comes next, in the voice ("Next comes Race…") and in every
kicker (**Coming next**), and drawn as cards over the design system's photographs, as slice 2.3 drew
its "Still to come". Nothing is taken from `docs/mocks/`. The GCN Training class photograph is not
used: it carries another brand's mark.

## What it says, and what it leaves out

- **Pairing in one press, Chrome or Edge on every width, and the remembered bike** are what the
  branch does (slices 2.1 to 2.3).
- **"Reads your power and sets the resistance"** is the purpose's own sentence: the bike's frames are
  read and a target resistance is sent and reported back (slices 2.1 and 2.3); a ride screen showing
  them is not built yet.
- **Race, Classes, XP, levels, stars, unlocks and the custom workout** are said as coming next.
- It leaves out settings, diagnostics, feedback, World loading and the 3D worlds.

When a slice builds one of those screens, the scene reads that slice's shots, drops **Coming next**
and the film is re-rendered.

## Build it again

From the repository root (the pictures come from slice 2.3's folder):

```shell
.cache/video-venv/bin/python tools/video-audio/film_audio.py docs/videos/00-meet-telo-ride
node tools/video-build/build.mjs docs/videos/00-meet-telo-ride --crf 25
```
