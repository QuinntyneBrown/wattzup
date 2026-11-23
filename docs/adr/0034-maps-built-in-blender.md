# 0034. Maps are built in Blender from the class they are modelled after, and ridden by the clock

- **Status:** Proposed
- **Date:** 2026-11-22
- **Amends:** [0020](0020-three-js-for-world-ride.md), [0023](0023-bend-the-road-in-the-vertex-stage.md), [0030](0030-world-library-carried-from-main.md)

## Context

AGENTS.md's Direction makes Telo Ride mainly a kart-racing-style game: each map is modelled after a
GCN online class, its size relative to the class's length, its elevation driven by the class's
resistance, and riders score for holding each stage's cadence.

`main`'s scenes (ADR 0030) cannot be that map. They draw a straight street that recycles every few
hundred metres, bend it in the vertex stage (ADR 0023) and ease its gradient towards the current
segment's as the rider arrives. There is no place on them: no corner a rider learns, no hill that
is the same hill next time. They stand as the concept of each world (`world-<name>.ts`,
`docs/class-worlds.md`).

## Decision

- **A map is a course: one model, built in Blender.** `tools/blender/build_course.py` reads a course
  file (the class's plan) and writes the map as glTF binary, the road's centre line as JSON, and the
  Blender scene. The glb and the JSON are served from the Ride app's `public/courses/`.
- **The class gives the course its structure.** A segment's stretch of road is its seconds x its
  cadence aim x 5 m a turn; its gradient is 1 % for each level its target resistance stands above
  the course's mean. Turns are dealt from a seed.
- **A class's clock places the rider.** At second `t` the rider is where the plan's stage at `t`
  puts them, each stage's stretch ridden evenly. Every rider meets each hill as the bike's
  resistance changes for it, and the class's video stays in step; their cadence against the
  stage's aim is what they are scored on (to come: L2-167).
- **A race's distance places the rider.** A race is won by distance (L2-071), so on a course its
  riders are the metres they have ridden from the start line, and the map's finish line is the
  race's: the map's `distanceKm` is the course's length.
- **A second renderer, behind the same contract.** `CourseRenderer` (`course-renderer.ts`) draws a
  course: GLTFLoader, the cyclist kit's riders on the road, a chase camera, a sunset sky. The
  loader hands the scene a `MapRenderer`, which imports `CourseRenderer` for a world named in
  `course-worlds.ts` and `main`'s `ThreeWorldRenderer` for every other. `WorldScene`, `SceneDriver`
  and the `WorldRenderer` contract are unchanged.
- **Ibiza Sunset Strip is the first course**, from GCN's Intervals to the Beat.

## Consequences

- In a race the plan still sets the resistance by the clock while the rider's place follows their
  distance: a rider faster or slower than the course's pace meets a hill before or after its
  resistance. Setting a race's resistance from the rider's place on the course would close that
  (open question 16).
- `CourseRenderer` has its own five tiers (pixel ratio and bloom), opens on a cheap one and steps
  up only while frames keep the display's pace (L2-166 AC6). The quality and Graphics API settings
  of L2-159 to L2-161 and the test-only probe's report are `main`'s renderer's and do not reach a
  course yet.
- A map is built for low-power tablets (L2-166 AC12): vertex colours and no textures, chunks along
  the road drawn by distance, blob shadows, merged riders. That budget stands in for a frame rate
  nobody has yet measured on a real tablet. The maps are 5 to 10 MB each, 2.5 to 5.7 MB gzipped:
  only Ibiza is within the 3 MB the budget allows. Draco, which Blender proper can write and whose
  decoder the build already copies for 3D Tiles, would cut the download several times.
- Ibiza Sunset Strip joins the map catalogue (ADR 0029) as its eighth map, open from the start,
  with the class's 20:00 plan rather than the 30:00 every other map rides. Its place on the unlock
  path is still to be decided.
- `main`'s scene for a world named in `course-worlds.ts` is no longer drawn; its file stays as the
  concept the Blender theme is built from.
- A course is rebuilt by its script: a change modelled by hand in the `.blend` is lost on the next
  build.
