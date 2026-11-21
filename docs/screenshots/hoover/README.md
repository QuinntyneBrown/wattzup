# Hoover Dam rendering

The live 3D world behind the ride HUD for [30 Minutes of Threshold Power](http://localhost:4200/classes/30-minutes-of-threshold-power?simulate), which rides the dam road. Until #940 it had no scene of its own and drew the placeholder look; the rider called it terrible. It is now built on the shared street kit (`world-kit.ts`) on the pattern of Old Town Criterium: one module, `world-hoover.ts`, with `build`, `lay`, `place`, `setTime` and `sink`, seeded detail, canvas textures, the kit's `Figures` for the visitors, and a loop that recycles the crest. Each capture is the same opening frame of the ride at 1440 × 900 on Three.js's WebGL2 backend, and each iteration is merged in its own pull request.

| Capture | Change and observed result | Render quality |
| --- | --- | --- |
| [001 · The crest road](001-the-crest-road.jpg) | The first Hoover Dam scene. The riders ride the crest road's double yellow line between raised sidewalks and the cream art deco parapets, bronze lamp standards every 24 m and visitors leaning on the wall. On the right the fluted intake towers rise from Lake Mead, a clock turned to the road, under the canyon wall's white bathtub ring; on the left the dark wall of the Black Canyon. Ahead, the bypass bridge's arch and columns cross the canyon under jagged volcanic peaks. In the first takes the far peaks were boxes that read as a city skyline, and the lake, 480 m wide on the inside of the bend, folded into rows like stadium seating; the peaks are now cones and the lake and its ringed wall are kept narrow. | 70% |

## Reproducing a capture

Build the app (`npm run build` in `frontend/`), serve `dist/wattzup/browser` on port 4300 with `node scripts/serve-dist.mjs 4300`, open `/classes/30-minutes-of-threshold-power?simulate`, click **Ride in Hoover Dam**, wait for `/world`, let the scene settle for eight seconds and capture the viewport at 1440 × 900.
