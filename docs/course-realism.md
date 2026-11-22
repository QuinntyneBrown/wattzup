# Making a course look real

How a course (a map built in Blender, ADR 0032) is brought towards the look of a modern cycling game: surfaces with
texture, real light, real shadow, dense scenery, while it still draws at 60 fps on a low-power tablet. Each
technique here was proven on Neon Docklands (`docs/screenshots/courses/docklands/README.md` logs every pass with
its numbers, picture and film) and is written so it can be applied to any other map.

## Tried on other maps

The techniques were proven on Neon Docklands, a night map. Cliffside Coast (sunset, a sea, cliffs) and Prairie
Paceline (golden hour, farmland) were then rebuilt with the same build into a scratch folder and ridden in the app,
unchanged and uncommitted (`docs/screenshots/courses/realism-on-coast.jpg`). Both build, and ride at 120 fps with
no slow frame. With no work in their themes they take techniques 1 (the ground), 5 (the sky), 11 (the smaller
file: 5.11 to 3.92 MB and 3.20 to 2.39 MB gzipped), 12 (the coast's water), 13 (street furniture), 16 (riders in
one draw call) and 18 (everything on the GPU first). The rest need a few lines in each theme, as each technique's
"To apply it to another map" says. The seven maps' shipped files have not been rebuilt: that is a decision for
whoever owns the maps, since every map's download and look change with it.

## The method

1. **One significant change a pass.** A surface, a light, a kind of scenery. Not a retune.
2. **Measure before and after in the real app** (the worst frame as well as the mean: stutter is a few bad frames)
   , with `tools/course-bench` (its README has the commands): the
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

**Light from above (Docklands pass 12).** The node also multiplies the light by how far the surface faces up:
`mix(0.22, 1, clamp(normalWorld.y x 0.5 + 0.5))`. Everything under a street lamp is lit from nearly straight
above, so this one term gives riders and scenery their shape without knowing where any lamp is.

**Watch for.** Walls overlit to their tops (keep them near half the ground's strength and fade with height); pale
colours blooming; nothing but the riders casts a shadow.

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

**Doors (Docklands pass 21).** `Kit.door(i, along, off, up, w, h, lit)` adds a panel to the same group with 4 added
across its UV; the material takes the two flags apart (`kind = floor(u / 2)`: 0 a dark window, 1 a lit one, 2 a shut
door, 3 a lit one) and draws a door as a frame and a shutter of slats, raised part-way on a lit bay. Add further
kinds the same way: a shop front, a garage, an arched doorway.

**Watch for.** The opening's share of the panel (`OPENING`) follows `WINDOW_SURROUND` and the window's size: a
window of another size needs the same surround in proportion, or the constants given as part of the UV.

### 7. Dressing the roadside, and railings as panels (Docklands pass 7)

**What it gives.** The land beside the road stops being bare: a railing, bollards, drums, crates, parked lorries,
floodlight masts, cranes and containers.

**How it works.**

- `tools/blender/themes.py`: the theme's scenery function walks the road's samples and deals clutter from a random
  generator of its own (`random.Random(k.n * 31 + 7)`), so adding to it moves nothing already placed. Each thing is
  a few boxes or one prism in an existing material, so it joins the `Solid` or `Walls` group and costs no draw
  call.
- `Kit.fence(i, off, height)`: one quad from this sample of the road to the next, in the `Fences` part, with a UV
  of (metres along the road, share of the height). `build_course.py` makes it the `Fences` group.
- `frontend/projects/world/src/fence-material.ts`: a flat-shaded Lambert node material, both sides drawn, that
  keeps a post every 2 m and three rails and cuts the rest away with `alphaTest`; the lamps light it as they do
  the walls.

**To apply it to another map.** Deal the map's own clutter in its theme's scenery function from a generator of its
own (hay bales and troughs on the prairie, cafe tables in the old town, boats on the beach). Use `Kit.fence` for
anything long and thin beside the road: a prairie's post-and-rail fence (change the posts' spacing and the rails in
`fence-material.ts`, or give the panel a kind), a guard rail, a promenade's balustrade.

