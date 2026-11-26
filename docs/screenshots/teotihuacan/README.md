# Teotihuacán from the saddle

Threshold Pyramid runs for 50 minutes over 22.275 km and 39 m of climbing. Its 16 stages retain the historic resistance and cadence targets and three-second video offset. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| La Ciudadela, 0.14 km | [Before](before-ciudadela.jpg) | [After](after-ciudadela.jpg) | Serpent heads project from the sloped masonry of the southern enclosure. The first platform leaves an open sightline north. Real 10, 12–14 and game 01. |
| Calzada de los Muertos, 4.20 km | [Before](before-avenue.jpg) | [After](after-avenue.jpg) | Parallel platforms frame a straight strip of packed earth. Low agave and nopal grow in the verges below the distant ridge. Real 01–05, 14–15 and games 03 and 05. |
| Pirámide del Sol, 8.48 km | [Before](before-sun.jpg) | [After](after-sun.jpg) | Five broad levels rise around the central stair on the east side. Recessed masonry and small chinking stones catch the morning light. Real 06, 08–10 and game 02. |
| Morning balloons, 12.78 km | [Before](before-balloons.jpg) | [After](after-balloons.jpg) | Striped balloons drift across the mountain silhouette, well above the low terraces. Their envelopes, ropes and baskets read against the clouds. Real 03, 06, 11 and games 02 and 03. |
| The vendors’ court, 17.45 km | [Before](before-market.jpg) | [After](after-market.jpg) | A hat seller and visitors animate the edge of the avenue beside craft blankets, shaded tables and a pepper tree. Real 07, 10–13 and game 04. |
| Plaza de la Luna, 22.05 km | [Before](before-moon.jpg) | [After](after-moon.jpg) | The spreading staircase and nested platforms of the Moon pyramid close the avenue below Cerro Gordo. Real 01, 05, 12, 14–15 and games 01 and 05. |

Original relief, volcanic masonry, scrub and market artwork distinguish the old city. The fixed Sun and Moon pyramids stand beyond the staggered platforms. Coloured balloons, ascending visitors and a vendor lifting a hat follow the ride clock. [Credited references](../../worlds/teotihuacan/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| southern enclosure | 0 m | 0.12 km to 0.95 km | 120.66 | 119.97 | 9.7 ms | 22.7 ms | 44 |
| Sun pyramid | 8300 m | 0.12 km to 0.95 km | 120.36 | 119.90 | 9.9 ms | 31.9 ms | 58 |

Reproduce from the frontend workspace with `npm run perf -- teotihuacan-tablet --headed`.
