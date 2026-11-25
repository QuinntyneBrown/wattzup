# Atacama Desert from the saddle

Choose Atacama Desert in Map Select. The original 13 stages of GCN’s *Extreme Fat Burning Class* run for 50:00 and cover 21.275 km. The road rises 15 m across the alluvial fans. The five matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Open salar, 0.08 km | [Before](before-salar.jpg) | [After](after-salar.jpg) | The road vanishes across pale crust beneath Licancabur. Real 01–06, 12 and 14, games 01–02. |
| Chaxa, 1.18 km | [Before](before-chaxa.jpg) | [After](after-chaxa.jpg) | A narrow wet margin and rose-coloured birds break up the salt pan. Real 07–09, game 04. |
| Dry shore, 2.01 km | [Before](before-vicunas.jpg) | [After](after-vicunas.jpg) | Vicuñas graze on the right between the road and the volcanic slopes. Real 01–04 and 13–15 give the setting, game 05 the riding scale. |
| Valle de la Luna, 4.56 km | [Before](before-valley.jpg) | [After](after-valley.jpg) | Stratified ridges with scalloped crowns rise beside the road. Real 10–11, game 03. |
| Miscanti, 8.62 km | [Before](before-miscanti.jpg) | [After](after-miscanti.jpg) | The second blue lagoon lies to the left opposite the dry eastern bank. Real 07, 13–15, games 04–05. |

The cone of Licancabur and its neighbouring ridges occupy fixed positions like Caribana’s Toronto skyline. Original salt plates tile in physical metres and the distant road carries a thin, shifting band of heat haze. The sky stays clear. A single shared instance buffer draws feeding flamingos at the lagoons or grazing vicuñas on the dry shore. A pause holds their current pose. The wet bird reflections use two flattened shapes apiece. [Credited references](../../worlds/atacama/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| open salar | 0 m | 0.12 km to 0.95 km | 119.39 | 119.04 | 10.5 ms | 77.3 ms | 30 |
| Chaxa lagoon | 890 m | 0.12 km to 0.96 km | 119.90 | 119.47 | 10.4 ms | 68.7 ms | 21 |

Reproduce from the frontend workspace with `npm run perf -- atacama-tablet --headed`.
