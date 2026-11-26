# Saguaro Desert from the saddle

GCN’s Burn Fat Fast retains its 42 stages, 24:40 duration and three-second video offset. The 10.748 km loop climbs 203 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Cactus Forest Drive entrance, 0.08 km | [Before](before-entrada.jpg) | [After](after-entrada.jpg) | A brown park sign marks the entrance to the narrow one-way loop. Ribbed saguaros stand above loose red gravel with the Rincon ridgeline beyond. Real 01–03 and 06. Games 01–03.. |
| Dawn cactus stand, 1.21 km | [Before](before-dawn.jpg) | [After](after-dawn.jpg) | Several differently branched saguaros break the orange-pink horizon. Long shadows cross the pavement, a hawk perches on one arm and a balloon drifts beyond the ridge. Real 07–09, 11 and 14–15. Games 03 and 04.. |
| Sandy wash crossing, 2.68 km | [Before](before-wash.jpg) | [After](after-wash.jpg) | The undulating drive descends into a sandy arroyo. A dip warning and low masonry culvert announce the crossing; a roadrunner moves near the shoulder. Real 01, 03–05 and 13. Games 02 and 05.. |
| Cactus forest rollers, 4.81 km | [Before](before-garden.jpg) | [After](after-garden.jpg) | Tall green saguaros with crooked arms and deep ribs surround the bend. Prickly pear pads, cholla and red-tipped ocotillo grow under palo verde between rocky rollers. Real 03, 10–13 and 15. Games 02–05.. |
| Stone picnic ramada, 7.32 km | [Before](before-ramada.jpg) | [After](after-ramada.jpg) | At the bollarded gravel pullout a low stone ramada shelters a picnic table. A pair of quail walks across the foreground beneath the palo verde canopy. Real 02, 04–05, 10 and 13. Games 01 and 05.. |
| Rincon overlook, 9.74 km | [Before](before-rincon.jpg) | [After](after-rincon.jpg) | A sweeping descent turns towards successive blue-grey ridges. Side-lit saguaros and ocotillo frame the valley from the pullout before the return to the entrance. Real 03–05, 08–10 and 14–15. Games 02–04.. |

Follow the entrance sign through the giant cactus groves to the dry wash, ramada and Rincon overlook. The sunrise clears over fixed mountain ridges while a roadrunner, quail and perched hawk move on ride time. [Credited references](../../worlds/saguaro/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| park entrance and dawn saguaros | 0 m | 0.12 km to 0.95 km | 120.45 | 120.00 | 9.8 ms | 14.4 ms | 43 |
| cactus forest rollers | 4610 m | 0.12 km to 0.95 km | 120.46 | 119.99 | 9.8 ms | 24.9 ms | 29 |

Reproduce from the frontend workspace with `npm run perf -- saguaro-tablet --headed`.
