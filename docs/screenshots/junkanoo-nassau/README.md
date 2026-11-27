# Junkanoo, Nassau from the saddle

Ride Bay Street through all 22 stages of GCN Training’s The Smash Fest. The course covers 12.591 km, climbs 47 m and preserves the 30-minute class and three-second video offset. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Bay Street, 0.08 km | [Before](before-bay-street.jpg) | [After](after-bay-street.jpg) | Shutters, galleries, floodlights and spectators frame the narrow street. Real 07, 11, 13–14, games 01 and 04. |
| Valley Boys, 2.31 km | [Before](before-valley-boys.jpg) | [After](after-valley-boys.jpg) | The golden lead costume, fringed fan and named banner rise above the troupe. Real 01–06, games 02 and 03. |
| Saxons percussion, 4.76 km | [Before](before-drummers.jpg) | [After](after-drummers.jpg) | Players strike the goatskin drums carried in front of their bodies beneath the Saxons banner. Real 03, 04, 09, 10 and 12, games 01 and 03. |
| Parliament Square, 7.24 km | [Before](before-parliament.jpg) | [After](after-parliament.jpg) | White pilasters, pink chambers and the seated statue open up behind the palms. Real 07, 13 and 14, games 01 and 05. |
| Roots, 9.48 km | [Before](before-roots.jpg) | [After](after-roots.jpg) | The shell-shaped lead costume, paper layers, cowbells and group standard stand out against the crowd. Real 02, 05, 06, 08 and 09, games 03 and 05. |
| Prince George Wharf, 12.12 km | [Before](before-wharf.jpg) | [After](after-wharf.jpg) | The quay opens onto ships with rows of lit decks and a pink sky. Real 01, 13 and 15, games 02 and 04. |

The original costume, grandstand and shopfront atlases separate the crowd into three depths. Four bounded instance batches move fringed paper costumes on the ride clock. The largest lead pieces sway, musicians strike goatskin drums, and bell players lift their instruments with a different rhythm. The printed group standards identify the Valley Boys, Saxons and Roots. Waving Bahamian flags, confetti worn into the asphalt, gingerbread railings and the quay distinguish the Nassau street. Past Parliament Square, paper colours give way to the pink harbour dawn. [Credited references](../../worlds/junkanoo/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Floodlit Bay Street | 0 m | 0.12 km to 0.96 km | 120.45 | 119.77 | 9.9 ms | 44.8 ms | 48 |
| Massed drummers and the Saxons lead piece | 4510 m | 0.12 km to 0.95 km | 120.26 | 120.00 | 9.8 ms | 18.6 ms | 57 |

Reproduce from the frontend workspace with `npm run perf -- junkanoo-tablet --headed`.
