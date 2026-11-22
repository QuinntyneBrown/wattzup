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