**Cost.** About 5,000 triangles in the frame and 5 draw calls on Docklands; 0.6 MB gzipped in the file.

**Watch for.** The count: a thing every sample of the road is thousands of things. A railing, a kerb or a line is a
panel or a formula, never boxes. Check the file's size and the frame's triangles after every rebuild.

### 8. Hills a rider can see (Docklands pass 8)

**What it gives.** Climbs that stand up in front of the rider, on a map whose listed climbing is small, without
changing what the map lists.

**How it works.** `tools/blender/build_course.py`, `lay_centre_line`: a theme's `grade` rule may hold
`"ramp": {"work": share, "recover": share}`. For a stage of that kind, its gradient is divided by the share and
applied over that share of its stretch from its start; the rest of the stretch is level. The gradients are then
eased over 40 m and scaled as before so the map climbs exactly its listed metres.

**To apply it to another map.** Give its theme a `ramp` where its hills do not show: any map whose efforts climb
at under about 6 % (work the gradient out as the listed climbing over the efforts' total length). Drop `roll` on a
map that should be flat between its hills. Leave the mountain maps as they are: a col's steady climb is the point.

**Cost.** None.

**Watch for.** Ramps steeper than about 10 % look like a wall and no longer match the resistance; a ramp shorter
than the 40 m the gradients are eased over is flattened.

### 9. Wet ground with reflections worked out (Docklands pass 9)

**What it gives.** Standing water on the road and pavements that mirrors the street lamps as streaks towards the
rider and holds the sky's glow, with no reflection pass and no second render of the scene.

**How it works.**

- The theme's `wet` (0 to 1) goes into the course file; `courseWet(file)` reads it.
- `ground-material.ts`, `groundMaterial(detail, roadHalfWidth, lamps, wet, haze)`: `water` is a `smoothstep` of the
  detail texture's patches (plus a little for the wheel tracks) whose threshold falls as `wet` rises. Water darkens
  the colour and drops the roughness to 0.12, so the scene's own light glints in it.
- The lamps' reflections: the material holds a uniform, the eye in the road's measure (metres left, metres up,
  metres along), which `course-renderer.ts` sets each frame from the camera's place on the road. For a pixel on the
  ground, the lamp row whose mirror image falls there is `eye + (pixel - eye) x (eye height + lamp height) / eye
  height` along the road, rounded to a row; that row and its neighbours, both kerbs, each add
  `pow(dot(normalize(toLamp + toEye), up), gloss)`, with `gloss` from the detail texture's grain so the streak
  breaks up.
- The sky's reflection: the haze's colour times `(1 - toEye.y)^5`.

**To apply it to another map.** Give its theme a `wet` and rebuild: it gets the dark patches, the glints and the
sky's sheen. The lamps' streaks need `lamps` too. By day a wet road mirrors the sky most: raise `MIRROR.sky` for a
theme, or give it the sun's glint by the same highlight with the sun's direction in place of a lamp's.

**Cost.** About 0.1 ms a frame at 1080p on an Adreno X1-85.

**Watch for.** Streaks that blow out (keep them a few times a lamp's brightness; bloom adds the rest); hard edges
between rows of lamps (take a row either side); on tight bends the road's measure bends and the streaks lean: they
are faint there, and it has not been a problem.

### 10. A glow round every light (Docklands pass 10)

**What it gives.** Lamps that look lit: a soft disc of light in the air round each, facing the eye, dwindling to a
string of points down the road.

**How it works.**

- `tools/blender/themes.py`: `Kit.halo(at, glow)` adds a quad whose four corners are all at `at`, with UVs (0,0),
  (1,0), (1,1), (0,1), to the `Halos` part in the light's glowing material. `build_course.py` makes it the `Halos`
  group, in chunks three long.
- `frontend/projects/world/src/halo-material.ts`: an unlit, additive node material with no fog and no depth write.
  Its `vertexNode` is the projection of the light's place in the eye's axes plus the corner's offset
  (`(uv - 0.5) x 2 x radius` in x and y). Its colour is the vertex colour times a tight gaussian and a wide cubic
  skirt of the distance from the middle, times a fade with distance from the eye.

**To apply it to another map.** Any map whose lamps are placed with `Kit.lamp` gets halos on rebuilding. Call
`k.halo(place, material)` for any other light: a lighthouse's lantern, a neon sign's ends, a string of bulbs (one
for a few bulbs, not one each), the sun's disc at dusk. By day leave them out: a lamp that is not lit has no glow.

**Cost.** About 0.05 ms a frame; a draw call a chunk in view; two triangles a light.

**Watch for.** Winding: the UV's flip on export turns the corners round, so draw both sides. Halos in front of
everything (they must test depth but not write it). Too many of them close together add up to a white smear.

### 11. Paying for detail: the file's size (Docklands pass 11)

**What it gives.** Room: every pass above adds vertices, and the map's download has a budget (3 MB gzipped).

**How it works.** `tools/blender/pack_glb.py`, run by the build over the glb it exports: each mesh's `POSITION`
becomes normalised 16-bit steps of the mesh's own bounding box, a step never finer than 1 cm (`STEP`), with the
box's corner and size written to the mesh's node as its translation and scale (KHR_mesh_quantization, which
Three.js's loader reads without a decoder). Colours were already bytes. UVs stay floats: they hold metres along a
21.6 km road.

**To apply it to another map.** Rebuild it: the packer runs on every map. Anything the app moves by its node (as
the confetti) must be named in `MOVED`. Code that reads a mesh's geometry must use the mesh's matrix, as
`course-renderer.ts` now does for a chunk's middle.

**And the codec (Docklands pass 23).** `tools/blender/meshopt_glb.mjs`, run by the build after the packer, reorders
each mesh for the meshopt codec and writes every buffer with it (EXT_meshopt_compression); the app's loader is
given Three.js's decoder. Docklands: 3.30 to 1.41 MB gzipped. Do not use `gltfpack` on these maps: it drops the
UVs and the lamps' glow, which no texture or area tells it are used.

**Cost.** None at run time. Docklands: 3.95 to 3.31 MB gzipped by stepping, and to 1.41 MB with the codec.

**Watch for.** Two surfaces a centimetre or two apart (paint on a road) must still be whole steps apart after
stepping, or they fight; a mesh more than 655 m across is held more coarsely than a centimetre.

### 12. Water that mirrors by the angle it is seen at (Docklands pass 13)

**What it gives.** A sea that ripples, takes the sky's colour towards the horizon, carries the far shore's lights as
columns and the sun's or the moon's glint, and is dark looked down on.

**How it works.** `frontend/projects/world/src/water-material.ts`, `waterMaterial(look, sun, detail, lights)`, for
the map's `Sea` group when the course file has `sea: true`:

- the surface's tilt is two reads of the detail texture at `positionWorld.xz`, scrolled across each other by the
  ride's clock;
- the eye's ray (`cameraPosition - positionWorld`) is reflected in the tilted surface;
- the reflected ray's height mixes the haze's colour (low) with the top of the sky (high);
- with `lights` (the file's `night`), where the ray runs low a warm column is added wherever the detail texture,
  read at the ray's compass bearing, is high;
- the ray's dot with `sun`, to a high power, is the glint;
- Schlick's `(1 - dot(up, toEye))^5` mixes the water's own dark colour with all of that.

**To apply it to another map.** A theme whose `terrain` has `sea: True` gets it on rebuilding (the coast, Vice City,
Ibiza). By day there are no shore lights; the sky's colours and the sun's glint come from the course file as they
are. A lake or a river is the same material on its own mesh named `Sea`.

**Cost.** None measurable where the sea is a small part of the frame; three texture reads a pixel of water.

**Watch for.** Shore lights as bright as their windows (keep them near half); ripples so steep the horizon breaks
up (`RIPPLE`); water seen through the land's edge where the land's mesh is coarse.

### 13. Street furniture that is the right shape (Docklands pass 14)

**What it gives.** Lamp posts and bend boards that look like the real things: the small, familiar objects that
give a scene away when they are wrong.

**How it works.** `tools/blender/themes.py`: `Kit.lamp` builds a five-sided column tapering from 0.1 m to 0.06 m,
an arm, a housing and one lit quad on its underside (35 triangles a lamp); `Kit.gates` builds each bend's board
across the road's direction on two legs, with three black triangles for arrowheads, pointing to the inside of the
bend.

**To apply it to another map.** Rebuild it: both are in the shared kit. Give other familiar things the same care
before adding new kinds of scenery: guard rails, snow poles, kilometre stones, bus shelters, bins.

**Cost.** None at run time; 0.06 MB in Docklands' file.

**Watch for.** Triangles a copy times thousands of copies. Two faces on the same corners: Blender keeps one.

### 14. Bridges: a climb with nothing beside it (Docklands pass 15)

**What it gives.** A climb that is a bridge over water: parapets, a walkway, piers, the sea beneath and the view
either side, where there was a ramp of paving with the land rising alongside.

**How it works.** `tools/blender/build_course.py`:

- `lay_centre_line`: with `bridges` in the theme, each sample of road from the foot of an effort's ramp is marked
  `bridge` while the road stands `BRIDGE_CLEAR` (1.6 m) above the height the ramp began at.
- `build_road`, `edges`: between two marked samples it lays a walkway to 1.5 m beyond the kerb, a parapet 1.05 m
  high and 0.3 m thick, the deck's side 1.3 m down, and every ninth sample a pier down to the sea's bed, in place of
  the theme's own edge.
- `build_land`: a marked sample counts as `BRIDGE_BED` (9 m below the sea) when the land's height near the road is
  worked out, so the land dips under the sea beneath a bridge.
- The theme's scenery skips marked samples (`s[i].get("bridge")`), and a few either side of them.

**To apply it to another map.** A theme with `ramp` and a sea (`terrain.sea`) can name `bridges`. For a viaduct
over a valley, mark the samples the same way and give the land a bed below the road instead of below the sea. For
a tunnel, the same marking with the edge a wall and a roof.

**Cost.** None; Docklands' file fell 0.23 MB.

**Watch for.** Scenery placed by its own rule that ignores the marks (a building on stilts beside the deck); the
land's coarse grid leaving a slope of land poking up beside the deck's first metres.

### 15. A landmark in lines of light (Docklands pass 16)

**What it gives.** Something tall, lit and unmistakable that a rider sees from far off and rides through: here,
cable-stayed pylons over each bridge, the stays strung with light, a colour a bridge.

**How it works.** `tools/blender/themes.py`, in the theme's scenery function: runs of marked samples (the bridges of
technique 14) are found; at 0.3 and 0.7 of each run stand two legs outside the parapets (`B["tower"].box`) with a
beam at the head and one under the deck; from each leg's head, a quad 0.16 m tall runs to the deck's edge every
fourth sample out to 96 m each way, in a glowing material (`neon-*`), which puts it in the `Glow` group: unlit,
bloomed at the tiers that bloom. `Kit.halo` adds a glow at each head.

**To apply it to another map.** Give each map one landmark built the same way: a few boxes for its mass and lines
or panels of a glowing material for what is lit. A lighthouse and its beam on the coast, a cathedral's lit spires
over the old town, a cable car's line of cabins in the Dolomites, a pier's Ferris wheel in Vice City. Place it
where the road turns towards it.

**Cost.** None measurable; a few hundred triangles.

**Watch for.** Ribbons seen edge on vanish: lay them upright, so a rider on the road sees their height. Two faces
on the same corners: Blender keeps one, so lay the second a hair away.

### 16. Many moving parts, one draw call (Docklands pass 17)

**What it gives.** Room in the draw-call budget: five riders' legs, cranks and pedals drawn at once.

**How it works.** `frontend/projects/world/src/rider-batch.ts`, `RiderBatch`: `add(rider, keep)` takes each of the
rider's visible meshes of a plain colour (not the merged still parts), copies its geometry with a colour a vertex
and `skinIndex`/`skinWeight` that hang every vertex on one bone of its own, and switches the mesh's layers off so it
is not drawn. The copies are merged into one `SkinnedMesh` bound to a `Skeleton` of those bones with identity
inverses. `follow()`, called each frame after the riders are placed and posed, copies each part's `matrixWorld` to
its bone (the bones are in no scene, so nothing else moves them).

**To apply it to another map.** It applies to every course already: it is the renderer's, not the map's. Use the
same class for other rigid moving things: a crowd waving, flags, traffic, a windmill's sails.

**Cost.** Faster than what it replaces on an Adreno X1-85 (about 50 fewer draw calls for a pack of five).

**Watch for.** `BatchedMesh` does not reduce draw calls on WebGPU. A bone that is in the scene graph is moved by
the scene: keep these out of it. The mesh is built again whenever a rider is added, so add riders rarely.

### 17. Coloured light from what glows (Docklands pass 18)

**What it gives.** Neon signs, lit cables and anything else that glows throw their colour on the ground, on what
stands on it and on the riders, brighter still where the ground is wet.

**How it works.**

- `tools/blender/themes.py`: `Kit.light(at, glow, reach, strength)` records a light: where, the glowing material
  whose colour it has, how far it reaches and how strong it is beneath it (a street lamp is 1). `build_course.py`
  writes them to the course file as `lights`: x, z, 0xRRGGBB, reach, strength, flat.
- `course.ts`, `courseLights(file)`: the list, or none if it is malformed.
- `lamp-light-map.ts`, `colourLightMap(course, lights)`: a grid over the map, 4 m a cell, four bytes a cell: each
  light's colour times `(1 - distance / reach)²` times its strength, summed.
- `lamp-glow.ts`: `LampGlow` takes the grid as a second texture; `coloured` is its light at the surface, and it is
  added to the lamps' before the fade with height and the shaping from above. `ground-material.ts` takes
  `coloured` and adds the ground's colour times it, and it again times the water.

**To apply it to another map.** Call `k.light(...)` beside whatever the theme builds that glows: Vice City's hotel
signs, Ibiza's club doors, the old town's cafe windows, a finish arch's bulbs. A map needs `lamps` for it to show
(the grid rides with the lamps' light): for a map with coloured lights and no street lamps, give `LampGlow` an
empty lamps' grid.

**Cost.** None measurable; one texture of the map's footprint at 4 m a cell; a few bytes a light in the course
file.

**Watch for.** Too many overlapping lights wash to white (the grid holds 1.5 a channel at most). The light has no
shadow: it passes through walls, so keep a sign's pool on the sign's own side of its building.

### 18. Everything on the GPU before the first frame (Docklands pass 19)

**What it gives.** A ride with no stutter as new stretches of the map come into view.

**How it works.** `course-renderer.ts`, `warm`, called once after the programs compile: every chunk is made visible
with frustum culling off, the scene is drawn once, culling goes back on and the chunks near the camera are chosen
as usual. Three.js sends a mesh's geometry to the GPU the first time it draws it; this makes that time the load.

**To apply it to another map.** Nothing to do: it is the renderer's. The same holds for anything made later in a
ride: `makeField` makes every rider of a race on its first frame and draws them once (pass 20), because a rider
made when first seen cost the same 75 ms.

**Cost.** One heavy frame at load and the whole map's geometry in GPU memory (9.8 MB for Docklands).

**Watch for.** Measure stutter with nothing else running on the machine and no film being taken: the bench times
the display's pace in a run of its own, and reports the worst frame beside the mean.

### 19. Weather with no moving parts (Docklands pass 20)

**What it gives.** Rain that falls round the rider, lit by whatever light it falls through.

**How it works.** `frontend/projects/world/src/rain.ts`, `rain(strength, light)`: a mesh of up to 2,600 quads whose
`position` attribute is the same for a quad's four corners: the streak's place in a unit cube. The material's
`positionNode` works out, from that and a clock uniform: the place fallen and drifted, wrapped with `fract` round
the camera in a box of air (so the rain is always round the rider, and never runs out), then the corner stepped
along the fall and across it square to the eye. The colour is `light` (technique 2's and 17's node) read at
`positionWorld`, so a streak is bright under a lamp and dark elsewhere. Additive, no depth write, one draw call.
`courseRain(file)` reads the theme's `rain`; the renderer hides the mesh with reduced motion.

**To apply it to another map.** Give its theme `rain` (and `wet`, technique 9, or the road will look dry in the
rain). The same mesh with other numbers is snow (slower, shorter, wider, more drift: the Dolomites, the col),
blown sand, blossom, or confetti that never has to be moved. A map with no street lamps passes no `light` and the
streaks take a plain grey.

**Cost.** About 0.03 ms a frame.

**Watch for.** A streak right at the eye fills the view: fade them out within a metre or two. Rain everywhere
alike, lit or not, looks like scratches on the lens: light it by where it is.

## The riders

The riders are the course renderer's own, so what follows applies to every map at once. Their passes, pictures and
films are in `docs/screenshots/courses/riders/README.md`.

### R1. A body from lofted sections, coloured by vertex (riders pass 1)

**What it gives.** A rider with the shape of a cyclist (thighs, calves, a waist, shoulders, a bent back) in kit
whose edges are drawn (shorts, grippers, socks, shoes, sleeves, gloves, a hem), on a road bike with every tube, for
fewer draw calls than a figure of capsules.

**How it works.** `frontend/projects/world/src/course-cyclist.ts`:

- `loft(sections, length, colour)` makes a closed tube along +y whose section at each `t` is an ellipse of
  half-widths `rx`, `rz`, moved off the axis by `x`, `z`. A thigh is eight sections, thick and deep at the hip,
  narrowing to the knee; a calf is a section pushed back off the shin's axis. `colour(t)` paints each section, so a
  thigh's shorts, gripper and skin are one mesh; a sharp edge is two sections a hair apart.
- `between(a, b)` lays a tube from one joint to another with its width across the bike. `bend` finds a knee or an
  elbow from the two ends and the two lengths.
- `bike()` and `body(jersey)` return some sixty such pieces in the rider's axes; they are merged into one mesh a
  rider, drawn with the renderer's vertex-coloured material.
- The parts the pedalling moves are made once for all riders, marked `userData.moving`, and placed each frame by
  `pose(angle)`: the pedal from the crank's angle, the shoe on it by its ball with a pitch that follows the stroke,
  the ankle above the ball, the knee by `bend`. `rider-batch.ts` (technique 16) draws them all as one.

**To apply it.** Nothing to do for a map. To change the rider, change the numbers: the joints' places at the top of
the file, and each part's sections. A different build (taller, heavier, a child) is the same sections scaled; a
different bike (a time-trial bike, a gravel bike) is the frame's eight points and the bars.

**Cost.** None: faster than the kit it replaces, with 15 fewer draw calls for a pack of five.

**Watch for.** An open end of a tube that is not buried in another part: close it with two or three small sections
(riders pass 5). Two round parts side by side where the body has one (a seat is one pelvis, not two spheres). A colour that smears: it blends over the gap between two sections. A limb that twists as it moves:
`between` keeps its width across the bike, which is right for legs that swing fore and aft. Parts that meet at a
joint must overlap, or a gap opens as the joint bends.

### R2. Kit painted for each rider (riders pass 2)

**What it gives.** A jersey with a yoke, side panels, pockets, lettering, a collar, a hem and cuffs, in each
rider's own colour, and shoulders that are part of the trunk.

**How it works.** `course-cyclist.ts`: `wrap(sections, length, u0, u1)` is a loft with a UV (round the tube from
`u1` down to `u0`, so what is written reads from outside; along it from 0 to 1) and a doubled seam. The trunk wraps
the left 70 % of the texture, the back's middle three quarters of the way across that; each sleeve wraps the rest.
`kitTexture(jersey)` paints a 512 px canvas in shades of the rider's colour. The three pieces are one mesh with one
`MeshStandardMaterial`, which the lamps light as they do every rider's material.

**To apply it.** Change the painting, not the mesh: a team's design, a leader's jersey, stripes for a champion, a
sponsor's name are lines in `kitTexture`. A rider's own design could be a picture drawn into the same canvas.

**Cost.** One draw call and one small texture a rider.

**Watch for.** Lettering in a mirror (the UV's direction). The seam: it runs down the rider's right side, under the
arm, where a panel hides it.

### R3. Lean, rock and sway (riders pass 3)

**What it gives.** Riders that lean into every bend of every map and whose bodies move over the bike as they pedal.

**How it works.** `rider-lean.ts`: `bendLean(heading, ahead, metres)` = atan(v² × turn / (metres × g)) at v = 10
m/s, held within ±0.35 rad; the renderer's `ride` takes the heading from `Course.place` here and 6 m on, and sets
it as the rider's roll. `course-cyclist.ts` nests three groups, one for each thing that turns the rider: `group`
(placed and leant by the renderer), `rig` (rocks with sin of the crank's angle), `torso` (turns the other way about
the hips-to-hands line, and lifts with cos of twice the angle).

**To apply it.** Nothing to do for a map: the lean comes from the centre line every course file already has. A map
with hairpins shows it most. The three amplitudes (0.03, 0.07, 4 mm) and the cap are constants.

**Cost.** One draw call a rider.

**Watch for.** The sign of the lean (positive roll leans the way a growing heading turns). A course whose centre
line has a kink: the lean will snap there; smooth the line, do not filter the lean.

### R4. Finish by vertex, and the lamps along the edges (riders pass 4)

**What it gives.** Skin, lycra, lacquer, carbon, steel and rubber that each take the light as themselves, in one
mesh and one material; at night, lamp light along every glossy edge.

**How it works.** `course-cyclist.ts` writes a `finish` attribute (gloss, metal) on every vertex from a table keyed
by the part's colour. `rider-finish.ts`: `vertexFinish` turns it into `roughnessNode` and `metalnessNode`;
`sheen(gloss)` is a Fresnel-like edge term. `LampGlow.rider` adds `light × sheen × 1.6` to the emission.

**To apply it.** Nothing to do for a map. By day the sun's highlight comes from the standard material alone; at
night the sheen needs the map's `lights` or `lamps` (techniques 9 and 18). A new part gets a row in `FINISHES`.

**Cost.** Two floats a vertex; some 1 % of a frame for the standard material.

**Watch for.** Geometry merged with geometry that lacks the attribute (the merge fails): everything drawn by the
riders' material must be made by `loft` or `solid`. Round shapes that meet at a crease: the edge light outlines
each.

## What is left, in the order it is worth doing

The pictures the work aims at differ from a course in these ways, most visible first. Each becomes a pass.

1. Nothing but the riders casts a shadow: posts, walls and containers throw none.
2. The water does not mirror the quay's own lamps, cranes and ships: only the sky and the far shore.
3. Lit windows on the upper floors light nothing: only the ground floor's throw light.
4. The neon signs have no glow in the air round them, as the lamps have.
5. The riders: wheels that do not turn, no face, nobody out of the saddle on a climb, one build and one bike for
   all (see the riders' own log).
6. Signs with lettering, pipes, gutters and fire escapes: a warehouse's wall is still flat between its windows.
7. The lamps along the quay are not mirrored in the harbour beside them.
