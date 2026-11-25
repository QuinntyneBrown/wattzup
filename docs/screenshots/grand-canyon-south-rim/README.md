# Grand Canyon South Rim from the saddle

Choose Desert View Drive in Map Select. GCN Training’s VO2 Max Booster keeps all 32 stages and its 30:00 duration. The 13.425 km road climbs 171 m between the forest and Desert View. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Ponderosa forest, 0.08 km | [Before](before-forest.jpg) | [After](after-forest.jpg) | Reddish trunks and open pine crowns line the double yellow road. Real 01–03 and games 01–02. |
| Grandview Point, 2.05 km | [Before](before-grandview.jpg) | [After](after-grandview.jpg) | The bend frames a free-standing temple against the far rim. Real 09 and 11, games 03–04. |
| Moran Point, 4.48 km | [Before](before-moran.jpg) | [After](after-moran.jpg) | Benches, cliffs and shadowed rock stand beyond the viewing rail. Real 06–10, games 01 and 04. |
| Lipan Point, 7.22 km | [Before](before-lipan.jpg) | [After](after-lipan.jpg) | The road descends past the viewing rail, revealing a turquoise meander in the Colorado River below the eastern terraces. Real 06–07 and 12–15, game 05. |
| Navajo Point, 10.16 km | [Before](before-navajo.jpg) | [After](after-navajo.jpg) | A park shuttle, parked cars and visitors share the approach to the stone terrace. Real 02, 05–07 and game 03. |
| Desert View Watchtower, 13.24 km | [Before](before-tower.jpg) | [After](after-tower.jpg) | The rough masonry, small window bands and crenellated top rise at the saddle. Real 04 and 13, games 02 and 05. |

Forest gives way to open rock at four independently placed overlooks. The native geometry includes Kaibab cap rock, stepped canyon walls, eroded temples, eastern river bends and the tapering masonry of Desert View Watchtower. An original strata material follows the rock faces. A separate original image dresses the distant North Rim. Wind-driven cloud shadows follow ride time and a park shuttle moves beside the Navajo Point turnout. Both hold on pause. [Credited references](../../worlds/grandcanyon/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Ponderosa forest rollout | 0 m | 0.12 km to 0.95 km | 120.48 | 120.00 | 9.5 ms | 13.6 ms | 86 |
| Navajo Point viewpoint | 9850 m | 0.12 km to 0.95 km | 120.60 | 119.93 | 9.6 ms | 33.8 ms | 90 |

Reproduce from the frontend workspace with `npm run perf -- grandcanyon-tablet --headed`.
