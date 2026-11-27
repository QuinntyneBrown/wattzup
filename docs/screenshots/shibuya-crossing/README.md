# Shibuya Crossing from the saddle

GCN Training’s Super High Cadence Sprints retains its 23 stages, 20:00 duration and zero video offset. Two 4.075 km laps climb 48 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Hachikō station plaza, 0.12 km | [Before](before-station.jpg) | [After](after-station.jpg) | The bronze dog stands on its stone plinth outside the station. Elevated JR tracks cross behind it, below the lit profiles of Hikarie and Scramble Square. Real 02, 11, 13 and 15. Games 03 and 05.. |
| Scramble crossing, 0.72 km | [Before](before-scramble.jpg) | [After](after-scramble.jpg) | Diagonal and straight zebra stripes meet across one broad junction. Umbrella groups wait together at the curb and then walk several crossings at once. Real 02, 03, 08, 13 and 15. Games 01 and 04.. |
| QFRONT screens, 0.81 km | [Before](before-qfront.jpg) | [After](after-qfront.jpg) | The curved screen frontage rises above the crossing. Original moving graphics change colour on the panel and glimmer on wet tarmac below. Real 01, 04, 06, 07 and 08. Games 01 and 03.. |
| 109 fork, 1.48 km | [Before](before-fork.jpg) | [After](after-fork.jpg) | The silver cylindrical Shibuya 109 facade stands between the two streets. A taxi passes beneath the green signals and turns onto the climbing road. Real 05, 09, 10 and 12. Games 02 and 03.. |
| Dogenzaka climb, 2.65 km | [Before](before-dogenzaka.jpg) | [After](after-dogenzaka.jpg) | Vertical karaoke and hotel signs stack above narrow shopfronts. Clear umbrellas catch the colour of individual signs as riders climb Dogenzaka. Real 03, 09, 10 and 12. Games 01, 02 and 05.. |
| Station return, 4.79 km | [Before](before-return.jpg) | [After](after-return.jpg) | A second pass brings the screen, waiting pedestrians and elevated train into a single street-level view. The tower lights remain visible above the train. Real 04, 06, 07, 11 and 14. Games 03 and 04.. |

Original facades light the wet streets. The station plaza carries a bronze Hachikō portrait. A JR train crosses the viaduct, pedestrians carry clear umbrellas through the scramble, QFRONT changes colour and the silver 109 drum stands inside the fork. [Credited references](../../worlds/shibuya/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Hachikō and the station approach | 0 m | 0.12 km to 0.95 km | 119.50 | 119.38 | 10.4 ms | 205.2 ms | 84 |
| umbrella crossing and QFRONT screens | 4650 m | 0.12 km to 0.95 km | 119.80 | 119.33 | 10.3 ms | 105.7 ms | 89 |

Reproduce from the frontend workspace with `npm run perf -- shibuya-tablet --headed`.
