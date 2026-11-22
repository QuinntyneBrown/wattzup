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

### 4. Shadows from standing lights, worked out (Docklands pass 4)

**What it gives.** Riders throw soft shadows away from each street lamp near them, which swing, stretch and fade as
they pass under it, in one draw call and with no shadow map.

**How it works.**

- `frontend/projects/world/src/lamp-shadows.ts`: `lampShadows(lamps, metres, lane)` gives the shadow of each of the
  four lamps nearest a rider (the row behind and the row ahead, both kerbs): its far end, `rider height / (lamp
  height - rider height)` times the way from the lamp, no longer than 9 m; its darkness, that lamp's fall-off over
  the sum of all four and a little ambient light, softened as it lengthens. Pure and unit-tested.
- `frontend/projects/world/src/rider-shadows.ts`: one `InstancedMesh` of a flat square with a soft round edge. Each
  frame every drawn rider adds five instances: the dark under the bike and the four shadows, each laid from one
  place on the road to another (`course.place`), so it follows bends and slopes. How dark an instance is rides in
  its instance colour.
- `course-renderer.ts` makes it where the course file has `lamps`; otherwise the sun's blob shadow stays.

**To apply it to another map.** Any map whose theme has `lamps` gets it. For a map lit by a low sun the same mesh
draws one long shadow a rider instead: give `lay` the sun's direction and a length of `rider height / tan(sun's
altitude)`. A sun shadow map (riders and scenery casting on everything) is the fuller answer by day and is not
built yet.

**Cost.** None measurable; four fewer draw calls than a blob a rider.

**Watch for.** On Three.js 0.187 (WebGPU) a custom instanced attribute's later values did not reach the GPU: carry
per-instance values in the instance's matrix or colour. Shadows drawn too faint to see look exactly like shadows
not drawn: log the numbers.

### 5. A sky worked out a pixel, and what stands on the horizon (Docklands pass 5)

**What it gives.** Drifting cloud, a glow round the sun or the moon, haze along the horizon and, at night, stars;
and a skyline of towers with lit windows that is always in view.

**How it works.**

- `frontend/projects/world/src/sky-material.ts`: `skyMaterial(look, sun, detail)` for a dome centred on the camera.
  The direction of each pixel gives: the course file's sky colours by height; cloud, the detail texture's patches
  laid on a flat ceiling (`direction.xz / (direction.y + 0.16)`) at two scales drifting in opposite ways, lit in
  the horizon's colour; a tight and a wide glow round `sun`; the haze's colour near the horizon. If the sky's top
  colour is darker than 0.02 it is night: stars are added (a grid on the sky, a hash a square, one in seven a
  star) and the cloud is drawn thinner and darker. `at(seconds)` moves the cloud; it is not called with reduced
  motion.
- `tools/blender/build_course.py`: a part named `Skyline` becomes the `Skyline` group: whole, not chunked, with the
  walls' UV and kind 4. `Kit.skyline` in `themes.py` builds its towers into that part.
- `wall-material.ts`: kind 4 is a grid of windows, lit by a hash of the window's row and column. Given a haze
  colour, the material mixes the wall half-way to it and takes no fog.

**To apply it to another map.** The sky needs nothing: every course gets it from the `sky`, `haze` and `light` its
file already has (by day: white-lit cloud, no stars, a wider sun glow). A map with a skyline (`Kit.skyline`, as Vice
City has) gets the windows on rebuilding. Mountains on the horizon (`Kit.peaks`) should become a group of their own
in the same way, so they too are always drawn.

**Cost.** None measurable at 1080p on an Adreno X1-85. About 5,000 triangles always drawn for 209 towers.

**Watch for.** Cloud too even (raise the lower edge of its `smoothstep`); stars that swim (they are fixed to the
sky's direction, so they should not); towers that read as glowing slabs (the far-off average is on too soon or too
bright).

### 6. Windows drawn on one panel each (Docklands pass 6)

**What it gives.** Every window has a lintel, a sill, a frame and glazing bars, and behind the glass a lit room or
dark panes, each window different, for two triangles a window.

**How it works.**

- `tools/blender/themes.py`: `Kit.window(i, along, off, up, w, h, lit, yaw)` adds one quad to the `Windows` part,
  `WINDOW_SURROUND` larger than the opening, with a UV a corner: 0 to 1 across the panel plus 2 if lit, 0 to 1 up it
  plus 2 x the window's number. `build_course.py` makes the part the `Windows` group, chunked like the scenery.
- `frontend/projects/world/src/window-material.ts`: an unlit node material. It takes the lit flag and the number
  back out of the UV, finds the place within the opening, and draws stone above and below it, wood at its edge and
  along the bars, and glass elsewhere. A lit room is its lamp's colour (a hash of the number: warm or cool, and how
  bright), a gradient up the window, a blind down to a height of its own, and the detail texture's patches for
  shapes in the room. Dark glass is the haze's colour, faint, brighter towards the top. `alphaTest` cuts the panel
  away beside the opening.

**To apply it to another map.** In its theme, call `k.window(...)` where it calls `k.panel(B["window"], ...)` or
`k.windows(...)` for a building's windows (Old Town's houses, the coast's cottages, Vice City's hotels), and
rebuild. For another shape of window (arched, shuttered, a shop front), add a kind beside the lit flag and its
drawing in `window-material.ts`. By day the lit share should be near none and the dark glass brighter: the haze's
colour already does the second.

**Cost.** None measurable; one draw call a chunk in view; no triangles beyond the two a window already had.

**Watch for.** The opening's share of the panel (`OPENING`) follows `WINDOW_SURROUND` and the window's size: a
window of another size needs the same surround in proportion, or the constants given as part of the UV.

## What is left, in the order it is worth doing

The pictures the work aims at differ from a course in these ways, most visible first. Each becomes a pass.

1. The land beside the road is bare: no clutter (bollards, crates, bins, fences, parked vehicles), and the quay is
   an empty apron.
2. Nothing but the riders casts a shadow: posts, walls and containers throw none.
3. The water is a flat colour: no reflection of the lights along the quay or of the city.
4. Wet ground: reflections of the neon and the lamps in the road.
5. Lamps and neon have no glow in the air (halos, haze under each lamp), and lit windows and neon throw no light
   on the ground.
6. The riders are simple figures: smooth limbs, no cloth, no faces.
7. Doors, signs, pipes, gutters and roof lines: a building is still a box with windows.
