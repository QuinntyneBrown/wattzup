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
