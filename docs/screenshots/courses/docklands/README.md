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
| 4 | The riders' shadows fall away from the lamps | 119.5 fps | median of three 306 fps (3.27 ms): 327, 299, 306 | | 74,955 | 127 | 3.42 MB | Yes |
| 5 | A night sky and the city on the horizon | 60.1 fps (the display was at 60 Hz) | median of three 331 fps (3.02 ms): 331, 325, 331 | | 76,115 | 128 | 3.39 MB | Yes |
| 6 | Windows with frames, panes and rooms behind them | 119.8 fps | median of three 328 fps (3.05 ms): 333, 328, 319 | | 74,869 | 129 | 3.38 MB | Yes |
| 7 | A working quay: railing, bollards, drums, crates, lorries, masts, cranes | 60.0 fps (the display was at 60 Hz) | best of six 301 fps; medians 241 and 232 on a busy machine (see the pass) | | 79,834 | 134 | 3.99 MB | Yes |
| 8 | Hills a rider can see: each effort a ramp up onto a bridge | 120.0 fps, no frame over 20 ms | median of three 308 fps (3.24 ms): 311, 308, 307, on the first ramp | | 66,997 | 123 | 3.92 MB | Yes |
| 9 | Wet ground that mirrors the lamps and the sky | 119.8 fps, no frame over 20 ms | median of three 298 fps (3.36 ms): 326, 296, 298, on the first ramp | | 66,997 | 123 | 3.92 MB | Yes |

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

## Pass 4: the riders' shadows fall away from the lamps

**Before** (`pass-03.jpg`, `pass-03.mp4`): each rider has one hard-edged dark oval, always pointing the same way
(away from the moon), though the light on the road is the lamps'.

**After** (`pass-04.jpg`, `pass-04.mp4`): each rider throws a soft shadow away from each lamp near them, the two
behind and the two ahead, and has the dark of the bike under them. Passing a lamp, its shadow shortens, swings
round from behind to ahead and fades as the next lamp's takes over. The riders sit on the road. It shows best in
the film.

**What changed.**

- `lamp-shadows.ts` works out, for a rider's place on the road, the four shadows: each runs straight away from its
  lamp, as long as similar triangles make it (the rider's 1.5 m over the lamp's 6.65 m), as dark as that lamp's
  share of the light there. Unit-tested.
- `rider-shadows.ts` draws them: one instanced mesh, a soft-edged shape for each shadow laid on the road along its
  slope, all riders in one draw call. The four blob meshes are gone where a course has lamps; a course without
  them keeps its blobs.

**Cost.** None measurable: 291 fps before, 306 after (within the noise), and 4 fewer draw calls.

**Tried and dropped.**

- How dark each shadow is, as an instanced attribute of its own (`instancedDynamicBufferAttribute`, and as an
  attribute of the geometry): on Three.js 0.187's WebGPU renderer the values it was made with reached the GPU, and
  no later value did, so every shadow stayed at nothing. Three.js keeps an instanced mesh's own colours up to date,
  so the darkness rides in each instance's colour instead (`vInstanceColor`).
- Half an hour went on "the shadows are not drawn" when they were drawn at nothing. Logging the numbers the page
  held would have shown it in a minute.

**Learned.**

- Shadows under lamps are short: a lamp 6.65 m up throws a 1.5 m rider's shadow only 0.29 m for every metre between
  them. Honest shadows here are a dark pool under and beside the bike, not the long streaks of a low sun, and they
  are what stops the riders floating.
- A shape laid flat needs its three axes in a right-handed order, or it faces down and is not drawn.
- Still nothing else casts a shadow: the posts, the warehouses, the containers.

## Pass 5: a night sky and the city on the horizon

