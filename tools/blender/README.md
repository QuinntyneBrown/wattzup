# Blender maps

Each Telo Ride map is modelled after a GCN online class (AGENTS.md, Direction; ADR 0034). This folder
builds a map in Blender from that class's plan.

```
blender --background --python tools/blender/build_course.py -- tools/blender/courses/ibiza.json
```

or, with Python 3.11+ and `pip install bpy` (no Blender install needed):

```
python tools/blender/build_course.py tools/blender/courses/ibiza.json
```

It writes:

| File | What it is |
| --- | --- |
| `frontend/projects/ride/public/courses/<id>.glb` | The map the Ride app draws: glTF binary, +Y up, coloured by vertex, no textures, no normals (the app shades it flat, and works out the ground's). |
| `frontend/projects/ride/public/courses/<id>.course.json` | The road's centre line and the plan's stages along it. The app rides this. |
| `tools/blender/scenes/<id>.blend` | The Blender scene: open it to look the map over or model it further. The `Guides` collection holds the centre line and is left out of the glb. |

`--preview <dir>` also renders four stills with Cycles (an overview, the start, the steepest climb and
the finale). `--out` and `--blend` move the outputs. `--video blender/<id>.mp4` stages a 20-second film of
the map after the build (an aerial of its turns and hills, then a drone chasing the rider and three bots out
of the start, up the twistiest climb and in to the finish, rendered with EEVEE at 1280 x 720, 30 fps);
`--render` renders it there and then. The films live in the repository's `blender/` folder.

### From a running Blender (the Blender MCP)

With Blender open and its MCP add-on connected, the same build runs inside the open file (emptied first, not
reset to factory settings) from Blender's Python:

```python
import sys; sys.path.insert(0, r"<repo>/tools/blender")
import build_course
build_course.main([r"<repo>/tools/blender/courses/prairie.json", "--video", r"<repo>/blender/prairie.mp4"])
```

`render_film.py` does the build and the render in one go, in the background, for any number of maps:

```
blender --background --factory-startup --python tools/blender/render_film.py -- prairie oldtown coast
```

On a machine short of memory, `film.sh` renders one map in steps, one Blender at a time: it stages the film's
scene, renders frames 1 to 300 and 301 to 600 as PNGs, and encodes them with ffmpeg (on the `PATH`):

```
for step in stage a b encode; do tools/blender/film.sh <scratch dir> $step prairie; done
```

`main` returns the map's facts (length, climbing, triangles, what the theme placed). Rendering the film from
the open Blender blocks its window for the length of the render; `blender --background <scene> --render-anim`
of the scene saved beside the film does the same out of the way.

## How a class becomes a map

A course file (`courses/<id>.json`) holds the class's plan: for each segment its kind, its seconds,
its target resistance (`level`) and its cadence aim (rpm).

- **Size.** A segment's stretch of road is its seconds x its rpm x 5 m a turn of the pedals (the
  scene driver's gearing). The map is as long as the class: Intervals to the Beat, 20:00, is 8.4 km.
- **Elevation.** A level above the course's mean climbs and one below it descends, 1 % of gradient a
  level, eased over 28 m. Ibiza's mean level is 15.9: the level 24 sprints climb at 8 %, the level
  11 recoveries and the cool-down descend at 5 %.
- **A catalogue map (ADR 0035)** names its `distanceKm` and `climbingMetres`: the metres a turn of the
  pedals are set so the road is exactly that long, and every gradient is scaled alike so it climbs exactly
  that much. Each stretch keeps its share of the length and each hill its place.
- **Ramps.** A theme's `grade` may name a `ramp` (`{"work": 0.4, "recover": 0.15}`): an effort's whole climb is
  laid in that share of its stretch and the rest runs level, and a recovery's descent likewise, so a small climb is
  a hill a rider can see. Neon Docklands climbs 8 % onto each of its bridges for its listed 120 m.
- **Bridges.** A theme with `bridges` (and a `ramp`) builds each effort's climb as a bridge: walkways, parapets and piers
  in place of the quay, and the land beneath taken down to the sea's bed.
- **Turns.** Dealt from the course's `seed`: hairpins and esses on the efforts, sweeps on the
  recoveries, straights and gentle sweeps on the warm-up and cool-down. The road never comes within
  46 m of an earlier stretch of itself, and turns for home when it strays far. Change the seed for
  another layout of the same course.
- **Theme.** Ibiza Sunset Strip's concept (`frontend/projects/world/src/world-ibiza.ts`,
  `docs/class-worlds.md`) is rebuilt as geometry. The sea is on the rider's left under a white
  seawall, with yachts at anchor; on the right, whitewashed beach clubs with neon shapes, glowing
  doors, pergola terraces, bougainvillea and a dancing crowd, festoon lights strung across the
  strip, and DJ terraces sweeping light beams. The sun sinks beside Conillera where the last
  stretch points. Each effort starts under a round neon arch and rides over chevrons; tight bends
  have red and white kerbs and arrow boards.
- **Start and finish.** The rider starts on a painted grid; the chequered start line stands 14 m
  up the road under stone pillars, a pergola and the start lights. The last 300 m run straight to
  a chequered finish line under a golden arch strung with bulbs, between barriers and crowds, with
  confetti in the air. Of the layouts a seed can deal, the script keeps one whose start and finish
  look out to open sea.

## Themes

