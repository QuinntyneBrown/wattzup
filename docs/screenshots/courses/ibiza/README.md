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
| Aeroplane 1 | An airliner on its way in to land, crossing the sky in front of the sun every 110 s | 60.1 fps, none over 20 ms, 90 draw calls, 149,410 triangles (the finish) | 53.2, 54.0 fps after (the finish, 119,555 triangles); Neon Docklands beside it 54.5, 54.0 |
| Sky 2 | Dark banks of cloud rimmed with fire over a gold horizon, shafts of light fanned from the sun, the sun's glow in the sky's own picture; the dome's rows and columns put where the rider looks | 60.1 fps, none over 20 ms, 93 draw calls, 144,331 triangles (the finish) | 49.5 fps after (the finish, 119,515 triangles); Neon Docklands beside it 50.3 |
| Party 2 | Partygoers stand and move as people do: weight on one leg, arms bent at the elbow, a tumbler in the fist raised in a toast, held out to clink or at the chest, the other hand in the air, on the hip or at their side | 60.0 fps, none over 20 ms, 85 draw calls, 111,699 triangles (the finish line) | 51.7 fps after (the finish, 118,587 triangles); Neon Docklands beside it 54.2 |
| Palms 2 | Date palms: a ball of narrow fronds whose leaflets hang from the spine, pale young fronds in its heart, the boot of cut stubs under the crown, bunches of dates on the tall ones | 60.1 fps, none over 20 ms, 76 to 83 draw calls, 85,164 to 95,506 triangles | 51.6, 49.6 fps after (the finish, 118,742 triangles); Neon Docklands beside it 52.8 |
| Sign 2 | The IBIZA letters as in the photograph: chunkier and deeper, on a stepped plinth in pool blue, palms planted close behind, people having their picture taken in front | 60.1 fps, none over 20 ms, 90 draw calls, 150,134 triangles (at the sign) | 51.6 fps after (at the sign, 101,622 triangles); Neon Docklands beside it 48.3 |
| Aeroplane 2 | Its wheels are down; its white strobes flash twice and its red beacons blink between them; it comes out of the haze and goes back into it | 60.1 fps, none over 20 ms, 82 draw calls, 95,296 triangles (from 3,250 m) | 52.8 fps after (the finish, 118,887 triangles); Neon Docklands beside it 53.9 |
| Party 3 | Friends stand together: pairs a pace apart, turned to each other, clinking their glasses over the gap between them | 60.0 fps, none over 20 ms, 85 draw calls, 112,403 triangles (the finish line) | 52.4 fps after (the finish, 118,883 triangles); Neon Docklands beside it 54.8 |
| Sky 3 | The map is lit by the sky painted for it: a redder sun, rose light from above and plum from the ground, a haze of burnt orange that the far land fades into, and the red sky in the sea's mirror | 60.0 to 60.1 fps, none over 20 ms (three places) | 50.9 fps after (the finish, 118,863 triangles); Neon Docklands beside it 53.2 |
| Palms 3 | A second kind, the fan palm (a straight thick trunk, a skirt of dead leaves, a round crown of fingered fans), one bunch in three; on the promenade each bunch grows from a white planter | 60.1 fps, none over 20 ms, 84,815 to 93,590 triangles | 52.1 fps after (the finish, 115,794 triangles, 3,000 fewer); Neon Docklands beside it 56.7 |
| Sign 3 | The letters stand in a square of their own: brick paving banded in a lighter brick, and strings of bulbs hung between five posts behind and beside them | 60.0 fps, none over 20 ms, 90 draw calls, 148,997 triangles (at the sign) | 55.5 fps after (at the sign, 101,403 triangles); Neon Docklands beside it 56.3; the finish 54.2 |
| Aeroplane 3 | A livery (grey belly, the airline's red in a line along each side and on the engines' lips), a row of lit cabin windows, flaps down, and its wings rocking a little | 60.1 fps, none over 20 ms, 82 draw calls, 93,300 triangles (from 3,250 m) | 52.6 fps after (the finish, 116,408 triangles); Neon Docklands beside it 53.4 |
| Party 4 | Dressed for the island: half of those not in a dress are in shorts with bare calves, one in five wears a straw hat, and the white they wear stays white | 60.1 fps, none over 20 ms, 86 draw calls, 114,152 triangles (the finish line) | 53.5 fps after (the finish, 118,378 triangles); Neon Docklands beside it 52.7 |
| Sky 4 | The far side of the sky: the full moon rising opposite the sunset, the first stars over it, the earth's shadow along that horizon under a pink band, and three vapour trails lit from beneath | 60.1 fps, none over 20 ms (three places) | 49.4 fps after (the finish, 118,564 triangles); Neon Docklands beside it 53.3 |
| Party 5 | On each club's terrace a high white table with drinks standing on it, and three partygoers in five gathered round it, turned to it | 60.0 fps, none over 20 ms, 91 draw calls, 152,030 triangles (from 7,950 m) | 51.9 fps after (the finish, 119,650 triangles: 350 under the budget); Neon Docklands beside it 57.4 |
| Palms 4, and room made | Fronds lit by the low sun, a vertex at a time: dark at the crown and paler to the tip, gold on the sunward side and dim on the far side. Before it, 6,700 triangles freed at the finish | 60.1 fps, none over 20 ms (two places) | 54.4, 51.3 fps after (the finish, 112,930 triangles, 7,070 under the budget); Neon Docklands beside it 55.1 |
| Party 6 | Faces and hands of the evening: sunglasses on four in ten, hair put up in a knot, and a phone held up to film, its screen lit | 60.1 fps, none over 20 ms, 85 draw calls, 111,028 triangles (the finish line) | 44.7, 47.8, 51.8 fps after (the finish, 113,812 triangles); Neon Docklands beside it 50.1, 41.5: the machine was busy, and these say little |
| Sky 5 | Four thunderheads stand on the horizon far out to sea, each a trunk that spreads into an anvil, fire on the side the sun is on and plum on the other | 60.1 fps, at most one frame over 20 ms (three places) | 51.2 fps after (the finish, 114,580 triangles); Neon Docklands beside it 53.6 |
| Palms 5 | Trunks: five-sided where they were square, six lengths banded light and dark with a flared foot and a boot, warm on the side the sun is on and in shade on the other | 60.1 fps, at most one frame over 20 ms (two places) | 51.4 fps after (the finish, 116,196 triangles); Neon Docklands beside it 53.5 |
| Party 7 | Bodies with a shape: wider than deep, hips, a waist drawn in and shoulders broader than either, the head narrower at the chin | 60.1 fps, none over 20 ms, 85 draw calls, 114,874 triangles (the finish line) | 49.8 fps after (the finish, 118,688 triangles); Neon Docklands beside it 53.0 |
| Sky 6 | The evening draws in as the course is ridden: the sky lighter and more golden at the start, as painted three quarters round, deeper and redder at the finish, the haze and the sun's light with it | 60.1 fps, none over 20 ms (three places) | 51.5 fps after (the finish, 118,688 triangles); Neon Docklands beside it 53.3 |
| Palms 6, and room made | A third kind, the island's own dwarf fan palm: a clump of low rosettes planted at the tall palms' feet in half the planters. Before it, forearms, heads, hat brims, festoon wires and the finish's gantry were made of fewer faces | 60.0 to 60.1 fps, none over 20 ms (two places) | 51.4 fps after (the finish, 116,893 triangles, 1,800 fewer than before the pass); Neon Docklands beside it 52.7 |
| Party 8 | One in three is dancing: knees bent, feet apart, the body leaning into the music and thrown to one side, the free hand in the air | 60.1 fps, none over 20 ms, 85 draw calls, 113,938 triangles (the finish line) | 50.0 fps after (the finish, 117,246 triangles); Neon Docklands beside it 53.6 |
| Sky 7 | The sun is drawn on the sky, so it stands where its glow does from anywhere on the map, and six bars of cloud lie across it and beside it, dark with their undersides lit gold | 60.1 fps, none over 20 ms (three places) | 52.6 fps after (the finish, 117,506 triangles, one draw call fewer); Neon Docklands beside it 47.9 |
| Palms 7 | The fan palm made again: its crown a ball of two dozen fans set round it in a spiral, each a half round of fingered blade on a stalk, and its skirt ragged hanging leaves with the trunk showing through | 60.0 to 60.1 fps, none over 20 ms (two places) | 50.1 fps after (the finish, 117,554 triangles); Neon Docklands beside it 53.1 |
| Party 9 | Three things to drink: a tumbler, a cocktail in a glass like a cone, or a bottle of beer in green glass or brown | 60.0 fps, none over 20 ms, 85 draw calls, 114,224 triangles (the finish line) | 51.0 fps after (the finish, 117,619 triangles); Neon Docklands beside it 52.5 |
| Sky 8 | The finish's sky is uncovered: the clubs' light beams are narrow, as searchlights are, where they fanned 18 m wide and hid the sunset the finish rides into | 60.0 to 60.1 fps, none over 20 ms (three places on the finish straight) | 52.1 fps after (the finish, 117,599 triangles); Neon Docklands beside it 52.9 |
| Palms 8 | A date palm's frond is a feather: leaflets in pairs along a bending spine, each pair swept back and hanging, with the sky between one pair and the next | 60.0 fps, none over 20 ms (two places) | 53.3 fps after (the finish, 117,592 triangles: none more); Neon Docklands beside it 51.6 |
| Party 10 | A waiter on every terrace: a white shirt and dark trousers, a round tray of three drinks carried high on one hand | 60.1 fps, none over 20 ms, 90 draw calls, 150,703 triangles (from 7,950 m) | 49.4 fps after (the finish, 117,912 triangles); Neon Docklands beside it 52.1 |
| Sky 9 | Sheet lightning flickers inside two of the thunderheads: dark nearly all the time, then two or three pulses, each in its own time | 60.1 fps, none over 20 ms | 55.7 fps after (the finish, 117,912 triangles); Neon Docklands beside it 54.0 |
| Palms 9 | In bunches, as asked: two to four palms from one bed and never one alone, close together and stepped in height, at every other place along the road with open stretches between | 60.1 fps, none over 20 ms (three places) | 55.4 fps after (the finish, 116,165 triangles; the map 25,000 fewer); Neon Docklands beside it 53.3 |
| Party 11 | People sit on the seawall to watch the sun go down, a drink in hand: one or two together every fifty metres or so, most with their legs over the wall towards the sea | 60.0 to 60.1 fps, none over 20 ms (two places) | 54.8 fps after (the finish, 117,966 triangles); Neon Docklands beside it 55.6 |
| Sky 10 | The thunderheads made again: a trunk of billows swelling one over the next, a neck, and a wide thin anvil with a flat top carried downwind; each billow lit on its shoulder and dark in the fold under it | 60.1 fps, none over 20 ms (three places) | 51.8 fps after (the finish, 118,094 triangles); Neon Docklands beside it 56.6 |
| Palms 10 | The fronds sway in the evening breeze: tips swing 17 cm, what is near the crown hardly moves, no two palms keep time | 60.1 fps, none over 20 ms, with the sway and without it (Ibiza and Neon Docklands, turn about) | 57.6, 47.0 fps after; Neon Docklands beside it 46.9: the machine was busy, and these say little |
| Party 12 (and Palms 10 put right) | The crowd moves to the music: dancers hop and sway most, those standing a little, a drink going with its hand. The palms' sway of the pass before did nothing until this one: the map's file did not carry it | 60.1 fps, none over 20 ms (Ibiza at two places, Neon Docklands) | 58.0, 56.7 fps after (the finish, 118,094 triangles); Neon Docklands beside it 58.2 |
| Sky 11 | A flock of eleven gulls crosses the sunset on its way to roost, low over the sea and the other way to the aeroplane, each beating its wings | 60.1 fps, none over 20 ms, 90 draw calls | 58.8 fps after (the finish, 118,290 triangles); Neon Docklands beside it 59.0 |
| Party 13 | Four people stroll the sidewalk by the seawall, a drink in hand, some each way, and are passed or met as the rider goes | 60.1 fps, none over 20 ms, 80 draw calls, 83,908 triangles (from 4,400 m) | from 4,400 m: 58.8, 58.2, 57.3 fps and, twice, 40.2; Neon Docklands beside it 59.0, 59.5, 56.0. The finish 58.7 (118,370 triangles). **Whether the 40s are the strollers or the machine is not known** |
| Sky 12 | Scud: sixteen scraps of low cloud, ragged on top and warm beneath, drift slowly round the sky in front of the painted deck | 60.1 fps, at most one frame over 20 ms (two places), 90 to 96 draw calls | 56.9 and 36.9 fps after (the finish, 119,906 triangles: 94 under the budget); Neon Docklands beside it 58.8, 58.2. See the note on the stand-in reading two ways |
| Party 14, and room made | The low sun on the crowd: each figure warm on the side turned to the sun and in shade on the other, and throwing a long shadow on the paving. Before it, the sky dome's rows over 18 degrees were given a quarter of their columns | 60.1 fps, none over 20 ms, 142,051 triangles (from 8,200 m) | 58.5 and 39.0 fps after (the finish, 119,584 triangles); Neon Docklands beside it 43.8, 44.7: the stand-in reading two ways, as noted under Sky 12 |
| Sky 13 | The sky towards the sun painted three times as finely, its deck of cloud broken into ripples lit gold beneath (a mackerel sky); on the three upper tiers only | 60.1 fps, none over 20 ms, 91 to 92 draw calls (two places) | 56.2 and 42.3 fps after (the finish, 119,584 triangles: none more, the fine sky is not drawn there); Neon Docklands beside it 57.7, 57.9 |
| Party 15 | The strollers step: their legs swing through a stride in time with the ground they cover, the foot coming forward lifts, and the body rises twice a stride | 60.1 fps, 82 draw calls (from 4,400 m) | from 4,400 m: 44.8 and 45.0 fps; Neon Docklands beside it 43.6 and 57.0: the stand-in reading two ways, as noted under Sky 12 |
| Sky 14 | The stars come out as the evening draws in: none for the first third of the course, all 150 by the finish; and the evening star stands beside the sunset from the start | 60.1 fps, none over 20 ms (three places), 88 to 100 draw calls | 56.7 and 55.6 fps after (the finish, 119,826 triangles: 174 under the budget); Neon Docklands beside it 58.4, 47.1 |
| Party 16 | The crowd cheers the rider as they pass: within 34 m a figure hops higher and faster and stretches up, most within 9 m, and settles as the rider goes | 60.1 fps, none over 20 ms (the finish) | 42.2 and 40.2 fps at the finish; Neon Docklands beside it 45.1 and 56.0: the stand-in reading two ways, as noted under Sky 12 |
| Sky 15 | The sun sets as the course is ridden: its disc stands 6 degrees over the horizon at the start and sinks steadily until its lower limb touches it at the finish | 60.1 fps, at most one frame over 20 ms (from 3,250 m, twice) | 48.9 and 39.3 fps after (the finish, 116,828 triangles); Neon Docklands beside it 46.2, 56.4: the stand-in reading two ways, as noted under Sky 12 |
| Party 17 | Friends with an arm round each other's shoulders: four pairs in ten stand side by side facing the road, drinks in their outer hands; and a stroller's arm at their side swings against its leg | 60.0 to 60.1 fps, none over 20 ms (the start line, 2,050 m, the finish) | 43.6 and 50.9 fps after (the finish, 116,678 triangles); Neon Docklands beside it 51.0, 55.4 |

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

