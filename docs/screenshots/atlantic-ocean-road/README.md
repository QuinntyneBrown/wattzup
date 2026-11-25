# Atlantic Ocean Road from the saddle

Choose Atlantic Ocean Road in Map Select. GCN Training’s nine-stage *FTP HIIT Booster for Longer Efforts* runs for 30:00 on a 13.125 km course with 65 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| First causeway, 0.08 km | [Before](before-causeway.jpg) | [After](after-causeway.jpg) | Rock fill and twin steel rails enclose the low wet roadway. Real 05, 10–12 and game 05. |
| Cabin islet, 0.33 km | [Before](before-rorbu.jpg) | [After](after-rorbu.jpg) | Red timber walls, white window frames and a gable roof stand across the skerries. Real 05, 14–15 and game 04 informed the shoreline scale. |
| Storseisundet from the side, 0.88 km | [Before](before-cantilever.jpg) | [After](after-cantilever.jpg) | The turn reveals the full rising span above the water. Real 01–04, 06–09 and games 01–02. |
| Storseisundet approach, 1.09 km | [Before](before-approach.jpg) | [After](after-approach.jpg) | The road rears up and the crest hides the descending deck. The steel rail follows the curve. Real 02, 03, 07 and game 01. |
| Crest, 1.31 km | [Before](before-crest.jpg) | [After](after-crest.jpg) | The descending arc opens across the water. Clouds and shafts of light move over the mainland range. Real 04, 09–11 and 14. |
| Myrbærholm, 3.58 km | [Before](before-fishing.jpg) | [After](after-fishing.jpg) | Anglers and rods stand beyond the road rail on their separate walkway. Real 12–15, games 03–05. |

The deck, rails, haunches and supports follow one centre line. The route panel samples its elevation every five metres. Caribana’s separation of an active foreground and stable horizon informed the breakers, low skerries and fixed mainland ridge. Foam plumes share one original texture and a bounded instance buffer. The sea, spray and squall banks use ride time, and the shore and walkway anglers are baked into the map. [Credited references](../../worlds/atlanticroad/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| causeway | 0 m | 0.12 km to 0.95 km | 120.23 | 120.00 | 9.7 ms | 14.0 ms | 31 |
| Storseisundet | 790 m | 0.12 km to 0.95 km | 120.65 | 119.91 | 9.8 ms | 24.8 ms | 20 |

Reproduce from the frontend workspace with `npm run perf -- atlantic-tablet --headed`.
