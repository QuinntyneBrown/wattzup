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
