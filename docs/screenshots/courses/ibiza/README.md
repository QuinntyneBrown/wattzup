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

## Beside Neon Docklands

`ibiza-vs-docklands.jpg`: Neon Docklands on the left, Ibiza Sunset Strip on the right, both in the app at the top
tier with the medium pack; the start strip above (60 m in), a bend below (Docklands at 3.79 km, Ibiza at 1.6 km).

| | Docklands, start | Ibiza, start | Docklands, bend | Ibiza, bend |
| --- | --- | --- | --- | --- |
| Display pace (60 Hz) | 60.3 fps | 60.0 fps | 60.2 fps | 60.4 fps |
| Draw calls | 88 | 84 | 72 | 78 |
| Triangles | 87,367 | 105,745 | 73,219 | 71,330 |

What Docklands' realism work gave, and what Ibiza has of it:

| Docklands | Ibiza |
| --- | --- |
| Road surface: grain, cracks, patches, wear, painted lines | Yes |
| Bends dealt to each stage, ramps and rolling ground | Yes |
| Walls with their material (brick there, stained whitewash here) | Yes |
| Windows in frames, some lit | Yes |
| Railings | Yes, along the open promenade |
| Glows in the air round what is lit | Yes: doorways, neon, strings of bulbs |
| Coloured lights tinting the ground and walls | Yes, at a sixth of a night's strength |
| Water | Yes, the sea |
| The riders of the riders' passes, shaped shadows, rim light | Yes, by the sun |
| Riders in one draw call, level of detail by tier, map in near chunks | Yes (the renderer's, shared) |
| Street lamps, their pools and the shadows they throw | No: the owner declined them (2026-11-22) |
| Wet road and rain | No: a dry evening on the island |
| A theme's land | No: the owner declined it; the land is still `build_terrain`'s |
| Night sky, city skyline, bridges | No: not this map's setting |

Nothing is added to a map without asking its owner first.

## Details: sky, aeroplane, party, sign, palms

A loop of passes on five things, each built in Blender and checked on the low-power stand-in (the lowest tier with
the processor six times slower). References: four photographs of Ibiza at sunset the owner supplied (a fiery deck of
cloud over a beach club; an aeroplane crossing a red sky over a party in white; the IBIZA letters; palms in bunches).

| Pass | What | Top tier | Low-power stand-in, before / after |
| --- | --- | --- | --- |
| Sky 1 | A sky painted in Blender: a deck of broken cloud lit red and gold from below towards the sun, violet away from it | 60.1 fps, none over 20 ms, 98 draw calls, 112,078 triangles | 54.4, 53.2 / 52.6, 53.6 fps |
| Party 1 | Partygoers with a drink in their hand: legs or a summer dress, a body, a head with hair, three skin tones, most in white | 60.0 fps, none over 20 ms, 88 draw calls, 133,050 triangles | 53.9, 54.1 fps after; Neon Docklands beside it 53.6 to 56.6 |
| Palms 1 | Date palms in bunches of one to three: a banded, curving trunk, a thatch of dry fronds, a crown of feathered fronds in three tiers | 60.0 fps, none over 20 ms, 83 draw calls, 109,354 triangles | 56.5 fps after; Neon Docklands beside it 56.1 |
| Sign 1 | The letters IBIZA on a plinth, at 388 m and at 7,420 m | 60.1 fps, none over 20 ms, 88 draw calls, 130,866 triangles | 57.0, 55.9 fps after; Neon Docklands beside it 55.1 |
| Rider's shadow 2 | As long as the sun is low, dark and not black, crisp at the tyres and soft at the head | as Sign 1 | as Sign 1: no draw call more |

### Sky 1: a sunset painted in Blender

**Before** (`ibiza-01-strip.jpg`): the app's own sky, worked out a pixel from the course's five colours with faint
drifting cloud: pink and even. **After** (`sky-01-strip.jpg`, `sky-01-headland.jpg`, `sky-01-finish.jpg`,
`sky-01.mp4`): the map carries its sky. `tools/blender/sky.py` works out a sunset's colour in any direction (the
afterglow from the horizon up, hot towards the sun and mauve away; a deck of cloud on a flat ceiling in rows across
the way to the sun, each puff's underside lit, the gaps in shade; a clear slot under the deck towards the sun; the
glow round the sun; the haze the far land fades into) and `build_sky` in `build_course.py` paints it into the
vertices of a dome (224 by 34, finest by the horizon; two halves and a cap; 15,000 triangles). The app carries the
dome with the camera and draws it with one plain material in place of its own sky: no work a pixel.
`python tools/blender/preview_sky.py out.png` draws the picture without Blender, to tune it.

The app's tone curve pales a bright colour, so the picture is painted deeper and a little darker than it is to be
seen (`SKY_DEPTH`, `SKY_GAIN`).

