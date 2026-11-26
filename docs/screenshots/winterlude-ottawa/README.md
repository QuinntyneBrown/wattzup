# Winterlude, Ottawa from the saddle

Aerobic Efforts With Max Sprints keeps its seventeen stages over 40 minutes and 17.35 km. The outbound and return racing lanes share the same level canal and bridges. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Downtown skateway, 0.14 km | [Before](before-locks.jpg) | [After](after-locks.jpg) | Château Laurier and the Parliament towers rise beyond bare branches and a crowd on groomed ice. Real 01, 06, 08 and games 01, 02. |
| Pretoria Bridge, 2.26 km | [Before](before-pretoria.jpg) | [After](after-pretoria.jpg) | The stone lift towers, dark steel deck and truss underside span the groomed canal. Real 02–05 and game 03. |
| Warming huts, 4.12 km | [Before](before-huts.jpg) | [After](after-huts.jpg) | The ice widens by timber warming huts, a BeaverTails stand and festival tents, with families gliding past. Real 06–09, 13, 14 and games 02, 04. |
| Snow carving terrace, 6.32 km | [Before](before-snow.jpg) | [After](after-snow.jpg) | A large snow bear and owl stand on white plinths above steps and the canal wall. Real 10, 11, 13 and games 01, 04. |
| Dows Lake turn, 7.74 km | [Before](before-dows.jpg) | [After](after-dows.jpg) | The track turns at the lake in clean winter sun. Skate scratches, snowbanks and bare maples lead into the returning lane. Real 06–09 and games 01, 02. |
| Illuminated ice gallery, 11.34 km | [Before](before-ice.jpg) | [After](after-ice.jpg) | Blue and violet lights pick out transparent ice carvings in a shaded festival pavilion. Real 11, 12, 15 and games 04, 05. |

The moving skaters alternate pushes and glides, while the festival pennant and ice uplights follow the ride clock. Original winter trees, downtown skyline and four sculpture designs sit beside native stone walls, lift towers and vendor huts. [Credited references](../../worlds/winterlude/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| downtown skaters | 0 m | 0.12 km to 0.96 km | 90.08 | 90.10 | 17.4 ms | 132.0 ms | 182 |
| festival village | 4020 m | 0.11 km to 0.96 km | 71.32 | 71.32 | 30.1 ms | 234.0 ms | 167 |

Reproduce from the frontend workspace with `npm run perf -- winterlude-tablet --headed`.
