# Neon Docklands: realism passes

Each pass makes one significant change to how real Neon Docklands looks, towards the pictures the work aims at
(MyWhoosh's worlds: textured roads, real light and shadow, dense scenery). Each is measured before and after in the
real app with `tools/course-bench` and kept only if the frame rate holds. `docs/course-realism.md` describes each
technique so it can be applied to the other maps.

**How it is measured.** A race against the medium pack of bots in the production build, in a Chromium window of
1920 x 1072 real pixels on this machine's GPU (Qualcomm Adreno X1-85, a Snapdragon X laptop), at the course's top
tier (bloom on), over ten seconds from 0:12 of the ride. "Display" is the frame rate at the display's pace (this
display switches between 60 and 120 Hz, so it reads one or the other); "uncapped" is with the frame rate limit off,
the number that compares passes. The film and the picture of each pass are beside this file.

**The rule.** A pass is kept only if the display's pace holds (60 fps or more, no run of slow frames) and uncapped
stays above 240 fps, so a device a quarter as fast still draws 60.

| Pass | Change | Display | Uncapped | Worst frame (uncapped) | Triangles | Draw calls | File, gzipped | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Baseline: every surface one flat colour, shaded flat | 119.8 fps | 357 fps (2.80 ms) | 39 ms | 73,629 | 117 | 3.37 MB | |
| 1 | The ground's surface and the lamps' light on it | 119.6 fps | 342 fps (2.92 ms) | 37 ms | 74,889 | 122 | 3.28 MB | Yes |

## Pass 1: the ground's surface and the lamps' light

**Before** (`pass-00.jpg`, `pass-00.mp4`): the road is one flat dark colour with crisp paint; nothing on it says
where the lamps are; the pavement is a flat grey.

**After** (`pass-01.jpg`, `pass-01.mp4`): the asphalt has its aggregate's grain, patches of older and newer surface,
paler polished wheel tracks, cracks where it is tired, and pale chips; the paint is worn and broken by the cracks;
each street lamp throws a pool of warm light on the road and the pavement, brightest under it and dim between; the
pavement is mottled and stained.

**What changed.**

- The Blender build puts what the road builds (asphalt, paint, kerbs, pavements, shoulders) in a new `Ground` group,
  with each vertex's place on the road in its UV: metres left of the centre line, metres from the start line. The
  course file names the lamps (`lamps`: every 24 m from -68 m, 5.1 m either side, 6.65 m up, `#ffe2a8`).
- The app draws `Ground` with one material (`ground-material.ts`) that works the surface out from that place and a
  256-texel detail texture made on the device (`surface-detail.ts`), read at three scales. The lamps' light is
  arithmetic in that material, not lights: it costs the same for one lamp or nine hundred.
- The ground is drawn to 420 m (it was drawn with the scenery, to 250 m), so the road no longer ends short of the
  haze.

**Cost.** 0.12 ms a frame on this GPU (357 to 342 fps uncapped); 5 more draw calls and 1,260 more triangles in the
frame (the ground drawn further); the file is smaller gzipped though it carries the UVs, as the ground's vertices
now sit together.

**Learned.**

- Light that falls off as the cube of the cosine (true for a bare lamp) merged the pools into an even wash: the
  road looked floodlit and flat. A shaded lamp's faster fall-off (the fourth power) reads as lamps.
- Detail read at one scale looks like wallpaper. The same texels at 1.2 m, 5.3 m and 37 m, each doing a different
  job (grain, cracks, patches), do not repeat to the eye.
- The first numbers were too timid: a grain of plus or minus 15 % vanishes under bloom and tone mapping. Plus or
  minus 50 %, and patches from 0.6 to 1.3, is what reads as asphalt at riding distance.
- The riders, the lamp posts and the walls are not lit by the lamps yet, so they sit dark on a lit road: the next
  passes.
- `e2e/race-course.spec.ts`: two of its three specs (Ibiza and Vice City) already failed before this pass, at the
  race's start, before anything is drawn; Prairie Paceline's passes before and after.
