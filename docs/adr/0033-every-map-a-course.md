# 0033. Every map in the catalogue is a course, built to its listed distance and climbing

- **Status:** Proposed
- **Date:** 2026-11-22
- **Amends:** [0032](0032-maps-built-in-blender.md)

## Context

ADR 0032 built the first map in Blender, Ibiza Sunset Strip, from the class it is modelled after, and left
the catalogue's other seven maps (Prairie Paceline, Old Town Criterium, Cliffside Coast, Neon Docklands,
Dolomites, Vice City and Col du Granit) on `main`'s recycled street scenes. Those scenes have no place a rider
learns: no corner or hill that is the same next time.

The seven maps share one 30:00 plan, the catalogue's placeholder intervals, and list their own distance
(14.2 to 38.5 km) and climbing (60 to 1,240 m). A race is won over the listed distance (`race-store.ts`'s
finish line is `distanceKm x 1000`), so a course must be exactly that long. Built by ADR 0032's rule alone,
every one would be 11.5 km, with identical hills. Old Town also follows a real place, Bruges, which a rider
can stream as photorealistic 3D Tiles (L2-066), and only `main`'s renderer can draw those.

## Decision

- **Every catalogue map is a course.** Each has a course file (`tools/blender/courses/<world>.json`: its plan,
  seed, theme, `distanceKm` and `climbingMetres`) and its glb and course JSON in `public/courses/`. Every map
  world is named in `course-worlds.ts`, Vice City's under `southbeach`, the id `main` draws it under.
- **A course is as long, and climbs as much, as its map lists.** The gearing, the metres a turn of the pedals,
  is set per course so the plan's stages add up to the listed distance, each stretch still in proportion to its
  seconds and cadence aim. The gradients, still laid from the target resistance (above the mean climbs, below
  descends), plus a theme's rolling ground and, on a col, a steady climb, are scaled alike, so the course climbs
  the listed metres and every hill keeps its place and its share. Ibiza Sunset Strip, built from its class
  rather than a catalogue entry, keeps ADR 0032's rule (5 m a turn, 1 % a level).
- **A theme dresses each world.** `tools/blender/themes.py` holds each world's palette, sky, haze and lights,
  land (farmland, a town, a headland, a harbour, an alpine valley, a beachfront, a high pass), road edge, the
  turns it deals and its scenery, built from the world's concept (`world-<name>.ts`). Ibiza keeps its own
  scenery in `build_course.py`.
- **The course file carries its world's sky and lights.** `sky`, `haze`, `light` and `fill`, as `#rrggbb`,
  which `courseLook` reads; a course without them, or with a malformed colour, is drawn in Ibiza's sunset.
- **Streaming a real place hands the canvas to `main`'s renderer.** Old Town rides its Blender course; when the
  rider streams the real Bruges, `MapRenderer` disposes the course and starts `main`'s renderer on the same
  canvas, which streams the place as before.
- **Each course has a 20-second film**, rendered with EEVEE by `tools/blender/render_film.py` into the
  repository's `blender/` folder: an aerial of its turns and hills, then a drone chasing the rider and three
  bots out of the start, up the twistiest climb and into the finish.

## Consequences

- No catalogue map is drawn by `main`'s scenes any more. World Ride's own specs (quality tiers, step-down,
  riders, a hidden tab) race a test-only map whose world, Amsterdam, `main` still draws; classes still ride
  `main`'s scenes.
- The seven share one placeholder plan, so their stages fall at the same times; only their gearing, hills,
  turns and dress differ. A real plan per map (the class each is modelled after) replaces the placeholder
  when the catalogue gets one, and the course is rebuilt.
- The longer maps are larger downloads: Dolomites' 38.5 km is about 525,000 triangles. Draco compression
  (ADR 0032) matters more.
- The films are build artefacts kept in the repository (a few MB each), rebuilt with the course.
