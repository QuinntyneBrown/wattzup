# Ibiza Sunset Strip: passes

Each pass makes one upgrade to the map or to how it is drawn, then checks the frame's cost at 16 places along the
course against the budget for low-power tablets (L2-166 AC12): no more than **120,000 triangles** and **140 draw
calls** in the worst frame, and a download of no more than **3 MB gzipped**.

The check runs the real `CourseRenderer` on the real `ibiza.glb` in headless Chrome and reads what the renderer sent
the GPU. It is a budget, not a frame rate: this was drawn in software, with no GPU, and **no pass has been timed on a
real tablet**. Until one is, the budget and the renderer's tiers (it opens cheap and steps up only while frames keep
the display's pace) are what stand behind 60 fps.

| Pass | Worst frame | Download | Budget |
| --- | --- | --- | --- |
| Pass 0 (baseline) | 350,829 triangles, 784 draw calls | 3.86 MB | Over |
| Pass 1 (map in chunks, one cheap material a group, draw distances, blob shadows, byte colours) | 177,662 triangles, 479 draw calls | 4.64 MB | Over |
| Pass 2 (riders' still parts merged, nearest four riders drawn, scenery drawn nearer) | 123,020 triangles, 193 draw calls | 4.64 MB | Over |
| Pass 3 (no undersides, land and beams in longer chunks, lighter asphalt) | 127,090 triangles, 175 draw calls | 4.50 MB | Over |
| Pass 4 (coarser far land, glow and leaves in longer chunks, nearer scenery distances) | 116,656 triangles, 166 draw calls | 4.34 MB | Over |
| Pass 5 (each rider's plain-coloured parts merged into one mesh) | 116,656 triangles, 141 draw calls | 4.34 MB | Over |
| Pass 6 (verges and paint two samples long on straight even road) | 115,450 triangles, 141 draw calls | 4.27 MB | Over |
| Pass 7 (shading baked into the colours: walls, posts, trunks and the crowd darker at the foot) | 115,450 triangles, 139 draw calls | 2.25 MB gzipped | Within |
| Pass 8 (clubs: arched glowing doorways, striped awnings, windows; the crowd gets faces and legs) | 112,130 triangles, 136 draw calls | 2.26 MB gzipped | Within |
| Pass 9 (fuller palms in two greens, a glow round the sun, its path on the water, streaks of cloud) | 121,889 triangles, 141 draw calls | 2.43 MB gzipped | Over |
| Pass 9, retuned (draw distances trimmed to pay for the palms and the sky) | 117,233 triangles, 141 draw calls | 2.43 MB gzipped | Over |
| Pass 10 (smaller sun glow matched to the sky; land and beams drawn nearer) | 117,233 triangles, 141 draw calls | 2.43 MB gzipped | Over |
| Pass 11 (start lights not drawn once far behind) | 117,233 triangles, 141 draw calls | 2.43 MB gzipped | Over |
| Pass 12 (glow and leaves in chunks three long: fewer meshes on screen) | 118,270 triangles, 138 draw calls | 2.49 MB gzipped | Within |
| Pass 13 (opens on a cheap tier and steps up only while frames keep pace; beams breathe, confetti flutters) | 118,258 triangles, 126 draw calls | 2.49 MB gzipped | Within |
| Pass 13 at the top tier (bloom on), for reference | 118,270 triangles, 138 draw calls | 2.49 MB gzipped | Within |

Passes 0 to 6 give the file's size uncompressed; from pass 7 it is gzipped, as it is served.

`app-*.jpg` are frames from the top tier (bloom on) after pass 13; `blender-overview.jpg` is the Blender scene.

## Rebuilt with the realism work that went into Neon Docklands

Ibiza Sunset Strip was the first map built in Blender, and the passes above were its. The realism work that
followed was done on Neon Docklands (`../docklands/README.md`, `docs/course-realism.md`) and on the riders
(`../riders/README.md`), in the builder's themes; Ibiza's own scenery predates the themes and its shipped file
predated all of it. This rebuilds it.

**Before** (`ibiza-00.jpg`, the shipped file in the app after the riders' and the camera's passes): a flat dark
road with no surface, flat-coloured clubs, land, leaves and glow and nothing else: no ground of its own, no walls,
windows, railings or glows in the air. The new riders, and the sun's light on them.

**After** (`ibiza-01-strip.jpg`, the club-lined strip by the start; `ibiza-01-headland.jpg`, 1.6 km in on the first
headland; `ibiza-01.mp4`, twelve seconds from 1.3 km): the road is asphalt with its grain, cracks, patches, wear and
painted lines; the promenades are worn paving between red and white kerbs. The clubs are stained whitewash with
windows in frames, some lit; their doorways and neon signs glow in the air and tint the terrace and the road before
them; strings of bulbs cross the strip. A railing runs along the promenade's far edge where no club stands. The sea
is water. The riders are the course's own (the rider of the riders' passes), with their shadows in their shape.

**The road follows its map, with bends and hills.** Ibiza is now a theme in everything but its land and scenery
(`"own": True` in `themes.py`): its stages are dealt bends (an effort winds up through esses and a hairpin, a
recovery sweeps down, the strip between has bends of its own: some 3,500 degrees of turning in 8.4 km, a full
circle every 860 m), each effort climbs a ramp in the first half of its stretch onto a headland and each recovery
drops off it, and the ground between rolls. Gradients run from -10 % to +10 %. It climbs 159 m, as its entry in
the catalogue says.

**What changed.**

- `tools/blender/themes.py`: an `ibiza` theme (its sunset as the app drew it, `turns`, `grade` with ramps and a
  roll), marked `own`.
- `tools/blender/build_course.py`: a theme that is `own` keeps `build_terrain` and `build_scenery`; `build_scenery`
  makes a kit as the themed maps do and uses it for the clubs' windows, the glow round each doorway, sign and string
  of bulbs, the light each throws, and the railing.
- `frontend/projects/world/src/lamp-glow.ts`, `course-renderer.ts`: a course with coloured lights and no street
  lamps (a strip at dusk) has them lit on its ground, water, walls, windows and railings (`colouredGlow`), at a
  sixth of a night's strength (`DUSK_LIGHT`), under the sun that still lights everything. Before, only a course
  with lamps used its lights.
- `frontend/projects/ride/public/courses/ibiza.glb`, `ibiza.course.json`, `tools/blender/scenes/ibiza.blend`:
  rebuilt.

**Measured**, in the real app from 1.3 km with the medium pack (the display was at 60 Hz):

| | Before | After |
| --- | --- | --- |
| Display pace, top tier | 60.1 fps, none over 20 ms | 60.0 fps, none over 20 ms, worst 17.2 ms |
| Uncapped, top tier | not measured | 360 fps (2.78 ms): 360, 360, 363 |
| Draw calls, top tier | 71 | 92 |
| Triangles in the frame, top tier | 69,173 | 92,816 |
| Groups drawn | Beams, Glow, Land, Leaves, Solid | those and Ground, Walls, Windows, Fences, Halos |
| The low-power stand-in (lowest tier, processor six times slower) | not measured | 55.7, 56.3 fps; 54 to 56 draw calls, 65,600 triangles |
| The file, as built | | 5.00 MB, 1.87 MB after meshopt |

Unit tests: 1,957 pass. The race's end-to-end specs: 73 pass and 14 fail; three that failed in a first, slow run
(`race.spec` twice, `race-world.spec` once) pass run on their own, and the rest are the failures recorded before
this work.

**A film to watch.** Forty-five seconds from 1.25 km, top tier, saved outside the repository at the owner's asking
(`Downloads/Ibiza Sunset Strip.mp4`). The panel's clock and distance in it are the race's own, which starts at the
start line while the bench places the camera up the road.

**Tried and dropped.** The coloured lights at a night's strength: with a string of bulbs over the road at each of
eighty clubs the whole road went grey and the terraces white. A sixth.

**Not done.** Ibiza has no street lamps of its own (it is not dark), so nothing lamp-lit applies: no lamp pools, no
lamps' shadows, no wet road. Its land is still `build_terrain`'s and not a theme's `land`.
