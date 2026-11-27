# Oregon Coast from the saddle

GCN Training’s FTP Builder retains nine original stages and a three-second video offset. The 42-minute Highway 101 course covers 19.525 km and climbs 139 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Highway 101, 0.08 km | [Before](before-highway.jpg) | [After](after-highway.jpg) | A rain-darkened two-lane highway curves between wind-shaped Sitka spruce, a silver guardrail and weathered shingle buildings. Real 01–05 and 13. Games 01 and 03.. |
| Cannon Beach, 3.18 km | [Before](before-haystack.jpg) | [After](after-haystack.jpg) | The broad basalt base and blunt, sloping crown of Haystack Rock rise above the Needles. Bleached logs lie across the grey beach. Real 06, 07, 13 and 14. Games 01 and 05.. |
| Yaquina Head, 6.83 km | [Before](before-light.jpg) | [After](after-light.jpg) | The tall white tower and dark lantern stand clear of a low spruce headland. A brown pullout sign and low coastal fog sit nearer the road. Real 05, 11 and 15. Games 01 and 04.. |
| Yaquina Bay Bridge, 9.96 km | [Before](before-yaquina.jpg) | [After](after-yaquina.jpg) | Green through-arch ribs, diagonal trusses and slender vertical hangers frame the rider above a tidal channel. Real 03, 10 and 11. Games 02 and 04.. |
| Heceta Head, 14.34 km | [Before](before-heceta.jpg) | [After](after-heceta.jpg) | A short white lighthouse and red-roofed service buildings overlook surf that wraps around the steep wooded point. Real 08, 09, 12 and 15. Games 03 and 04.. |
| Boardman headlands, 18.86 km | [Before](before-arches.jpg) | [After](after-arches.jpg) | Water shows through a dark basalt arch. White breakers curl in front of it and wind-shaped spruce bracket the distant stacks. Real 02, 05, 12–14. Games 01, 03 and 05.. |

A two-lane highway passes Sitka spruce and grey driftwood beaches. Haystack Rock, the two Newport and Heceta lighthouse stations, the steel through arch at Yaquina Bay and the open Boardman rock arch frame the coast. Wind, beacon and tide follow ride time. [Credited references](../../worlds/oregon/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Highway 101 and the spruce forest | 0 m | 0.12 km to 0.95 km | 120.16 | 119.83 | 10.4 ms | 32.1 ms | 33 |
| Heceta Head and Pacific surf | 14230 m | 0.12 km to 0.95 km | 120.27 | 119.95 | 9.9 ms | 26.6 ms | 64 |

Reproduce from the frontend workspace with `npm run perf -- oregon-tablet --headed`.
