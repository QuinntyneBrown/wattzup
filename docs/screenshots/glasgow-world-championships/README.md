# Glasgow World Championships from the saddle

Choose Glasgow World Championships in Map Select for the 48-corner road circuit. GCN Training’s VO2 Max Race Simulation retains all 16 stages across 30:00. The 13.1 km lap climbs 91 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| George Square, 0.08 km | [Before](before-square.jpg) | [After](after-square.jpg) | The civic tower rises beyond the stone monuments. Real 05–07 and 14–15, games 01 and 05. |
| Sandstone terraces, 1.38 km | [Before](before-tenements.jpg) | [After](after-tenements.jpg) | Tenement bays follow the road up to the turn. Real 08–11, 13 and game 03. |
| Merchant City, 3.54 km | [Before](before-merchant.jpg) | [After](after-merchant.jpg) | Stone shopfronts and crossing paint line the wet street. Real 02, 08–12, games 03–05. |
| Royal Exchange Square, 6.18 km | [Before](before-wellington.jpg) | [After](after-wellington.jpg) | The mounted figure and orange cone stand in front of the gallery columns. Real 05–07 and 14 inform monument scale, game 03 the approach. |
| Championship crowds, 9.24 km | [Before](before-crowds.jpg) | [After](after-crowds.jpg) | Raincoats and umbrellas gather above rainbow barriers. Real 01–04 and game 02. |
| Finish straight, 12.98 km | [Before](before-finish.jpg) | [After](after-finish.jpg) | The gantry and the City Chambers tower share the finish sightline. Real 01, 05–07 and games 01 and 05. |

The finish gantry stands across the actual line, with City Chambers at the east end of George Square. Four sandstone elevations alternate along Merchant City. The gallery portico stands behind the mounted Duke of Wellington and his traffic cone. Painted surfaces, recessed windows, ironwork and rain break up the streets. Supporters share instanced rainwear and umbrellas. Wheel spray and umbrella movement follow ride time and hold their place on pause. [Credited references](../../worlds/glasgow/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| George Square rollout | 0 m | 0.12 km to 0.95 km | 120.56 | 120.00 | 9.6 ms | 14.8 ms | 43 |
| Merchant City crowd and rain | 9050 m | 0.12 km to 0.95 km | 120.11 | 120.00 | 9.5 ms | 17.0 ms | 46 |

Reproduce from the frontend workspace with `npm run perf -- glasgow-tablet --headed`.
