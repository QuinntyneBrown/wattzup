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

**One run is not enough (found in pass 3).** The same build read 262 and 307 fps uncapped in two runs a minute
apart: a laptop warms and slows, and other work on the machine shows. From pass 3 the bench takes three uncapped runs
and the median is the number; a pass is compared with the pass before it measured the same way, in the same
sitting. Passes 0 to 2 were single runs: read their uncapped numbers as within a tenth.

**The rule.** A pass is kept only if the display's pace holds (60 fps or more, no run of slow frames) and uncapped
stays above 240 fps, so a device a quarter as fast still draws 60.

| Pass | Change | Display | Uncapped | Worst frame (uncapped) | Triangles | Draw calls | File, gzipped | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Baseline: every surface one flat colour, shaded flat | 119.8 fps | 357 fps (2.80 ms) | 39 ms | 73,629 | 117 | 3.37 MB | |
| 1 | The ground's surface and the lamps' light on it | 119.6 fps | 342 fps (2.92 ms) | 37 ms | 74,889 | 122 | 3.28 MB | Yes |
| 2 | The lamps light what stands near the road: riders, posts, walls, land | 119.0 fps | 321 fps (3.11 ms); median of three 299 fps (3.34 ms) | 73 ms | 74,889 | 122 | 3.28 MB | Yes |
| 3 | Walls of brick, steel and plaster | 117.9 fps | median of three 291 fps (3.43 ms): 322, 286, 291 | 74 ms | 75,005 | 131 | 3.42 MB | Yes |

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

## Pass 3: walls of brick, steel and plaster

**Before** (`pass-02.jpg`, `pass-02.mp4`): a warehouse is a box of one flat red-brown; a container a box of one flat
colour.

**After** (`pass-03.jpg`, `pass-03.mp4`): the warehouses are brick, laid in courses half a brick out of step with
mortar between, each brick a shade of its own, streaked where rain has run down and dark where the road has
splashed their foot; the containers have their upright ribs and patches of rust; the lamps light all of it.

**What changed.**

- The Blender build puts what is built of brick, steel or plaster (`WALL_KINDS`) in a new `Walls` group. Each face
  gets a UV in its wall's own axes: metres along the wall, metres above the road beside it, with 1,000 m added to
  the height for each kind of wall (1 brick, 2 steel, 3 plaster; roofs are 0).
- The app draws `Walls` with one material (`wall-material.ts`): brick courses, mortar and a shade a brick worked out
  from the UV; a container's ribs from a sine along the wall; stains and streaks from the ground's detail texture.
  Where a course of brick is less than a pixel tall, the pattern fades into its average.

**Cost.** Nothing that three runs can tell apart: 299 fps before (330, 299, 295), 291 after (322, 286, 291). 9 more
draw calls (the walls are their own group) and 0.14 MB more in the file gzipped (the walls' UVs, and corners no
longer shared between a box's faces). At the display's pace the last run had 5 frames of 1,180 over 20 ms and the
run before it 1; the mean is 118 to 120 fps either way.

**Tried and dropped.** The kind of wall in the alpha of each vertex's colour: Blender's glTF exporter writes the
alpha as 1 whatever the mesh holds. It rides in the UV instead.

**Learned.**

- The first measurement said this pass cost 0.6 ms (321 to 269 fps). Cutting the shader's texture reads from four
  to two changed nothing, which gave it away: it was the machine, not the shader. Measure three times before
  optimising anything.
- A pattern finer than a pixel must fade out before it gets there (from 0.18 to 0.6 of a course a pixel): faded
  later, the far walls crawled with bands.
- A wall's kind and its place on the wall are all a material needs for brick, ribs or plaster. Windows, doors and
  signs are still flat panels laid on the wall: a later pass.
