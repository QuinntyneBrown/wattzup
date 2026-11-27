# Lisbon Tram Hills from the saddle

GCN Training’s 15 Minute Strength Workout provides sixteen stages over 15:00 and 6,337.5 m. The three-second video offset is preserved. The course climbs 193 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Tram 28 lane, 0.08 km | [Before](before-tram.jpg) | [After](after-tram.jpg) | A yellow Remodelado takes the bend beneath the contact wire. Twin steel rails follow the polished calçada through the lane. Real 01–04, 06 and 12 and games 03 and 05. |
| Sé Cathedral, 1.04 km | [Before](before-se.jpg) | [After](after-se.jpg) | The cathedral’s two square towers and recessed rose window close the street. An escadinha branches away from its sunlit forecourt. Real 04, 07 and 10 and games 01 and 04. |
| Alfama beco, 2.18 km | [Before](before-beco.jpg) | [After](after-beco.jpg) | Blue and green azulejos, iron balconies and hanging laundry frame a stepped side alley. Locals gather beside café tables beneath bougainvillea. Real 05 and 07–11 and games 03–05. |
| Santa Luzia, 3.36 km | [Before](before-luzia.jpg) | [After](after-luzia.jpg) | A blue-tiled parapet and flowering pergola open onto terracotta ridges and the broad Tagus. Real 03, 08, 11 and 13 and games 01–02. |
| Portas do Sol, 4.70 km | [Before](before-portas.jpg) | [After](after-portas.jpg) | Low roofs descend from the terrace toward the river. São Vicente’s paired white towers rise above them. Real 05, 09 and 13–14 and games 02 and 04. |
| Castelo de São Jorge, 6.02 km | [Before](before-castelo.jpg) | [After](after-castelo.jpg) | Crenellated stone walls climb to a square keep beyond the final bend. A shaded arch opens beneath the battlements. Real 13–15 and games 01–02. |

The lanes follow polished limestone setts, twin rails and overhead wire. Yellow Remodelado trams travel on those rails. The two churches, São Jorge’s crenellations and the two miradouros occupy fixed locations among the roofs above the Tagus. Suspended laundry and pedestrians follow race time. Tiled façades and bougainvillea retain the restrained street composition requested in rider feedback #931. [Credited references](../../worlds/lisbon/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Tram 28 in Alfama | 0 m | 0.12 km to 0.95 km | 116.92 | 116.78 | 11.8 ms | 131.8 ms | 50 |
| Santa Luzia and the Tagus | 3100 m | 0.12 km to 0.95 km | 119.13 | 118.97 | 10.5 ms | 76.5 ms | 44 |

Reproduce from the frontend workspace with `npm run perf -- lisbon-tablet --headed`.
