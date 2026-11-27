# Trollstigen from the saddle

GCN Training’s Gradual Threshold Effort Builds supplies all seventeen stages over thirty minutes. The 12 km route climbs 800 m from Isterdalen to the summit. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| The Isterdalen approach, 0.14 km | [Before](before-isterdalen.jpg) | [After](after-isterdalen.jpg) | A narrow wet road climbs out of green Isterdalen between the dark walls of the U-shaped valley. Real 01–03 and game 01. |
| The lower switchbacks, 2.45 km | [Before](before-switchbacks.jpg) | [After](after-switchbacks.jpg) | The next return bend cuts across the grey wall above the rider. Individual stone parapet blocks mark the exposed edge. Real 02–07 and games 02–04. |
| Stigfossen bridge, 4.98 km | [Before](before-stigfossen.jpg) | [After](after-stigfossen.jpg) | Water drops in white ribbons from the cliff above the stone bridge and rejoins the torrent below the arch. Real 07–09, 12 and game 03. |
| Tourist traffic, 7.28 km | [Before](before-traffic.jpg) | [After](after-traffic.jpg) | A camper van leads a car and touring motorbike around the narrow upper bend. Real 04, 09–11 and games 01–02. |
| The upper skyline, 9.45 km | [Before](before-peaks.jpg) | [After](after-peaks.jpg) | Separate Kongen, Dronninga and Bispen silhouettes rise through moving cloud, with summer snow caught on ledges. Real 01, 07, 12–15 and games 03–05. |
| The summit overlook, 11.78 km | [Before](before-overlook.jpg) | [After](after-overlook.jpg) | Visitors stand on a rusted steel cantilever over Isterdalen. The low visitor centre follows the line of the upper stream. Real 05, 07, 12–15 and games 04–05. |

Eleven hairpins link the lower valley to an open steel platform. Stigfossen runs down a separate granite channel; the van, wagon, motorbike, white water and sky share ride time. The summit and gorge retain their own fixed spatial positions. [Credited references](../../worlds/trollstigen/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Isterdalen | 0 m | 0.12 km to 0.95 km | 120.23 | 119.95 | 10.1 ms | 32.8 ms | 50 |
| tourist bend | 7100 m | 0.12 km to 0.95 km | 118.86 | 118.79 | 10.8 ms | 100.1 ms | 68 |

Reproduce from the frontend workspace with `npm run perf -- trollstigen-tablet --headed`.
