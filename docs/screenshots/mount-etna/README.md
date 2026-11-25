# Mount Etna from the saddle

Choose Mount Etna in Map Select. The 14 stages of GCN Training’s Go Until You Blow last 30:00. The south approach covers 12.885 km and climbs 798 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Lava fields, 0.08 km | [Before](before-lava.jpg) | [After](after-lava.jpg) | Basalt flows and the summit profile follow real 01–05 and 14. Games 01–02 informed riding scale. |
| SP92 hairpins, 2.28 km | [Before](before-hairpins.jpg) | [After](after-hairpins.jpg) | Roadside cuttings, stone kerbs and pioneer plants follow real 01–05 and games 03–04. |
| Coastal outlook, 4.76 km | [Before](before-coast.jpg) | [After](after-coast.jpg) | The break along the lower slope looks towards the Catania plain. Real 01 and 05 informed the grade and haze, game 05 the sightline. |
| Silvestri craters, 8.38 km | [Before](before-silvestri.jpg) | [After](after-silvestri.jpg) | Rust-red scoria banks and crater walkers draw on real 07–11 and 15 and games 01 and 03. |
| Rifugio Sapienza, 10.74 km | [Before](before-rifugio.jpg) | [After](after-rifugio.jpg) | Shopfronts, gables, parking and the white summit tour bus follow real 04, 06, 09 and 12 and games 03–04. |
| Funivia, 12.18 km | [Before](before-funivia.jpg) | [After](after-funivia.jpg) | Red cabins travel uphill below the summit along a sagging cable. Real 13–14 and games 02 and 05 informed the approach. |

The cone has a fixed bearing and the summit plume follows ride time. As in Caribana, the roadside blocks, middle-distance craters and distant skyline have distinct scales and parallax. Native surfaces distinguish black clinker from oxidised scoria and sunlit bitumen. The refuge uses an original frontage atlas. The class and race share the white tour bus, walker clothing and plume timing. The south road, crater rims, refuge and cableway are condensed to the original workout length. [Credited references](../../worlds/etna/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Opening lava fields | 55 m | 0.12 km to 0.95 km | 120.25 | 120.00 | 9.6 ms | 18.1 ms | 60 |
| Rifugio Sapienza and the cableway | 10550 m | 0.12 km to 0.95 km | 120.31 | 119.93 | 9.7 ms | 43.0 ms | 132 |

Reproduce from the frontend workspace with `npm run perf -- etna-tablet --headed`.
