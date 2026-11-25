# Cliffside Coast from the saddle

Headland Road retains the catalogue’s 30-minute, 17-stage interval ride, the Prairie Paceline unlock, 32 km and 410 m of climbing. Every elevation sample matches the previous course. The five matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Opening, 0.08 km | [Before](before-opening.jpg) | [After](after-opening.jpg) | The first sweeping bend introduces the warm light and the seaward wall. Real 01–04, 08–10 and games 01–02. |
| First lookout, 0.65 km | [Before](before-lookout.jpg) | [After](after-lookout.jpg) | A widened verge breaks the railing above the sea. Real 13–15, games 01 and 03. |
| Cove and viewpoint, 2.40 km | [Before](before-cove.jpg) | [After](after-cove.jpg) | Parked cars and walkers overlook tidal stacks and the next point. Real 03, 05–10 and games 04–05. |
| First surge crest, 6.21 km | [Before](before-crest.jpg) | [After](after-crest.jpg) | The rising tarmac separates the grass bank from the sea. Real 01–04 and 13–15, games 01, 03. |
| Lantern headland, 9.81 km | [Before](before-tower.jpg) | [After](after-tower.jpg) | The white tower rises on the seaward point. Real 11–12, game 02. |

The road follows one shore eastbound, with the drop and tide on its right. Layered sandstone extends from the dark waterline to turf-topped stacks. Gorse and heather punctuate the inland bank. Stone coping alternates with galvanised guardrails. The headlands, tapered lighthouse and lantern occupy fixed positions. Caribana’s active foreground and fixed skyline informed the separation between the walkers, foam and distant points. At the lookouts the cars have sloping windscreens, pillar divisions, mirrors and wheel hubs. A single batch covers the visible surf and advances on ride time. The near parapet can hide the cliff foot between viewpoints. [Credited references](../../worlds/coast/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Opening cliff road | 25 m | 0.12 km to 0.95 km | 119.55 | 119.06 | 9.8 ms | 163.1 ms | 29 |
| Lookout and headland | 580 m | 0.12 km to 0.95 km | 120.14 | 119.97 | 10.3 ms | 16.0 ms | 29 |

Reproduce from the frontend workspace with `npm run perf -- coast-tablet --headed`.
