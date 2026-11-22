# Making a course look real

How a course (a map built in Blender, ADR 0032) is brought towards the look of a modern cycling game: surfaces with
texture, real light, real shadow, dense scenery, while it still draws at 60 fps on a low-power tablet. Each
technique here was proven on Neon Docklands (`docs/screenshots/courses/docklands/README.md` logs every pass with
its numbers, picture and film) and is written so it can be applied to any other map.

## The method

1. **One significant change a pass.** A surface, a light, a kind of scenery. Not a retune.
2. **Measure before and after in the real app**, with `tools/course-bench` (its README has the commands): the
   display's pace, and the frame rate with the limit off, at the top tier, on a real GPU.
3. **Keep it only if the frame rate holds**: 60 fps or more at the display's pace with no run of slow frames, and
   uncapped above 240 fps on the bench machine (so a device a quarter as fast still draws 60). Otherwise take it
   out, and record what was tried.
4. **Record it**: the pass's row and notes in the map's README under `docs/screenshots/courses/<map>/`, with its
   picture and ten-second film, and the technique here.

## Principles that keep it cheap

- **Detail comes from where a surface is, not from pictures in the file.** The Blender build already knows where
  everything is; it gives the app a few numbers a vertex (a UV, a colour) and the material works the surface out.
  The map's download does not grow with its detail.
- **One material a group, one draw call a chunk.** A new look is a new group of the map (as `Ground` is), not a
  material an object. Draw calls stay where they were.
- **Light that never changes is arithmetic or baked, not a light.** A street lamp that stands still is a formula in
  the material or a tint in the vertices. Only what moves (the riders) needs anything worked out each frame.
- **Small textures made on the device, mipped and repeated.** Sampling a texture is far cheaper than noise worked
  out a pixel, and its mips keep the distance from shimmering.
- **Choose the cheap form before dropping the technique** (AGENTS.md, Low-power rendering): lower resolution, fewer
  samples, nearer draw distance, the top tiers only.

## Techniques

### 1. The ground's surface and the lamps' light (Docklands pass 1)

**What it gives.** Asphalt with grain, patches, wheel tracks, cracks and chips; worn paint; mottled pavements and
shoulders; and, where a map has street lamps, a pool of light under each.

**How it works.**

- `tools/blender/build_course.py`: the parts `build_road` lays (`GROUND_PARTS`) join a `Ground` group. `assemble`
  gives each of its vertices a UV: `u` the metres left of the centre line, `v` the metres from the start line
  (worked out from the nearest sample of the centre line). The glb exports UVs for this group only.
- `frontend/projects/world/src/surface-detail.ts`: a 256 x 256 texture worked out on the device, the same on every
  device, that repeats without a seam. Four channels: grain, patches, cracks, stones.
- `frontend/projects/world/src/ground-material.ts`: one `MeshStandardNodeMaterial` (TSL). It reads the detail at
  three scales (tiles of 1.2 m, 5.3 m and 37 m) and from `u` alone knows asphalt (within `roadHalfWidth`) from what
  lies beside it, and where the wheel tracks run. Paint is known by its pale vertex colour. The vertex colour stays
  the surface's base colour, so a theme's palette still decides it.
- Lamps: the course file's `lamps` (`every`, `first`, `across`, `height`, `colour`). The material adds, as emitted
  light, the surface's own colour times the lamp's colour times the fall-off from the nearest lamp and the next on
  each side: `(h² / (h² + across² + along²))²`.
- `course-renderer.ts` works out the group's normals when the map loads (the file carries none) and draws the
  group to 420 m.

**To apply it to another map.** Rebuild it (`blender --background --python tools/blender/build_course.py --
tools/blender/courses/<id>.json`): every map gets the `Ground` group and its surface with no other change. For a
map with street lamps, give its theme a `lamps` entry in `themes.py` (as Docklands') and place its lamps from it;
a map lit by day needs none. Tune only through the theme's palette (`asphalt`, `promenade`, `sand`): the material's
numbers are shared.

**Cost.** About 0.1 ms a frame at 1080p on an Adreno X1-85; no more triangles; the UVs add 8 bytes a ground vertex
before gzip.

**Watch for.** Lamp pools that merge into a wash (the fall-off too slow or the lamps too strong); detail too faint
to survive bloom and tone mapping; anything standing on the lit ground that the lamps do not light.

## What is left, in the order it is worth doing

The pictures the work aims at differ from a course in these ways, most visible first. Each becomes a pass.

1. Lamps light only the ground: the riders, the posts and the walls beside the road stay dark.
2. Walls are one flat colour: no brick, no window frames, no doors.
3. The riders' shadows are blobs, and nothing else casts a shadow.
4. The sky is bands of colour: no stars, moon or cloud at night; no real clouds by day.
5. The water is a flat colour: no reflection of the lights along the quay.
6. Wet ground: reflections of the neon and the lamps in the road.
7. The land beside the road is bare: no clutter (bollards, crates, bins, fences, parked vehicles).
8. Lamps and neon have no glow in the air (halos, haze under each lamp).
