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
