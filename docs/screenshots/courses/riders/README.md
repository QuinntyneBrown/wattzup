# The riders: realism passes

Each pass makes one significant change to how real the riders on a course look, towards the picture the work aims
at (a rider seen from behind on a road bike: the shape of a body, real kit, a real bike). The riders are the
course renderer's, not a map's: every pass here applies to every map. They are measured and filmed on Neon
Docklands with `tools/course-bench`, on its first bridge (`WZ_BENCH_FROM=3760`), against the medium pack of bots,
and a pass is kept only if the frame rate holds. `docs/course-realism.md` describes each technique.

| Pass | Change | Display | Worst frame | Uncapped, median of three | Triangles | Draw calls | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Before: the class worlds' rider, a figure of capsules and spheres | 119.9 fps | 25 ms | 306 fps (pass 22 of the map; 248 to 315 on a busy machine in pass 23) | 83,391 | 79 | |
| 1 | A rider with the shape of a body, on a bike with the proportions of one | 60.1 fps (the display was at 60 Hz), none over 20 ms | 16.9 ms | 335 fps (2.99 ms): 335, 339, 314 | 83,881 | 64 | Yes |
| 2 | Kit with a design: panels, pockets, lettering, cuffs; shoulders that join the arms | 120.1 fps, none over 20 ms | 16.8 ms | 323 fps (3.10 ms): 324, 314, 323 | 81,601 | 69 | Yes |
| 3 | Riders that move: a lean into each bend, the bike rocking under the stroke, the shoulders swaying over it | 120.1 fps, none over 20 ms | 9.6 ms | 320 fps (3.12 ms): 331, 320, 293 | 81,601 | 74 | Yes |
| 4 | A finish for each surface: skin, lycra, lacquer, carbon, steel, rubber; lamp light along glossy edges | 120.0 fps, none over 20 ms | 16.6 ms | 317 fps (3.15 ms): 326, 317, 317 | 81,601 | 74 | Yes |
| 5 | One pelvis for a seat, sleeves closed over the shoulders, the back of the head: hair, ears, the helmet's cradle and straps | 120.1 fps, none over 20 ms | 16.9 ms | 314 fps (3.19 ms): 320, 310, 314 | 84,781 | 74 | Yes |
| 6 | Out of the saddle on a steep climb, the bike thrown from side to side; a pose that allocates nothing | 119.9 fps; one frame of 25 ms in 2 timings of 11, none in 9 (the pass before: none in 8) | 25.3 ms | 302 fps (3.31 ms): 302, 311, 302 | 84,781 | 74 | Yes, with that noted |
| 7 | Riders who differ: skin, hair, height, the bike's colour, shoes and socks | 120.1 fps, none over 20 ms in 4 timings | 8.7 ms | 312 fps (3.21 ms): 301, 312, 321 | 84,781 | 74 | Yes |
| 8 | Bike lights at night: a red rear lamp that glows, and the pools the lamps throw on the road | 119.8 fps; two frames of 25 ms in 1 timing of 4, none in 3 | 16.7 ms filmed, 25.1 ms worst | 294 fps (3.40 ms): 301, 292, 294 | 85,051 | 84 | Yes, with that noted |
| 9 | Shade baked where the parts meet: under the helmet, inside the arms, beneath the seat, at the frame's joins | 119.9 fps; one frame of 25 ms in 1 timing of 3 | 25.1 ms | 317 fps (3.15 ms): 323, 313, 317 | 85,051 | 84 | Yes |
| 10 | Cloth painted as cloth: the back's shape, folds, pocket shade, mesh panels, seams, the knit's grain; lamp light that keeps what is painted | 119.9 fps; two frames of 25 ms in 1 timing of 4, neither with a collection | 16.9 ms filmed, 25.0 ms worst | 294 fps (3.40 ms): 296, 286, 294 | 85,051 | 84 | Yes |
| 11 | The whole rider in the frame: the picture raised a tenth so the wheels and the road under them show above the panel | 119.8 fps, none over 20 ms | 16.8 ms | 304 fps (3.29 ms): 304, 294, 313 | 85,051 | 84 | Yes |
| 12 | The camera closer: the rider some two fifths of the picture's height, where they were a ninth | 119.9 fps, none over 20 ms | 16.7 ms | 302 fps (3.31 ms): 305, 284, 302 | 85,051 | 84 | Yes |
| 13 | Hips and legs of a cyclist: glutes that are the thighs' own tops, fuller thighs, calves that swell behind | 119.8 fps, 1 over 20 ms | 25.0 ms | 308 fps (3.25 ms): 305, 312, 308 | 87,691 | 84 | Yes |
| 14 | A road helmet: a long low shell with vents along its crown, a dark rim and a pale tail | 119.7 fps, 1 over 20 ms | 25.0 ms | 303 fps (3.30 ms): 299, 303, 309 | 87,751 | 84 | Yes |
| 15 | Shoes, hands and arms: a cupped heel with a tab, a strap and toe cap; a hand that holds the hood; arms with their muscles | 120.0 fps, 0 over 20 ms | 16.7 ms | 303 fps (3.30 ms): 291, 307, 303 | 90,791 | 84 | Yes |
| 16 | Lamp light with a side: what faces the nearest lamp is lit more, what faces away less | 119.7 fps, 0 over 20 ms | 16.8 ms | 296 fps (3.37 ms): 296, 301, 293 | 90,791 | 84 | Yes |
| 17 | Wheels that turn: deep rims with decals and laced spokes, rolling with the road | 120.1 fps, 0 over 20 ms | 8.7 ms | 305 fps (3.28 ms): 300, 305, 307 | 90,871 | 84 | Yes |
| 18 | Muscle drawn on the legs' skin: the calf's two heads and the groove between, the Achilles tendon, the hollow behind the knee | 119.7 fps, 0 over 20 ms | 16.8 ms | 301 fps (3.32 ms): 303, 301, 299 | 96,711 | 84 | Yes |
| 19 | A drivetrain: seven sprockets, a derailleur with its cage and jockey wheels, a dark chain, slim hubs, black cranks | 119.7 fps, 1 over 20 ms | 25.0 ms | 301 fps (3.33 ms): 301, 298, 302 | 100,371 | 84 | Yes |
| 20 | The camera at the reference's distance: the rider half the picture's height | 119.9 fps, 0 over 20 ms | 16.7 ms | 295 fps (3.39 ms): 295, 296, 293 | 100,371 | 84 | Yes |

