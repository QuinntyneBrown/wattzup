# Sixth Street, Austin from the saddle

Choose Sixth Street, Austin in Map Select. The 39 original GCN Training stages of *Get Pumped With Grace* run for 33:40 on ten laps of a flat 1.545 km circuit. Each lap passes the same festival stages, Brazos Street corner and East Sixth murals. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Driskill approach, 0.08 km | [Before](before-brazos.jpg) | [After](after-brazos.jpg) | Stone arches, balconies, cornices and packed sidewalks. Real 01, 03, 07, 10 and 11, games 01 and 03. |
| Ritz block, 0.37 km | [Before](before-ritz.jpg) | [After](after-ritz.jpg) | Vertical red sign, illuminated entrances and SXSW street banner. Real 02 and 08, game 02. |
| Open stage, 0.64 km | [Before](before-festival.jpg) | [After](after-festival.jpg) | Guitar, singer, drums and revellers behind crowd-control barriers. Real 01, 02 and 14, game 04. |
| East Sixth, 1.12 km | [Before](before-east.jpg) | [After](after-east.jpg) | Painted walls and lit entrances appear past the festival vehicles. Real 09, 12, 13 and 15, game 05. |
| Downtown turn, 2.08 km | [Before](before-skyline.jpg) | [After](after-skyline.jpg) | The older commercial streets meet the distant contemporary towers. Real 03, 04 and 11, games 01 and 04. |
| Final lap, 15.38 km | [Before](before-finish.jpg) | [After](after-finish.jpg) | Crosswalks, street lamps, star wires and cross-street light trails frame the return toward Brazos. Real 04–06 and 10, game 03. |

The old commercial fronts and hotel balconies stand under a fixed downtown skyline. Recessed club doors, lit letters and individual bulbs colour the pavement. Shared instance geometry draws guitarists, drummers, vocalists and festival crowds from ride time. Pausing holds the strumming hand. The Texas stars, street lamps, shutters, crosswalks, food trucks and pedicabs share baked batches. [Credited references](../../worlds/austin/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Brazos and the Ritz | 0 m | 0.12 km to 0.95 km | 120.31 | 120.00 | 9.7 ms | 18.9 ms | 109 |
| Live stages and crowds | 594 m | 0.12 km to 0.95 km | 120.10 | 119.98 | 9.7 ms | 18.5 ms | 109 |

Reproduce from the frontend workspace with `npm run perf -- austin-tablet --headed`.
