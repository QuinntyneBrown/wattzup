# Ride a course

**Requirement:** L2-166 (L1-027). **Decisions:** ADR 0032, ADR 0033 (every catalogue map a course). **Mock:** none changes: the course is drawn
on the canvas of the race scene (`docs/mocks`, the race), whose HUD stands as it is.

A course is a map built in Blender from the class it is modelled after. This design covers building
one and drawing it; the cadence score (L2-167) and a course's place in the catalogue are not in it.

## Building a course

`tools/blender/build_course.py` (see `tools/blender/README.md`) turns `courses/<id>.json`, the
class's plan, into three files.

| Step | Rule |
| --- | --- |
| Stages | Each segment of the plan becomes a stage with the metres it starts and ends at: `duration x cadenceAim / 60 x 5`. |
| Gradient | `(level - mean level) x 1 %`, the mean weighted by metres, eased with a 28 m box filter twice. The lowest point stands 4 m above the sea. |
| Turns | Dealt feature by feature from the seed (straight, sweep, hairpin, ess), weighted by the stage's kind, rejected when the road would come within 46 m of an earlier stretch, when nothing lies ahead of it, or when it strays past 620 m and does not turn for home. Curvature is eased over 20 m, and the eased line is checked again. |
| Road | A sample every 4 m, from 80 m before the start line to 200 m past the finish. |
| Map | The road with kerbs, paint and effort chevrons; an island heightfield that holds the road's height beside it and falls to the sea; the theme's scenery; gates at the start, the finish and the foot of every effort. One mesh a material. |