## Pass 1: the shape of a body, and of a bike

**Before** (`rider-00.jpg`, and the map's `../docklands/pass-23.mp4`): the rider is the class worlds' kit
(`world-cyclist.ts`): a capsule for a trunk, capsules of one thickness for limbs, a ball for a head, with a gap at
every joint; a bike of thin sticks. It reads as a toy.

**After** (`rider-01.jpg` on the bridge, `rider-01-start.jpg` at the start line, `rider-01.mp4`): a cyclist. The
thighs are thick at the hip and narrow to the knee, in bib shorts with a gripper band above it; the calves swell
behind the shin and thin to the ankle, with white socks to mid-calf and road shoes with dark soles that tip toe-down
through the bottom of each stroke. The trunk is one shape from the pelvis to the neck, narrow at the waist and wide
at the shoulders, along a back that rounds; the jersey ends in a pale hem over the shorts, the race number pinned
on it. Sleeves end above the elbow; gloved hands hold the brake hoods. The helmet has vents and a tail. The bike
has a frame of the right tubes at the right sizes, a fork, a seat post and saddle, a stem and taped drop bars with
hoods and levers, deep rims in real tyres, a chainring, cassette, derailleur and chain, and a bottle.

**What changed.**

- `course-cyclist.ts`, new: the course's own rider. Every limb is a lofted tube whose elliptical section changes
  along it (wider front to back than side to side, off-centre where a muscle lies); the trunk is one loft of nine
  sections along the spine. The colour of each part is in its vertices, so skin, shorts, gripper, sock and shoe are
  sections of one mesh, not meshes of their own.
- Everything that never moves against the bike (the body from the hips up, the arms, the whole bike: some 60
  pieces) is merged into one mesh a rider. What the pedalling moves (two thighs, shins, shoes, cranks and pedals)
  is ten meshes marked `moving`, which `rider-batch.ts` draws for every rider at once.
- The class worlds keep their own rider untouched. `merged-cyclist.ts`, which joined that kit's parts for a course,
  is gone: the new kit is made merged.

**Cost.** Less than nothing: 335 fps against 306 to 315, and **15 fewer draw calls** (64, from 79), because a rider
is now a merged mesh, a number and two spoke discs where it was a dozen meshes. 500 more triangles in the frame for
five riders.

**Learned.**

- The capsule figure was not short of triangles; it was short of shape. A limb whose section changes along it, at
  the same cost, is the whole difference between a toy and a body.
- Colours in the vertices let one mesh be a leg with shorts, skin and a sock on it. A colour changes over the gap
  between two sections, so where the edge must be sharp (a hem, a sock's top) two sections go a hair apart.
- Building the rider merged, instead of merging a kit of parts afterwards, removed a file and fifteen draw calls.

**Not yet.** The shoulders are balls that stand proud of the trunk; the jersey and shorts are flat colours with no
panels, pockets or lettering; skin and cloth shine alike; the upper body is rigid as the legs turn; every rider is
the same build.

## Pass 2: kit with a design

**Before** (`rider-01-start.jpg`): the jersey is one flat colour from hem to collar and the shoulders are two balls
standing proud of the trunk, the sleeves hanging from them.

**After** (`rider-02-start.jpg` at the start line, `rider-02.jpg` and `rider-02.mp4` on the bridge): the jersey is
cut and printed. A darker yoke lies over the shoulders with TELO under it and two bars beneath the name; darker
panels run down each side under the arms; three pockets are stitched across the small of the back; the collar and
the hem are pale; the sleeves end in a dark cuff with a pale line; the shorts carry a small mark on the seat. The
trunk now widens into the shoulders and each sleeve starts inside it, so arm and body are one line.

**What changed.** `course-cyclist.ts`:

- `wrap` is `loft` with a UV in place of a colour: round the tube and along it. The trunk and the two sleeves are
  made with it and merged into one mesh a rider, drawn with a texture of that rider's own
  (`kitTexture(jersey)`, 512 px, painted on a canvas in the rider's colour): the trunk's wrap on the left 70 % of
  it, the sleeve on the rest.
- The shoulder balls are gone. The trunk's sections widen to 0.186 m at the shoulders, and the sleeve starts 14 mm
  further in and a little wider than the arm.
- The bare upper arm below the sleeve is a piece of its own, in the mesh coloured by vertex.

**Cost.** One draw call and one 512 px texture a rider (69 draw calls for a pack of five, from 64): 323 fps against
335, with no frame over 20 ms.

**Tried and dropped.** The first lettering read backwards: a UV that runs with the angle round a tube reads from
inside it. It runs the other way now.

**Learned.**

- Colour by vertex is right for parts with a few flat colours and wrong for anything written or stitched: that
  wants a texture, and a texture wants its own mesh. Only what needs it got one.
- A joint looks like a joint when the two shapes overlap inside each other, not when a ball is put between them.

## Pass 3: riders that move

**Before** (`rider-02.mp4`): only the legs move. The rider and the bike stand bolt upright through every bend, as if
on rails, and the body above the saddle is one rigid piece with the frame. (The bike's rock under the stroke, written
in pass 1, never showed: the renderer set the rider's whole turn each frame and wrote over it.)

**After** (`rider-03.mp4`, and `rider-03.jpg`, four frames of it through the bridge's bend): the rider leans into
the bend with the bike, as far as the bend is tight, and comes upright as the road straightens; the whole pack leans
together. Under each stroke the bike rocks a little about the tyres, the shoulders sway the other way over it, and
the back rises and falls a few millimetres twice a turn.

**What changed.**

- `rider-lean.ts`, new, with its unit tests: `bendLean(heading, ahead, metres)` is the lean that balances a bike
  round the curve the road makes over the next `metres`, at 10 m/s, to at most 0.35 rad (twenty degrees).
  `CourseRenderer.ride` reads the road's heading 6 m ahead and gives the rider that roll.
- `course-cyclist.ts`: the rider is now three levels. The group the renderer places and leans; inside it a `rig`
  (bike, legs, rider) that rocks 0.03 rad with the stroke; inside that a `torso` (the kit's mesh, the head and arms,
  the number) that turns 0.07 rad the other way about the line from the hips to the hands, so the hips stay on the
  saddle and the hands on the hoods.
- With reduced motion the cranks do not turn, so nothing rocks or sways; the lean, which is where the rider is and
  not an animation, stays.

**Cost.** One draw call a rider (the head and arms are no longer in the bike's mesh): 74 for a pack of five. 320 fps
against 323; no frame over 20 ms, the worst 9.6 ms. A first run had one frame of 25 ms and was run again.

**Tried and dropped.** A lean of up to 0.42 rad: right by the physics for this bend, but with a camera that stays
level it looked like a fall. 0.35.

**Learned.**

- A motion written into a group that someone else also writes is lost without a sign. Each thing that turns the
  rider got a group of its own: placing and leaning, rocking, swaying.
- The lean is read from the road, not from each rider's speed: a pack leans as one, and nobody stands up mid-bend
  because they eased off.
- Turning the upper body about the line through the two places it is held (saddle and bars) lets it move without
  the hands leaving the hoods; no arm has to be solved again each frame.

## Pass 4: a finish for each surface

**Before** (`rider-03.mp4`, `rider-02-start.jpg`): everything coloured by vertex (skin, shorts, shoes, helmet, the
whole bike) was drawn fully matt, by one Lambert material, and the lamps only tinted it. Skin, rubber and steel
differed in colour and in nothing else.

**After** (`rider-04-start.jpg`, `rider-04.jpg`, `rider-04.mp4`): each part has its own finish. Under the street
lamps the light runs along the edge of a calf, the lycra over the seat, the helmet's shell and the frame's tubes;
socks, bar tape and tyres stay dull; the cassette and hubs are metal.

**What changed.**

- `course-cyclist.ts`: beside its colour, every vertex carries a `finish` (gloss 0 to 1, metal 0 to 1), looked up
  from the colour it is painted (`FINISHES`: skin 0.5, shorts 0.38, shoes 0.8, frame 0.95 and a quarter metal, steel
  0.8 and all metal, tyres 0.12, socks 0.08; cloth 0.22 where nothing is named; the helmet's shell 0.9).
- `rider-finish.ts`, new: `vertexFinish(material)` reads the attribute into the material's roughness
  (1 - 0.82 × gloss) and metalness; `sheen(gloss)` is how much of an all-round light a surface throws back along
  its edges ((1 - facing)³ × gloss).
- The riders' vertex-coloured material is a standard (physically lit) material in place of Lambert, on every map,
  so the sun and the moon draw a highlight on what is glossy.
- `lamp-glow.ts`: a rider's lamp-lit material adds the lamps' light × `sheen` to what it emits, in the lamps' own
  colour, so a magenta sign rims a rider in magenta.

**Cost.** 317 fps against 320; no frame over 20 ms. No draw calls, no triangles, no textures: two floats a vertex.

**Tried and dropped.** Shorts at 0.55: the seat's two rounds each took a bright ring and read as two balls. 0.38,
the same as the kit's cloth above them.

**Learned.**

- The lamps here are not lights the renderer shades with (they are a map the surfaces read), so a glossy material
  alone showed nothing at night. The gloss had to be given something to throw back: the same map, at the edges.
- A finish in the vertices costs nothing a frame and keeps the rider one mesh; a material for each finish would have
  been a draw call for each.
- The rim light is unkind to crude shapes: it drew a line round the seat's two spheres. Shape first, then shine.

## Pass 5: the seat, the shoulders and the back of the head

**Before** (`rider-04-start.jpg`): the seat is two spheres side by side, which the edge light of pass 4 drew a ring
round each; each sleeve's open top stands out of the trunk as a point at the shoulder; below the helmet the head is
a bare skin-coloured ball.

**After** (`rider-05-start.jpg`, `rider-05.jpg`, `rider-05.mp4`): one pelvis, wide over the saddle and round
behind, that the trunk grows out of and the thighs leave. The sleeves close over the shoulders in a dome. Dark hair
shows between the helmet and the collar, with ears, the helmet's cradle on the nape and its straps down to the chin.

**What changed.** `course-cyclist.ts`: the two glutes are one ellipsoid (0.15 × 0.09 × 0.118 m, tipped forward with
the pelvis); the sleeve's loft starts with three small sections; `HAIR` and four small pieces a head; the saddle is
dull (0.15) so its tail does not ring.

**Cost.** 3,200 more triangles in the frame for five riders. 314 fps against 317, inside the run-to-run spread; no
frame over 20 ms.

**Tried and dropped.** A pelvis 0.16 m wide: wider than the waist above it, it sat like a cushion.

**Learned.**

- An open end of a tube must be inside something or closed. It hid at pass 2 and showed once the shoulders were
  looked at closely.
- From a camera behind the rider, the back of the head and the seat are the two places the eye rests. They were the
  two crudest.

## Pass 6: out of the saddle

**Before** (`rider-05.mp4`): riders sit the same on an 8 % ramp as on the flat.

**After** (`rider-06.mp4`, up the first bridge's ramp, 3.5 % to 8.2 %; `rider-06.jpg`, four frames of it): as the
road passes 5 % the riders rise off the saddle, fully out of it by 7 %, and sit again over the top. Standing, the
hips lift some 7 cm and the shoulders come forward over the bars, the bike is thrown further from side to side under
each stroke (0.08 rad, from 0.03), and the body bobs with it. The lift is modest: it reads mostly as the bike
rocking, and as the saddle showing under the seat.

**What changed.**

- `rider-stance.ts`, new, with its unit tests: `outOfTheSaddle(gradient)` is 0 to 5 %, 1 from 7 %, eased between.
- `CourseRenderer.ride` returns it for the gradient where the rider is, and each rider's `pose(angle, standing)`
  takes it.
- `course-cyclist.ts`: standing turns the torso about the hands on the hoods (0.085 rad), which lifts the hips and
  keeps the hands where they are; the legs' hips are now read from the torso, so they follow its sway and rise.
- `between` and `bend` write into what they are given: a pose made every frame for every rider allocates nothing
  (it made some thirty small objects a rider a frame since pass 1).

**Measured.** 302 fps uncapped against 314, on a machine that also ran slower for the pass before in the same
sitting. Display pace 119.9 fps. One frame of about 25 ms came in 2 of 11 timings of this pass (at 4.6 s and 8.6 s,
no fixed place), and in none of 8 timings of pass 5 made alternately with them; the last four of each were clean.
Nothing in the change makes or uploads anything, and passes 0 and 3 each had the same single frame once. Kept, with
this on the record: if it recurs, look here first.

**Tried and dropped.** Throwing the bike 0.12 rad when standing: on top of a lean into a bend it looked like a fall.

**Learned.**

- Posture from the road, like the lean: nothing to store, a pack rises together where the ramp begins.
- A rider's upper body can change posture without solving the arms again if it turns about the hands.
- Timing runs must alternate with the pass before in one sitting; a run after a run compares the machine, not the
  change.

## Pass 7: riders who differ

**Before** (`rider-06.mp4`): the pack is one person five times, on five black bikes; only the jerseys differ.

**After** (`rider-07-pack.jpg`, the pack at the start line enlarged; `rider-07.jpg`, `rider-07.mp4`): each rider has
their own skin tone (six), hair (five), height (0.94 to 1.06 of the middling rider, on a bike their size), frame
colour (seven: black, white, red, blue, green, graphite, gold), shoes and socks. A rider's look comes from their
race number, so it is the same every race.

**What changed.**

- `rider-look.ts`, new, with its unit tests: `riderLook(number)` steps through each list at its own pace, so the
  lists do not fall into step and two riders next to each other in the numbers never share everything.
- `course-cyclist.ts`: the body, the legs and the bike are painted from the rider's own palette; each of its colours
  takes the finish of the part it paints. The legs' shapes, shared by all riders until now, are made for each rider
  (the batch of moving parts copied them for each rider already, so nothing more is drawn or held on the GPU). The
  rider's rig is scaled by their height.

**Cost.** None measured: 312 fps against 302 for pass 6 (the machine, not the change), no frame over 20 ms in four
timings, the same 74 draw calls and triangles. Three small geometries more a rider in memory, disposed with them.

**Learned.**

- Variety that comes from a number the rider already has needs no data and no choosing, and stays put between
  races.
- A table of finishes keyed by colour had to become a weak one once colours were made for each rider, or every race
  would have left its riders' colours in it.

## Pass 8: bike lights at night

**Before** (`rider-07.mp4`): at night the bikes are unlit; a rider up the road is a dim figure between street lamps.

**After** (`rider-08-start.jpg`, `rider-08.jpg`, `rider-08.mp4`): every bike carries a rear lamp on the seat post,
below the saddle, that glows red, and throws a red pool on the wet road behind the rear wheel; a front lamp under
the stem throws a pale pool ahead. The riders up the road are each marked by a red point and its light on the
road. The pale pool ahead is hard to see where the street lamps already light the road. The ghost carries no light.
By day (a course whose file is not `night`) nothing is made or drawn.

**What changed.** `course-cyclist.ts`: where the course is ridden at night the kit makes one soft round glow
texture (64 px), one additive material, and two shapes shared by every rider: the lamp's glow (a 0.3 m square
facing back) and the road's (a red 1.3 × 2.6 m and a pale 2.2 × 6 m flat on the road, one mesh). The lamp's glow
rides in the rig with the bike; the road's is in the rider's group and turned back by the rider's lean each pose, so
it stays flat on the road through a bend. Two small dark lamp bodies are in the bike's mesh.

**Cost.** Two draw calls a rider (84 for a pack of five, from 74) and the pools' overdraw: 294 fps against 312.
Display pace 119.8 fps. One timing of four had two frames of 25 ms (at 6.0 s and 9.5 s); the filmed run and two
others had none. Since pass 6, 3 timings of 19 have had such a frame and 16 none, against none of 8 for pass 5:
not enough to lay at a pass's door, and nothing in passes 6 to 8 allocates in a frame, but it is on the record.

**Tried and dropped.**

- The lamp on top of the seat post: it was inside the rider's seat and showed on nobody's bike but the far ones.
- A double-sided glow: a transparent double-sided mesh is drawn twice. Each plane faces the one way it is seen.

**Learned.**

- At night a rider is found by their light before their shape: a point of red and its pool on the road say
  "rider" at two hundred metres, where five pixels of jersey do not.
- What lies on the road must not lean with the rider: it is the one part that takes the lean back out.

## The odd slow frame: what was measured after pass 8

Passes 6 and 8 each recorded a rare frame of about 25 ms. To see whether a pass causes it, pass 5 and pass 8 were
built side by side and timed alternately in one sitting, six timings of 10 seconds each, at display pace on the
bridge:

| Build | Timings with a frame over 20 ms | Worst frame of each timing, ms |
| --- | --- | --- |
| Pass 5 | 0 of 6 | 9.6, 9.3, 16.7, 10.0, 10.1, 8.6 |
| Pass 8 | 1 of 6 (one frame, 24.9 ms) | 16.9, 16.7, 10.1, 24.9, 16.7, 16.7 |

With every timing since pass 6 counted: 4 of 25 for passes 6 to 8, 0 of 14 for pass 5. That leans towards the later
passes without settling it (passes 0 and 3 each had one such frame too, and an earlier sitting gave pass 5 a worst
frame of 17 ms in four timings of four). The mean frame is 8.3 ms and the 99th percentile 8.5 ms in all of them, so
this is one frame in some six thousand, not a slower picture. Nothing in passes 6 to 8 allocates or uploads in a
frame. It stays open: the bench does not yet say which frame was slow or why, and until it does (a count of frames
over 12 ms, and the heap before and after) more timings will not tell more.

## Pass 9: shade where the parts meet

**Before** (`rider-08-start.jpg`): every part of the rider is lit as if it stood alone; the neck under the helmet is
as bright as the shoulder, the inside of an arm as bright as its outside.

**After** (`rider-09-start.jpg`, `rider-09.jpg`, `rider-09.mp4`): the neck under the helmet, the inside of the arms
against the trunk, the jersey under the arms, the seat over the saddle and the joins of the frame are darker. It is
a small change to the picture: it takes the evenness off the rider more than it draws shadows on them.

**What changed.**

- `rider-shade.ts`, new, with its unit tests: `occlusion(positions, normals, reach, samples)` gives each point how
  shut in it is by the samples standing in front of it within `reach`, found through a grid of cells.
- `CourseCyclistKit.shade` runs it once, for the first rider made (every rider has the same shape), over the bike,
  the body and the kit together, with one sample a triangle and a reach of 0.14 m, and keeps the result; each rider's
  vertex colours are multiplied by 1 - 0.7 × shade. The kit's mesh gained white vertex colours (and lycra's finish)
  to carry it.

**Cost.** Nothing a frame: 317 fps against 294 for pass 8 (the machine was quicker this sitting). Once, a few
milliseconds when the first rider is made. One timing of three had the one 25 ms frame recorded since pass 6.

**Learned.**

- Shade that never changes belongs in the vertices, worked out once; the riders' shape is the same for all, so once
  for the whole pack.
- The legs move, so they neither shade nor are shaded here; what the legs do to the seat and the frame is still
  missing.

## The odd slow frame: what the page allocates

The bench now counts frames over 12 ms, reads the JavaScript heap every frame (how much was made, how often it was
collected, whether a slow frame came with a collection) and, with `WZ_BENCH_ALLOC=1`, samples who allocates
(`<label>-alloc.txt`). On the bridge, ten seconds at display pace:

| Build | Made in 10 s | Collections |
| --- | --- | --- |
| Pass 5 | 145 MB | 5 |
| Pass 9 | 134 MB | 5 |
| Pass 9, no other riders | 134 MB | 5 |
| Pass 9, after the two fixes below | 98 MB | 4 |

So the page makes some 13 MB of short-lived objects a second, with or without riders and before the riders' passes
as after them: the churn is not the riders'. Who makes it:

- 36 MB: the renderer's own report for the test hook (`CourseRenderer.report`), which split every chunk's name and
  built two records each frame. It runs only when a test pins the tier, so the bench was measuring its own report.
  The group is now kept with the chunk and the report writes into one record.
- 3 MB: `lampShadows` listed its two rows and two kerbs in arrays for every rider every frame. It counts them now.
- The rest, some 95 MB: Three.js's WebGPU renderer (cache keys of node materials worked out for every object every
  frame, render lists, pass descriptors). Not ours to change in a pass; it is the next place to look (fewer objects
  drawn is fewer keys).

After the two fixes, six timings in a row had no frame over 20 ms (0 to 3 frames over 12 ms each). That is not
proof either, but the heap is now collected four times in ten seconds, not five, and the bench can say next time
whether a slow frame came with a collection.

## Pass 10: cloth painted as cloth

**Before** (`rider-09-start.jpg`): the jersey's design is flat fills, and under a street lamp the whole jersey goes
to one pale orange: the lamps' light was added to every textured part as if it were white, washing out whatever was
painted on it (the panels, the cuffs, the number's digits).

**After** (`rider-10-start.jpg`, `rider-10.jpg`, `rider-10.mp4`): the jersey holds its colour under the lamps, with
its darker side panels and cuffs, and the shorts their seams. Painted over the design: the spine's hollow and the
shoulder blades, shade under the arms, folds gathered at the waist and pulled from the armpits, shade under the
pockets' top edge and the swell of what is in them, rows of holes in the mesh side panels, a sheen and three seams
on the shorts, a seam and folds on the sleeve, and a grain over all of it. From the race camera the colour, panels,
cuffs and seams read; the folds and the grain are fine detail that mostly reads close to.

**What changed.**

- `course-cyclist.ts`: `cloth(ctx, …)` paints light and dark over the kit's texture with soft (blurred) strokes and
  blobs, then a grain from a fixed seed.
- `lamp-glow.ts`: a rider's lamp-lit material multiplies the lamps' light by the surface's colour as the material
  has worked it out (`diffuseColor`: colour × vertex colours × map), where it used the plain colour and so ignored
  the map.

**Cost.** 294 fps against 317 for pass 9; the timings of pass 8 on a like machine were 294 too, and nothing here is
drawn or sampled that was not before. No draw calls, no triangles. Some 20 ms more a rider when they are made (the
grain reads the canvas back), at load. Of four timings one had two frames of 25 ms. The bench's new columns say what they were not: neither came with a
collection of the heap (four collections in that timing, none at a slow frame), so the churn of memory is not what
makes them. They came at 0.575 s and 2.575 s, exactly two seconds apart: something on a timer. That is the next
thing to find.

**Learned.**

- Check what light is multiplied by. An emission that forgets the map is invisible on flat-coloured parts and
  flattens exactly the parts that were given detail.
- Detail has a distance. What is painted at a millimetre's scale is for the rider you are beside; the race camera
  reads panels, seams and colour.

## The odd slow frame: not the page's script

The bench now also asks the browser for its long animation frames, and records for each frame over 20 ms how late
its callback ran after the display's tick and how long the frame before it spent in script. Eighteen more timings
of pass 10 on the bridge: three had slow frames (one, one and two).

- The browser reported no long animation frame for any of them: no script ran long.
- For the two measured, the callback ran 1.0 and 1.5 ms after the display's tick, and the frame before had spent
  3.8 and 3.0 ms in script. The page was on time and had 4 ms of work; the display showed the frame late anyway.
- None came with a collection of the heap.
- Pairs fell a whole number of seconds apart (2.000 s, 7.000 s).

So the 25 ms frame is not made by the riders, the renderer's JavaScript or the garbage collector: the frame is
skipped after the page has handed it over, in the browser's compositor or the GPU. The whole seconds between them
point at something that happens once a second (the HUD's numbers changing over the canvas is the first thing to
try: pause it and time again; the machine's other programs are the second). It is about one frame in several
thousand on this machine. The riders' passes are cleared of it; it is left here as a finding for the race screen.

## Tried and not kept: spray off the rear wheel

On a wet road a rear wheel throws its water up and back, and from behind that tail is the plainest sign of riding in
the rain. It was built (two crossed sheets from the tyre's contact to 0.6 m up and 1.5 m back, a texture of streaks
scrolled along them, on courses whose file is `wet`) and looked at on the start line and the bridge.

It could not be seen. The rider's own rear wheel meets the road under the panel at the foot of the screen, so their
spray is behind the HUD; on the riders up the road it is a few faint pixels. It cost two draw calls a rider (94 for
a pack of five, from 84). Nothing seen for ten draw calls: not kept, and no film made of it.

What would make it worth another try: a camera that shows the road behind the rider's wheel (the race camera's
height and distance are the requirement's, L2-166 AC9), or riders close ahead, where their spray would hang in the
rider's own view. Then it wants soft mist low on the road more than streaks.

## Pass 11: the whole rider in the frame

**Before** (`rider-10-start.jpg`): the rider's rear wheel meets the road behind the panel at the foot of the screen.
The bike has no ground under it in the picture: no contact, no shadow, no pool of light. The picture this work aims
at shows the rider whole, wheels on the road.

**After** (`rider-11-start.jpg`, `rider-11.jpg`, `rider-11.mp4`): the rider, both wheels, the road under them and
the rear lamp's red pool behind are clear of the panel, on the start line and on the bridge. The horizon and the
riders up the road sit a tenth higher too; the sky loses that tenth at the top, under the header.

**What changed.** `course-renderer.ts`: the course's camera has its lens shifted down by a tenth of the frame's
height (`FRAME_RISE`, through `setViewOffset`), which raises the picture by as much. The camera is where it was and
points where it did (L2-166 AC9's distances are unchanged), so nothing leans or stretches: it is the shift a view
camera makes. AC9 now says the rider shows whole above the panel.

**Cost.** None: 304 fps, no frame over 20 ms, the same draw calls and triangles. The race's end-to-end specs give
the same results as before the riders' work (the 13 failures that were there, no others).

**Learned.**

- Look at the whole screen, not the crop. Ten passes went into a rider whose wheels were under the HUD; it took a
  spray nobody could see to notice.
- To move a subject in the frame without changing the view, shift the lens; tilting the camera down would have
  raised the rider and lost the skyline.

## Pass 12: the camera closer

**Before** (`rider-11.jpg`): the rider is whole in the frame but small, about a ninth of the picture's height. In
the picture this work aims at the rider takes some two fifths of it: that picture is about the rider.

**After** (`rider-12-start.jpg`, `rider-12.jpg`, `rider-12.mp4`): the camera rides 3.3 m behind and 1.9 m above the
rider (it was 4.9 m and 2.25 m), and 2.7 m and 1.7 m at the start and finish lines (3.5 m and 1.8 m). The rider
stands some two fifths of the picture high. The picture is raised 0.15 of its height (0.1 in pass 11), since a
nearer rider sits lower in it. The kit's lettering, the number, the shorts' seams, the calves, the bike's stays and
the lamp are all plainly read now, and so is the lean through a bend.

**What changed.** Four constants in `course-renderer.ts` (`CAMERA_BACK`, `CAMERA_UP`, `CLOSE_BACK`, `CLOSE_UP`) and
`FRAME_RISE`. L2-166 AC9 carries the new distances.

**Cost.** None: 302 fps, no frame over 20 ms. The race's end-to-end specs give the same results as before.

**To weigh.** A nearer camera shows less road to either side and makes the riders ahead a little smaller against the
rider; it also shows the rider's remaining simplicity (hands, the face nobody sees, the legs' flat skin) more
plainly. The distances are four numbers if the old view is wanted back.

**Learned.** How real a rider looks is first how much of the picture they are given. Every earlier pass is worth
more at this distance than it was at the old one.

## Pass 13: hips and legs of a cyclist

**Before** (`rider-12-start.jpg`): seen this close, the seat is one black ellipsoid wider than the waist, sitting on
the saddle like a cushion, with the thighs starting abruptly under it; the legs are thin, and the calf's swell was on
the front of the shin (its offset had the wrong sign: along a shin, +z is the front).

**After** (`rider-13-start.jpg`, `rider-13.jpg`, `rider-13.mp4`): each thigh begins above and behind the hip joint
with a rounded glute that turns with the leg, so the seat is two glutes running into two thighs with the saddle
between them, and it works as the rider pedals. The thighs are fuller, with the quadriceps to the front; the calves
swell behind, widest a third of the way down, and draw in to the ankle.

**What changed.** `course-cyclist.ts`: `thighShape` gains three sections above the hip (t from -0.17) and fuller
ones below; `shinShape`'s calf is on -z and larger; the pelvis is a smaller filler between the hips
(0.122 × 0.08 × 0.098 m).

**Cost.** None beyond the run-to-run spread; a few hundred triangles for the pack.

**Learned.**

- A loft may start before its joint (a negative t): that is how a muscle that crosses a joint is made part of the
  limb that moves it.
- Write down which way a limb's own axes point. The calf was on the wrong side for twelve passes because nobody
  could see it from 4.9 m.

## Tried and not kept: the rider's reflection in the wet road

After pass 13 no shadow can be seen under a rider: the lamps' shadows (the map's pass 8) are soft dark shapes on
asphalt that is already dark. On a wet road at night what grounds a rider is their reflection, so a dark shape was
laid from under each rider towards the eye, as long as a flat mirror would make it (`distance × 1.5 / (eye's height
+ 1.5)`, with unit tests), in the same instanced mesh as the shadows, darker the wetter the road.

It could not be seen: dark on dark, except where it happened to cross a lamp's reflection. For the rider's own bike
it lies in the strip between the wheels and the panel. Nothing seen: not kept, no film.

What it showed is what is missing: the road shows the lamps' reflections but nothing of the riders. A reflection
worth having carries the rider's colours (a jersey lit by a lamp, smeared down the wet road), which is a mirrored
or smeared draw of the rider, not a dark quad. That is a pass of its own, and it wants the road below the rider's
wheels in the frame.

## Pass 14: a road helmet

**Before** (`rider-13-start.jpg`): the helmet is half a ball with its vents coloured in by triangle, which at the
new camera distance shows as a checkerboard on a ball.

**After** (`rider-14-start.jpg`, `rider-14.jpg`, `rider-14.mp4`): a road helmet's shell, long and low from the brow
to a tail raised behind the head, lacquered in the rider's colour with a pale tip to the tail and a dark rim under
its edge; five vents run along the crown. From directly behind, the shell, its rim and its tail are what is seen;
the vents are on top and show when the rider is seen from above or the side.

**What changed.** `course-cyclist.ts`: `loft`'s colour may now depend on where round the tube a vertex is
(`colour(t, round)`), so one loft can carry stripes along it. The helmet is a loft of seven sections from brow to
tail, 28 round, coloured by `round` for the vents and the rim and by `t` for the tail.

**Cost.** Sixty triangles more for the pack; 303 fps against 308, within the spread. The filmed run had the one
25 ms frame already traced to the display.

**Tried and dropped.** A tail pale from four fifths of the way back: from behind, where only the tail shows, the
helmet read as a white cap.

**Learned.** Colour a shape along the lines it was built on. Stripes painted on a ball's triangles zigzag; the same
stripes on a loft whose columns run front to back are straight for nothing.

## Pass 15: shoes, hands and arms

**Looked at first, and left.** No shadow can be seen under a rider at night, and none could in the map's pass 23
either: the lamps' shadows are dark shapes on dark asphalt. The lamps' light on a rider already falls from above
(the map's pass 9), so the rider's remaining flatness is not that. Neither was changed.

**Before** (`rider-14-start.jpg`): each shoe is a white lozenge, each hand a dark ball on the hood, each arm a tube.

**After** (`rider-15-start.jpg`, `rider-15.jpg`, `rider-15.mp4`): the shoes have a rounded, cupped heel in a darker
colour with a pale tab up its back, a strap over the instep and a dark toe cap; they are deepest at the instep and
widest at the ball. From the race camera the heels, with their tabs, are what shows as the feet turn. Each hand is
a palm lying along the hood in a fingerless glove, fingers curled down over its front and a thumb round its inner
side; the upper arm has its triceps and the forearm is thick below the elbow and narrow at the wrist. The hands and
arms are a small change at this distance.

**What changed.** `course-cyclist.ts`: `shoeShape`'s upper is nine sections, coloured by `t` and `round`; the fist's
ball is three lofts (palm, fingers, thumb); the arm's lofts have their muscles' sections.

**Cost.** A few hundred triangles for the pack; the frame rate is within the spread of the passes before.

**Learned.** What the following camera sees of a foot is its heel. The heel got the detail; the toe got a cap.

## Pass 16: lamp light with a side

**Before** (`rider-15.mp4`): the lamps' light on a rider depends on where the rider is and on whether a surface
faces up or down, and on nothing else: a lamp ahead and a lamp behind light the rider's back alike.

**After** (`rider-16.mp4`; `rider-16.jpg` is five frames of it): a surface that faces the nearest lamp takes up to
45 % more of its light and one that faces away 45 % less. The rider's back brightens as a lamp falls behind and
dims as the next comes up ahead, in step with the pools of light on the road. Where a rider is nearer one kerb than
the other, that side of them is the lit one. On the centre line, between two rows of lamps, the two sides are lit
alike: this pass shows mostly as the light on the rider's back rising and falling, less as a lit and a shaded side.

**What changed.** `lamp-glow.ts`: the slope of the lamps' light across the ground is read from the same grid that
gives the light (four more samples, 1.5 cells apart); its direction is towards the nearest lamp. A rider's lamp-lit
material multiplies the lamps' light by `1 + 0.45 × (the surface's horizontal facing · that direction)`. Only the
riders' materials use it; the map's are as they were.

**Cost.** Four texture samples for each of a rider's pixels: 296 fps against 303, no frame over 20 ms.

**Tried and dropped.** 60 %: at its brightest the jersey washed out.

**Learned.** A map of how much light there is also says where it comes from: its slope points at the lamp. No list
of lamps has to reach the shader.

## Pass 17: wheels that turn

**Checked first.** In pass 16's film the rider seemed, in a small crop, to lean out of a bend. In the whole frame
the road bends right and the rider leans right: the lean is the right way.

**Before** (`rider-16.mp4`): the wheels do not turn. Each wheel's side is a disc of thin spokes, unlit and one grey,
standing still while the bike does 46 km/h.

**After** (`rider-17.mp4`; `rider-17.jpg` is four frames of it a sixtieth of a second apart, enlarged): each wheel
has a deep carbon rim with two pale decals opposite one another and twenty-four laced steel spokes on a hub, lit as
the rest of the bike is, and it turns as the bike covers the road, once in its own circumference. Through a bend,
where the wheels are seen from the side, the decals and spokes are in a different place in every frame. Straight
from behind a wheel is seen edge on and this shows little.

**What changed.**

- `course-cyclist.ts`: `wheelTexture()` (512 px, with holes) is the wheel's side; its disc reaches the tyre; its
  material is a standard one, so the lamps light it. `RiderModel.roll(metres)` turns both discs about their axles
  by `metres / (wheel's radius × the rider's size)`.
- `CourseRenderer.ride` calls `roll` with where the rider is on the road.
- `LampGlow.rider` keeps a material's `alphaTest`, or the lit wheel would have been a solid disc.

**Cost.** None measured: 305 fps, no frame over 20 ms, the same draw calls.

**Known.** At speed the spokes move further in a frame than the gap between them, so they can seem to stand or
creep, as on film. The decals, two to a wheel, read truly.

**Learned.** Something that turns needs a mark on it. Twenty-four alike spokes show no turning; two decals do.

## Pass 18: muscle drawn on the legs

**Regression check first.** The whole end-to-end suite after pass 17: 198 passed, 13 failed, the same 13 that failed
before the riders' work (two of `race-course`, eleven of `race-world-*`).

**Before** (`rider-17.mp4`, `rider-15-start.jpg`): the calves have a calf's outline (pass 13) but their skin is one
flat colour, so from behind, where they fill a good part of the picture, they read as smooth tubes.

**After** (`rider-18-legs.jpg`, the legs enlarged at the start line and on the bridge; `rider-18.jpg`,
`rider-18.mp4`): the calf has a groove down its back between two heads that catch the light, the hollow behind the
knee is in shade with a tendon either side, the Achilles tendon stands pale above the heel with a hollow each side,
and the shin's front is a touch lighter. It moves with the leg, being the leg's own colours.

**What changed.** `course-cyclist.ts`: a rider's palette gains `skinShade` (their skin × 0.74) and `skinLight`
(their skin 14 % towards white); `shinShape` and the bare part of `thighShape` choose among the three by `t` and
`round`, and are 20 round where they were 12 and 14, so the bands are a vertex wide and blend into the skin.

**Cost.** A few hundred triangles for the pack. No texture, no draw call.

**Learned.** Muscle is light and shade before it is shape. Three tones of a skin, placed where the anatomy puts
them, did more for the calf than its outline had.

## Pass 19: a drivetrain

**Before** (`rider-18-legs.jpg`): beside the rear wheel the cassette is a pale cone and the hub a thick pale bar
across the frame, the brightest things on the bike; the cranks are pale too.

**After** (`rider-19-legs.jpg`, `rider-19.jpg`, `rider-19.mp4`): the cassette is seven thin sprockets stepping down
from the wheel, in a darker steel; under it hangs the derailleur, its body behind the axle and its cage forward
with a jockey wheel at each end; the chain is dark and runs over the chainring to the cassette and back from the
lower jockey wheel; each hub is a slim dark shell with its skewer's steel ends showing; the cranks are black.

**What changed.** `course-cyclist.ts`, in `bike()`: the cone is seven discs; the derailleur is three sticks and two
discs; `SPROCKET` and `CHAIN` colours with metal finishes; hubs and cranks in the rim's black.

**Cost.** Some 500 triangles a rider, in the mesh that was already drawn: no draw call.

**Learned.** A stack of thin discs reads as a cassette from every side for less than its cone looked like one. And
the brightest part of a bike should not be its hub.

## Pass 20: the camera at the reference's distance

**Compared first** (`rider-20-compare.jpg`: the rider after pass 19 beside the picture this work aims at, at the
same scale). The build and proportions agree: shoulders to hips, the legs' length and thickness, the head. What
differs is that the reference's rider is about a fifth larger in the frame, is lit by the sun, and throws a shadow.

**After** (`rider-20-start.jpg`, `rider-20.jpg`, `rider-20.mp4`): the camera rides 2.75 m behind and 1.8 m above
the rider (3.3 m and 1.9 m since pass 12), 2.4 m and 1.65 m at the lines, and the picture is raised 0.19 of its
height (0.15). The rider is half the picture's height, as in the reference, with the wheels clear of the panel; the
road ahead, the riders on it and the skyline are still in the frame, the sky having given up the room.

**What changed.** Five constants in `course-renderer.ts`; L2-166 AC9 and the design carry them.

**Cost.** 295 fps against 301: a nearer rider covers more pixels with the riders' more costly material. No frame
over 20 ms. The race's end-to-end specs: the same 13 failures as before the riders' work, no others.

**To weigh.** This is as near as the camera can go and still show the road the rider is about to ride; the sky is
now the top third of the picture where it was nearly half.
