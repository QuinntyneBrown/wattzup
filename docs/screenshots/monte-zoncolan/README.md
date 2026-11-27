# Monte Zoncolan from the saddle

The historical 30-minute Strength Builder & Quad Burner class sets 15 stages on the 12.375 km ascent from Ovaro. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Ovaro approach, 0.14 km | [Before](before-ovaro.jpg) | [After](after-ovaro.jpg) | The street passes pale village houses with timber balconies and a Carnic bell tower. Real 08–12 and games 01, 05. |
| Liariis forest gate, 2.15 km | [Before](before-liariis.jpg) | [After](after-liariis.jpg) | Past the last village walls, beech and spruce close around the narrow patched ramp. Real 08, 10, 11, 15 and games 02, 04. |
| Forest wall, 4.91 km | [Before](before-ramp.jpg) | [After](after-ramp.jpg) | Painted riders’ names climb away on asphalt steeper than twenty percent, tight between trees. Real 03–06, 13 and games 02–04. |
| Painted galleries, 9.70 km | [Before](before-gallery.jpg) | [After](after-gallery.jpg) | Three short galleries interrupt the road. Light falls across original cycling murals and the open exits. Real 01, 03–06 and games 02, 03. |
| Carnic high pasture, 10.91 km | [Before](before-pasture.jpg) | [After](after-pasture.jpg) | Cows graze above a guardrail. Switchbacks cut across grassy pasture under the jagged Carnic skyline. Real 03–07, 13, 14 and games 01, 04. |
| Summit race crowd, 12.18 km | [Before](before-finish.jpg) | [After](after-finish.jpg) | Fans and flags fill grassy banks around tents at the finish, leaving the racing line clear. Real 01–04, 13–15 and games 03, 05. |

Authored village houses, painted road, gallery arches, switchbacks, Alpine pasture, animated cattle and Giro spectators follow the climb from Ovaro to the finish. [Credited references](../../worlds/zoncolan/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Ovaro village | 0 m | 0.12 km to 0.95 km | 118.05 | 117.93 | 10.8 ms | 118.7 ms | 35 |
| summit spectators | 11320 m | 0.12 km to 0.95 km | 119.37 | 119.35 | 11.0 ms | 61.3 ms | 112 |

Reproduce from the frontend workspace with `npm run perf -- zoncolan-tablet --headed`.
