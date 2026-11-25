# Bondi to Bronte from the saddle

Select Bondi to Bronte in Map Select. The original 15 stages of GCN Training’s 15 Min HIIT Cardio: Belly Fat Loss run for 13:30, cover 6.150 km and climb 95 m along Sydney’s east coast. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Bondi Beach promenade, 0.07 km | [Before](before-bondi.jpg) | [After](after-bondi.jpg) | The sand crescent, sheltered promenade, beachgoers and surfers follow real 02, 11 and 13, with coastal sightlines from games 01 and 02. |
| Icebergs approach, 0.43 km | [Before](before-icebergs.jpg) | [After](after-icebergs.jpg) | White walls enclose the lap lanes and the smaller pool below the club. Real 01, 03, 11 and 12, games 01 and 04. |
| Sandstone shelves, 1.12 km | [Before](before-sandstone.jpg) | [After](after-sandstone.jpg) | Coastal path, railings, sandstone bedding and Pacific whitewater. Real 04–06 and 15, games 01, 03 and 05. |
| Tamarama cove, 2.17 km | [Before](before-tamarama.jpg) | [After](after-tamarama.jpg) | The gold surf lifesaving club stands behind the cove and its breakers. Real 09 and 15, games 02 and 03. |
| Waverley boardwalk, 4.46 km | [Before](before-waverley.jpg) | [After](after-waverley.jpg) | Stepped headstones, coastal vegetation and path users above the sea. Real 05 and 06, games 03–05. |
| Bronte Baths approach, 6.05 km | [Before](before-baths.jpg) | [After](after-baths.jpg) | A smaller rock pool marks the finish beyond the Bronte crescent. Real 07, 08, 10 and 14, games 02 and 05. |

The sandstone ledges and crescent beaches occupy fixed positions beyond the shared path. Like Caribana’s foreground parade, the joggers, walkers, swimmers and surfers use bounded shared geometry driven by ride time. Lane lines and concrete retaining walls distinguish the two ocean baths. Foam breaks against the cliffs and spills over the seaward pool walls. The route condenses the headlands, passing the cemetery on a loop before finishing above Bronte Baths. [Credited references](../../worlds/bondi/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Bondi Icebergs and the promenade | 110 m | 0.12 km to 0.95 km | 120.44 | 120.00 | 9.5 ms | 14.4 ms | 30 |
| Waverley coastal boardwalk | 4110 m | 0.12 km to 0.95 km | 120.73 | 120.00 | 9.5 ms | 14.5 ms | 19 |

Reproduce from the frontend workspace with `npm run perf -- bondi-tablet --headed`.
