# Sa Calobra, Mallorca from the saddle

Select Sa Calobra, Mallorca in Map Select. The four original stages of GCN’s Aerobic Cadence Workout With Team Sky run for 30:30. The 11.851 km course gains 671 m from the port to Coll dels Reis. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Sa Calobra port, 0.08 km | [Before](before-port.jpg) | [After](after-port.jpg) | Harbour boats, vernacular buildings, blue water and the road into the gorge use real 12–15 and game 04. |
| Limestone gorge, 1.35 km | [Before](before-gorge.jpg) | [After](after-gorge.jpg) | Karst fins stand either side of the road, holm oaks and wild olives break the slope, and the training group shares the lane. Real 03–04 and 12–15, games 01 and 03. |
| Mountain road, 4.65 km | [Before](before-switchbacks.jpg) | [After](after-switchbacks.jpg) | The riding lane doubles back and climbs through the other 25 turns. Parapets bound the drop. Real 03, 05–08 and 15, games 01–03. |
| Lower knot approach, 9.81 km | [Before](before-underpass.jpg) | [After](after-underpass.jpg) | The lower road leads beneath the stone arch and the deck of the upper lane. Real 01, 02, 06, 09 and 11, games 02–03. |
| Upper loop, 10.04 km | [Before](before-upper.jpg) | [After](after-upper.jpg) | The 270-degree return leads across the bridge above the lower road. Real 01, 02, 05, 06 and 09, games 02–03. |
| Coll dels Reis, 11.62 km | [Before](before-cafe.jpg) | [After](after-cafe.jpg) | The brown pass sign, café terrace and regrouping riders mark the top. Real 03, 08 and 10, games 01, 04 and 05. |

The 26 physical reversals gain height on one hillside. A lower lane passes beneath the limestone vault, turns through 270 degrees and crosses the same structure on top. Like Caribana’s fixed Toronto skyline, Puig Major stays in place beyond the terraces. The Spanish port, finned limestone gorge, dry-stone verges, small groups of grazing goats and the navy team estate with its three roof-mounted bikes carry forward the earlier class concept. The race reproduces its 60-degree chase lens, 5.5 m following distance, 2.1 m eye height and 24 m bend-following look-ahead as praised in rider feedback #921. A bounded field of training cyclists follows the climb while tour coaches descend. The stylised pass café and route proportions fit the original interval distance. [Credited references](../../worlds/calobra/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Limestone gorge and training camp | 1200 m | 0.12 km to 0.95 km | 119.85 | 119.76 | 10.5 ms | 37.7 ms | 80 |
| Knot bridge and upper loop | 9650 m | 0.12 km to 0.95 km | 118.54 | 118.42 | 12.2 ms | 99.7 ms | 63 |

Reproduce from the frontend workspace with `npm run perf -- calobra-tablet --headed`.