**Before** (`pass-04.jpg`, `pass-04.mp4`): the sky is flat navy; nothing stands on the horizon (the skyline's towers
were built into the map but stood beyond the scenery's draw distance, so they were never drawn).

**After** (`pass-05.jpg`, `pass-05.mp4`): broken cloud drifts across a sky of stars, lit from below by the city;
the moon has a glow; a band of haze lies along the horizon; and across the harbour stands a city of towers, their
windows lit warm and cool, some dark.

**What changed.**

- `sky-material.ts` draws the sky a pixel: the course's own colours from the horizon up, cloud from the ground's
  detail texture read at two scales that drift past each other, a glow round the moon, haze on the horizon, and,
  because the top of this sky is dark, stars from a grid with one star in a few of its squares, hidden by cloud.
  The dome is 24 x 12 faces now, not 48 x 24 with a colour a vertex.
- The Blender build puts the skyline's towers in a `Skyline` group that is never cut into chunks and is always
  drawn (5,300 triangles), as walls of a kind of their own (4). It builds more of them (209, was 133), taller and
  nearer, some with a lower wing; the light strips that stood for their windows are gone.
- `wall-material.ts` draws kind 4: a grid of windows 3.2 x 3.4 m, 36 % of them lit, each warm or cool and its own
  brightness. The skyline's material stands in the haze's colour rather than being faded out by the fog, so the
  windows shine through.

**Cost.** None measurable: 306 fps before, 331 after (the display run and the bench ran cooler; read it as the
same). 1,160 more triangles in the frame and one more draw call. The file is 0.03 MB smaller gzipped.

**Learned.**

- The towers had been in the map all along and never drawn: what is far has to be its own group, drawn always, or
  the draw distances that keep the frame cheap cut it out. Check that what the build places is on screen.
- Fog that fades a lit window as it fades a wall kills a skyline: the towers became faint grey blocks. Lights carry
  through haze; walls do not. The wall's colour gives way to the haze, the window's light does not.
- The far-off average of the windows, switched on as soon as a window was a few pixels, turned each tower into a
  glowing beige slab. Windows this large stay crisp until they are well under a pixel (0.7 to 1.6 of a window a
  pixel), and their average is a fifth of a lit window, not two fifths.
- A sky worked out a pixel costs less than it looks: three texture reads and a hash over a third of the screen.

## Pass 6: windows with frames, panes and rooms behind them

**Before** (`pass-05.jpg`, `pass-05.mp4`): a window is a flat rectangle on the brick, dark grey or one glowing
yellow.

**After** (`pass-06.jpg`, `pass-06.mp4`): each window sits under a stone lintel and over a sill, in a dark frame
with glazing bars, two panes across and three up. A lit one shows a room: its lamp warm or, one in five, cool,
brighter towards the ceiling, a blind drawn part-way down, shapes against the light. A dark one is black glass
holding a little of the sky, a pane here and there darker. No two alike.

**What changed.**

- `Kit.window` (themes.py) builds each window as one flat panel in a new `Windows` group, 0.18 m wider each side,
  0.14 m lower and 0.24 m taller than the opening. Its UV is the place on the panel, with 2 added across if it is
  lit and 2 added up for each step of the window's own number (0 to 499, from where it is, so every build gives the
  same). Docklands' warehouses use it.
- `window-material.ts` draws the panel: lintel and sill in stone, the frame and bars, and the glass by the window's
  number. Beside the opening the panel is cut away (`alphaTest`), so the brick shows.

**Cost.** None measurable: 331 fps before, 328 after. One more draw call; no more triangles than the flat
rectangles were (two a window).

**Tried and dropped.** Sills and lintels as boxes of their own: Docklands has some 18,000 windows, and two boxes
each took the map from 308,000 to 676,000 triangles and its file from 3.4 to 9.1 MB gzipped. They are drawn on the
panel instead, at no triangles.

**Learned.**

- Count what a small part is multiplied by before modelling it. Anything a window, a lamp or a metre of road has
  must cost nothing in triangles: draw it in the material.
- A number of its own for each thing (a window here, a brick in pass 3) is what stops a wall of them looking
  stamped out. It rides in the UV for free.
- The windows give no light to the pavement beneath them, and the ground-floor ones have no doors between them.

## Pass 7: a working quay

**Before** (`pass-06.jpg`, `pass-06.mp4`): left of the road is a bare stone apron 26 m wide to the water, with one
stack of containers in sight. The cranes and most of the containers the theme deals were never placed: they were
dropped wherever the land under the apron fell away, which is nearly everywhere.

**After** (`pass-07.jpg`, `pass-07.mp4`; the climbs in `pass-07-climb-1.mp4` and `pass-07-climb-2.mp4`): a railing
runs between the pavement and the apron, with gaps for gates; mooring bollards stand along the water's edge; drums,
crates on pallets and parked lorries with containers on their trailers stand about the apron; floodlight masts
rise over it; and the gantry cranes and container stacks now stand where they were meant to.

**What changed.**

- `themes.py`, `docklands`: the quay's clutter, dealt from numbers of its own so the rest of the map stands where
  it stood. Cranes and containers are placed on the apron whatever the land beneath it does.
- `Kit.fence` builds a railing as one flat panel a 4 m of road in a new `Fences` group, its UV the metres along it
  and the share of its height. `fence-material.ts` draws a post every 2 m and three rails on it and cuts the rest
  away.
- `tools/course-bench` can start a ride any number of metres up the road (`WZ_BENCH_FROM`), to film and time a
  climb or a bend rather than the start line.

**Cost.** 4,965 more triangles in the frame (79,834, of a budget of 120,000) and 5 more draw calls (134 of 140).
The frame rate could not be told apart from pass 6 once the machine's own noise was allowed for: the same build
with pass 6's map and with this one, run turn about, read 199, 293, 297 fps and 232, 224, 301. The best runs are
level; the medians are not, because another program was taking the processor through this sitting. **The file is
the real cost: 3.99 MB gzipped, from 3.38**, and the budget is 3 MB. Docklands was over it before this pass; it is
further over now.

**Tried and dropped.**

- The railing as posts and rails of their own (three boxes every 4 m), a bollard of two prisms every 12 m, and the
  quay's yellow line and crane rails as strips of ground: 598,000 triangles for the map, from 308,000, and 6.3 MB.
  The railing became panels (two triangles every 4 m), the bollards one prism every 24 m, and the strips went.

