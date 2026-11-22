# Blender maps

Each Telo Ride map is modelled after a GCN online class (AGENTS.md, Direction; ADR 0032). This folder
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
| `frontend/projects/ride/public/courses/<id>.glb` | The map the Ride app draws: glTF binary, +Y up, flat colours, no textures, no normals (the app shades it flat). |
| `frontend/projects/ride/public/courses/<id>.course.json` | The road's centre line and the plan's stages along it. The app rides this. |
| `tools/blender/scenes/<id>.blend` | The Blender scene: open it to look the map over or model it further. The `Guides` collection holds the centre line and is left out of the glb. |

`--preview <dir>` also renders four stills with Cycles (an overview, the start, the steepest climb and
the finale). `--out` and `--blend` move the outputs.

## How a class becomes a map

A course file (`courses/<id>.json`) holds the class's plan: for each segment its kind, its seconds,
its target resistance (`level`) and its cadence aim (rpm).

- **Size.** A segment's stretch of road is its seconds x its rpm x 5 m a turn of the pedals (the
  scene driver's gearing). The map is as long as the class: Intervals to the Beat, 20:00, is 8.4 km.
- **Elevation.** A level above the course's mean climbs and one below it descends, 1 % of gradient a
  level, eased over 28 m. Ibiza's mean level is 15.9: the level 24 sprints climb at 8 %, the level
  11 recoveries and the cool-down descend at 5 %.
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

To add a map: write `courses/<id>.json` from the class's plan, give the theme its scenery in
`build_scenery`, run the script, and name the world in
`frontend/projects/world/src/course-worlds.ts`.

A hand-modelled change made in the `.blend` is lost the next time the script runs. Until the
pipeline can keep one, change the script, or export the glb from Blender yourself and leave the
script alone for that map.