**Found on the way.** Blender's exporter shares one accessor between meshes whose data is the same (the dome's
sectors had the same triangles), and `meshopt_glb.mjs` reordered that one list once a mesh: every sector but the
first was scrambled. Each mesh now takes its own copy of what it shares.

**The low-power stand-in is under 60 on this map, with or without the sky** (53 to 54 fps at 1.3 km this evening;
56 earlier). The sky does not move it. Getting it to 60 is the next pass's work.

The bench's browser is muted (`--mute-audio`): it was playing the ride's sound at whoever sat by the machine.

### Party 1: people with drinks

**Before** (`ibiza-01-strip.jpg`): each dancer was five boxes in one colour, both arms in the air. **After**
(`party-01-strip.jpg`, `party-01-finish.jpg`, `party-01.mp4`): `person` in `build_course.py` makes someone at a
party. Legs, or bare legs under a dress that flares from the waist; a body wider at the shoulders; a head and hair
(dark, brown or fair, long down the back for some) in one of three skin tones; one arm up in a toast or holding the
glass at the chest, the other in the air or at their side; the drink amber, pink or lime, glowing a little. Six in
ten are in the island's white. About ninety triangles a figure, where the old one was fifty.

The crowd has its own dice, so nothing else on the map moved. Two of every three places at the finish's barriers
are taken, to hold the frame's triangles.

**Cost.** The worst frame on the lowest tier (the finish) is 119,479 triangles, inside the 120,000 budget; the sky's
dome was thinned to 160 by 24 (7,400 triangles, one mesh) to pay for it. The file is 0.85 MB gzipped.

**The low-power stand-in.** This evening it reads 52 to 56 fps on Neon Docklands as well as on Ibiza (it read 60 on
Docklands earlier in the day): the machine, not the map. Measured alternately, Ibiza is level with Docklands or a
frame or two behind, with 58 draw calls to its 42. Tried and dropped: longer chunks for the land, the ground, the
walls and the scenery (the draw calls did not fall, the triangles rose), and a shorter draw distance on the lowest
tier (two draw calls). Glow, leaves, halos and beams are in longer chunks (fewer meshes).

### Palms 1: date palms in bunches

**Before** (`party-01-strip.jpg`): one palm every twenty metres, each a straight trunk under nine flat fronds.
**After** (`palm-01-strip.jpg`, `palm-01-headland.jpg`, `palm-01.mp4`): `palm` and `palm_bunch` in
`build_course.py`. A bed holds one palm, two or three, of different heights and leaning away from each other. A
trunk is banded light and dark, swollen at its foot and under its crown, and curves as it rises. Under the crown
hangs a thatch of dry fronds. The crown is three tiers of feathered fronds (old ones hanging, the middle arching
out, the young upright): each a spine that bends under its own weight with a blade folded down either side. Greens
are an olive and a dark green, where they were two bright ones. About 130 triangles a palm.

The palms have their own dice, so nothing else moved.

**Cost.** The file is 1.21 MB gzipped (it was 0.85): there are some seven hundred palms. Leaves are in chunks of
one length of road again, so that a far bunch is not drawn; the finish's crowd fills four places in nine, and the
sky's dome is 128 by 20 (5,000 triangles). The lowest tier's worst frame (the finish) is 119,185 triangles.

### Sign 1: the IBIZA letters

`sign-01.jpg`, `sign-01.mp4`. `ibiza_sign` in `build_course.py` stands the five letters on a pale blue plinth: 2.4 m
tall, 0.55 m deep, white with dark faces as in the photograph, each letter a few slabs (the Z's diagonal and the A's
legs are slanted ones). They stand across the open promenade, turned to face whoever rides up, with lamps in the
plinth that light the paving before them. There are two: at the first place after 220 m where no club stands and
the road runs straight enough to read them coming (388 m), and the same before the finish (7,420 m). About two
hundred triangles a sign.

### Rider's shadow 2 (asked for by the owner: "a little more realistic")

`shadow-02.jpg` (three places). Before, a rider's shadow in the sun was 3.4 m long whatever the sun, near black, and
evenly soft. Now:

- **Its length is the sun's.** `shadowLength` in `rider-shadow-shape.ts`: the rider's height over the tangent of the
  sun's angle, held between 1.4 m and 6.5 m. Ibiza's sun is six degrees up: 6.5 m.
- **It is not black.** It darkens the road by two thirds and leaves the road's colour showing, with a breath of the
  sky's colour from below.
- **Crisp at the tyres, soft at the head.** `shadow-silhouette.ts` paints the figure twice, crisp and spread, and
  joins them along the shadow; it thins towards its far end.
- **It starts under the bike.** A dark patch where each tyre meets the road and a line between them; the wheels'
  rims are heavier.

Two textures made once, as before; nothing more is drawn a frame.
