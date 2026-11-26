# Sea Point, Cape Town from the saddle

GCN Training’s 20/40 Interval Session retains its 27 stages, 20:00 duration and three-second video offset. The 8.45 km course climbs 10 m across two 4.225 km laps. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Sea Point Promenade, 0.08 km | [Before](before-promenade.jpg) | [After](after-promenade.jpg) | Beach Road runs beside a green lawn, broad concrete footway and metal seawall rail. Walkers, runners and a dog share the promenade. Real 01, 05, 09 and 14. Games 01 and 03.. |
| Atlantic rock pools, 0.69 km | [Before](before-saunders.jpg) | [After](after-saunders.jpg) | Atlantic breakers fold over exposed dark rock shelves. Green kelp fringes sheltered blue tidal pools below the rail. Real 03, 04, 10 and 11. Games 01 and 04.. |
| Sea Point Pavilion, 1.13 km | [Before](before-pavilion.jpg) | [After](after-pavilion.jpg) | The outdoor seawater pool sits between the promenade and the ocean, with swimming lanes, railings and a stepped spectator terrace. Real 05, 06, 09 and 14. Games 02 and 04.. |
| Mouille Point lighthouse, 1.94 km | [Before](before-mouille.jpg) | [After](after-mouille.jpg) | The square Green Point lighthouse has diagonal red stripes, a projecting white gallery and a glazed red lantern. Short buildings cluster around its base. Real 07, 08 and 14. Games 02 and 05.. |
| Lion’s Head and Signal Hill, 3.02 km | [Before](before-lionshead.jpg) | [After](after-lionshead.jpg) | The inland return looks up past palm trunks and the projecting balconies of white flats. A pointed granite cap rises above the long green shoulder of Signal Hill. Real 02–04, 08, 14 and 15. Games 01–03.. |
| Table Mountain, 7.87 km | [Before](before-table.jpg) | [After](after-table.jpg) | The flat summit and near-vertical sandstone faces of Table Mountain show past a gap in the apartment rows. A low tablecloth cloud spills over the ledge. Real 01, 08 and 15. Games 02, 03 and 05.. |

The seafront runs past rocky kelp shelves, the Pavilion pool and Green Point lighthouse before turning inland below Lion’s Head, Signal Hill and Table Mountain. The native mountains carry original relief portraits. Runners, swimmers and breaking water move on ride time. [Credited references](../../worlds/seapoint/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| promenade and rock pools | 0 m | 0.12 km to 0.95 km | 120.11 | 119.93 | 10.0 ms | 27.8 ms | 109 |
| Pavilion and lighthouse | 1340 m | 0.12 km to 0.95 km | 119.44 | 119.36 | 10.3 ms | 88.0 ms | 89 |

Reproduce from the frontend workspace with `npm run perf -- seapoint-tablet --headed`.
