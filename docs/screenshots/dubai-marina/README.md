# Dubai Marina from the saddle

Choose Dubai Marina in Map Select to ride the 14 stages of Sprint Into the Effort from GCN Training. The 20-minute course follows 8.600 km of waterfront with 3 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Marina Walk, 0.08 km | [Before](before-walk.jpg) | [After](after-walk.jpg) | The opening runs between the crowd barriers at the edge of the canal. Real 01–03 and 11–13, games 02 and 04. |
| Cayan Tower, 0.78 km | [Before](before-cayan.jpg) | [After](after-cayan.jpg) | The twisting tower rises beyond the paving and waterfront palms. Real 05–06 and 14–15, game 01. |
| Marina pontoons, 1.65 km | [Before](before-pontoons.jpg) | [After](after-pontoons.jpg) | Yachts and the dhow occupy the water side of the promenade. Real 04–05 and 07, game 05. |
| Sprint crowds, 3.43 km | [Before](before-podium.jpg) | [After](after-podium.jpg) | Spectators gather beside the cafés below pennants and lit towers. Real 11–15, games 02 and 04. |
| Canal crossing, 5.64 km | [Before](before-bridge.jpg) | [After](after-bridge.jpg) | The crossing opens a view along the water. Real 01–03 and 08–10, game 05. |
| Bluewaters, 7.76 km | [Before](before-wheel.jpg) | [After](after-wheel.jpg) | The wheel is visible above the low roofs ahead of the rider. Game 03 supplies the silhouette, real 01–03 the waterfront context. |

Cayan Tower and Ain Dubai have fixed positions beyond the near promenade, using the same separation between foreground crowds and distant landmarks as Caribana. Marina Walk combines limestone paving, retail fronts and race barriers. The timber dhow moves on ride time, with yachts moored along the canal. The route compresses the marina and Bluewaters into one workout. [Credited references](../../worlds/dubai/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Cayan Tower and the entrance promenade | 50 m | 0.12 km to 0.95 km | 120.31 | 120.00 | 9.7 ms | 15.9 ms | 92 |
| Marina Walk cafés and sprint crowds | 3300 m | 0.12 km to 0.95 km | 120.29 | 120.00 | 9.8 ms | 18.6 ms | 105 |

Reproduce from the frontend workspace with `npm run perf -- dubai-tablet --headed`.
