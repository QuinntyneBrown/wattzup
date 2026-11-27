# San Fermín, Pamplona from the saddle

Sprint Sprint Sprint retains 27 historical stages across 22:00 with a three-second video offset. The 9.133 km route climbs 29 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Santo Domingo approach, 0.08 km | [Before](before-corral.jpg) | [After](after-corral.jpg) | Double rows of timber barricades enclose the first sprint. Red pañuelos stand out against white shirts behind the rails. A medic and police officer occupy a fence opening. Real 01, 07–08 and 10. Games 01 and 02.. |
| Plaza Consistorial, 1.54 km | [Before](before-ayuntamiento.jpg) | [After](after-ayuntamiento.jpg) | The narrow approach opens onto the baroque Ayuntamiento. A layered stone pediment, balconies and hanging flags stand above the crowd. Real 05–06 and 09–10. Games 04 and 05.. |
| Mercaderes turn, 3.16 km | [Before](before-mercaderes.jpg) | [After](after-mercaderes.jpg) | The marked right-angle turn into Calle Estafeta follows the wall and its two street plaques. Timber barriers protect the outside of the corner. Real 03–04, 07 and 15. Games 02–03.. |
| Calle Estafeta, 5.02 km | [Before](before-estafeta.jpg) | [After](after-estafeta.jpg) | Four- and five-storey houses close around the wet stone street. Their iron balconies are packed with spectators and red scarves, with warm light reaching only the upper floors. Real 02–04, 08 and 09. Games 01 and 03.. |
| Telefónica barriers, 7.17 km | [Before](before-telefonica.jpg) | [After](after-telefonica.jpg) | Sashed runners pass waving spectators at the double fence. Damp setts and scattered fiesta confetti lead toward the bullring. Real 01, 07–08 and 12. Games 01 and 04.. |
| Callejón entrance, 8.92 km | [Before](before-ruedo.jpg) | [After](after-ruedo.jpg) | The open entrance tunnel disappears beneath the brick and stone bullring. A glimpse of the ochre arena and the rings of red-and-white spectators draws the rider forward. Real 10–11 and 14. Games 02 and 05.. |

The double barricades open onto Plaza Consistorial before a measured right-angle turn on to Calle Estafeta. Balconies, runners, scarves and confetti lead to the open callejón at the Plaza de Toros. [Credited references](../../worlds/pamplona/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| the Santo Domingo barricades | 0 m | 0.12 km to 0.95 km | 120.17 | 119.81 | 10.4 ms | 43.4 ms | 75 |
| packed balconies on Calle Estafeta | 4810 m | 0.12 km to 0.95 km | 119.84 | 119.51 | 10.4 ms | 71.5 ms | 118 |

Reproduce from the frontend workspace with `npm run perf -- pamplona-tablet --headed`.