### Sky 2: banks of cloud rimmed with fire, and shafts of light

`sky-02-finish.jpg`, `sky-02-headland.jpg`, `sky-02.mp4`, `sky-02-preview.png` (the picture as `preview_sky.py` draws
it, now as the rider sees it: 89 degrees wide, to 20 degrees up). Sky 1's deck was mostly out of the picture: the
eye looks a little down at the road, so the sky it sees ends some 15 degrees over the horizon, where Sky 1 kept a
clear slot and had five of the dome's rows. Now:

- **The deck comes down into view.** The clear slot under it is a few degrees deep, and the haze on the horizon
  thinner.
- **Banks with dark hearts.** The low sun reaches a bank's thin edges and not its heart: a bank is plum in the
  middle and rimmed with fire, as in the photograph of the beach club, where Sky 1's were lit all through.
- **Shafts of light.** The sun throws rays up through the gaps and the banks' shadows between them, fanned out
  from where it stands and fading as they climb.
- **The sun's glow is in the sky.** The pale disc that stood behind the sun, with an edge to it against the painted
  sky, is gone; its corona is painted into the sky and fades with no edge. The sun itself is a small disc, white hot
  at its heart and orange at its limb.
- **The dome's vertices are where the rider looks.** Thirteen of its twenty rows are in the first 18 degrees (five
  were), and its columns stand twice as close towards the sun as away. No triangle more.
