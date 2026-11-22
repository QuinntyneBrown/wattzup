# Making a course look real

How a course (a map built in Blender, ADR 0032) is brought towards the look of a modern cycling game: surfaces with
texture, real light, real shadow, dense scenery, while it still draws at 60 fps on a low-power tablet. Each
technique here was proven on Neon Docklands (`docs/screenshots/courses/docklands/README.md` logs every pass with
its numbers, picture and film) and is written so it can be applied to any other map.

## The method

1. **One significant change a pass.** A surface, a light, a kind of scenery. Not a retune.
2. **Measure before and after in the real app**, with `tools/course-bench` (its README has the commands): the
   display's pace, and the frame rate with the limit off, at the top tier, on a real GPU. Take the median of three
   uncapped runs, and measure the before and the after in the same sitting: one run differs from the next by a
   tenth or more.
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

### 2. Standing light as a grid seen from above (Docklands pass 2)

**What it gives.** Everything near the road (riders, posts, walls, land, leaves) is lit by the street lamps, bright
under each and dim between, with no lights for the GPU to add up.

**How it works.**

- `frontend/projects/world/src/lamp-light-map.ts`: from the course's centre line and its `lamps`, a grid over the
  whole map, 2.5 m a cell: the summed light of the lamps at ground level (the same fall-off the ground uses) and
  the road's height at the nearest point of the centre line. Worked out once on the device, in a few milliseconds;
  unit-tested; nothing added to the map's file.
- `frontend/projects/world/src/lamp-glow.ts`: the grid as a two-channel texture and one TSL node, read at
  `positionWorld.xz`: the lamps' colour times the light there, faded out between 1.5 m and 9 m above the road's
  height. `scenery(strength)` is a flat-shaded, vertex-coloured Lambert material that emits its own colour times
  that node; `rider(material, strength)` copies a rider's material and adds the same.
- `course-renderer.ts`: where the course file has `lamps`, the `Solid`, `Land` and `Leaves` groups are drawn with
  `scenery`, and each rider's materials are swapped once, when the rider is made. A course without lamps keeps its
  plain materials and pays nothing.

**To apply it to another map.** Nothing more than technique 1's `lamps` entry in the theme: the grid and the
materials follow from the course file. For lights that are not along the road (a lit window, a neon sign, a
floodlit quay), add their pools to the grid in `lampLightMap` from a list in the course file; the materials do not
change. By day the same grid can hold shade instead of light (under a bridge, a tunnel, an avenue of trees).

**Cost.** About 0.2 ms a frame at 1080p on an Adreno X1-85; one texture of the map's footprint at 2.5 m a cell
(3.2 MB for Docklands' 3.3 x 3.0 km).

**Watch for.** Walls overlit to their tops (keep them near a third of the ground's strength and fade with height);
pale colours blooming; the light has no direction and casts no shadow.

### 3. Walls of brick, steel and plaster (Docklands pass 3)

**What it gives.** Buildings and containers stop being flat boxes: brick in courses with mortar, each brick its own
shade; ribbed, rusting steel; mottled, cracked plaster; rain streaks and a dirty foot on every wall.

**How it works.**

- `tools/blender/build_course.py`: a part whose material is in `WALL_KINDS` joins the `Walls` group. For each face
  `assemble` works out the wall's own axes from the face's normal: `u` is the metres along the wall (level, square
  to the way it faces), `v` the metres above the road beside it plus `WALL_KIND_STEP` (1,000) for each kind. A roof
  or a floor is kind 0, its UV its place on the map.
- `frontend/projects/world/src/wall-material.ts`: one flat-shaded Lambert node material. It takes the kind and the
  height back out of `v`, then draws the kind's pattern from `u` and the height: brick (0.225 x 0.075 m, 12 mm
  joints, a hash of the brick's row and column for its shade), ribs (a sine, 0.28 m pitch), plaster (the detail
  texture's grain, patches and cracks). `fwidth` of the UV says how much of a pattern one pixel covers; past a
  fifth of a repeat the pattern fades into its average.
- It reads the same detail texture as the ground (two reads) and adds the lamps' light as technique 2 does.

**To apply it to another map.** Rebuild it: its parts built of the materials in `WALL_KINDS` (`facade-*`, `deco-*`,
`whitewash`, `brick`, `tower`, `wall`, `container-*`) become walls with no other change. Give a new kind of wall a
number in `WALL_KINDS` and a pattern in `wall-material.ts` (timber boards, stone blocks, corrugated roofing, glass
curtain wall). The vertex colour stays the wall's base colour, so each theme's palette still decides it.

**Cost.** Too little to measure at 1080p on an Adreno X1-85; a draw call a chunk for the new group; about 0.14 MB
gzipped for Docklands' walls.

**Watch for.** Moire on far walls (fade the pattern sooner); a mortar colour that glows against dark brick at
night; kinds that need more than `u` and height (a pitched roof's tiles need the roof's own slope).

## What is left, in the order it is worth doing

The pictures the work aims at differ from a course in these ways, most visible first. Each becomes a pass.

1. Windows, doors and signs are flat panels: no frames, sills, glass or light spilling from them.
2. The riders' shadows are blobs, and nothing else casts a shadow.
3. The sky is bands of colour: no stars, moon or cloud at night; no real clouds by day.
4. The water is a flat colour: no reflection of the lights along the quay.
5. Wet ground: reflections of the neon and the lamps in the road.
6. The land beside the road is bare: no clutter (bollards, crates, bins, fences, parked vehicles).
7. Lamps and neon have no glow in the air (halos, haze under each lamp).
