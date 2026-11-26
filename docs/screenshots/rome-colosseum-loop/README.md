# Rome Colosseum Loop from the saddle

GCN’s Fast Fitness: High Intensity 35 retains the original 41 stages, 33:30 duration and three-second video offset. Three physical circuits total 14.981 km and climb 48 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Piazza Venezia, 0.08 km | [Before](before-venezia.jpg) | [After](after-venezia.jpg) | The avenue opens beside the Vittoriano. Wide marble steps ascend to its deep colonnade and the two bronze quadrigas on its roof. Real 01, 02 and 13. Games 01 and 04.. |
| Trajan’s Market, 0.52 km | [Before](before-mercati.jpg) | [After](after-mercati.jpg) | A low parapet opens onto the excavated brick hemicycle, ranks of columns and the rectangular tower above the market. Tour groups move along the pavement. Real 01, 02, 11 and 12. Games 01 and 02.. |
| Via dei Fori Imperiali, 0.91 km | [Before](before-fori.jpg) | [After](after-fori.jpg) | The worn basalt fans of the wide straight lead towards the elliptical Colosseum. Deep arcades, broken upper walls and warm arch bays stand clear of the pines. Real 01–05 and 08. Games 02 and 03.. |
| Arch of Constantine, 1.37 km | [Before](before-costantino.jpg) | [After](after-costantino.jpg) | Beside the amphitheatre stands the marble arch with a high central opening, two lower passages, relief panels and a projecting attic. A guide raises an umbrella. Real 08–11 and 15. Games 03 and 04.. |
| Via di San Gregorio, 2.21 km | [Before](before-gregorio.jpg) | [After](after-gregorio.jpg) | Flat pine crowns rise above the Palatine brick ruins. A red Vespa and white taxi drive along the roadside with a clear lane for the rider. Real 04–07 and 14. Games 02 and 05.. |
| Piazza del Colosseo, 11.15 km | [Before](before-colosseo.jpg) | [After](after-colosseo.jpg) | On the third circuit the rider passes the same travertine piers, stacked arches and irregular rim at close range. Tourists and street sellers give the building scale. Real 03, 08–10 and 15. Games 01, 03 and 05.. |

Ride from the Vittoriano down Via dei Fori Imperiali past Trajan’s Market to the open arcades of the Colosseum and the Arch of Constantine. Umbrella pines frame the Palatine return. A tour guide, Vespa and taxi follow ride time. [Credited references](../../worlds/rome/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Piazza Venezia and the Vittoriano | 0 m | 0.12 km to 0.95 km | 119.86 | 119.50 | 9.9 ms | 104.4 ms | 77 |
| Colosseum arcade and tourist crowds | 1010 m | 0.12 km to 0.95 km | 119.67 | 119.50 | 10.1 ms | 80.3 ms | 63 |

Reproduce from the frontend workspace with `npm run perf -- rome-tablet --headed`.
