# Yosemite Valley from the saddle

Northside Drive follows all 18 stages of the historical 30-minute Full Effort VO2 Max Intervals class over 13.15 km. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Northside Drive, 0.14 km | [Before](before-northside.jpg) | [After](after-northside.jpg) | The one-way road runs through ponderosa and incense cedar, with a park shuttle beside a signed pullout. Real 01–04, 12 and games 02, 04. |
| El Capitan Meadow, 2.90 km | [Before](before-elcap.jpg) | [After](after-elcap.jpg) | Split rails bound an open meadow under El Capitan’s sheer pale wall. Climbers appear as tiny flecks. Real 04–06, 11, 12 and games 02, 03. |
| Bridalveil Fall, 4.82 km | [Before](before-bridalveil.jpg) | [After](after-bridalveil.jpg) | Across the valley a thin white fall bends from its lip toward the trees. Real 06, 08, 11 and games 01, 04. |
| Merced and Swinging Bridge, 6.91 km | [Before](before-merced.jpg) | [After](after-merced.jpg) | Green water and pale sand flank the bridge, below the high granite walls. Real 06, 10, 13, 14 and games 03, 05. |
| Yosemite Falls, 9.64 km | [Before](before-falls.jpg) | [After](after-falls.jpg) | Upper and lower falls are separated by a rock shelf. Spray hangs at their feet. Real 07, 12, 13 and games 01, 05. |
| Half Dome outlook, 12.74 km | [Before](before-dome.jpg) | [After](after-dome.jpg) | The sliced face and curved crown of Half Dome glow above a meadow and shady pine foreground. Real 03, 09, 11, 15 and games 02, 03. |

Granite faces, conifer groves, meadow fencing, the Merced River and Swinging Bridge frame the ride. The shuttle, wind-blown Bridalveil ribbon and two tiers of Yosemite Falls move with the ride clock. The falls grow audible near the viewpoints and pause with the rider. [Credited references](../../worlds/yosemite/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Northside shuttle pullout | 0 m | 0.12 km to 0.95 km | 120.60 | 119.98 | 10.2 ms | 21.0 ms | 53 |
| Yosemite Falls spray | 9500 m | 0.12 km to 0.95 km | 119.68 | 119.55 | 11.1 ms | 61.8 ms | 42 |

Reproduce from the frontend workspace with `npm run perf -- yosemite-tablet --headed`.
