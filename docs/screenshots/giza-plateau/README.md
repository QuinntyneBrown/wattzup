# Giza Plateau from the saddle

Choose Giza Plateau in Map Select to ride Plateau Road. GCN Training’s The Pyramid keeps its ten stages and 23:00 duration. The 9.4 km circuit climbs 57 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Khafre approach, 0.08 km | [Before](before-khafre.jpg) | [After](after-khafre.jpg) | The polished casing stands above the stone courses. Real 01–04 and game 01. |
| Khufu, 1.43 km | [Before](before-khufu.jpg) | [After](after-khufu.jpg) | The Great Pyramid rises ahead of the sandy kerbs and guard shelter. Real 06–08, games 02–03. |
| Queens’ pyramids, 2.95 km | [Before](before-queens.jpg) | [After](after-queens.jpg) | Rough satellite pyramids and mastabas follow the turn. Real 03 and 14 and game 05. |
| Sphinx enclosure, 4.56 km | [Before](before-sphinx.jpg) | [After](after-sphinx.jpg) | The headdress, forepaws and long lion body sit beyond the temple stones. Real 10–11 and 13, game 04. |
| Panorama turnout, 6.82 km | [Before](before-panorama.jpg) | [After](after-panorama.jpg) | Camels carry woven saddle rugs beside the turnout. Real 02, 09 and 12, games 01 and 03. |
| Cairo approach, 9.12 km | [Before](before-city.jpg) | [After](after-city.jpg) | The circuit returns toward the pyramids and the hazed city edge. Real 04–06 and 15, game 02. |

Khufu, Khafre, Menkaure and the Great Sphinx occupy fixed positions. Sunlit treads, staggered masonry faces and a capped upper slope distinguish the pyramids. The original relief wraps the Sphinx’s stone head. The road bends past temple blocks, fallen masonry, saddle blankets, a moving horse cart and the northern edge of the city. Geometric dunes, baked long shadows and textured wind drifts keep the desert legible. The animal assemblies share geometry and materials and use ride time. [Credited references](../../worlds/giza/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Khafre approach | 0 m | 0.12 km to 0.95 km | 120.71 | 120.00 | 9.6 ms | 13.6 ms | 40 |
| Panorama turnout | 6570 m | 0.12 km to 0.95 km | 120.46 | 120.00 | 9.6 ms | 15.2 ms | 34 |

Reproduce from the frontend workspace with `npm run perf -- giza-tablet --headed`.
