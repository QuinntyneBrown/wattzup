# Joshua Tree from the saddle

Park Boulevard preserves all thirteen stages of GCN Training’s Ramp Session: Dialling In Your Training Zones, including 55:00 of riding and the three-second video offset. The native road covers 23.625 km and climbs 272 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Park Boulevard, 0.08 km | [Before](before-boulevard.jpg) | [After](after-boulevard.jpg) | A narrow two-lane road passes Joshua trees and dry creosote scrub. Real 03–05, 07, 10–12 and games 02 and 05. |
| Hidden Valley, 4.25 km | [Before](before-hidden-valley.jpg) | [After](after-hidden-valley.jpg) | A climber reaches for a hold above the belayer and trailhead pull-out. Real 02, 08 and 13 and games 01 and 03. |
| Skull Rock, 9.78 km | [Before](before-skull-rock.jpg) | [After](after-skull-rock.jpg) | The eye sockets and nose darken the near face of the sunlit monzogranite. Real 02, 06 and 13 and game 03. |
| Jumbo Rocks, 12.37 km | [Before](before-jumbo-rocks.jpg) | [After](after-jumbo-rocks.jpg) | Tents, picnic tables and parked cars occupy spaces between the boulder piles. Real 01, 08 and 13 and games 03 and 04. |
| Cholla Cactus Garden, 17.63 km | [Before](before-cholla.jpg) | [After](after-cholla.jpg) | The cholla with fine pale spines replace tall Joshua trees beside the road. Real 09 and 15 and games 02 and 04. |
| Little San Bernardino Mountains, 22.31 km | [Before](before-range.jpg) | [After](after-range.jpg) | The fixed purple ridgelines stand above the sandy basin, with near yuccas passing against them. Real 04, 05, 10, 14 and 15 and game 05. |

Native monzogranite blocks use an original mineral texture. Two sockets and a nasal cavity are carved into the roadside face of Skull Rock. The bolted climbing faces have a visible crack and a rope linking the climber, top anchor and belayer. Both people use race time and hold still on pause. Like Caribana’s distant skyline, the original Little San Bernardino panorama stays fixed beyond nearby rock formations. The yuccas and cholla use a shared original botanical atlas, while rock, plants and campsites stay anchored to the grade. [Credited references](../../worlds/joshuatree/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Park Boulevard through the Joshua trees | 0 m | 0.12 km to 0.95 km | 120.38 | 119.97 | 9.8 ms | 19.6 ms | 44 |
| Jumbo Rocks campground and climbing walls | 12050 m | 0.12 km to 0.95 km | 120.21 | 119.82 | 9.8 ms | 57.7 ms | 54 |

Reproduce from the frontend workspace with `npm run perf -- joshuatree-tablet --headed`.
