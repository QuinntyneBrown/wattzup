# Dutch Tulip Fields from the saddle

The 10.1 km polder race restores GCN Training’s thirteen-stage Easy Cadence Workout, including its twenty-five minutes and three-second video offset. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Bollenstreek road, 0.14 km | [Before](before-bollenstreek.jpg) | [After](after-bollenstreek.jpg) | Long red, white and yellow beds cross the view under the open April sky. The narrow lane has grass verges. Real 01–04, 11 and games 01–02. |
| The drainage ditch, 2.16 km | [Before](before-sloten.jpg) | [After](after-sloten.jpg) | A straight water-filled ditch reflects a row of clipped willows between the road and the next bulb plot. Real 04–06, 10, 15 and games 02–03. |
| Keukenhof mill, 4.17 km | [Before](before-keukenhof.jpg) | [After](after-keukenhof.jpg) | Four lattice sails turn around the cap of a tall Dutch smock mill above its timber gallery. Real 08, 12–13 and games 01, 04. |
| The mixed bulb beds, 5.89 km | [Before](before-hyacinths.jpg) | [After](after-hyacinths.jpg) | Blocks of violet hyacinths and yellow daffodils break the tulip stripes; small groups of tourists stop to photograph them. Real 05–07, 09, 14 and games 02–04. |
| The bulb farm, 7.64 km | [Before](before-farmstead.jpg) | [After](after-farmstead.jpg) | Brick farmhouses, low storage sheds and a line of poplars enclose the fields behind an upright Dutch cyclist. Real 01, 03, 10–11, 15 and games 03, 05. |
| The windmill sprint, 9.92 km | [Before](before-sprint.jpg) | [After](after-sprint.jpg) | A second mill marks the sprint with a canal and swaying red and white tulips beside the finish. Real 07, 12–15 and games 01, 04–05. |

Two original smock mills carry rotating lattice sails. The beds change from modelled flower clusters beside the road to furrows across the polder. Sloten, pollards, brick farms and the open sky establish distance on this level course. [Credited references](../../worlds/tulips/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Bollenstreek lane | 0 m | 0.12 km to 0.95 km | 120.40 | 119.95 | 10.1 ms | 26.0 ms | 51 |
| windmill sprint | 8990 m | 0.12 km to 0.95 km | 120.51 | 120.00 | 9.7 ms | 15.4 ms | 51 |

Reproduce from the frontend workspace with `npm run perf -- tulips-tablet --headed`.