Ibiza Sunset Strip's scenery is `build_scenery` here. Every other map names a theme in `themes.py`: its sky
(which the course file carries for the app), haze and lights, a palette for the shared materials, its land
(farmland, a town in the countryside, a headland over the sea, a harbour, an alpine valley, a beachfront, a
high pass), its road edge (verge, pavement, cliff, quay, guard rail, beach, parapet), the turns it deals and
how steep its hills are (`grade`: the gradient a level, a rolling wave between the class's hills, and a
climb for a col). All seven map worlds have one:

| Course | Theme | What lines the road |
| --- | --- | --- |
| `prairie` | Open farmland at golden hour | Fenced verges, wheat and green fields in strips, red barns and silos, round bales, windbreaks, a wind farm and a grain elevator by the start |
| `oldtown` | A cobbled old town on race day | Pastel houses door to door on both pavements, tiled roofs, shuttered windows, café umbrellas, bunting across the street, lamps, a cathedral with two spires, cypresses beyond the walls |
| `coast` | A clifftop road at sunset | A guard rail over the drop to the sea, rocks at the edge, a stone wall inland, gorse and pines, white cottages with lit windows, a lighthouse on the point, sea stacks |
| `docklands` | A harbour city after dark | Lamps every 24 m, brick warehouses with lit windows and neon, cranes and container stacks on the quay, lit ships at anchor, a skyline of towers, steel bridges over the efforts |
| `dolomites` | An alpine valley | Guard rails, spruce on the valley walls, chalets with flower boxes in the meadows, a chapel on the highest bend, pale limestone peaks with snow all round |
| `vicecity` | A neon beachfront at a magenta sunset | Palms on both sides, art deco hotels in pastel with neon bands and signs, convertibles at the kerb, lifeguard towers and umbrellas on the beach, a neon skyline |
| `granite` | A high pass at first light | Hairpins up bare granite, stone parapet blocks, snow poles, larches below the tree line, boulders and snow patches above, a refuge and the col's sign at the top, granite peaks |

Every map has the start pylons and lights, the finish arch, barriers and crowds at both ends, an arch at the
foot of every effort, flags where each recovery begins and arrow boards round every tight bend.

To add a map: write `courses/<id>.json` from the class's plan (`theme` names its theme), give the theme its
data and scenery in `themes.py`, run the script, and name the world in
`frontend/projects/world/src/course-worlds.ts`.

## Built for low-power tablets

- **Groups and chunks.** Every part hands its faces to the assembly (`assemble`), which joins them into a
  few groups by material (`Land`, `Ground`, `Walls`, `Solid`, `Leaves`, `Glow`, `Beams`, `Confetti`), puts each face's colour
  into its vertices, and cuts each group into chunks of 240 m of road (the land and beams four times as
  long, glow and leaves three). The app draws a chunk only near the camera, in one draw call.
- **The ground.** What the road builds (asphalt, paint, kerbs, pavements, shoulders) is the `Ground` group, the only
  one with a UV: each vertex's metres left of the centre line and metres from the start line. The app draws its
  surface and the lamps' light from that (`docs/course-realism.md`). A theme with street lamps names them (`lamps`)
  and the course file carries where their light falls.
- **The walls.** What is built of a material in `WALL_KINDS` (brick, containers, plaster) is the `Walls` group. Its
  UV is each vertex's metres along its wall and metres above the road beside it, plus 1,000 m for each kind of
  wall, from which the app draws brick courses, ribs or plaster (`docs/course-realism.md`).
- **The skyline.** `Kit.skyline` builds its towers into a part named `Skyline`, which becomes one mesh that is not cut
  into chunks and is always drawn; the app draws their lit windows.
- **Windows.** `Kit.window` builds a window as one panel of the `Windows` group, its UV its place on the panel, whether
  it is lit and its own number; the app draws the rest. Nothing a window has is modelled: there are thousands.
- **Halos.** `Kit.halo` puts four corners at a light's place in the `Halos` group; the app spreads them to face the eye
  and draws the light's glow. `Kit.lamp` gives every lamp one.
- **Baked shading.** What stands on the ground is darkened at its foot in its colours.
- **`pack_glb.py`** rewrites the exported vertex colours as bytes, a quarter of their size, and each mesh's positions as
  16-bit steps of its own box, a step a centimetre, put back by the mesh's node (KHR_mesh_quantization).
- **`meshopt_glb.mjs`** then writes the glb's buffers with the meshopt codec (Node, with the app's packages installed):
  a third of the download, and nothing in the file changed. Without Node the build leaves the glb as the packer
  wrote it.
- **`layout`.** Searching the layouts a seed can deal for one whose start and finish look out to sea can
  take minutes. The script prints the layout it chose, and each course file names it (`"layout": 2`) so
  the next build goes straight to it. Remove the line to search again after changing the seed.
- **The film's lamps.** The street lamps the film lights at night (`GlowLamp`) are kept whole in a `Film`
  collection of the scene, out of the glb, beside their chunks.
- **The budget** (L2-166 AC12): the worst frame within 120,000 triangles and 140 draw calls, the file
  within 3 MB gzipped. `docs/screenshots/courses/README.md` gives each map's numbers.

A hand-modelled change made in the `.blend` is lost the next time the script runs. Until the
pipeline can keep one, change the script, or export the glb from Blender yourself and leave the
script alone for that map.
