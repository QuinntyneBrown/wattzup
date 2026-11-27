# Surfers Paradise from the saddle

GCN Sprint Surges retains its 24 stages, 32:00 duration and three-second video offset. The 13.2 km course climbs 10 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| The Esplanade, 0.12 km | [Before](before-esplanade.jpg) | [After](after-esplanade.jpg) | The rider follows a two-lane road between apartment balconies and the foreshore path. Parked cars, pandanus and tall palms break up the near edge of the sand. Real 01, 04, 09 and 12. Games 01 and 03.. |
| Q1 above the foreshore, 2.23 km | [Before](before-q1.jpg) | [After](after-q1.jpg) | Q1 rises above its neighbouring towers, with a sloping glass crown and a single long gold-tipped mast. White balcony slabs and turquoise glass separate the surrounding high-rises. Real 03, 05, 06 and 07. Games 01 and 03.. |
| Breakers and surfers, 4.42 km | [Before](before-surf.jpg) | [After](after-surf.jpg) | Long Pacific breakers advance across bands of wet sand. A board and surfer lift over a swell, with swimmers and cumulus beyond. Real 07 and 09–12. Games 02 and 04.. |
| Cavill Avenue arch, 6.63 km | [Before](before-cavill.jpg) | [After](after-cavill.jpg) | The curved steel Surfers Paradise arch spans the pedestrian entrance at Cavill Avenue. Its lettering reads above the path and the ocean shows through the opening. Real 01, 02 and 04. Games 01 and 05.. |
| Patrolled beach, 9.05 km | [Before](before-patrol.jpg) | [After](after-patrol.jpg) | Paired red-and-yellow flags mark the swimming area beside a raised lookout and warning signs. The cloth bends in the sea breeze above the reflective shore. Real 05, 07, 09 and 13. Games 04 and 05.. |
| Cavill Avenue station, 12.88 km | [Before](before-tram.jpg) | [After](after-tram.jpg) | A yellow and blue G:link tram passes the station platform. Glazed doors, articulations, paved track and overhead wire distinguish the tram corridor from the beachfront road. Real 08, 14 and 15. Games 01 and 03.. |

Apartment balconies lead toward the Q1 mast, with pandanus and palms along the beach. Breakers wash against the wet sand, a patrol flag moves at the lookout and a G:link tram passes the rider. The fixed city backdrop follows the approach used for Caribana. [Credited references](../../worlds/surfers/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| the beachfront Esplanade | 0 m | 0.12 km to 0.95 km | 119.08 | 118.72 | 9.8 ms | 249.9 ms | 72 |
| the breaking surf | 4210 m | 0.12 km to 0.95 km | 120.64 | 120.00 | 9.9 ms | 23.2 ms | 117 |

Reproduce from the frontend workspace with `npm run perf -- surfers-tablet --headed`.
