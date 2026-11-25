# Beach Road, Melbourne from the saddle

Choose Beach Road, Melbourne in Map Select. The 48 original stages of GCN’s *45 Minute Sprint Training* take 45:50 on a 19.613 km bayside course with 17 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| St Kilda Pier, 0.19 km | [Before](before-pier.jpg) | [After](after-pier.jpg) | The pile-supported deck and pavilion extend into Port Phillip Bay. Real 05, 06 and 10, game 02. |
| Brighton, 0.87 km | [Before](before-brighton.jpg) | [After](after-brighton.jpg) | Striped beach boxes line the foreshore with distant Melbourne towers above. Real 03, 04, 07 and 09, game 01. |
| Club bunch, 1.69 km | [Before](before-bunch.jpg) | [After](after-bunch.jpg) | Cyclists in three kits ride beside the marked bike lanes. Real 01, 02 and 13 establish bayside proportions, game 03 the pack sightline. |
| Clifftop path, 3.69 km | [Before](before-path.jpg) | [After](after-path.jpg) | The winding shared path and its lamps follow the low bluff. Real 10, 13 and 15, game 04. |
| Ricketts Point, 7.93 km | [Before](before-shelves.jpg) | [After](after-shelves.jpg) | Low sandstone shelves emerge along the shallow margin. Real 11 and 12, game 05. |
| Pier at sunset, 18.63 km | [Before](before-sunset.jpg) | [After](after-sunset.jpg) | The sun and its reflection sit over the bay on the final bend. Real 08 and 14, games 02 and 04. |

Six club cyclists rotate through two lines ahead of the rider. The ride clock drives their turns and holds the group on pause. The Brighton huts have individually painted doors and timber gables. Kiosk windows, pier lamps, weathered lane paint, branching tea-tree and tidal shelves provide foreground detail. The skyline stays fixed across Port Phillip Bay, and the water reflects the evening light on the final approach. [Credited references](../../worlds/beachroad/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| St Kilda Pier and Brighton | 0 m | 0.12 km to 0.95 km | 119.47 | 119.39 | 10.4 ms | 95.0 ms | 57 |
| Brighton club bunch | 790 m | 0.12 km to 0.95 km | 120.30 | 120.00 | 9.6 ms | 14.2 ms | 57 |

Reproduce from the frontend workspace with `npm run perf -- beachroad-tablet --headed`.
