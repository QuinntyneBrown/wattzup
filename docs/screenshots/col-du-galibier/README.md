# Col du Galibier from the saddle

Choose Col du Galibier in Map Select. GCN Training’s Increase Your Threshold Power keeps its twenty original stages over 60:00. The 26.05 km pass road climbs 942 m to the summit at 2,642 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Plan Lachat, 0.08 km | [Before](before-lachat.jpg) | [After](after-lachat.jpg) | Weathered timber chalets and stream on the valley approach. Real 09–12 and 14, games 02 and 04. |
| Bare switchbacks, 6.72 km | [Before](before-switchbacks.jpg) | [After](after-switchbacks.jpg) | White edge dashes, shale banks and retaining stones. Real 02–04, 08 and 11, games 02–03. |
| Tour road, 11.52 km | [Before](before-tour.jpg) | [After](after-tour.jpg) | Painted names and cyclists’ supporters beside the road. Real 02–03 and 08, games 01 and 04. |
| Tunnel fork, 18.42 km | [Before](before-tunnel.jpg) | [After](after-tunnel.jpg) | Arch stones frame the dark bore alongside the open road and ploughed banks. Real 01 and 06–07, games 03 and 05. |
| Henri Desgrange monument, 22.36 km | [Before](before-desgrange.jpg) | [After](after-desgrange.jpg) | Dressed stone column with an original engraved relief. Real 05, 10 and 13, games 02 and 04. |
| Galibier summit, 25.82 km | [Before](before-summit.jpg) | [After](after-summit.jpg) | The rough plinth carries a pass name, elevation and departmental plates. Real 03, 07, 13 and 15, games 01 and 05. |

The Plan Lachat chalets stand beside a moving mountain stream. The shale and turf turn to snowbanks near the tunnel fork. Tour lettering, flags and cheering fans retain the class’s colours and movement on the ride clock. The road passes the carved Desgrange monument and finishes at the stone plinth with the two departmental signs. The Valloire valley and La Meije stay in world coordinates as the rider turns. The route joins locations on both sides of the pass to fit the class. [Credited references](../../worlds/galibier/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Plan Lachat approach | 55 m | 0.12 km to 0.95 km | 120.36 | 120.00 | 9.6 ms | 13.2 ms | 98 |
| Summit tunnel, fans and flags | 17790 m | 0.12 km to 0.95 km | 119.07 | 118.98 | 9.7 ms | 327.2 ms | 83 |

Reproduce from the frontend workspace with `npm run perf -- galibier-tablet --headed`.
