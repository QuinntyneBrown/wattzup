# Torres del Paine from the saddle

The original GCN Training 30 Minute VO2 Max Session has 14 stages across 29:00. The 13.025 km Pehoé route climbs 146 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Pehoé gravel, 0.08 km | [Before](before-steppe.jpg) | [After](after-steppe.jpg) | Two wheel ruts and pale loose stone frame wind-bent tussocks on the golden steppe. Low shrubs and a layered lenticular cloud show the direction of the wind. Real 01–02 and 11. Games 02 and 04.. |
| Cuernos shore, 2.24 km | [Before](before-horns.jpg) | [After](after-horns.jpg) | Across a blue-green bay, almost black Cuernos caps top lighter granite buttresses. Glacier ice and windblown snow collect in the cleft. Real 03–05, 10 and 14. Games 01 and 03.. |
| Guanaco grazing ground, 4.57 km | [Before](before-herd.jpg) | [After](after-herd.jpg) | Several tawny guanacos graze beside the gravel, one upright with alert ears. Their slender legs and cream undersides stand out above the bent grass. Real 06, 09 and 12. Games 01–02.. |
| Salto Grande, 7.22 km | [Before](before-salto.jpg) | [After](after-salto.jpg) | A rocky lip carries turquoise upper water over a broken white curtain into the lower lake. Spray crosses the lip while the road follows the bank. Real 07–08 and 15. Games 03–04.. |
| Torres overlook, 9.82 km | [Before](before-towers.jpg) | [After](after-towers.jpg) | Three steep granite towers stand separately above moraine benches. A hanging glacier and snow apron occupy the shaded basin beneath them. Real 04, 11 and 13–14. Games 03 and 05.. |
| Lake Pehoé return, 12.54 km | [Before](before-pehoe.jpg) | [After](after-pehoe.jpg) | Whitecaps cross turquoise Pehoé in streaks under layered cloud. The long slant of the tussocks and the dark foothill cast shadows across the gravel. Real 03, 05, 07, 10 and 15. Games 04–05.. |

The gravel road passes bent coirón, dark-capped Cuernos across Lake Pehoé, grazing guanacos, Salto Grande and three pale granite towers. Whitecaps, grass, grazing and falling spray move on the ride clock. [Credited references](../../worlds/paine/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Pehoé gravel and windswept steppe | 0 m | 0.12 km to 0.95 km | 120.07 | 119.68 | 10.3 ms | 40.7 ms | 36 |
| Salto Grande and the lake narrows | 7020 m | 0.12 km to 0.95 km | 120.21 | 119.90 | 10.0 ms | 24.6 ms | 63 |

Reproduce from the frontend workspace with `npm run perf -- paine-tablet --headed`.
