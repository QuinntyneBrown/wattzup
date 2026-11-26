# Wicklow Gap from the saddle

Conor’s Racing Bonanza keeps all 23 stages, 35 minutes and 15.89 km. The terrain rises 335 m in total and reaches the 475 m saddle before the Laragh descent. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Hollywood approach, 0.14 km | [Before](before-hollywood.jpg) | [After](after-hollywood.jpg) | Gorse, low granite walls and a dashed centre line lead the R756 past a dark Sitka plantation. Real 01, 02 and game 02. |
| Blanket bog pools, 3.06 km | [Before](before-bog.jpg) | [After](after-bog.jpg) | Tussocks break the black water of peat cuttings below round brown-purple slopes. Real 03–05, 12, 13 and games 01, 03. |
| Blackface sheep bend, 6.24 km | [Before](before-sheep.jpg) | [After](after-sheep.jpg) | Blackface sheep graze beside a low stone wall, one stepping down toward the verge. Real 04, 10–12 and games 01, 05. |
| Turlough Hill turn, 8.68 km | [Before](before-turlough.jpg) | [After](after-turlough.jpg) | A service road climbs away from the saddle to the stone embankment and pumped-storage reservoir. Real 02, 05, 10–12 and games 01, 04. |
| Tonelagee and Camaderry, 10.15 km | [Before](before-gap.jpg) | [After](after-gap.jpg) | Low cloud drifts across rounded summits while a roadside tricolour strains in the wind. Real 02, 10, 11, 14 and games 01, 03. |
| Glendalough descent, 14.87 km | [Before](before-glendalough.jpg) | [After](after-glendalough.jpg) | The road drops through spruce toward the upper lake, with the round monastic tower below. Real 06–09, 13–15 and games 04, 05. |

Original bog and granite textures, blackface sheep, a wind-driven tricolour and low drifting cloud lead from the R756 to the reservoir and the Glendalough round tower beside its lake. [Credited references](../../worlds/wicklow/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Hollywood and the R756 | 0 m | 0.12 km to 0.96 km | 117.49 | 117.43 | 12.2 ms | 160.8 ms | 51 |
| sheep and granite walls | 6100 m | 0.12 km to 0.97 km | 113.51 | 113.50 | 13.5 ms | 134.0 ms | 146 |

Reproduce from the frontend workspace with `npm run perf -- wicklow-tablet --headed`.
