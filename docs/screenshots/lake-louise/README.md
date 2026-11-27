# Lake Louise from the saddle

The thirteen stages of GCN Training’s 20 Min Cardio Spin Bike Workout cover 8.000 km in 20:00. The course climbs 52 m and the class begins three seconds into the video. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Château forecourt, 0.08 km | [Before](before-chateau.jpg) | [After](after-chateau.jpg) | Arcaded limestone walls and rows of windows rise from the terrace. Hikers cross between the lawn and the low stone parapet. Real 08, 13–14 and game 05. |
| Canoe dock, 1.22 km | [Before](before-boathouse.jpg) | [After](after-boathouse.jpg) | Red canoes leave a timber boathouse, their paddles dipping beside the dock against milky turquoise water. Real 04–05, 09–11 and game 03. |
| Victoria Glacier, 2.68 km | [Before](before-glacier.jpg) | [After](after-glacier.jpg) | The hanging glacier sits in a notch between dark rock faces above its reflection, visible beyond the stone-lined gravel trail. Real 06–07 and games 01 and 04. |
| Bow Valley Parkway, 4.14 km | [Before](before-forest.jpg) | [After](after-forest.jpg) | Lodgepole pines and spruce close around a narrow asphalt bend. A park sign and timber bench mark a pullout. Real 02–03 and 12 and game 02. |
| Fairview shoreline, 5.86 km | [Before](before-fairview.jpg) | [After](after-fairview.jpg) | The steep grey shoulder of Fairview drops into jade water. Hikers and road cyclists pass on the near side of the lake. Real 06, 10 and 15 and game 04. |
| Moraine Lake road, 7.52 km | [Before](before-moraine.jpg) | [After](after-moraine.jpg) | The road turns past a signed viewpoint. Mount Temple rises beyond the lower tree-covered slopes. Real 01, 03, 14–15 and games 01 and 05. |

The Château and canoe dock sit at the edge of the turquoise lake. Fixed mountain walls frame an original painting of Victoria Glacier. Conifers, the lakeshore stonework, gravel and park signs follow the road geometry. Canoes and their paddlers, pole-carrying hikers and a road cyclist move with the same clock as the ride. [Credited references](../../worlds/lakelouise/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Château and lakeshore | 0 m | 0.12 km to 0.95 km | 120.19 | 120.00 | 9.7 ms | 19.6 ms | 51 |
| Canoe dock and hikers | 1100 m | 0.12 km to 0.95 km | 120.12 | 119.63 | 10.1 ms | 82.6 ms | 86 |

Reproduce from the frontend workspace with `npm run perf -- lakelouise-tablet --headed`.
