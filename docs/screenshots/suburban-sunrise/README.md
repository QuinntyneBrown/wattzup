# Suburban Sunrise from the saddle

GCN Training’s 15 Minute Cardio Workout at Home retains all sixteen stages, the 15:00 duration and the three-second video offset. Maple Avenue covers 6.575 km and climbs 12 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Maple canopy, 0.12 km | [Before](before-maples.jpg) | [After](after-maples.jpg) | Warm dawn light catches mature maple leaves above the narrow lane. Parked family cars, long tree shadows and overhead wires frame the rider. Real 01–04 and 10. Games 01 and 04.. |
| Porch row, 1.19 km | [Before](before-porches.jpg) | [After](after-porches.jpg) | Two-storey clapboard houses sit back from the curb behind mown lawns. Three wooden steps lead to each columned porch; a mailbox stands at a driveway. Real 05–08 and 12. Games 02 and 03.. |
| Lawn sprinklers, 2.46 km | [Before](before-sprinkler.jpg) | [After](after-sprinkler.jpg) | Small sprinklers sweep glittering arcs of droplets across a dewy lawn and adjoining concrete sidewalk. The grass strip breaks at a driveway. Real 04, 07, 13 and 14. Games 01 and 03.. |
| Newspaper delivery, 3.73 km | [Before](before-paper.jpg) | [After](after-paper.jpg) | A delivery cyclist follows the curb with a stack of folded papers. One rolled paper arcs from the moving rider toward a porch lawn. Real 01, 03, 06 and 12. Games 02 and 04.. |
| The waking block, 4.91 km | [Before](before-neighbours.jpg) | [After](after-neighbours.jpg) | A neighbour raises a coffee cup and waves from a porch. A jogger and dog walker pass a fire hydrant and a basketball hoop farther along the sidewalk. Real 05, 08, 11 and 12. Games 03 and 05.. |
| Cul-de-sac loop, 6.35 km | [Before](before-loop.jpg) | [After](after-loop.jpg) | The pavement widens and the course bends around the end of the cul-de-sac. Cars, stop signs and wooden poles outline the return under a pink-orange sky. Real 08–10, 14 and 15. Games 01 and 05.. |

Maple crowns shade the curb and porches above the lawns. A delivery cyclist throws a folded newspaper, a lawn sprinkler sweeps toward the sidewalk and a neighbour waves. A continuous ground surface keeps the turning loop above the grass. Caribana’s distinction between the moving foreground and fixed skyline guides the trees, street furniture and distant dawn. [Credited references](../../worlds/suburbia/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| the opening maple canopy | 0 m | 0.12 km to 0.96 km | 120.28 | 120.00 | 9.9 ms | 14.3 ms | 60 |
| the newspaper delivery | 3500 m | 0.12 km to 0.95 km | 119.87 | 119.45 | 9.9 ms | 162.4 ms | 75 |

Reproduce from the frontend workspace with `npm run perf -- suburbia-tablet --headed`.