- **Its darks are painted deeper** (`SKY_CONTRAST`): the app's tone curve lifted them, and a bank came out as pale
  as the sky behind it.

### Sky 3: the map lit by its sky

`sky-03.jpg` (the headland, the finish, and the strip looking away from the sun), `sky-03.mp4` (from 600 m). Sky 2
painted a red sky over a map still lit for Sky 1's peach one: the far land faded into a pale haze lighter than the
sky above it, and the sea mirrored five colours of a sky that was no longer there. The course's colours are now
those of the painted sky (`themes.py`, `ibiza`): the sun's light redder, the light from above rose and from the
ground plum, the haze a burnt orange (the same the painted sky takes on its horizon), and the sky the sea mirrors
gold at the horizon through orange and red to plum. No geometry changed.

### Sky 4: the far side of the sky

`sky-04.jpg` (from 600 m, 5,950 m and 3,250 m), `sky-04.mp4` (from 5,950 m, riding away from the sun). Half the map
is ridden with the sunset behind, and that half of the sky had only its colour.

- **The full moon is rising** opposite the sunset, as it does: big and low, reddened by the air it is seen through,
  its lower limb dimmer in the haze and a sea darkening one side of its face. A disc of twenty triangles drawn on
  the dome.
- **The first stars** are out over it, in the darker sky above 7 degrees: forty-six, faint near the horizon.
- **The earth's shadow** lies blue-grey along that horizon, and over it the pink band of the last light, before the
  violet (`SKY_AWAY` in `sky.py`).
- **Vapour trails**, the island's sky being a road for aeroplanes: three, lit gold and pink from beneath, sharp at
  the head and spreading and fading behind it. One crosses towards the sun.

All of it is in the sky's one mesh: 190 triangles more, no draw call more.

### Sky 5: thunderheads on the horizon

`sky-05.jpg` (from 3,250 m, 2,000 m and 8,100 m), `sky-05.mp4` (the finish). Four thunderheads stand on the horizon,
far out to sea: three round the sunset and one in the pink of the far side. Each is a trunk that swells and narrows
as it climbs and spreads into an anvil at its top, 4 to 8 degrees high, lit gold and fire on the side the sun is on
and plum on the other, its foot lost in the haze.

**Tried first, and not kept:** painting them into the dome's colours, as the deck of cloud is. The dome's vertices
are a degree and a half apart and could not hold an outline: each came out a smear. They are drawn on the sky
instead, as the moon is: a grid of 12 by 8 a tower, 770 triangles for the four, in the sky's one mesh. The first
drawn outline wobbled faster than its rows could follow and came out jagged; it wobbles slowly now.

### Sky 6: the evening draws in

`sky-06.jpg` (from 600 m, 3,250 m and 8,100 m). The sky stood still for the whole ride. Now the evening draws in as
the course is ridden (`dusk.ts`, unit-tested): at the start the painted sky is lighter and more golden and the sun
stronger; three quarters of the way round it is as it was painted; from there to the finish it deepens and reddens
and the sun weakens to four fifths. The haze the far land fades into follows the sky. It never brightens and it
never jumps (under 2 parts in a hundred over 84 m of road). It goes by where the rider is on the course, not by the
clock, so it is the same sky at the same place on every ride, and reduced motion changes nothing in it.

