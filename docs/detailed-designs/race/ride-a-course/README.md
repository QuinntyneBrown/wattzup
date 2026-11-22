# Ride a course

**Requirement:** L2-166 (L1-027). **Decision:** ADR 0032. **Mock:** none changes: the course is drawn
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

`<id>.course.json` carries `lengthMetres`, `durationSeconds`, `step`, `startIndex`, `roadHalfWidth`,
`sun` (the light's direction), `stages` (the plan's segments with `start`, `from`, `to`) and `points`
(the centre line, x, y, z in the glb's axes).

## Drawing a course

All of it is in the `world` library; nothing outside it changes.

| File | Role |
| --- | --- |
| `course-worlds.ts` | Names the worlds drawn as courses and where their files are served. No Three.js. |
| `course.ts` | `parseCourse` validates the file. `Course` answers `metresAt(seconds)`, `stageAt(seconds)`, `place(metres, lane)` and `gradeAt(metres)`. No Three.js; unit-tested in `course.spec.ts`. |
| `map-renderer.ts` | `MapRenderer`, the `WorldRenderer` the loader returns. On `start` it imports `CourseRenderer` or `main`'s `ThreeWorldRenderer` by the world's id, and passes every call on. |
| `course-renderer.ts` | `CourseRenderer`: loads the glb and the course file, builds the sky, the lights and the rider, and draws. |
| `world-renderer-loader.ts` | Returns a `MapRenderer`. It imports neither renderer, so Three.js still loads only when a world starts. |

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

**Look.** The glowing meshes (neon, bulbs, the arches, the sun, the beams) are drawn past the tone
mapping, and a bloom pass over the scene (`RenderPipeline`, `BloomNode`) lets them glow. Only the
riders cast shadows, from one 1024 px map that follows the rider, onto the road and the promenade.

**Budget.** The map's meshes are static (`matrixAutoUpdate` off), untextured, and shaded flat from
derivatives (the glb carries no normals). The pixel ratio steps down (2, 1.5, 1, 0.75) when 90
frames average more than 1.6 display periods; the bloom is drawn only at the first two.

**Dispose.** Every geometry and material of the glb, the sky, the lights, the cyclist kit and each
rider's materials, and the renderer.

## Tests

- `course.spec.ts`, `course-worlds.spec.ts`: the rules above, case by case.
- `e2e/race-course.spec.ts`: a race on a map whose world is `ibiza` loads `courses/ibiza.glb`, shows
  the renderer's tag, and its picture changes as the clock runs.

## Not yet

- The cadence score (L2-167), a course as a class, and a race's resistance set from the rider's
  place on the course.
- Quality tiers, the Graphics API setting and the probe's report on a course.
- Draco compression of the glb; saving a course for offline (L2-165).
