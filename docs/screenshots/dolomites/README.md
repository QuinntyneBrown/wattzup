# Dolomites from the saddle

Earn two stars on Cliffside Coast to open Dolomites in Map Select. Val Gardena Valley Road covers 38.5 km with 860 m of climbing. The shipped centre line and all 17 intervals of its 30:00 workout are preserved. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Ortisei, 0.08 km | [Before](before-ortisei.jpg) | [After](after-ortisei.jpg) | The town entrance and onion dome mark the opening below Sassolungo. Real 01, 04 and 05, games 01 and 04. |
| Meadow road, 2.10 km | [Before](before-meadow.jpg) | [After](after-meadow.jpg) | Meadow edge and hay lofts below the limestone block. Real 02–03, 05 and 14, games 01 and 05. |
| Santa Cristina, 8.40 km | [Before](before-cristina.jpg) | [After](after-cristina.jpg) | The parish church and balconies form a second settlement on the valley road. Real 06 and 09–10, games 02–03. |
| Gondola approach, 15.10 km | [Before](before-lift.jpg) | [After](after-lift.jpg) | The lift connects opposite slopes over the rolling forest edge. Real 03, 09–10 and 14 for the valley and game 02 for near-road scale. |
| Odle meadow, 23.50 km | [Before](before-odle.jpg) | [After](after-odle.jpg) | The northern spires rise beyond the conifers, timber fence and retaining wall. Real 08, 11–12 and 15, games 01 and 05. |
| Selva, 32.60 km | [Before](before-selva.jpg) | [After](after-selva.jpg) | The church, hotels and fixed Sella tableland frame the upper valley. Real 03, 07–08 and 13, games 03–04. |

Sassolungo, the Sella plateau and the Odle needles occupy separate world bearings as Caribana’s Toronto skyline does. Original transparent mountain portraits sit behind grounded spruce and larch groves. Local sections bring in masonry, meadows, hay barns and timber fencing. Churches reuse the Ladin village kit with nave details and village entrance signs. A gondola travels a sagging cable above the SS242 on the ride clock. The settlements are fitted to the existing race loop. [Credited references](../../worlds/dolomites/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Ortisei and the valley meadows | 55 m | 0.12 km to 0.95 km | 119.70 | 119.65 | 10.6 ms | 83.2 ms | 57 |
| Santa Cristina village and the forest edge | 8200 m | 0.12 km to 0.95 km | 120.15 | 119.97 | 10.4 ms | 31.9 ms | 57 |

Reproduce from the frontend workspace with `npm run perf -- dolomites-tablet --headed`.
