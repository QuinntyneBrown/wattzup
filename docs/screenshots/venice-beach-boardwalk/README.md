# Venice Beach Boardwalk from the saddle

GCN Training’s 10 On 20 Off Max Sprints retains its original 41 stages, seventeen minutes and three-second video offset. The separately paved bike path runs 6.95 km beside Ocean Front Walk. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Muscle Beach, 0.14 km | [Before](before-muscle.jpg) | [After](after-muscle.jpg) | The lifting platforms and steel exercise frames sit inside the open gym fence. Ocean Front Walk runs beside the bike path. Real 01, 04–05 and games 01, 03. |
| Ocean Front Walk, 1.32 km | [Before](before-arcades.jpg) | [After](after-arcades.jpg) | Painted arcades, souvenir racks and awnings alternate behind a separate pedestrian promenade. Palm trunks frame the sprints. Real 02–03, 05–07, 09 and game 03. |
| Venice Skatepark, 2.64 km | [Before](before-bowls.jpg) | [After](after-bowls.jpg) | Skaters carve through connected concrete bowls below metal coping. Roller skaters pass on the promenade. Real 10–11 and games 02, 05. |
| Venice Art Walls, 3.81 km | [Before](before-walls.jpg) | [After](after-walls.jpg) | Original painted concrete walls step down to the sand. Buskers play beside benches and strolling spectators. Real 08–09, 12 and games 01, 04. |
| Lifeguard tower, 5.11 km | [Before](before-tower.jpg) | [After](after-tower.jpg) | A raised blue lifeguard tower faces breaking Pacific surf beyond broad sand. The mountains recede into summer haze. Real 02, 10, 14–15 and game 02. |
| Santa Monica Pier, 6.77 km | [Before](before-pier.jpg) | [After](after-pier.jpg) | The Pacific Park wheel turns above the timber pier, with the coaster rails and the wooden piles visible along the waterline. Real 13–15 and games 02, 04. |

Original shop facades, murals, palms, skaters and musicians follow the local references. The native gym cage, curved skate bowls, blue towers and pile-supported pier are anchored along the coast. The skaters carve, the guitarist strums and the gondolas turn on the ride clock. [Credited references](../../worlds/venice/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Muscle Beach and market | 0 m | 0.11 km to 0.95 km | 119.68 | 119.50 | 10.4 ms | 99.7 ms | 68 |
| Skatepark bowls | 2450 m | 0.12 km to 0.96 km | 117.48 | 117.39 | 11.2 ms | 233.4 ms | 73 |

Reproduce from the frontend workspace with `npm run perf -- venice-tablet --headed`.
