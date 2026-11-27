# Día de Muertos Parade from the saddle

GCN Training’s Spicy Maximum Minute Efforts retains 15 stages, 20:00 duration and zero video offset. The parade covers 8 km and climbs 23 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Paseo de la Reforma, 0.08 km | [Before](before-reforma.jpg) | [After](after-reforma.jpg) | A broad racing lane runs between marigold beds, mature trees, glass towers and lamps. The gilded Ángel glows above the boulevard. Real 01–02, 12 and 14. Games 01–03.. |
| Giant catrinas, 1.44 km | [Before](before-catrinas.jpg) | [After](after-catrinas.jpg) | Tall papier-mâché skeleton puppets in vivid dresses sway above the rail. A painted-face crowd gathers beneath the brim of the Catrina’s hat. Real 04–09. Games 02–03 and 05.. |
| Monarch dancers, 2.68 km | [Before](before-monarcas.jpg) | [After](after-monarcas.jpg) | Monarch dancers lift their veined orange wings over the marigold median. The road remains open between fans and performers. Real 03–04, 08 and 13. Games 03–04.. |
| Ángel de la Independencia, 3.96 km | [Before](before-angel.jpg) | [After](after-angel.jpg) | A winged gold figure crowns the fluted stone column beyond the flower-filled roundabout. Bronze statuary and the lit steps give its base scale. Real 01–02, 12 and 14. Games 01, 03 and 05.. |
| Alebrije float and lowriders, 5.52 km | [Before](before-alebrije.jpg) | [After](after-alebrije.jpg) | An illuminated alebrije floats above a rolling platform, followed by a lowrider. Spectators in calavera make-up fill the pavement. Real 06–07, 09–11 and 15. Games 02–04.. |
| Papel picado at night, 7.47 km | [Before](before-picado.jpg) | [After](after-picado.jpg) | Cut-paper flags arc across the avenue above lamps and warm float lights. Lit towers stand beyond the darker street trees. Real 02, 05, 10–11, 13 and 15. Games 01–03.. |

Marigolds line the median along Paseo de la Reforma. Catrinas sway, monarch dancers turn and an alebrije float and lowrider advance past the gilded Ángel. Papel picado and glass towers stand above the painted-face crowd as dusk gives way to night. [Credited references](../../worlds/muertos/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Paseo de la Reforma | 0 m | 0.12 km to 0.95 km | 119.73 | 119.33 | 9.9 ms | 159.2 ms | 38 |
| Alebrije float and lowriders | 5400 m | 0.12 km to 0.95 km | 120.30 | 119.97 | 9.9 ms | 24.5 ms | 63 |

Reproduce from the frontend workspace with `npm run perf -- muertos-tablet --headed`.