Three numbers a frame: the painted sky's one material is multiplied by a colour, the haze's colour set, the sun's
light scaled. A map without a painted sky is as it was.

### Sky 7: the sun in the sky, and bars of cloud across it

`sky-07.jpg` (from 3,250 m, 2,000 m and 8,100 m), `sky-07.mp4` (from 3,250 m).

- **The sun stood in the wrong place** from most of the map. Its disc was a thing standing in the world 5 km beyond
  the finish, while its glow, its shafts and the lit cloud are in the sky, which is carried with the eye: from the
  finish straight they agreed, and from the start, 8 km back, the disc stood a long way round from its own glow (it
  shows as a pale disc beside the island in Sky 5's second picture). The disc is now drawn on the sky, 3 degrees up
  where the glow is, white hot at its heart and orange at its limb, redder at its lower limb. One mesh and one draw
  call fewer.
- **Bars of cloud** lie across the sun and to either side of it, low over the horizon: six, each a long lens,
  dark, its underside lit gold where it is near the sun and dull red further off. They are drawn after the sun, so
  they cross its face. 290 triangles, in the sky's one mesh.

### Sky 8: the finish's sky uncovered

`sky-08.jpg` (from 7,900 m, 8,100 m and 8,300 m), `sky-08.mp4` (the finish). The finish rides straight into the
sunset, and it was the one place on the map where the sunset could not be seen: the light beams the clubs throw up
were each 18 m wide at their far end, a dozen of them overlapped over the road, and what showed through them was a
pale wash (every picture of the finish above this one). A beam is 7 m wide now, as a searchlight's is: the sun, its
glow, the bars of cloud across it and the thunderhead beside it all show between them. No triangle changed.

### Sky 9: sheet lightning in the thunderheads

`sky-09.jpg` (a thunderhead dark, and the same with its lightning held on to be seen). Two of the four thunderheads
have lightning inside them: the heart of the tower lights pale violet from within. It is dark nearly all the time;
every ten seconds or so, never on the beat, comes a flicker of two or three pulses, each lit at once and dying in a
fifth of a second; the two keep different time (`lightning.ts`, unit-tested). Never more than three pulses in a
second, and none with reduced motion.

Each is a small mesh in the map (the heart of its tower, bright at its middle and black at its edge) carried with
the sky and drawn over it with its light added; the app sets its brightness. It is in the scene only while lit: a
draw call for a fifth of a second.

**Found on the way.** It drew nothing at first: the sky is seen from inside its dome, so what is drawn on it faces
away from the eye, and the sky's material is two-sided for that reason; the lightning's was not.

### Party 11: sitting on the seawall

`party-11-seawall.jpg` (three moments from 600 m), `party-11.mp4`. The party was all at the clubs and the finish:
8 km of seawall had nobody on it. Now people sit on it to watch the sun go down, a drink in hand: one, or two side
by side, every fifty metres or so (a quarter of the places are left empty), most of them facing the sea with
their legs over the wall and the rest facing the road, and none in the last 350 m, where the crowd stands. A
sitter is a partygoer built as the others are and set down by the height of their hips, with their thighs level
along the wall and their shins hanging; they do not dance or pair off. They have dice of their own.

### Sky 10: the thunderheads made again

`sky-10.jpg` (from 3,250 m, 8,300 m and 2,000 m), `sky-10.mp4` (the finish). Sky 5's thunderheads had a clear
outline and the wrong one: a smooth stalk that flared into two points, more a whale's tail than a cloud. Now a
thunderhead is a trunk of billows, one swelling over the next; a neck; and over it the anvil, three times the
trunk's width, thin, flat on top and thinner still at its ends, carried downwind of the trunk. Its light is in five
steps from plum through red and orange to cream: the side the sun is on is lit, each billow is brighter on its
shoulder and dark in the fold under it, the anvil's underside is in shade and its top catches the last light. 110
triangles more for the four.

### Party 12: the crowd moves (and the palms' sway put right)

`party-12.mp4` (the finish); `party-12-moves-held.jpg` (the finish with the hop made forty times too big, and the
palms with the swing made ten times too big: the figures stretch from their planted feet, the fronds blow over, and
the arch, the walls and the trunks stand still).

Everybody at the party stood stock still. Now they move to the music, 114 beats a minute: a figure hops on the
beat (4 cm at the head) and sways from side to side over two beats (7 cm), feet planted, more the higher up the
body. A dancer moves most; someone standing less than half as much; a sitter and a waiter a little. Where a figure
stands sets where in the beat they are, so it is a crowd and not a chorus line; and a drink goes with the hand that
holds it, though it is in another mesh.

How, as for the leaves: each corner of a figure says how freely it moves in the fourth part of its colour, and the
materials of what stands on the map and of what glows on it (`dance-material.ts`) move each corner by that in its
vertex's place, to the ride's clock. A figure is made of builders of its own for this (`_Figures`). Nothing a
pixel, no triangle, no draw call; still with reduced motion; a map that sets none has nothing that moves.

**Palms 10 had moved nothing.** Making the figures move showed it: forty times too big, they did not stir, and
nor did the palms ten times too big. The picture Palms 10 was checked by had been of two different moments, and the
difference between them was taken for the swing. Three things lost the fourth part of a colour between the map and
the app, and all three are put right: the meshes were written with it set to 1; Blender leaves it out of the file
unless the material uses it; and with it in, Blender writes colours as 16-bit numbers, which the packer passed
through at twice the size (the map's file went to 3.1 MB; it is 2.1 MB).

### Sky 11: gulls going to roost

`sky-11.jpg` (three moments from 3,050 m; the flock is the V of specks at the upper left of the second), `sky-11.mp4`.
A flock of eleven gulls crosses in front of the sunset in a loose V, low over the sea: 95 m out and 24 m up, at 13
metres a second, the other way to the aeroplane, rising and falling 4 m as it goes; one flock every 85 s, in the
sky for three quarters of that, coming out of the distance and going back into it (`flock-flight.ts`, unit-tested).
Each gull is a body and two wings cranked back at the wrist, dark against the sky, and beats its wings, each in its
own time, the wings longer up than down (`flap-material.ts`: the wings' beat is carried in the fourth part of each
corner's colour, as the leaves' swing is). 66 triangles, one draw call while it is in the sky, none with reduced
motion.

**How big they are.** At the ends of the crossing they are specks, a few pixels across; the first cut, 150 m out
and a third smaller, was specks all the way across. The wings' beat has not been seen in a picture: at this size a
film does not show it. It is the same mechanism the figures and the leaves were proved with.

### Party 13: strolling the seawall

`party-13.jpg` (four moments from 4,400 m), `party-13.mp4`. Nobody on the map went anywhere. Now four people
stroll the sidewalk by the seawall with a drink in hand, two up the course and two down it, at 1.2 to 1.5 metres a
second, whatever the rider does: one is overtaken, another comes to meet the rider. So that there is always someone
to pass, each is kept in a stretch that goes with the rider (60 m behind to 200 m ahead), and one who walks out of
it at one end comes into it at the other, behind the rider or far ahead (`promenaders.ts`, unit-tested). None at the
start line or in the last 420 m.

Each is a partygoer built mid stride about their own feet, a mesh of their own in the map, which the app places on
the course and turns the way they walk; they move to the music as the others do. Four draw calls. Their legs do not
step: they glide at a stroll, mid stride. One was seen to walk through the post of an effort's gate.

### Sky 12: scud that drifts

`sky-12.jpg` (from 3,250 m and 600 m), `sky-12.mp4` (from 3,250 m). Everything in the sky was painted on it and
stood still. Now sixteen scraps of low cloud, all round the sky between 4 and 13 degrees up, drift across it on the
evening wind: each ragged on top and flat beneath, dark with a warm underside, fading out at its edges (by the
fourth part of its colour, since what is behind it changes as it goes). They are one mesh on a pivot of its own
inside the sky, which the app turns 0.12 degrees a second (`cloud-drift.ts`, unit-tested): a degree or so in ten
seconds, once round in fifty minutes. 770 triangles, one draw call; still with reduced motion.

**The drift has not been seen in a picture**: in ten seconds of film the camera turns far more than the cloud does,
and the two could not be told apart. The scud is seen; that it turns rests on the unit test and on one line that
sets a group's turn.

**The low-power stand-in reads two ways, and it is the machine.** Since Party 12 some runs have read 40 to 44 fps
and others 57 to 59. Run turn about four times each from 4,400 m, Ibiza read 42.8, 58.5, 58.2, 42.0 and Neon
Docklands 58.8, 44.6, 42.9, 57.0: half of each, whichever map. In the slow runs the page spends 7.3 s of the 10 in
script on either map, in the fast ones 4.2 to 5.7 s.

### Party 14: the low sun on the crowd

`party-14.jpg` (the seaward side of the finish), `party-14.mp4` (from 8,200 m).

**Room made first.** The finish was 94 triangles under the low tier's budget. The sky dome's five rows over 18
degrees are out of the rider's picture but for a bend or a hill, and its colour there is smooth: they have a column
in four now, joined to the fine rows by a fan at each coarse corner. 960 triangles fewer, on every frame.

**The sun on the figures.** A sunset lights a crowd from one side and lays its shadows long, and the party had
neither. Now:

- **A lit side and a shaded side.** Each corner of a figure is coloured by which side of the figure it is on:
  brighter and warmed towards gold on the side turned to the sun, at two thirds of its colour on the other, in three
  steps. This is what Party 10 tried a face at a time and gave up for the size of the file; the figures have had
  corners of their own since Party 12, so it costs nothing now. Strollers turn as they walk and are lit evenly; what
  glows is as it was.
- **Long shadows.** Each standing figure throws a shadow on the paving away from the sun, 3.4 times their height
  long, narrowing to the head: one quad, the paving's colour in shade. The first cut was too pale to see. Not for
  those sitting on the wall or strolling. A shadow is flat: where it runs over a kerb or under a wall it does not
  bend.

### Sky 13: a mackerel sky towards the sun

`sky-13.jpg` (the pass before; this one from the same place, 3,250 m; and the finish), `sky-13.mp4` (from 3,250 m).
The dome's corners are a degree and a half apart, and the deck of cloud painted into them is soft: nothing in it is
smaller than three degrees. The photograph of the beach club has a deck broken into hundreds of small lit ripples.

- **A fine sky.** The same picture over the 50 degrees either side of the sun and the first 18 up, three times as
  fine across and twice as fine up, as a mesh of its own drawn over the dome (8,700 triangles). At its edge it has
  the dome's own colours, between the dome's corners as the dome is drawn, and takes its own over a cell and a half:
  no edge shows.
- **Ripples.** Painted finely, the old picture was only a little sharper: it had nothing small in it. The fine sky
  adds what the dome could not hold: the deck broken into ripples, row on row across the way to the sun, each
  brighter and warmer beneath and the gap behind it in shade, between 2 and 15 degrees up.
- **Not on the two lowest tiers.** There the dome is drawn as before: the low tier's frame has no triangle more.
- **What stands in the sky** (the sun, the moon, the stars, the thunderheads, the bars and the trails) is now a
  mesh of its own, drawn over the dome and the fine sky: one draw call more.

### Party 15: the strollers step

`party-15.jpg` (six moments a fifth of a second apart, from 4,400 m: the stroller's legs close, open and close),
`party-15.mp4`. Party 13's strollers glided along the sidewalk in one pose. Now they step: everything below the
hips swings fore and aft, more the nearer the foot, the two legs opposite; the foot coming forward lifts 7 cm; and
the body rises 2.5 cm twice a stride (`walk-material.ts`, in the vertex's place). Where in the stride each is comes
from the ground they have covered (`promenaders.ts`, unit-tested): two steps for every 1.12 m, so the feet do not
slide, and no two are in step.

A stroller's mesh is kept in metres about their own feet in the map's file (`MOVED` in `pack_glb.py`), so that the
material knows where the hips are; each has a material of their own for their own stride. Their arms do not swing.

### Sky 14: the stars come out

`sky-14.jpg` (from 600 m: none; from 5,950 m and 6,500 m: the first of them, small). Sky 4's forty-six stars were
painted on the far side of the sky, there from the start line, when the sun is at its highest. Now the stars are a
mesh of their own, 150 of them all round the sky from 6 degrees up (most of them low, where the rider looks; fewer
and fainter towards the sunset), whose light is added to the sky's; and the evening brings them out
(`stars` in `dusk.ts`, unit-tested): none for the first third of the course, then more and brighter to the finish.
The evening star is there from the start: one bright eight-pointed glint low to the left of the sunset.

**They are small.** A star is one or two pixels; in the pictures they are a scatter of faint points, and the first
cut could hardly be seen at all (they are twice as bright now). The finish itself looks into the sunset, where
there are fewest.

One draw call once they show; 150 triangles (the finish is 174 under the low tier's budget).

### Party 16: the crowd cheers the rider

`party-16-cheer-held.jpg` (the finish with the stretch made sixteen times too big: the figures beside the rider
stand twice their height and those up the road are as they were), `party-16.mp4` (the finish). The crowd danced
the same whether a race went by or not. Now it cheers the rider: a figure within 34 m hops higher (up to three
times), faster (up to twice a beat) and stretches up 10 cm, rising smoothly as the rider comes, all of it within
9 m, and settling the same way as they go (`cheer` in `crowd-cheer.ts`, unit-tested; the figures' material works
the same sum out for each corner from where the rider is). Along the finish it runs through the crowd beside the
rider like a wave. A drink goes up with its hand. No triangle, no draw call; none of it with reduced motion.

It is the rider it cheers, not the other riders; strollers do not cheer.

### Sky 15: the sun sets

`sky-15.jpg` (from 3,250 m: above, the disc held at 11 degrees to see that it moves; below, where it stands there in
the ride, 4 degrees up, behind the island's shoulder). The evening drew in (Sky 6) and the stars came out (Sky 14)
round a sun that never moved. Now it sets: its disc stands 6 degrees over the horizon at the start, in the middle
of the glow painted for it, and sinks steadily with the share of the course ridden until its middle is 1.2 degrees
up at the finish, its lower limb on the horizon (`sun` in `dusk.ts`, unit-tested). It is a mesh of its own on a
pivot inside the sky, drawn over the sky and under the bars of cloud, which cross its face as it comes down
through them; the land and the island hide what is below them. One draw call more; the same sun at the same
place on every ride.

The glow painted round it does not sink with it, nor does the light it throws on the land: by the finish the disc
is 5 degrees under the middle of its own glow.

**Tried first and not kept:** the sun's path on the sea. Three cuts of it in the sea's material could hardly be
told from the sea without it: the sun stands behind the island from most of the road, and the sea in view is off
to one side of it.

### Party 17: an arm round a friend's shoulders

`party-17.jpg` (the two sides of the finish, enlarged: the pair by the pole stand shoulder to shoulder, each with
a drink up in their outer hand), `party-17.mp4` (the finish). Friends who paired up all did the same thing: half
turned to each other, glasses touching (Party 3). Four pairs in ten now stand side by side instead, half a metre
apart and facing the road, each with an arm round the other's shoulders (out level from their own shoulder, behind
the friend's neck, the hand resting on the far shoulder) and their drink in the outer hand: the pose of every
photograph taken at a party. They do not dance; they move to the music and cheer as the others do. No triangle
more (an arm is an arm).

**A stroller's arms swing** (`walk-material.ts`): an arm hanging at their side swings 16 cm fore and aft against
the leg on its side, more the nearer the hand; an arm raised with a drink is still. This has not been seen in a
picture: the strollers in this pass's film are too far off.

**Two odd readings of the pass before, measured again:** 60.0 fps with no frame over 20 ms from the start line
(it had read 38) and from 2,050 m (it had seven frames over 20 ms), and on Neon Docklands from its start line.

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

### Party 2: arms that bend, a stance, a tumbler in the fist

`party-02-finish.jpg`, `party-02-close.jpg` (the two sides of the finish, enlarged), `party-02.mp4`. Party 1's
figures stood to attention: two upright boxes for legs, and arms that were upright boxes too, straight up or straight
down. Now each stands with their weight on one leg, the other foot out to the side or a step forward, their body
swayed a little over it; and each arm is two parts that meet at an elbow, a sleeve or bare skin to the elbow and a
bare forearm. The hand with the drink is up in a toast (four in ten), held out to clink a friend's (one in four) or
at the chest between sips; the other is in the air with the music, on the hip, or at their side. The glass is a
tumbler in the fist, wider at its lip. Long hair falls down the back as one tapering piece.

A limb is four sides and no ends (the joints hide them): eight triangles where a box was twelve, so the elbows cost
nothing. The whole map has 1,700 triangles fewer than before the pass.

### Party 3: friends clink glasses

`party-03-close.jpg` (the two sides of the finish, enlarged), `party-03.mp4`. Every partygoer stood alone, a few
metres from the next, facing the road. Now four in ten turn to whoever comes next, who stands a pace beside them and
turns to them: the two are half turned to each other and half to the road, as people are who talk while they watch,
and each holds their glass out in the hand nearer their friend so that the two glasses meet over the gap between
them. No one was added: the friend is the next partygoer, moved to stand with them, so the crowd has pairs and gaps
where it had an even row. A pair is not made across more than 7 m.

### Party 4: dressed for the island

`party-04-close.jpg` (the two sides of the finish, enlarged), `party-04.mp4`.

- **Shorts.** Half of those not in a dress are in shorts: the leg is cloth to the knee and a bare calf below it,
  where every leg was a trouser leg to the ground.
- **Straw hats.** One in five wears a straw hat in place of their hair: a wide brim, tipped a little, and a low
  crown.
- **White that stays white.** The island's white was shaded as a wall is where it meets the ground (dark at the
  feet, grey to the waist) and read as grey in the evening light. It is kept out of that shade and a little
  brighter, so a crowd in white reads as one, as in the photograph of the party under the aeroplane.

### Party 5: gathered round a table

`party-05-terraces.jpg`, `party-05.mp4` (from 7,950 m). On a club's terrace the partygoers stood scattered, each
facing the road. Now each terrace has a high white table with two drinks standing on it, and three in five of that
club's partygoers stand in a ring round it, turned to it; the rest are where they were, and the friends of Party 3
still pair up. From the road the terrace's wall hides most of the table: what reads is the knot of people.

The tables have dice of their own, so nothing else on the map moved. **The low tier's budget is nearly spent**: the
finish is 350 triangles under 120,000. The first cut tried, two tables on the wider terraces with three drinks each,
went 1,196 over.

### Party 6: sunglasses, a knot of hair, a phone held up

`party-06-close.jpg` (the two sides of the finish, enlarged), `party-06.mp4`.

- **Sunglasses** on four in ten, the sun being in their eyes: a dark band across the face, which gives the head a
  front.
- **Hair put up** in a knot on three in ten of those in a dress, where all of them had it long down the back.
- **A phone held up** by four in ten of those with a hand in the air, to film the sunset and the aeroplane: a dark
  slab in the hand, its screen lit on their side of it.

### Party 7: bodies with a shape

`party-07-close.jpg` (the two sides of the finish, enlarged), `party-07.mp4`. A partygoer's body was a square post,
as deep as it was wide, a little broader at the top. It is now wider than it is deep and has three girths: hips, a
waist drawn in above them, and shoulders broader than either (less so in a dress), the chest carried a little
forward of the hips and swayed over the standing leg. The head is narrower at the chin than at the crown. Seen from
the side a figure is slim; seen from the front it has shoulders.

Eight triangles more a figure; the finish is 1,300 under the low tier's budget again.

### Party 8: dancers

`party-08-close.jpg` (the seaward side of the finish, enlarged), `party-08.mp4`. Everyone stood upright on straight
legs. One in three is now dancing (not those clinking glasses with a friend): their feet are further apart, their
knees are bent (each leg is a thigh and a shin, the knee carried forward), everything above the hips leans forward
or back and is thrown to one side, and the hand without the drink is in the air. The lean is in where a figure's
parts are placed (`at`), so the head, the hair, the hat, the sunglasses and the arms go with the body.

### Party 9: three things to drink

`party-09-close.jpg` (the two sides of the finish, enlarged), `party-09.mp4`. Everyone held the same tumbler. Now
four in ten hold a tumbler; three in ten a cocktail in a glass like a cone, wide at the rim and held by its foot,
its drink bright in it; and three in ten a bottle of beer held by its neck, a body and a neck in green glass or
brown, which does not glow. The cocktail glass is fewer triangles than the tumbler and the bottle more: 65 more at
the finish.

### Party 10: a waiter with a tray

`party-10-terraces.jpg` (three moments along the clubs), `party-10.mp4` (from 7,950 m). Somebody brings the drinks:
each club's terrace has a waiter crossing it, in a white shirt and dark trousers, a round tray carried level on
the flat of one hand over the shoulder with three drinks standing on it, the other arm at their side. A waiter does
not dance, pair off or wear shorts. They take the place of one of the terrace's partygoers and are not one more (as
one more, the finish went 815 triangles over its budget).

**Tried first and not kept:** lighting every figure a face at a time by the sun, as the palms are. It cost no
triangle, but each face then has corners of its own, the map's file grew by a quarter of a megabyte, and beside the
picture before it the difference was slight. **The map's file is 2.2 MB gzipped** (of 3 MB): the palms' fronds and
trunks, coloured a vertex at a time since Palms 4, are most of what it has grown by.

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

### Palms 2: date palms

`palm-02-headland.jpg`, `palm-02-bend.jpg`, `palm-02.mp4` (from 4,450 m). Palms 1's fronds were broad paddles, 1.2 m
across and nearly flat. A date palm's are long and narrow, their leaflets hanging from the spine, and the crown is a
ball of them. Now:

- **A frond is narrow and its leaflets hang**: 0.9 m across at its widest, each side folded down from the spine more
  than it spreads, so from the side it reads as a comb.
- **The crown is a ball in three tiers**: five old fronds hanging below the level, five arching out and over, four
  young ones standing in its heart, in a paler green that catches the sun. Their reach grows with the palm's height.
- **The boot**: under the crown the trunk swells out to the stubs of the cut fronds.
- **Dates**: on a palm over 7.5 m, two bunches of fruit hang gold under the crown.

No triangle more a palm than before (148 in its leaves): two of the dry fronds of the thatch went, and the old
tier's fronds are two lengths, not three.

### Palms 3: fan palms, and planters

`palm-03.jpg`, `palm-03.mp4` (from 3,250 m). The palms of the photograph are of two kinds, and stand in white
planters on the terrace.

- **Fan palms** (`fan_palm`): one bunch in three is of fan palms, not date palms. A thick trunk that rises straight;
  a skirt of last years' leaves folded down round it under the crown; and a round crown of nineteen fans in three
  tiers, each a hand on a short stalk whose edge is cut into fingers, long and short, drooping at the tips. A
  bunch is of one kind. A fan palm is 150 triangles, fewer than a date palm.
- **Planters**: on the promenade a bunch grows from a white planter, a low square box with dark earth in it, wider
  for three palms than for one.

### Palms 4: fronds lit by the low sun (and room made on the low tier)

`palm-04.jpg`, `palm-04.mp4` (from 4,450 m).

**Room made first.** The finish was 350 triangles under the low tier's 120,000. Two things nobody sees were taken
out, 15,000 triangles over the map and 6,700 at the finish:

- **The pergolas' hidden faces.** A post's top is under its beam, and a beam's or a slat's two ends are a few
  centimetres square: `Builder.box` can leave them off (`open_`). A third of the triangles of every club's woodwork.
- **String bulbs of four faces.** A bulb on a string is a few pixels across: a tetrahedron does for it, where it
  was an octahedron.

**The fronds.** Every face of a frond was one flat green. Each corner now has its own colour, worked out as it is
built (`leaf_face`): dark where the frond leaves the crown and paler to its tip; warmed towards gold on the side
of the crown the sun is on, more at the tips; dim on the far side. A crown reads as a round thing lit from one
side, and a palm seen against the sun has a gold rim. No triangle more. The fan palm's skirt is slimmer, too: it
had read as a block.

### Palms 5: trunks

`palm-05.jpg`, `palm-05.mp4` (from 4,450 m). A palm's trunk was a square post in four lengths. Now (`bark`):

- **Rounder**: five sides, in six lengths on a date palm (five on a fan palm), so it curves more evenly as it leans.
- **Shaped**: flared at the foot; on a date palm the boot under the crown swells in over the last two lengths.
- **Lit**: each side has its own colour, worked out as it is built: warm on the side turned to the sun, in shade
  on the other, as the fronds are (Palms 4). The bands of old frond scars stay, a length light and a length dark.

A date palm's trunk is 60 triangles (32); the finish drew 1,600 more.

### Palms 6: dwarf palms in the planters (and room made again)

`palm-06.jpg`, `palm-06.mp4` (from 3,250 m).

**Room made first.** The last 440 m of the map is mostly people (two thirds of what stands there), so they were
made of fewer faces where it does not show: a forearm is three-sided, a head four-sided with a flat face for the
sunglasses, a hat's brim has no underside. A festoon's wire runs from every other bulb to the next but one, and the
finish gantry's beams and slats have no end faces.

**Dwarf palms** (`dwarf_palms`): the island's own palm, the dwarf fan palm, is planted at the tall palms' feet in
half the planters on the promenade: a clump of two or three rosettes of stiff, fingered fans no higher than a
person, some on a short stem, lit by the sun as the tall palms' fronds are.

**Two tries not kept.** They were first planted wild at the feet of the bunches beyond the seawall, where the wall
hides them from the road. And they first shared the palms' dice, which moved every bunch on the map and put the
finish over its budget though the map had fewer triangles: they have dice of their own now, cast from where the
bunch stands.

### Palms 7: the fan palm made again

`palm-07.jpg`, `palm-07.mp4` (from 4,450 m). The fan palm of Palms 3 was the crudest thing among the palms: its
fans stood in three flat tiers, each a long kite from the crown to its tips, so the crown read as a stack of
spikes; and its skirt was a closed sleeve, a block on a post.

- **The crown is a ball.** Two dozen fans are set round it in a spiral, from those that hang below the level to
  those that stand upright at its top, no two at one height. Each is a half round of blade at the end of a thin
  stalk, its edge cut into fingers that droop at the sides.
- **The skirt is leaves.** Five points hang from under the crown with a shorter one behind each gap, so the hem is
  ragged and the trunk shows through.

The crown has dice of its own and takes from the palms' dice what the old crown took, so no bunch on the map moved
(the first try moved them all, and put the finish 82 triangles over its budget).

### Palms 8: fronds that are feathers

`palm-08.jpg`, `palm-08.mp4` (from 4,450 m). A date palm's frond was one long blade either side of its spine: a
strap. It is a feather now: leaflets in pairs along the spine (six pairs on the fronds that arch over, four on the
rest), each pair swept back towards the tip and hanging, longest a third of the way out, with the sky between one
pair and the next. Against the sunset a crown is fringed where it was a clump of straps. A pair of leaflets is two
triangles, where a length of blade was two quads: the fronds have exactly the triangles they had.

### Palms 9: in bunches

`palm-09.jpg` (from 4,450 m, 3,250 m and 8,100 m), `palm-09.mp4` (from 4,450 m). "In bunches" was half true: half
the places a palm stood had one palm, and they stood every twenty metres like street trees. Now a place has two,
three or four palms from one bed, never one, closer together than before and stepped in height from the tallest
down (to under half its height for a fourth), leaning away from each other; and every other place along the road
is left open, so the bunches stand apart with the sky between them, as in the photograph of the terrace. There are
fewer palms than there were (the map has 25,000 fewer triangles) and they read as more.

### Palms 10: the fronds sway

`palm-10.mp4` (from 4,450 m). **As committed, this pass moved nothing**: see Party 12, which found why and put it
right; `party-12-moves-held.jpg` is the proof for both. The palms stood as still as the walls. Now their fronds sway in
the evening breeze: a tip swings 17 cm, what is near the crown hardly moves, and where a palm stands sets where in
its swing it is, so no two keep time. Fan palms' fans and the dwarf palms' sway the same way; trunks, bushes and
awnings do not.

How: a leaf says how freely each of its corners swings in the fourth part of that corner's colour (1 held fast, 0.3
at a frond's tip; `leaf_face`), which `pack_glb.py` now keeps where it set it to 1; and the leaves' material
(`leaf-material.ts`) moves each corner by that in its vertex's place, to the ride's clock. Nothing a pixel, no
triangle, no draw call; with reduced motion the clock does not run and they are still. Every map's leaves are drawn
with it, and a map that sets no swing has leaves that do not move.

### Sign 1: the IBIZA letters

`sign-01.jpg`, `sign-01.mp4`. `ibiza_sign` in `build_course.py` stands the five letters on a pale blue plinth: 2.4 m
tall, 0.55 m deep, white with dark faces as in the photograph, each letter a few slabs (the Z's diagonal and the A's
legs are slanted ones). They stand across the open promenade, turned to face whoever rides up, with lamps in the
plinth that light the paving before them. There are two: at the first place after 220 m where no club stands and
the road runs straight enough to read them coming (388 m), and the same before the finish (7,420 m). About two
hundred triangles a sign.

### Aeroplane 1: an airliner coming in to land

`plane-01.jpg`, `plane-01.mp4` (from 3,250 m). `aeroplane.py` builds an airliner some 37 m long about its own middle:
a fuselage lofted through eight stations from nose to tail cone, a strip of windows down each side and the flight
deck's, swept wings that rise to winglets, an engine slung on a pylon under each, a tailplane, and a fin in the
airline's red; with a red light on the left wing's tip, a green on the right's, a white at the tail, a beacon under
the belly and landing lights in the wings' roots. 310 triangles in two meshes (its skin, lit by the sun as the land
is; its lights, which glow).

The map only carries it. The app flies it (`plane-flight.ts`, unit-tested): from the eye, as the sky is, so it is seen
from anywhere on the map. It crosses in front of the sun, 300 m out and square to it, at 72 m/s, coming down 1.3
degrees with its nose a little up, from 96 m where it comes into sight 2 km to one side to 8 m where it is lost 2 km
to the other; one every 110 s, the first already on its way when the ride starts. It is low because the eye looks a
little down at the road: the sky in the picture ends some 15 degrees over the horizon. It is not flown with reduced
motion. Two draw calls while it is in the sky.

### Sign 2: the letters as in the photograph

`sign-02.jpg`, `sign-02.mp4` (from 280 m). Beside the photograph, Sign 1's letters were thin, its plinth grey in the
evening light, and it stood alone on bare paving. Now:

- **Chunkier letters**: a stroke of 0.58 m in letters 2.5 m tall (0.44 in 2.4), 0.8 m deep (0.55), so the white of
  their sides shows from the road.
- **A plinth in pool blue**, a wide step and the block the letters stand on; it and the letters' white are kept out
  of the shade baked where a wall meets the ground, which had greyed them.
- **Palms behind**: three bunches of date palms planted close behind the letters, as in the photograph.
- **People in front**: three partygoers by the ends of the plinth, facing whoever rides up, a drink in hand.

The palms and the people have dice of their own, so nothing else on the map moved.

### Aeroplane 2: wheels down, lights that flash, out of the haze

`plane-02.jpg` (four moments of one crossing), `plane-02.mp4` (from 3,250 m).

- **Its wheels are down** for the landing: the nose gear, and the main gear under the wings' roots, each a strut and
  a pair of wheels.
- **Its lights flash as an airliner's do.** The white strobes at its wing tips and tail flash twice in quick
  succession every 1.1 s, and the red beacons on its back and under its belly blink between them
  (`planeLights` in `plane-flight.ts`, unit-tested). They are two meshes of their own, which the app shows and hides;
  the red, green and landing lights burn steadily.
- **It comes out of the haze.** Aeroplane 1 appeared 2 km off all at once. Now it shows through over the first 600 m
  of its path and is lost over the last 600 m (`shown`, on its two materials).

### Sign 3: a paved square under strings of bulbs

`sign-03.jpg`, `sign-03.mp4` (from 280 m). In the photograph the letters stand on brick paving, with strings of
bulbs behind them. Now, for 8 m either side of each sign, the promenade from the kerb to its far edge is paved in
brick, banded in a lighter brick every 4 m along and in three lines across; the paving follows the promenade, so it
keeps off the road where the letters are turned to it. Five posts stand at its corners and behind the letters, and
four strings of bulbs hang between them: two behind the letters and one out to the kerb at each end. The glow of
three of the bulbs is drawn.

### Aeroplane 3: a livery, lit windows, flaps, and wings that rock

`plane-03.jpg` (the sky, and the aeroplane enlarged from the film), `plane-03.mp4` (from 3,250 m).

- **A livery**: white above and grey under the belly, the airline's red in a line along each side under the windows
  and on the lip of each engine, as on its fin.
- **Lit cabin windows**: the dark strip down each side is a row of two dozen warm panes, with the gap of a door in
  it; they glow as its steady lights do.
- **Flaps down**: a panel behind the inner half of each wing, hinged down for the landing.
- **Its wings rock** a little in the evening air: under two degrees, slowly (`roll` in `plane-flight.ts`,
  unit-tested).

About 550 triangles in all.

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
