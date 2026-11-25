# Cherry Blossom Festival, D.C. from the saddle

GCN Training’s A Little Bit of Everything retains 59 stages over 40:00. The rider completes five Tidal Basin circuits in 16.853 km with 14 m of accumulated climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Yoshino canopy, 0.08 km | [Before](before-blossoms.jpg) | [After](after-blossoms.jpg) | Pale flowering branches enclose the path. Real 01–06, 11 and games 01–02. |
| Jefferson Memorial, 0.56 km | [Before](before-jefferson.jpg) | [After](after-jefferson.jpg) | The broad dome and white colonnade emerge beside the path. Real 04–06, 14 and game 02. |
| Stone embankment, 1.01 km | [Before](before-seawall.jpg) | [After](after-seawall.jpg) | Close granite coping separates the visitors’ path from the water. Real 01–03, 11–14 and game 04. |
| Boat landing, 1.43 km | [Before](before-boats.jpg) | [After](after-boats.jpg) | The riding view turns toward rentals on the basin. Real 02–05, 14 and game 04. |
| Kite festival, 2.16 km | [Before](before-kites.jpg) | [After](after-kites.jpg) | Stalls line the lawn and ribbons trail from kites over the tents. Real 07–10, 12, 15 and games 03, 05. |
| National Mall, 2.83 km | [Before](before-monument.jpg) | [After](after-monument.jpg) | The Washington Monument rises over the far end of the lawn. Real 01–03, 07, 13 and games 03, 05. |

Two Yoshino crowns and two groups of visitors share an atlas adapted from the project’s Caribana source. The granite joints, surface grain and petals repeat at riding scale. The memorial dome, columns, steps and two-tone obelisk keep their positions on every lap. The fabric kites, ribbons and eight blue paddle boats move on ride time and hold on pause. Choose Sunrise in local Race Setup for a pink sky, softer daylight and reflected light on the water. [Sunrise near the Jefferson Memorial](sunrise-jefferson.jpg). [Credited references](../../worlds/cherryblossom/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Yoshino canopy and memorial shore | 25 m | 0.12 km to 0.95 km | 120.61 | 120.00 | 10.0 ms | 15.3 ms | 53 |
| Kite festival and waterside crowds | 1930 m | 0.12 km to 0.95 km | 120.60 | 120.00 | 9.8 ms | 22.0 ms | 55 |

Reproduce from the frontend workspace with `npm run perf -- cherryblossom-tablet --headed`.
