# Montreal Jazz Fest from the saddle

GCN Training’s High Intensity, Short Rest runs for 22:03 across 9.695 km, retaining all 26 stages, zero video offset and 17 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Rue Sainte-Catherine, 0.08 km | [Before](before-rue.jpg) | [After](after-rue.jpg) | Historic stone shops and glass offices line a closed street. Terrace tables, food stalls and saxophone banners mark the approach to the festival. Real 01, 08 and 13. Games 01 and 03.. |
| Place des Festivals main stage, 1.76 km | [Before](before-stage.jpg) | [After](after-stage.jpg) | A broad black stage roof, truss legs, stacked speakers and coloured spots frame the live band. Spectators fill the front rail in staggered rows. Real 03–07 and 10. Games 02–03.. |
| Place des Arts and fountain court, 3.31 km | [Before](before-jets.jpg) | [After](after-jets.jpg) | Fountain jets rise from the plaza paving. The sloping theatre roof, tall bent white light masts and red lighting dots identify the Quartier des spectacles. Real 01, 04, 09 and 15. Games 02 and 04.. |
| Village pink-ball canopy, 4.89 km | [Before](before-canopy.jpg) | [After](after-canopy.jpg) | Pink strands sag across the narrow street. Shop awnings, warm windows and a bike-share dock give the overhead canopy scale. Real 02, 08 and 13. Games 03–04.. |
| Food kiosks and summer terrasses, 6.77 km | [Before](before-terrasse.jpg) | [After](after-terrasse.jpg) | Festivalgoers move between illuminated food stands, café terraces and a blue Métro entrance. A second set plays beyond the crowd. Real 05–06, 11–12 and 14. Games 02–03.. |
| Mount Royal cross street, 9.12 km | [Before](before-mount.jpg) | [After](after-mount.jpg) | A cross street opens onto wooded Mount Royal and its cross. Glass towers frame the hill as dusk deepens and the festival lights brighten. Real 01, 04, 08, 12 and 15. Games 01 and 05.. |

Rue Sainte-Catherine opens into the main stage and the Place des Arts fountain court. Crowds and musicians move to the set, the Village pink-ball canopy crosses the road, and the wooded Mount Royal ridge appears beyond a downtown cross street. [Credited references](../../worlds/montreal/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Rue Sainte-Catherine | 0 m | 0.12 km to 0.95 km | 120.46 | 119.98 | 9.9 ms | 17.7 ms | 38 |
| Place des Festivals main stage | 1630 m | 0.12 km to 0.95 km | 117.23 | 116.95 | 10.6 ms | 336.7 ms | 42 |

Reproduce from the frontend workspace with `npm run perf -- montreal-tablet --headed`.
