# North Shore, Oahu from the saddle

GCN’s 20 Minute Fat Burning Workout retains all 21 stages and zero video offset. The 20:30 class follows Kamehameha Highway for 8.914 km and climbs 42 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Haleiwa town, 0.08 km | [Before](before-haleiwa.jpg) | [After](after-haleiwa.jpg) | The painted surfer sign stands beside timber shops and a fruit stall. A double yellow line runs past a parked board-laden truck. Real 02, 04, 05 and 12. Games 02 and 03.. |
| Anahulu River, 1.33 km | [Before](before-anahulu.jpg) | [After](after-anahulu.jpg) | Rainbow Bridge spans the river between sandy verges. The concrete arches frame the turquoise inlet and wind-bent palms. Real 02, 06 and 10. Games 03 and 04.. |
| Waimea Bay, 2.86 km | [Before](before-waimea.jpg) | [After](after-waimea.jpg) | The highway bends above a curved bay. White breakers peel past jumping rock, with the church tower tucked into the green hillside. Real 01, 08, 10, 11 and 14. Games 01 and 02.. |
| Banzai Pipeline, 4.49 km | [Before](before-pipeline.jpg) | [After](after-pipeline.jpg) | A surfer carries a board toward the beach. Beyond the palms a winter swell curls over a turquoise face and breaks white. Real 08, 09, 11 and 13. Games 01 and 04.. |
| Sunset Beach, 6.56 km | [Before](before-sunset.jpg) | [After](after-sunset.jpg) | A truss bridge carries the road beside ironwoods. Trade-wind clouds catch golden light offshore and the Koolau ridges remain inland. Real 03, 06, 14 and 15. Games 02, 04 and 05.. |
| Kahuku shrimp trucks, 8.49 km | [Before](before-kahuku.jpg) | [After](after-kahuku.jpg) | Shrimp trucks face a gravel pullout. Written signatures surround the serving hatch, customers queue and picnic benches sit in palm shade. Real 02, 03, 07 and 12. Games 03 and 05.. |

From the wooden shops of Haleiwa, the highway crosses Rainbow Bridge and follows turquoise winter surf through Waimea Bay, Pipeline and Sunset Beach. A surfer carries a board and a customer waits beside the graffiti-covered shrimp trucks. Afternoon light warms as the rider approaches Sunset Beach. [Credited references](../../worlds/northshore/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Haleiwa town and Rainbow Bridge | 0 m | 0.12 km to 0.95 km | 120.14 | 119.71 | 9.9 ms | 61.1 ms | 74 |
| Kahuku shrimp truck queues | 8380 m | 0.12 km to 0.95 km | 120.50 | 119.77 | 10.2 ms | 56.9 ms | 80 |

Reproduce from the frontend workspace with `npm run perf -- northshore-tablet --headed`.
