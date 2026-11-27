# Tel Aviv Promenade from the saddle

GCN Training’s 30 Second Sprint Intervals retains the original thirteen stages, 24:00 duration and three-second video offset. The 10.70 km promenade climbs 2 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Herbert Samuel promenade, 0.12 km | [Before](before-tayelet.jpg) | [After](after-tayelet.jpg) | The red bike lane passes circles of cream and brown stone. Date palms cast long shadows between the path and the white hotel balconies. Real 01–05 and 07. Games 01 and 03.. |
| Gordon Pool and marina, 2.08 km | [Before](before-pool.jpg) | [After](after-pool.jpg) | Lane ropes stripe an open-air swimming pool. Masts and bobbing sailboats rise beyond its fence inside the rock breakwater. Real 04, 07, 12 and 15. Games 01 and 02.. |
| Frishman Beach courts, 4.25 km | [Before](before-courts.jpg) | [After](after-courts.jpg) | A volleyball crosses a net on the sand while a pair plays matkot nearer the water. Ochre lifeguard huts and tall lamps overlook the courts. Real 06, 08 and 09. Games 02 and 04.. |
| Beachfront cafés, 6.47 km | [Before](before-cafes.jpg) | [After](after-cafes.jpg) | Timber shade pergolas, parasols, sunbeds and café tables face the sea. White apartment and hotel towers rise behind the palms. Real 01, 03, 09, 10 and 14. Games 01, 03 and 05.. |
| Banana Beach, 8.36 km | [Before](before-sunset.jpg) | [After](after-sunset.jpg) | Turquoise surf breaks over warm sand as the setting sun reflects on the Mediterranean. The stone Jaffa headland marks the southern end of the coast. Real 09–14. Games 03 and 04.. |
| Old Jaffa, 10.41 km | [Before](before-jaffa.jpg) | [After](after-jaffa.jpg) | The clock tower, St Peter’s bell tower and stepped sandstone buildings stand above the beach ahead, behind benches and promenade lamps. Real 10–13. Games 02 and 05.. |

A red cycle lane follows patterned stone circles between date palms, hotel elevations and the sea. Gordon Pool, its marina, the beach courts and the coastal café line up along the Tayelet. The sailboats, volleyball, matkot and surf move on ride time. The Jaffa headland stays fixed beyond them, following Caribana’s foreground and skyline separation. [Credited references](../../worlds/telaviv/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Herbert Samuel promenade | 0 m | 0.12 km to 0.96 km | 120.16 | 119.98 | 10.3 ms | 17.9 ms | 56 |
| Frishman Beach courts | 4030 m | 0.12 km to 0.95 km | 119.63 | 119.57 | 9.8 ms | 107.5 ms | 161 |

Reproduce from the frontend workspace with `npm run perf -- telaviv-tablet --headed`.
