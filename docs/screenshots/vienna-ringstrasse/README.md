# Vienna Ringstrasse from the saddle

The 35 Minute Threshold HIIT class repeats the 5.3 km Ringstrasse circuit across 14 km and ten stages. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Wiener Staatsoper, 0.14 km | [Before](before-oper.jpg) | [After](after-oper.jpg) | The opera loggia and copper roof rise across the tram rails. A red and ivory tram runs beside the rider. Real 01, 08, 13, 14 and games 01, 05. |
| Maria-Theresien-Platz, 1.19 km | [Before](before-museen.jpg) | [After](after-museen.jpg) | The twin museum domes flank the bronze Maria Theresa monument beyond a tree-lined forecourt. Real 03, 04, 05, 14 and games 02, 04. |
| Parliament and Athena, 2.02 km | [Before](before-parlament.jpg) | [After](after-parlament.jpg) | The white Greek portico stands above broad steps. The Athena fountain plays beneath a gilded figure. Real 02, 11, 12, 15 and games 02, 04. |
| Rathaus and Burgtheater, 2.55 km | [Before](before-rathaus.jpg) | [After](after-rathaus.jpg) | The pointed Rathaus tower and smaller pinnacles face the projecting Burgtheater facade across the Ring. Real 02, 09, 10 and games 01, 05. |
| Votivkirche approach, 3.12 km | [Before](before-votiv.jpg) | [After](after-votiv.jpg) | Two narrow openwork spires rise beyond the trees and overhead tram wires. Real 03, 05, 09, 10 and games 01, 04. |
| Stadtpark boulevard, 4.71 km | [Before](before-park.jpg) | [After](after-park.jpg) | The path follows mature trees and the park fence. A commuter rolls past as trams continue around the Ring. Real 03-07 and games 03, 05. |

Original elevations show the opera, museum fronts, Rathaus and Votivkirche. The tram follows its rails, a cyclist pedals by Stadtpark and the Athena fountain plays in front of Parliament. [Credited references](../../worlds/vienna/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Opera tram tracks | 0 m | 0.12 km to 0.95 km | 116.23 | 116.19 | 12.0 ms | 90.1 ms | 101 |
| Parliament and Rathaus | 1900 m | 0.12 km to 0.95 km | 115.88 | 115.88 | 12.0 ms | 157.3 ms | 88 |

Reproduce from the frontend workspace with `npm run perf -- vienna-tablet --headed`.
