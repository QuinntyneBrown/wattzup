# Iten, Kenya from the saddle

Race the red-dirt road through Iten’s highland farms and Kamariny Stadium before riding out to the Kerio escarpment. GCN Training’s 40 Minute HIIT retains all fourteen original stages and its two-second video offset. The 17.86 km course climbs 378 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Red-murram approach, 0.08 km | [Before](before-murram.jpg) | [After](after-murram.jpg) | Warm laterite and a grassy shoulder pass between fences, umbrella acacias and candelabra euphorbias. Real 01–05, games 01, 02 and 04. |
| Training road, 2.84 km | [Before](before-runners.jpg) | [After](after-runners.jpg) | Small groups share the verge with the rider, in distinct running kit. Real 07 and 08, games 03–05. |
| Highland farms, 5.61 km | [Before](before-farms.jpg) | [After](after-farms.jpg) | Cattle and goats graze by cropped fields, a herder and the farm gate. Real 04, 07, 13 and 14, games 03 and 04. |
| Kamariny Stadium, 8.72 km | [Before](before-stadium.jpg) | [After](after-stadium.jpg) | The race passes the red dirt oval, open grass infield and timber stand. Real 08 and 12, games 03 and 04. |
| Iten town, 12.81 km | [Before](before-town.jpg) | [After](after-town.jpg) | Painted shopfronts, corrugated roofs, poles, the matatu and local traffic line the street. Real 11 and 15, game 03. |
| Kerio Valley, 16.94 km | [Before](before-kerio.jpg) | [After](after-kerio.jpg) | The broken rim opens onto successive green spurs and the hazy valley floor. Real 06 and 09–11, games 01 and 05. |

Two ruts, a broken central strip, fine gravel and laterite dust follow the grade. Acacias and euphorbias stand beyond the fences. The training partners run out of phase and the livestock graze across from maize and pasture. The Kamariny oval sits in a level cut, with timber seating and a corrugated canopy. A matatu waits outside the tin-roofed market while a boda-boda travels along the street. An original image extends the native escarpment into the distant Kerio Valley. The trees and road surface also use original generated artwork. [Credited references](../../worlds/iten/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Red murram and the highland verges | 0 m | 0.12 km to 0.95 km | 120.79 | 120.00 | 9.7 ms | 15.3 ms | 34 |
| Iten market, matatus and boda-bodas | 12420 m | 0.12 km to 0.96 km | 120.04 | 119.60 | 10.2 ms | 60.0 ms | 41 |

Reproduce from the frontend workspace with `npm run perf -- iten-tablet --headed`.
