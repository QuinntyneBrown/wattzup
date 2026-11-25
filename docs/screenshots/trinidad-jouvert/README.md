# Trinidad J'Ouvert from the saddle

Frederick Street follows the 17 original stages of GCN Training’s Quick But Brutal HIIT class. The 6.275 km ride climbs 42 m in 15:00, with the original three-second video offset. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Frederick Street, 0.08 km | [Before](before-frederick.jpg) | [After](after-frederick.jpg) | Shop windows, iron rails and balconies beneath the street lamps. Real 01, 07 and 12–15, games 01 and 05. |
| Blue devils, 1.43 km | [Before](before-devils.jpg) | [After](after-devils.jpg) | Horns, paint and swinging chains distinguish the Jab Jab band. Real 02 and 04–06, games 01–02. |
| Sound truck, 2.68 km | [Before](before-truck.jpg) | [After](after-truck.jpg) | Baffled speakers and a box cab move along the parade route. Real 04–07 and 12, games 02–03. |
| Steelband, 3.67 km | [Before](before-pans.jpg) | [After](after-pans.jpg) | Players raise their mallets above paired metal pans on wheeled frames. Real 03 and 08, game 03. |
| Woodford Square, 4.82 km | [Before](before-red-house.jpg) | [After](after-red-house.jpg) | Pilasters, window bays and a central pediment face the lawn. Real 07, 09–11 and 13–15 inform Port of Spain’s civic scale, game 04 the framing. |
| Northern Range, 5.93 km | [Before](before-dawn.jpg) | [After](after-dawn.jpg) | The street opens to tropical trees and the fixed hills. Real 06, 07, 12–15, games 04–05. |

An original storefront atlas follows each balcony bay. The Northern Range stays on the horizon behind the lamps and mas bands. The speakers ride on a moving lorry, blue devils swing their chains, and players strike double pans on wheeled racks. All three follow the ride clock. The nearest revellers leave extra clearance through sprint efforts. The Caribbean crowd photographs informed the lighting and spacing, with Trinidad’s steelpan reference guiding the shape of the instruments. [Credited references](../../worlds/jouvert/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Pre-dawn Frederick Street | 0 m | 0.11 km to 0.95 km | 120.19 | 120.00 | 10.0 ms | 24.0 ms | 43 |
| Crowd around the soca truck and pan side | 2490 m | 0.12 km to 0.95 km | 120.39 | 119.98 | 9.8 ms | 26.8 ms | 50 |

Reproduce from the frontend workspace with `npm run perf -- jouvert-tablet --headed`.
