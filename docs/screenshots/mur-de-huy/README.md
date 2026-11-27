# Mur de Huy from the saddle

GCN Training’s Sprints for Climbing retains 26 stages over 26 minutes with the original three-second offset. Repeated ascents cover 11.2 km and climb 534 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Lower town, 0.08 km | [Before](before-houses.jpg) | [After](after-houses.jpg) | Terraces crowd the foot of the climb. Dark wheel tracks and worn white names lead into the lane. Real 06, 09 and 10. Games 02 and 05.. |
| Chemin des Chapelles, 2.34 km | [Before](before-chapelle.jpg) | [After](after-chapelle.jpg) | A white roadside oratory sits inside the chicane. Its pointed roof and recessed niche stand clear of the passing riders. Real 01, 04 and 08. Games 01 and 04.. |
| Steepest bend, 4.81 km | [Before](before-wall.jpg) | [After](after-wall.jpg) | The 26% pitch tips the painted tarmac upward between steel crowd barriers. Spectators reach over the outside rail. Real 02–05, 07 and 13. Games 01 and 05.. |
| Meuse valley, 6.53 km | [Before](before-meuse.jpg) | [After](after-meuse.jpg) | The road shoulder opens above the Meuse and Huy rooftops. The fort rises from its rocky bluff beside the river. Real 14 and 15. Game 03.. |
| Wooded slope, 8.80 km | [Before](before-canopy.jpg) | [After](after-canopy.jpg) | Leafy branches arch over the riders while damp patches break up the spring light on the lane. Real 03, 06, 07 and 12. Games 01 and 04.. |
| Notre-Dame de la Sarte, 10.82 km | [Before](before-sarte.jpg) | [After](after-sarte.jpg) | The summit finish arch frames the lane beside the church. Flags and spectators line the approach. Real 01, 04 and 11. Games 02 and 05.. |

A narrow road rises between Walloon brick and stone terraces. Painted rider names lead past the white oratories and a climbing cyclist to the 26% bend. A Belgian flag ripples behind the barriers, the Meuse and citadel appear below and a spectator applauds beside the summit finish at Notre-Dame de la Sarte. [Credited references](../../worlds/murdehuy/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Lower town terraces | 0 m | 0.12 km to 0.95 km | 120.15 | 119.80 | 9.8 ms | 39.0 ms | 34 |
| Crowd on the steepest bend | 4740 m | 0.12 km to 0.95 km | 119.54 | 119.31 | 10.1 ms | 127.8 ms | 46 |

Reproduce from the frontend workspace with `npm run perf -- murdehuy-tablet --headed`.
