# Avenida 9 de Julio from the saddle

GCN Training’s High Power Anaerobic Sprints retains all 24 original stages and the zero video offset. The 40-minute race covers 18 km and climbs 49 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Avenida 9 de Julio, 0.08 km | [Before](before-avenida.jpg) | [After](after-avenida.jpg) | Seven paved lanes fan out beside the central Metrobus corridor. Long dashed lines, billboard crowns and jacarandas frame the sprint. Real 01, 03, 05 and 14. Games 01 and 05.. |
| Metrobus station, 3.21 km | [Before](before-metrobus.jpg) | [After](after-metrobus.jpg) | A colectivo runs beside the red-roofed platforms. The boarding islands carry shelter columns, handrails, stop names and waiting passengers. Real 02, 04, 08–11 and 15. Games 03 and 05.. |
| Ministry of Health, 6.74 km | [Before](before-evita.jpg) | [After](after-evita.jpg) | The steel outline of Eva Perón spans the Ministry’s pale window grid. Passing taxis and palms establish its height above the avenue. Real 04, 12 and 14. Games 01 and 02.. |
| Teatro Colón, 9.78 km | [Before](before-colon.jpg) | [After](after-colon.jpg) | The opera house’s pediment, arched windows, pilasters and stone cornices rise above the planted side plaza. Purple jacarandas shade the pavement. Real 03, 06 and 13. Games 01 and 02.. |
| Multi-stage crossing, 13.62 km | [Before](before-cruce.jpg) | [After](after-cruce.jpg) | Long zebra crossings break at the raised median islands. Pedestrians wait by signal posts as taxis, buses and motorbikes stream past. Real 02, 04, 06, 08–10. Games 03–05.. |
| Plaza de la República, 17.53 km | [Before](before-obelisco.jpg) | [After](after-obelisco.jpg) | The four-sided Obelisco rises 67 metres over the plaza, tapering toward the pyramidal tip. Evening lights gather along its base and the surrounding avenues. Real 01, 03, 05–07, 11 and 15. Games 01, 02 and 04.. |

Seven traffic lanes flank the Metrobus corridor, where colectivos stop at red platform roofs. Black-and-yellow taxis, a motorbike and pedestrians move through the crossing islands. The steel Evita portrait, Teatro Colón and jacaranda-lined plazas lead to the 67-metre Obelisco at dusk. [Credited references](../../worlds/nuevedejulio/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Avenida traffic and billboards | 0 m | 0.12 km to 0.95 km | 120.08 | 119.97 | 10.1 ms | 25.1 ms | 201 |
| Plaza de la República at dusk | 17400 m | 0.12 km to 0.95 km | 120.18 | 119.95 | 10.1 ms | 23.7 ms | 160 |

Reproduce from the frontend workspace with `npm run perf -- nuevedejulio-tablet --headed`.
