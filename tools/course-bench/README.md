# course-bench

Times a course's frames in the real app, on this machine's GPU, and films ten seconds of it. It is how a change to
a map, or to how a map is drawn, is shown to keep its frame rate (`docs/course-realism.md`).

```
cd frontend && npx ng build ride && cd ..
node tools/course-bench/bench.mjs <label> [map id] [out dir]
```

`map id` is the catalogue's (`neon-docklands` by default); `out dir` is `.cache/course-bench-out` by default.

It is not a test and not a sweep: it compares nothing, and neither `npm run e2e` nor CI runs it. It opens the
production build (served on `:4330` by `frontend/scripts/serve-dist.mjs`) in a Chromium window, with the shared
fixture's fake bike and backend, starts a race against the medium pack of bots on a real clock, pedals at 90 rpm,
and rides 12 seconds before it measures. The window is 1920 x 1072 real pixels, one device pixel a CSS pixel, and
the course is pinned at its top tier (2 device pixels a CSS pixel at most, bloom on) through the test-only hook
(`world-ride-probe.ts`), so the frame budget cannot step it down out of the measurement.

It runs twice:

| Run | What it shows | Writes |
| --- | --- | --- |
| At the display's pace | The frame rate a rider sees: ten seconds of `requestAnimationFrame` gaps (mean, 95th and 99th percentile, worst, frames over 20 ms). On a 60 Hz display it cannot read above 60. | `<label>.json`, `<label>.png`, `<label>.mp4` (ten seconds of the window, 60 fps, taken off the screen by ffmpeg) |
| With the frame rate limit off (`--disable-frame-rate-limit --disable-gpu-vsync`) | How much room is left: the frames the GPU can draw a second. This is the number to compare before and after a change. | `<label>-uncapped.json` |

Each JSON also holds what the renderer sent the GPU in its latest frame: the tier, the backend, the draw calls and
the triangles.

**The rule a change must keep:** at the display's pace, a mean of 60 fps or more with no more than a frame or two
over 20 ms in the ten seconds; and uncapped, room enough that a tablet a quarter as fast still draws 60 (240 fps
here, on a Snapdragon X's Adreno X1-85). A change that fails is not kept.

The film is taken off the screen, so the window must be in front and unobscured, at the top left of the display.
ffmpeg must be on the `PATH`.
