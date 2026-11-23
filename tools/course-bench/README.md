# course-bench

Times a course's frames in the real app, on this machine's GPU, and films ten seconds of it. It is how a change to
a map, or to how a map is drawn, is shown to keep its frame rate (`docs/course-realism.md`).

```
cd frontend && npx ng build ride && cd ..
node tools/course-bench/bench.mjs <label> [map id] [out dir]
```

`map id` is the catalogue's (`neon-docklands` by default); `out dir` is `.cache/course-bench-out` by default.
`WZ_BENCH_FROM=<metres>` starts the ride that far up the road, to film and time a climb or a bend rather than the
start line (the HUD still reads from the start line: only the world is moved on). `WZ_BENCH_QUERY` sets the race's
mode (`mode=solo`; the medium pack of bots by default), and `WZ_BENCH_FILM=0` takes no film.

It is not a test and not a sweep: it compares nothing, and neither `npm run e2e` nor CI runs it. It opens the
production build (served on `:4330` by `frontend/scripts/serve-dist.mjs`) in a Chromium window, with the shared
fixture's fake bike and backend, starts a race against the medium pack of bots on a real clock, pedals at 90 rpm,
and rides 12 seconds before it measures. The window is 1920 x 1072 real pixels, one device pixel a CSS pixel, and
the course is pinned at its top tier (2 device pixels a CSS pixel at most, bloom on) through the test-only hook
(`world-ride-probe.ts`), so the frame budget cannot step it down out of the measurement.

It runs five times: at the display's pace once for the film and once more, with no film being taken, to time it;
then three times with the limit off:

| Run | What it shows | Writes |
| --- | --- | --- |
| At the display's pace | The frame rate a rider sees: ten seconds of `requestAnimationFrame` gaps (mean, 95th and 99th percentile, worst, frames over 20 ms). On a 60 Hz display it cannot read above 60. | `<label>.json`, `<label>.png`, from the run with no film (taking the film costs a slow frame or two in ten seconds); `<label>.mp4` (ten seconds of the window, 60 fps, taken off the screen by ffmpeg) from the run before it |
| With the frame rate limit off (`--disable-frame-rate-limit --disable-gpu-vsync`) | How much room is left: the frames the GPU can draw a second. Run three times: one run differs from the next by a tenth or more on a laptop, so the median is the number to compare before and after a change. | `<label>-uncapped.json` (the last run), `<label>-summary.json` (all three and their median) |

Each JSON also holds what the renderer sent the GPU in its latest frame: the tier, the backend, the draw calls and
the triangles.

**The rule a change must keep:** at the display's pace, a mean of 60 fps or more with no more than a frame or two
over 20 ms in the ten seconds; and uncapped, room enough that a tablet a quarter as fast still draws 60 (240 fps
here, on a Snapdragon X's Adreno X1-85). A change that fails is not kept.

The film is taken off the screen, so the window must be in front and unobscured, at the top left of the display.
ffmpeg must be on the `PATH`.

On a busy machine the median of three moves by a third. Then run the old and the new turn about (swap the map's
glb in `frontend/dist/ride/browser/courses/`, or the build) and compare the best run of each.

## Memory

Each timing also records, in `<label>.json` under `frames`: `over12Ms` (frames the display showed twice at 120 Hz),
`allocatedMb` (what the page made while it was timed), `collections` (times the heap fell by over 1 MB) and
`slowWithCollection` (frames over 20 ms that came with one). `WZ_BENCH_ALLOC=1` samples the allocations as well and
writes the 25 functions that made the most, with their callers, to `<label>-alloc.txt`; build with
`npx ng build ride --source-map` first if the names are to mean anything. The browser is started with
`--enable-precise-memory-info` so the heap is exact.

For each frame over 20 ms the timing also records `slowLateMs` (how late the frame's callback ran after the
display's tick) and `slowScriptMs` (how long the frame before spent in script), and `longFrames` lists what the
browser's long-animation-frame entries say ran. A slow frame with all three small was skipped by the compositor or
the GPU, not by the page.

`WZ_BENCH_CPU=<n>` slows the page's processor n times (Chrome's CPU throttling) as a stand-in for a slower
device; with `WZ_BENCH_TIER=low` it is the nearest the bench comes to a tablet. It does not slow the graphics chip.

`WZ_BENCH_PROFILE=1` samples the page's processor while it is timed and writes the forty functions with the most
self time, as a share of the ten seconds, to `<label>-cpu.txt` (`(idle)` and `(program)`, the browser's own work,
among them).

`WZ_BENCH_CSS=<rules>` adds style rules to the page and `WZ_BENCH_HIDE_HUD=1` hides everything but the canvas: for
finding what a panel over the canvas costs before changing it (`docs/screenshots/courses/low-power/README.md`).

Each `<label>.json` also carries `mainThread` (the browser's own account of the ten seconds: `taskMs`, `scriptMs`,
`styleMs`, `layoutMs` and the counts of style and layout passes; divide by `frames.count` for a frame's worth),
`animating` (what is animating as the timing ends) and `layoutReads` (how often the page read an element's
`offsetTop`). `WZ_BENCH_BACKEND=webgl2` draws with WebGL 2.
