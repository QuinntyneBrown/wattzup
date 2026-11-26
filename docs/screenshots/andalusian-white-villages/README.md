# Andalusian White Villages from the saddle

GCN Training’s Aerobic Efforts: Drop Ollie Like a Boss retains 22 stages, 50:04 duration and zero video offset. The 21.377 km route climbs 382 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Olive road, 0.08 km | [Before](before-groves.jpg) | [After](after-groves.jpg) | Silver olive rows follow the ochre contours beside narrow edge-painted asphalt. The stone wall curves past a break in the orchard, framing distant white houses. Real 01, 04, 14 and 15. Games 01 and 02.. |
| Zahara de la Sierra, 3.42 km | [Before](before-zahara.jpg) | [After](after-zahara.jpg) | A square Moorish keep crowns a jagged rock above stacked white roofs, while the road stays low enough to read the castle against the sky. Real 02, 03, 08 and 09. Games 01 and 04.. |
| Zahara-El Gastor reservoir, 6.21 km | [Before](before-reservoir.jpg) | [After](after-reservoir.jpg) | The verge drops away to uneven turquoise coves. A small boat crosses the water below olive terraces, and the distant shoreline stays fixed behind it. Real 03, 08 and 09. Games 01 and 05.. |
| Grazalema pass, 10.66 km | [Before](before-grazalema.jpg) | [After](after-grazalema.jpg) | Oak and pinsapo forest frame the mountain bend. The village appears as a band of white walls against the tilted limestone layers of the sierra. Real 01, 04, 10 and 15. Games 01 and 03.. |
| Puente Nuevo and El Tajo, 15.47 km | [Before](before-ronda.jpg) | [After](after-ronda.jpg) | Before the crossing the rider sees the tall central arch of Puente Nuevo and its upper openings between sheer cliffs. Houses line the rim, with the river far below the bridge deck. Real 11–14. Games 03 and 04.. |
| Olvera white streets, 20.91 km | [Before](before-olvera.jpg) | [After](after-olvera.jpg) | Iron grilles, hanging geraniums and terracotta pots border a tight whitewashed lane. Beyond it the bell tower, red tile roofs and ruined keep share the hilltop skyline. Real 02, 05–08, 12 and 15. Games 02–05.. |

White houses climb to the Moorish keep above Zahara. Grazalema sits beneath limestone crags beyond the turquoise reservoir. The road approaches Puente Nuevo across a ravine before traversing its physical deck. The reservoir boat, griffon and Olvera bell follow ride time. [Credited references](../../worlds/pueblos/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| olive road and limestone walls | 0 m | 0.12 km to 0.95 km | 120.59 | 120.00 | 9.7 ms | 15.1 ms | 35 |
| Puente Nuevo gorge approach | 15270 m | 0.11 km to 0.95 km | 120.40 | 120.00 | 9.8 ms | 15.0 ms | 51 |

Reproduce from the frontend workspace with `npm run perf -- pueblos-tablet --headed`.