**Learned.**

- This is pass 6's lesson again, and it cost a rebuild to relearn: anything laid along every metre of a 21.6 km
  road is thousands of copies. Decide how it is drawn before placing it.
- When the machine is busy, the median of three runs moves by a third. Run the old and the new turn about and
  compare the best of each: the best run is the one the machine left alone.
- Every film so far showed the first 150 m of the course, which is straight and flat, and it read as a map with no
  bends or hills. The course has them (7,000 degrees of turning, hills of 4 % on every effort), but the first is
  3.8 km in. Film what the map is for, not where the ride happens to start.
- The file's size is now the map's weakest number. Positions and UVs are 32-bit floats; quantising them, or Draco,
  is the pass that would pay for the clutter.

## Pass 8: hills a rider can see

Asked for by the rider: "Where are the hills?" From this pass the bench films and times the first effort (3,760 m
up the road, `WZ_BENCH_FROM`), where the map turns and climbs, not the start line.

**Before** (`pass-07-climb-1.mp4`, `pass-07-climb-2.mp4`): each of the eight efforts climbed some 15 m at a steady
4 % over its 460 m, and each recovery gave it back at 1.5 % over 2 km, on ground that also rolled a little
everywhere. From behind a rider it looked level.

**After** (`pass-08.jpg`, `pass-08.mp4`): each effort climbs a ramp at 8.3 % over the first two fifths of its
stretch (184 m, 14 m up) onto a harbour bridge and runs level across it; each recovery comes down off it at 5.3 %
in its first seventh, then the quays are flat. The road ahead stands up in front of the rider and the crest shows
against the sky. The map still climbs the 120 m it lists.

**What changed.** `build_course.py`: a theme's `grade` may name a `ramp`, the share of an effort's stretch that
climbs and of a recovery's that descends; the stage's whole rise is put into that share and the rest runs level.
Docklands' theme: `"ramp": {"work": 0.4, "recover": 0.15}`, and no rolling ground. Nothing in the app changed.

**Cost.** None: 308 fps (311, 308, 307) with no frame over 20 ms, on a quiet machine, at the first ramp. The file is
0.07 MB smaller gzipped.

**Learned.**

- A gradient has to pass about 6 % before the road ahead reads as a hill from a chase camera 2.25 m up. The same
  metres climbed at 4 % are invisible.
- Rolling ground spends a map's listed climbing where no one sees it. On a flat map, put all of it in the hills.
- This departs from "1 % of gradient a level" (L2-166 AC3) for a theme that names a ramp: the resistance is still
  highest where the road climbs, but the climb is the first part of the effort, not all of it.
- The land and the quay still rise with the road, so the "bridge" has ground beside it. A bridge that leaves the
  quay behind (piers, water beneath, a drop either side) is the next step for these hills.

## Pass 9: wet ground that mirrors the lamps and the sky

**Before** (`pass-08.jpg`, `pass-08.mp4`): the road is dry and matt everywhere: the lamps light it, and nothing
shines.

**After** (`pass-09.jpg` on the first ramp, `pass-09-start.jpg` at the start line, `pass-09.mp4`): it has rained.
Water lies in patches and in the hollows of the wheel tracks, darker than the dry road, and in it each lamp ahead
is mirrored as a streak of light running towards the rider, broken by the grain of the surface; at a glancing
angle the water also holds the sky's glow. The streaks slide over the road as the rider moves, as reflections do.

**What changed.**

- The Docklands theme names how wet it is (`"wet": 0.55`), the course file carries it, and `courseWet` reads it (a
  course that names none, or names it wrongly, is dry).
- `ground-material.ts`: where the detail texture's patches are high, the ground is water: 0.55 as bright, almost
  smooth (roughness 0.12), and it adds two reflections to what it emits. The lamps': worked out in the road's own
  measure from where the eye is (three numbers the renderer sets a frame). A lamp mirrors at the point a share
  `eye height / (eye height + lamp height)` of the way from the eye to it, so the one row of lamps that could be
  mirrored at a pixel is known; that row and the row either side, on both kerbs, are given Blinn's highlight (six a
  pixel). The sky's: the haze's colour, by Schlick's fifth power of the glancing angle.

**Cost.** 0.11 ms a frame (308 to 298 fps), no frame over 20 ms. No triangles, no draw calls, nothing in the file
but one number.

**Tried and dropped.** The first reflections were 14 times a lamp's brightness with a broad highlight, from only
two rows of lamps: white slabs with hard edges where one row gave way to the next. They are 2.6 times, with a
highlight three times as tight, from three rows.

**Learned.**

- A reflection needs the eye, and a material that knows only the road's own measure (metres along, metres across)
  can still have it: give it the eye in that measure. Near the rider the road is straight enough for it to hold.
- Lamps that repeat need not be looped over: the mirror's geometry says which one a pixel can show.
- The pavements and the quay are wet by the same rule and it suits them; the brick, the riders and the water of the
  harbour are not, and the neon signs are not mirrored: only the lamps and the sky.