**Catalogue maps (ADR 0033).** A course file with `distanceKm` and `climbingMetres` (each catalogue map's)
is built to them: the metres a turn are `distanceKm x 1000 / the plan's turns`, and every gradient is scaled by
`climbingMetres / the metres the laid road climbs`. Its `theme` names its dress in `tools/blender/themes.py`:
palette, sky and lights, land (rolling farmland, a town in the countryside, a headland over the sea, a harbour,
an alpine valley, a beachfront, a high pass), road edge, the turns' weights, the gradient a level, a rolling
wave and a col's steady climb, and its scenery. The radius the road turns for home in grows with the square root
of its length, and the land's cells with it.

| Map | Course | Length | Climbing | Theme |
| --- | --- | --- | --- | --- |
| Prairie Paceline | `prairie` | 18.4 km | 90 m | Farmland at golden hour: fenced verges, fields in strips, barns and silos, a wind farm |
| Old Town Criterium | `oldtown` | 14.2 km | 140 m | Pastel houses on both pavements, bunting, cafés, a cathedral; the real Bruges streams by World Ride |
| Cliffside Coast | `coast` | 32 km | 410 m | Guard rail over the sea, pines and gorse, cottages, a lighthouse, sea stacks |
| Neon Docklands | `docklands` | 21.6 km | 120 m | Night: lamps, brick warehouses with lit windows and neon, cranes, containers, ships, bridges |
| Dolomites | `dolomites` | 38.5 km | 860 m | Alpine valley: spruce, chalets, a chapel on the highest bend, limestone peaks |
| Vice City | `vicecity` | 24 km | 60 m | Magenta sunset: palms, art deco hotels with neon, convertibles, the beach |
| Col du Granit | `granite` | 16.1 km | 1,240 m | High pass at first light: hairpins, parapets, snow poles, larches, granite peaks |

`<id>.course.json` carries `lengthMetres`, `durationSeconds`, `step`, `startIndex`, `roadHalfWidth`,
`sun` (the light's direction), `stages` (the plan's segments with `start`, `from`, `to`) and `points`
(the centre line, x, y, z in the glb's axes). A themed course adds `sky` (five colours, horizon up), `haze`,
`light` (`colour`, `intensity`) and `fill` (sky and ground), as `#rrggbb`.

## Drawing a course

All of it is in the `world` library; nothing outside it changes.

| File | Role |
| --- | --- |
| `course-worlds.ts` | Names the worlds drawn as courses and where their files are served. No Three.js. |
| `course.ts` | `parseCourse` validates the file. `Course` answers `metresAt(seconds)`, `stageAt(seconds)`, `place(metres, lane)` and `gradeAt(metres)`. No Three.js; unit-tested in `course.spec.ts`. |
| `map-renderer.ts` | `MapRenderer`, the `WorldRenderer` the loader returns. On `start` it imports `CourseRenderer` or `main`'s `ThreeWorldRenderer` by the world's id, and passes every call on. On `stream` (a real place, L2-066) while a course draws, it disposes the course, starts `main`'s renderer on the same canvas with the size and frame period it was given, and streams with it. |
| `course-renderer.ts` | `CourseRenderer`: loads the glb and the course file, builds the sky, the lights and the rider, and draws. |
| `ground-material.ts` | The `Ground` group's material (L2-166 AC13): the surface worked out from each vertex's place on the road (its UV) and a detail texture, and the lamps' light on it. `docs/course-realism.md` describes it. |
| `lamp-light-map.ts` | `lampLightMap(course, lamps)`: a grid over the map seen from above, the lamps' light on the ground and the road's height in each cell (L2-166 AC14). No Three.js; unit-tested. |
| `lamp-glow.ts` | `LampGlow`: the grid as a texture and the node that adds the lamps' light to a material; the scenery's and the riders' lit materials. |
| `wall-material.ts` | The `Walls` group's material (L2-166 AC15): brick, steel or plaster drawn from each vertex's place on its wall and the wall's kind, both in its UV. |
| `lamp-shadows.ts` | `lampShadows(lamps, metres, lane)`: the four shadows a rider throws under the lamps (L2-166 AC16). No Three.js; unit-tested. |
| `rider-shadows.ts` | `RiderShadows`: one instanced mesh that lays every rider's shadows on the road. |
| `sky-material.ts` | `skyMaterial(look, sun, detail)`: the sky worked out a pixel, with cloud, a glow, haze and, at night, stars (L2-166 AC17). |
| `window-material.ts` | The `Windows` group's material (L2-166 AC18): lintel, sill, frame, bars and a lit room or dark glass, drawn on one panel a window from its UV. |
| `fence-material.ts` | The `Fences` group's material (L2-166 AC19): posts and rails drawn on one panel a stretch of railing. |
| `halo-material.ts` | The `Halos` group's material (L2-166 AC21): four corners at a light's place, spread to face the eye, drawn as an added glow. |
| `water-material.ts` | The `Sea` group's material where the file has `sea` (L2-166 AC22): ripples, and the sky, the far shore's lights and the glint mirrored by the angle of view. |
| `rider-batch.ts` | `RiderBatch`: every rider's moving parts of a plain colour as one skinned mesh, a bone a part, so they are one draw call (L2-166 AC12). |
| `rain.ts` | `rain(strength, light)`: the rain as one mesh, each streak falling, wrapping round the camera and facing the eye in the vertex shader, lit by the lamps' grid (L2-166 AC24). |
| `course-cyclist.ts` | `CourseCyclistKit`: the course's own rider (L2-166 AC26), a body and a bike of lofted sections coloured by vertex, merged into one mesh but for the parts the pedalling moves. The class worlds' `world-cyclist.ts` is not used by a course. |
| `rider-lean.ts` | `bendLean`: how far a rider leans for the turn the road makes over the next metres (L2-166 AC27). Pure, unit-tested. |
| `rider-finish.ts` | `vertexFinish`, `sheen`: the gloss and metal a rider's vertices carry, as the material's roughness and metalness, and the edge light the lamps add (L2-166 AC28). |
| `rider-stance.ts` | `outOfTheSaddle`: how far out of the saddle a gradient has a rider (L2-166 AC29). Pure, unit-tested. |
| `rider-look.ts` | `riderLook`: a rider's skin, hair, bike, shoes, socks and height from their race number (L2-166 AC30). Pure, unit-tested. |
| `surface-detail.ts` | The detail texture's texels, worked out on the device: grain, patches, cracks, stones. No Three.js; unit-tested. |
| `world-renderer-loader.ts` | Returns a `MapRenderer`. It imports neither renderer, so Three.js still loads only when a world starts. |

**The field.** On a race's first frame `makeField` makes every rider (the first twelve) and draws them once, before
the frame the rider sees (L2-166 AC25).

**Warm.** Once the programs have compiled, every chunk is drawn once (`warm`), so its geometry is on the GPU before
the ride's first frame and a chunk coming into view later costs nothing.

**Start.** `WebGPURenderer` with its WebGL2 fallback (ADR 0021), then the course file and the glb
together. A failure of either resolves `false`, and `WorldScene` emits `unavailable` as it does for
`main`'s renderer. The scene is compiled (`compileAsync`) and drawn once at the start line before
`start` resolves, so the ride's first frame compiles nothing.

**A frame.** In a class, `metres = course.metresAt(frame.time x course seconds / plan seconds)`; in a
race (the frame carries `riders`), `metres = frame.s`, the metres ridden. The rider is
stood at `place(metres)` with the road's heading and slope; the camera sits 4.9 m back and 2.25 m up
on the centre line and looks 14 m ahead, so it follows every bend and crest, and closes in to 3.5 m
and 1.8 m at the start and the finish (L2-166 AC9). The sky dome and the sun's
light ride with the camera. Other riders come from `ridersOnRoad` (as `main`'s) and are stood at
`metres + gap` on their lanes.

**Look.** `courseLook(file)` gives the sky's bands, the haze (the fog and the background), the sun's colour and
intensity and the hemisphere fill; each part a file does not name, or names wrongly, is the sunset's. The glowing
meshes are unlit and drawn past the tone mapping; at the tiers that have it, a bloom pass over the scene
(`RenderPipeline`, `BloomNode`) lets them glow.

**The map's meshes.** The glb holds a few groups, each coloured by vertex and drawn with one cheap material (no
texture, no PBR, shaded flat): `Land`, `Solid`, `Leaves`, `Glow`, `Beams` and `Confetti`, cut into chunks along the
road (`Solid_012`), and `Sea`, `Sun`, `Conillera`, `StartRed` and `StartGreen` whole. What stands on the ground is
darker at its foot, baked into its colours. A mesh named for no group is drawn as the loader made it.

**What a frame draws.** Every few frames, and at once when the camera has jumped, each chunk is shown or hidden by
its distance from the camera, by group: the land to 950 m, solid scenery to 250 m, glow to 400 m, beams to 460 m,
leaves to 210 m, confetti to 300 m; the haze (200 m to 1500 m) covers the rest. No more than the four nearest riders
are drawn. A rider's still parts are merged into one mesh a material, and those of a plain colour into one
vertex-coloured mesh and the kit's mesh (`course-cyclist.ts`), with the moving parts of all riders drawn as one
(`rider-batch.ts`): some 5 draw calls a rider. Each rider's shadow is a dark blob
stretched away from the sun, or under street lamps the lamps' own shadows (`rider-shadows.ts`); there is no shadow map.

**Tiers.** Cheapest first: 0.75, 1, 1.5 device pixels a CSS pixel, then 1.5 and 2 with bloom. The ride opens on 1
with no bloom (L2-111 AC3's rule). Every 90 frames the average frame time is compared with the display's period:
within 1.1 of it, the tier steps up; over 1.6, it steps down and never steps up again.

**Budget (L2-166 AC12).** The worst frame within 120,000 triangles and 140 draw calls, the map's file within 3 MB
gzipped. `docs/screenshots/courses/README.md` gives each map's numbers. It is a budget, not a frame rate measured on
a tablet.

**Ground (L2-166 AC13).** `courseLamps(file)` reads the file's `lamps`, or null for none or a malformed one. The
`Ground` group is drawn to 420 m with `groundMaterial(roadHalfWidth, lamps)`; its normals are worked out when the map
loads. `tools/course-bench` times a course's frames in the real app; `docs/course-realism.md` gives the method and
each technique.

**Wet ground (L2-166 AC20).** `courseWet(file)` reads the file's `wet`. The ground's material mirrors the lamps and
the sky in its water as seen from an eye in the road's own measure, which `aim` sets each frame.

**Coloured lights (L2-166 AC23).** `courseLights(file)` reads the file's `lights`; `colourLightMap` makes their grid;
`LampGlow` adds it to the lamps' light and hands it to the ground's material.

**Lamplight (L2-166 AC14).** Where the file has `lamps`, `Solid`, `Land` and `Leaves` are drawn with
`LampGlow.scenery`, and each rider's lit materials are swapped for `LampGlow.rider` copies when the rider is made
(kept in a map by their source, so riders share them).

**Dispose.** Every geometry and material of the glb, the ground's detail texture, the lamps' grid and the riders'
lamplit materials, the sky, the lights, the cyclist kit and each
rider's materials, and the renderer.

## Tests

- `course.spec.ts`, `course-worlds.spec.ts`: the rules above, case by case.
- `e2e/race-course.spec.ts`: a race on a map whose world is `ibiza` loads `courses/ibiza.glb`, shows
  the renderer's tag, and its picture changes as the clock runs; Prairie Paceline and Vice City load their own
  courses (`prairie`, `vicecity`).
- `e2e/race-scenery.spec.ts`: Old Town's course hands over to World Ride to stream the real Bruges.
- World Ride's own specs race `worldRideMap`, a test-only map on Amsterdam, which `main` still draws.

## Films

`tools/blender/render_film.py <world>...` builds each course and renders its 20-second film to `blender/<id>.mp4`
with EEVEE (1280 x 720, 30 fps): four seconds of aerial over the turns and hills, then a drone 11 to 16 m behind
the rider and three bots out of the start, up the 300 m with the most turning and climbing, and into the finish
under the arch. At night the street lamps get point lights for the film only.

## Not yet

- The cadence score (L2-167), a course as a class, and a race's resistance set from the rider's
  place on the course.
- Quality tiers, the Graphics API setting and the probe's report on a course.
- Draco compression of the glb; saving a course for offline (L2-165).
