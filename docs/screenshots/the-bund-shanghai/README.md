# The Bund, Shanghai from the saddle

Select The Bund, Shanghai in Map Select. Three flat waterfront circuits cover 12.833 km. The 23 stages of GCN’s 30 Minute High Cadence HIIT retain the original 30:03 timing. The seven matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Promenade, 0.07 km | [Before](before-promenade.jpg) | [After](after-promenade.jpg) | Pale paving, lamps and railings lead along the stone riverfront. Real 01–04 and games 01, 03. |
| Customs House, 0.48 km | [Before](before-customs.jpg) | [After](after-customs.jpg) | The clock tower rises above the floodlit masonry façades. Real 01–04, 07 and 13. |
| Pudong, 0.81 km | [Before](before-pudong.jpg) | [After](after-pudong.jpg) | The Oriental Pearl, Jin Mao, World Financial Center and Shanghai Tower stand across the Huangpu. Real 05, 06, 11 and 12 and games 01–03. |
| Peace Hotel, 1.24 km | [Before](before-hotel.jpg) | [After](after-hotel.jpg) | The green pyramidal roof breaks the line of pale façades. Real 14 and 15. |
| Huangpu Park, 1.59 km | [Before](before-park.jpg) | [After](after-park.jpg) | Trees and the waterfront monument mark the northern promenade. Real 02, 07–09 and 12. |
| Waibaidu Bridge, 1.86 km | [Before](before-bridge.jpg) | [After](after-bridge.jpg) | The pale steel truss crosses Suzhou Creek. Real 08–10 and games 03–05. |
| Boulevard, 2.74 km | [Before](before-boulevard.jpg) | [After](after-boulevard.jpg) | Traffic follows the return past lit masonry on the Puxi side. Real 01–04, 07 and 13–15. |

Like Caribana’s CN Tower, the four Pudong landmarks stand at fixed positions across the river. The pink spheres, open trapezoid, stepped crown and twisting shaft have distinct silhouettes. Warm floodlights trace the Puxi cornices. The green Peace Hotel roof and Customs House clock mark the promenade before Huangpu Park and the steel truss over Suzhou Creek. Cruise vessels, pedestrians, traffic and coloured water reflections advance with race time. The return boulevard and repeated circuit condense the waterfront for the class. [Credited references](../../worlds/bund/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| The crowded promenade and Pudong | 610 m | 0.12 km to 0.95 km | 120.57 | 119.89 | 9.8 ms | 50.8 ms | 61 |
| Huangpu Park and Waibaidu Bridge | 1540 m | 0.12 km to 0.95 km | 120.26 | 120.00 | 9.8 ms | 15.9 ms | 51 |

Reproduce from the frontend workspace with `npm run perf -- bund-tablet --headed`.
