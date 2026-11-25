# Neon Docklands from the saddle

Choose Neon Docklands in Map Select for the Harbour Bridges Loop. The existing 21.6 km course climbs 120 m over 30:00. All 17 stages retain their timing, including the eight 30-second efforts. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Opening quay, 0.08 km | [Before](before-quay.jpg) | [After](after-quay.jpg) | Wet asphalt, mooring furniture and port skyline. Real 05 and 09, games 01 and 03. |
| Warehouse promenade, 1.32 km | [Before](before-warehouses.jpg) | [After](after-warehouses.jpg) | Brick loading bays, awnings and umbrella walkers. Real 06–08 and 14–15, games 01 and 05. |
| Single-pylon crossing, 4.05 km | [Before](before-swan.jpg) | [After](after-swan.jpg) | Inclined steelwork and illuminated stays draw on real 01 and 10. Games 02 and 04 informed the approach. |
| Twin blades, 6.50 km | [Before](before-piers.jpg) | [After](after-piers.jpg) | The Bolte lighting and the separation of its towers follow real 02–05. Game 03 informed the riding scale. |
| Passenger terminal, 8.17 km | [Before](before-terminal.jpg) | [After](after-terminal.jpg) | Passenger windows, quay lighting and moored vessels draw on real 09 and 11–12, with skyline depth from game 05. |
| Lattice span, 10.78 km | [Before](before-webb.jpg) | [After](after-webb.jpg) | Arched steel ribs follow the deck over the harbour. Real 13 and games 02 and 04 informed the silhouette. |

The first bridge has splayed legs and a single inclined cable mast. Pairs of tall detached blades mark the Bolte crossings, and a steel lattice follows the arch of the Webb crossing. The working quays add gabled loading bays, lit awnings and passenger decks beside the schooner. The ferry rolls at its berth and the umbrella walkers move on ride time. The centre line, stage definitions, duration and total climb match the previous course file. [Credited references](../../worlds/docklands/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Warehouse quay and waterfront bars | 60 m | 0.12 km to 0.95 km | 119.04 | 118.82 | 10.9 ms | 190.9 ms | 51 |
| Cruise terminal to the third bridge | 8150 m | 0.14 km to 0.96 km | 118.95 | 118.89 | 11.6 ms | 87.7 ms | 46 |

Reproduce from the frontend workspace with `npm run perf -- docklands-tablet --headed`.
