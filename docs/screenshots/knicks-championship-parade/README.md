# Knicks Championship Parade from the saddle

The original 18 stages of GCN Training’s Sprintavals carry the rider up 7.000 km of Broadway, climbing 43 m over 17:00. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Bowling Green, 0.08 km | [Before](before-bull.jpg) | [After](after-bull.jpg) | The bull has a lowered head, curved horns, a humped shoulder and bronze highlights against the park fence. Real 07, 08, 10 and 13–14 and games 01 and 05. |
| Float, 1.42 km | [Before](before-float.jpg) | [After](after-float.jpg) | Rails and team figures ride above the flatbed. Orange and blue fans crowd the blue barriers. Paper tumbles past open windows and accumulates on the road. Real 01–04 and games 02 and 03. |
| Trinity Church, 2.65 km | [Before](before-trinity.jpg) | [After](after-trinity.jpg) | The narrow Gothic spire, churchyard fence and trees break the wall of commercial buildings. Real 05, 09 and 15 and games 01–02. |
| Open bus, 3.88 km | [Before](before-buses.jpg) | [After](after-buses.jpg) | A moving double-decker has an open roof, visible passenger rail and two rows of windows. The lower Broadway street name and signals hang above its lane. Real 01–06 and 12 and games 03 and 04. |
| St. Paul’s Chapel, 5.27 km | [Before](before-chapel.jpg) | [After](after-chapel.jpg) | A columned porch and pale steeple are seen at the churchyard. Bronze route plaques occupy the granite pavement. Tower shadows leave distinct sunlit bands. Real 05, 07, 12 and 15 and games 04 and 05. |
| City Hall, 6.69 km | [Before](before-woolworth.jpg) | [After](after-woolworth.jpg) | Terra-cotta setbacks and the green copper crown stay at the far end of Broadway and approach the rider. Real 05, 11–12 and 15 and games 01 and 05. |

The original championship floats roll at 2.2 m/s on the race clock. Their passengers, ticker tape and an open-top double-decker keep their poses when the ride pauses. Fixed landmarks include the bronze Charging Bull at Bowling Green, Trinity Church, St. Paul’s Chapel and the copper crown of the Woolworth Building. The first four credited photographs depict the US women’s soccer parade and inform float and crowd scale. [Credited references](../../worlds/knicks/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Bowling Green parade start | 0 m | 0.12 km to 0.95 km | 119.90 | 119.90 | 10.0 ms | 23.6 ms | 71 |
| Floats, open buses and ticker tape | 3640 m | 0.12 km to 0.95 km | 119.99 | 119.97 | 9.9 ms | 25.9 ms | 80 |

Reproduce from the frontend workspace with `npm run perf -- knicks-tablet --headed`.
