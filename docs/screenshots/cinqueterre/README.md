# Cinque Terre rendering

The live 3D world behind the ride HUD for [3 Mins On, 2 Mins Off](http://localhost:4200/classes/3-mins-on-2-mins-off?simulate), which rides the corniche. The world follows its description: cliffside villages in pastel colours above the Ligurian Sea. It is built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-cinqueterre.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the walkers, and a loop that recycles the corniche. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture                                    | Change and observed result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Render quality |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| [001 · The corniche](001-the-corniche.jpg) | The first Cinque Terre scene, on a warm, clear afternoon in early autumn. The riders roll along the narrow corniche cut into the cliff, with a stone parapet and agaves on the seaward side and the deep blue Ligurian Sea below. Ahead on the left, a village of pastel houses with green shutters is stacked on its rock spur down to the water, its bell tower rising above the roofs. Umbrella pines lean over the road. Inland, vineyard terraces on drystone walls climb the hillside in steps, bougainvillea spills over the bank, and walkers follow the coastal path. Earlier takes hid the villages behind the parapet and a headland, and drew the bougainvillea as pink boulders. The village is small in the frame, and the fog fades its pastels. | 80%            |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/3-mins-on-2-mins-off?simulate`, click **Ride in Cinque Terre**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.

## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [046 · The coast and its villages stand still](bend-046-coast-stands.jpg) | The Ligurian sea, the headlands and the villages on them were bent vertex by vertex with the corniche's 40° bends, so the coast swung and squeezed with each turn above it. It now stands beyond the road unbent, as the panorama does, and the props behind the rider stand on the road there instead of at the height under the rider. |

## The course

Cinque Terre as a map built in Blender (ADR 0034, `tools/blender/themes.py`'s `cinqueterre`), raced from the catalogue with the chase camera
Ibiza Sunset Strip uses. Each capture is the course bench's picture (`tools/course-bench`), and each row names which of the ten
critical details in `docs/worlds/cinqueterre/README.md` the change works on. The frame rate is the bench's at the Low tier with the
processor slowed four times, its stand-in for a low-power tablet, on a 120 Hz display.

| Capture | Detail | Change | Low tier, 4× slowed |
| --- | --- | --- | --- |
| [000 · The bare corniche](course-000-the-bare-corniche.jpg) | 3 The corniche road | The first build: the 17.1 km road of 3 Mins On, 2 Mins Off bends above the sea and climbs with its efforts, behind a low stone parapet on the seaward shoulder. Nothing else stands on the land yet. | 120 fps, 37,779 triangles, 35 draw calls |
| [001 · Golden light](course-001-golden-light.jpg) | 10 Golden Italian light | The sky was a flat grey-blue and the haze swallowed the road. It is now pale and warm at the horizon and deep azure overhead, the sun higher and warmer, the sea a deeper blue-green, the asphalt and the hillside in the colours of the reference photographs. The theme moved into a module of its own, `tools/blender/cinqueterre.py`. | 120 fps, 48,009 triangles, 41 draw calls |
| [002 · Capstones on the parapet](course-002-capstones.jpg) | 3 The corniche road | The seaward wall was one plain block. It is now a wall of coursed stone under paler, worn capstones that overhang it, with a squat capped pier every 32 m and a slot at its foot now and then to let the rain off the road. | 120 fps, 48,833 triangles, 43 draw calls |
