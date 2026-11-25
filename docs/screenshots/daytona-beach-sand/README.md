# Daytona Beach Sand from the saddle

GCN Training’s Drag Race keeps its original 17 stages over 20:00. Tide Line runs 8.375 km on hard-packed Atlantic sand with no climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Starting strand, 0.08 km | [Before](before-tracks.jpg) | [After](after-tracks.jpg) | Morning light on the parallel tyre tracks and wet tide line. Real 01–04 and games 01–02. |
| Beach traffic, 0.71 km | [Before](before-cars.jpg) | [After](after-cars.jpg) | Slow pickups pass the beach access and dunes. Real 01–02 and 06, games 01 and 03. |
| Hilton, 2.33 km | [Before](before-hilton.jpg) | [After](after-hilton.jpg) | The terrace of glass bays and white balcony lines faces the dry sand. Real 04–06, 09–10 and 12, games 03 and 05. |
| Bandshell, 3.48 km | [Before](before-bandshell.jpg) | [After](after-bandshell.jpg) | The ochre arch frames the stage beside the amusement strip. Real 06, 12–13 and 15, games 03–05. |
| Main Street Pier, 3.83 km | [Before](before-pier.jpg) | [After](after-pier.jpg) | Timber piles support the restaurant across the wet shore. The wheel and towers stand inland. Real 03, 07–08, 11 and 13–14, games 01, 03 and 05. |
| Beach patrol, 6.62 km | [Before](before-towers.jpg) | [After](after-towers.jpg) | Lifeguard huts, beach furniture and strollers follow the Atlantic shore. Real 01–04, 09–10 and 12, games 01–02. |

The stepped Hilton balconies, arched Bandshell and timber Main Street Pier have physical positions along the beach. The original ridge of sea oats, pools of umbrellas and walking beachgoers, foam and stock cars carry forward the low-memory approach praised in rider feedback #905. The beach access signs share artwork. The paired canvas loungers share geometry. Like Caribana’s parade vehicles the slow pickups advance on the ride clock. The wheel has 24 instanced gondolas beside two open-lattice Sky Coaster pylons. The gaps between these coastal landmarks are condensed to the workout. [Credited references](../../worlds/daytona/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Tide-line tracks and beach traffic | 45 m | 0.12 km to 0.95 km | 120.00 | 119.84 | 10.2 ms | 24.1 ms | 187 |
| Bandshell, wheel and Main Street Pier | 3370 m | 0.12 km to 0.95 km | 120.05 | 119.93 | 10.3 ms | 28.1 ms | 186 |

Reproduce from the frontend workspace with `npm run perf -- daytona-tablet --headed`.
