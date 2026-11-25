# Cypress Mountain from the saddle

GCN Training’s Ramp Workout: From Threshold to Sprints retains its original 13 stages over 43:00. The Cypress Bowl Road course covers 18.125 km and climbs 797 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Lower forest, 0.08 km | [Before](before-forest.jpg) | [After](after-forest.jpg) | Coastal conifers frame the road shoulders and double yellow line. Real 09, 10, 13 and 15, games 01–02. |
| Lower switchback, 2.67 km | [Before](before-bend.jpg) | [After](after-bend.jpg) | The shoulder curves beneath the uphill forest and around the barrier. Real 01 and 09, games 01 and 05. |
| Highview Lookout, 5.65 km | [Before](before-highview.jpg) | [After](after-highview.jpg) | A timber rail and plaque mark the turnout above the inlet. The bridge and towers sit against the distant ridge. Real 01–04, 08 and 12, games 02–03. |
| Howe Sound, 9.32 km | [Before](before-sound.jpg) | [After](after-sound.jpg) | The forest opens towards the layered coastal islands and opposite shore. Real 09, 11 and 14, games 02 and 05. |
| Upper mountain, 14.54 km | [Before](before-lions.jpg) | [After](after-lions.jpg) | The twin horns rise beyond the upper forest opening. Real 07, 11 and 15, games 01–03. |
| Ski area approach, 17.88 km | [Before](before-lodge.jpg) | [After](after-lodge.jpg) | Timber lodge and lift terminal frame the final approach. Real 05–07, games 03–05. |

Six broad hairpins cross the mountainside. The lower road is enclosed by mature Douglas fir, western red cedar and western hemlock, with openings towards the water at Highview and Howe Sound. Four original botanical portraits share a cutout atlas. Following Caribana’s approach to a fixed skyline behind the moving foreground, a second original matte wraps around the southern basin. It compresses the view between Vancouver and the islands and layers with the native headlands, bridge and towers. The camera turns towards the water at the lookouts. Training cyclists use the same articulated road-bike model as the rider. The chairs follow the summit lift cable. Both follow ride time and hold when paused. The exposed summit horns, glazed timber lodge, ski terminal and wet road remain on Low. [Credited references](../../worlds/cypress/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Lower forest and climbing cyclists | 55 m | 0.12 km to 0.95 km | 120.38 | 120.00 | 9.6 ms | 13.8 ms | 54 |
| Highview Lookout and the Vancouver skyline | 5400 m | 0.12 km to 0.95 km | 120.45 | 120.00 | 9.7 ms | 16.3 ms | 60 |

Reproduce from the frontend workspace with `npm run perf -- cypress-tablet --headed`.
