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
| 2 | The lamps light what stands near the road: riders, posts, walls, land | 119.0 fps | 321 fps (3.11 ms) | 73 ms | 74,889 | 122 | 3.28 MB | Yes |

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

## Pass 2: the lamps light what stands near the road

**Before** (`pass-01.jpg`, `pass-01.mp4`): the road is lit, but the riders, the lamp posts, the warehouses and the
quay beside it are as dark as open night: they look cut out and pasted on.

**After** (`pass-02.jpg`, `pass-02.mp4`): the riders ride through the pools and brighten under each lamp; the
warehouses' brick is lit warm at street level and falls back to night above the lamps; the posts, the containers
and the quay catch the same light. The picture reads as one place lit by its lamps.

**What changed.**

- `lamp-light-map.ts` works out, once when the map loads, a grid over the whole map seen from above (2.5 m a cell,
  two bytes a cell): the lamps' light at ground level and the road's height there. No change to the map's file.
- `lamp-glow.ts` gives that grid to the GPU as a texture and adds one node to what a material emits: the surface's
  own colour times the lamps' light where it stands, fading from 1.5 m to 9 m above the road. The `Solid`, `Land`
  and `Leaves` groups use it, and each rider's lit materials are swapped for copies that do (the ghost is not lit).
- Strengths against the ground under a lamp (4.2): the land 4.2, walls and posts 1.5, leaves 1.8, riders 1.5.

**Cost.** 0.19 ms a frame (342 to 321 fps uncapped): one more texture read for almost every pixel of the scene. No
more triangles or draw calls; a 1,317 x 1,202 grid, 3.2 MB on the GPU while the course is open. One 67 ms hitch in
the ten seconds at the display's pace in the last run and none in the run before it; uncapped has the same few
either way (pass 0 has them too), so it is the machine, not the pass.

**Learned.**

- Light kept in the world's own axes, read by where a surface is, lights everything with one node: nothing has to
  know which lamp is near it, and a rider is lit like a wall. It is the cheap form of hundreds of lights.
- Lit to the lamps' full strength, vertical walls glowed orange to their tops: a wall catches a lamp's light side
  on, and nothing above the lamp's head. A third of the ground's strength, faded out by 9 m up, reads as lamplight.
- Pale jerseys bloom under a strong lamp. The riders take less of it than the ground does.
- It lights without direction: a wall facing away from the lamp is lit as one facing it, and nothing casts a
  shadow. The shape of things still comes only from the moon's light. Shadows are the next gap.
