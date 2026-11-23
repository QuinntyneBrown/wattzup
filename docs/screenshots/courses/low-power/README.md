# A course on a low-power device: passes towards 60 frames a second

The rider's device may be a tablet or a low-power laptop beside the bike. None has been measured. This log works on
a stand-in for one, and each pass is kept only if it raises the stand-in's frame rate.

**The stand-in.** Neon Docklands in the real app, at the lowest tier, with the page's processor slowed six times
(Chrome's CPU throttling), on the first bridge with the medium pack of bots, for ten seconds:

```
WZ_BENCH_TIER=low WZ_BENCH_CPU=6 WZ_BENCH_FROM=3760 WZ_BENCH_SETTLE=3 node tools/course-bench/bench.mjs <label>
```

It slows the processor and not the graphics chip, so it stands for a device whose processor is the short thing. The
display here runs at 120 Hz, so a frame is a multiple of 8.3 ms: 60 frames a second means every frame within two of
them. A real device is the only true test; this says which way a change moves.

**The aim.** 60 frames a second or better on the stand-in. It began at about 44.

| Pass | Change | Frames a second (each run) | Mean frame | Frames over 20 ms | Kept |
| --- | --- | --- | --- | --- | --- |
| 0 | Before | 46.2, 44.0, 45.6, 43.3, 44.4 | 22.5 ms | about 70 % | |
| 1 | The interval's countdown bar moves in four steps a second, not on every frame | 51.2, 50.7, 51.0, 51.8 | 19.6 ms | 14 % | Yes |
| 2 | A simple build of the riders on the two lowest tiers, and both wheels as one mesh on every tier | before, the same sitting: 57.3, 53.8, 58.5, 60.2; after: 63.2, 60.8, 63.0, 57.0 | 17.5 ms to 16.4 ms | no better (see below) | Yes |
| 3 | Only the map's chunks near the camera are in the scene; the standings board measures its rows only when the order changes | before, the same sitting: 58.3, 53.2, 63.3, 54.1 (mean 57.2); after: 60.4, 60.4, 57.2, 60.8 (mean 59.7) | 17.4 ms to 16.7 ms | no better | Yes |

## Finding where the time goes

The riders' log (`../riders/README.md`) had already shown that fewer draw calls and triangles did not shorten the
frame on the stand-in, and that 41 % of the time was the browser's own work outside JavaScript. That pointed away
from the 3D scene, so the page around it was tried, with style rules added by the bench (`WZ_BENCH_CSS`, new) and
nothing built:

| Tried on the stand-in | Frames a second |
| --- | --- |
| As it is | 43 to 46 |
| Every panel hidden, the canvas alone (`WZ_BENCH_HIDE_HUD=1`, new) | 55.5, 55.1, 56.1 |
| The panels' blur of the picture behind them turned off | 41.9, 42.2 |
| Every transition and animation turned off | 52.5 |
| The route panel hidden | 44.1 |
| The standings board hidden | 41.8 |
| The power, resistance, bar and scenery panels hidden | 44.2 |
| The interval panel hidden | 54.0 |
| The interval's bar with no transition | 52.0 |
| The interval's bar stepped four times a second | 51.5, 51.6 |

So the panels over the canvas cost some ten frames a second, and one of them nearly all of it: the interval panel,
by its bar. The panels' blur, which looked the likeliest, costs the processor nothing measurable (it is the graphics
chip's work, which the stand-in does not slow).

## Pass 1: the countdown bar in steps

**Before.** The bar under the interval's countdown (`race-interval`) is a rectangle whose width is set once a
second and eased to with `transition: width 1000ms linear`. A width in transition is worked out, laid out and
painted again on every frame the display shows, 120 times a second here, and the page's main thread does it between
the frames of the race. The bar moves less than a pixel a second: an interval is 30 seconds to five minutes across
some 300 px.

**After.** `transition: width var(--duration-countdown) steps(4, end)`: the bar reaches each second's place in four
steps. Nothing the eye can see changes; the bar is where it was at every quarter of a second.

**Measured** (the stand-in, five runs before and four after, in one sitting): 44 to 46 frames a second before, 51
after; the mean frame 22.5 ms to 19.6 ms; frames over 20 ms from about 70 % to 14 %. `lp-01.mp4` is the stand-in
filmed after the change (the filming itself costs a little: 51.8). The race's end-to-end specs: 51 pass and the same
13 fail as before this work. Unslowed, the top tier is as it was.

**The design system** gives this bar a linear transition. This departs from it for a reason it could not have
known, and the picture is the same; the reason is beside the rule in `race-interval.scss`. The class ride's segment
bar (`class-segment.scss`) eases its width the same way and is not changed here: it is not on the stand-in, and
would want its own measure.

**Learned.**

- The frame of a 3D page is not only the 3D. A one-line transition in a panel cost more than all the riders.
- Hide things to find what costs: a style rule and one run each, before any code is read.
- What looked expensive (seven blurred panels) was free here, and what looked free (a thin bar) was not.

## Pass 2: a simple build of the riders for the lowest tiers

**Where the draw calls were.** At the lowest tier the bridge drew 65 things a frame, and the map was only 30 of
them. The rest was riders: each was eight draw calls (the bike, the trunk, the head, the kit, two wheels' sides, the
lamp's glow and its pools on the road), besides the one that draws every rider's legs.

**What changed.**

- On every tier, both wheels' sides are one mesh and are turned by turning their picture about its middle
  (`CourseCyclistKit.roll`), not by turning two discs for each rider: one draw call a rider fewer, and nothing to
  place each frame. Every wheel on the road turns with the rider's own; riders keep much the same pace.
- On the two lowest tiers (`SIMPLE_RIDERS`) the riders are a simple build: the trunk, the head and the bike are one
  mesh, and the lamps throw no pools on the road. Four draw calls a rider. What is given up on those tiers: the
  trunk's slight sway and its rise out of the saddle on a climb, and the head staying level and turning into a bend
  (`lp-02-builds.jpg`: the simple build on the left, the full one on the right, through the bridge's bend).

**Measured** on the stand-in, four runs of each, alternating, in one sitting:

| Build | Frames a second | Mean frame | Draw calls |
| --- | --- | --- | --- |
| Pass 1 | 57.3, 53.8, 58.5, 60.2 | 17.5 ms | 65 |
| Pass 2 | 63.2, 60.8, 63.0, 57.0 | 16.4 ms | 45 |

Four frames a second more, by the medians (58 to 62), and three runs of four at 60 or over. Two cautions:

- **The machine moved.** Pass 1's build read 51 an hour before and 54 to 60 in this sitting. Only runs made
  alternately in one sitting are compared in this log; the figure the loop aims at is not a fixed one on this
  machine.
- **Still uneven.** Four frames in ten are still over 20 ms (they are 25 ms, three ticks of the 120 Hz display,
  among frames of 8 and 17 ms). The mean has reached 60; an even 60 has not.

The race's end-to-end specs: 51 pass, the same 13 fail. Unit tests: 1,512 pass.

**No film of this pass that can be trusted.** While it was being filmed the laptop was found to be on battery at
14 %, with Windows' battery saver on: the display had gone to 60 Hz and the app was held to 34 frames a second even
unslowed at the top tier (uncapped it still drew 260). `lp-02.mp4` was filmed in that state and is kept only as a
record of it. The four-against-four timings above were made before the display changed (they report over 60 frames
a second, which a 60 Hz display cannot). The film and the next pass wait for mains power.

**Learned.**

- Count draw calls by what makes them. "The map" was under half; the riders, each a little, were the rest.
- Check the machine before believing a slow run: its power, its display's rate, what else is running.

## Pass 3: a smaller scene, and a board that does not measure itself

**After the rebase and on mains power**, the stand-in read 63.6, 60.8 and 55.0 on pass 2's code: about 60 on
average and uneven, four frames in ten at 25 ms.

**A steadier measure.** Frames a second on the stand-in move by ten from run to run on this laptop (the processor's
own speed changes as it charges and warms, and the slowing is a multiple of it). The bench now also reads the
browser's own account of the page's main thread over the ten seconds (`mainThread` in `<label>.json`: time in tasks,
in script, in style, in layout). It showed two things: style and layout together are 0.4 ms of a 17 ms frame, so
the page around the canvas is no longer where the time is; and the main thread is full, so the frame rate is simply
ten seconds over the work in a frame. It also lists what is animating as the timing ends, and counts how often the
page asks an element where it is.

**What changed.**

- The map is 458 chunks, of which a frame draws about thirty; the scene held 642 objects. A chunk out of reach was
  hidden, and a hidden object is still walked twice by every frame, to be placed and to be asked whether it is in
  view. The chunks are now taken out of the map once it is built, each keeping its place in the world as its own,
  and only those in reach are in the scene (`near`, in `course-renderer.ts`); `choose` puts them in and takes them
  out as it used to show and hide them. The confetti, which moves, stays in the map.
- The standings board (`race-board.ts`) asked every row where it was after every check of its view: 200 reads in
  ten seconds, each able to force the page's layout, for a slide that happens only when two riders swap places. It
  measures only when the order of the riders changes: 20 to 30 reads in ten seconds.

**Measured** on the stand-in, four runs of each, alternating:

| Build | Frames a second | Mean | Main thread a frame | Script a frame |
| --- | --- | --- | --- | --- |
| Pass 2 | 58.3, 53.2, 63.3, 54.1 | 57.2 | 17.4 ms | 12.6 ms |
| Pass 3 | 60.4, 60.4, 57.2, 60.8 | 59.7 | 16.7 ms | 11.8 ms |

Two and a half frames a second by the means, and three runs of four at 60: within what the runs' own spread could
hide, but in the direction the profile said, and each change removes work that did nothing. `lp-03.mp4` is the
stand-in filmed after it (58.5 while filming). The map draws as before at the start, on the bridge and nine
kilometres in (`lp-03-map.jpg`, top tier).

**Tests.** Unit tests: 1,957 pass. The race's end-to-end specs: 72 pass and 15 fail; the six of those in
`race-world-scene`, `race-world-settings` and `race-world-step-down` were run against the code before this change
and fail there too (the rebase brought them), and the rest are the failures recorded before.

**Still to do for an even 60.** The frame's work on the stand-in is 16.7 ms, all but the whole of two ticks of the
display, so any frame that runs a little long takes three. It wants to be some 14 ms. Script is 11.8 ms of it,
Three.js's renderer nearly all of that.

**Learned.**

- Hidden is not gone. What is not drawn should not be in the scene.
- When the frame rate will not hold still, measure the work, not the rate.
