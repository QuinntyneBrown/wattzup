# Okinawa Coast Road from the saddle

Spin Those Legs retains its 13 original stages and zero video offset. The 40-minute course covers 16.88 km and climbs 56 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Route 58, 0.08 km | [Before](before-route58.jpg) | [After](after-route58.jpg) | An orange centre line curves between the coral seawall and subtropical greenery. A Japanese route shield stands at the edge of the village. Real 01, 05, 06 and 15. Games 01 and 03.. |
| Shisa village, 2.76 km | [Before](before-shisa.jpg) | [After](after-shisa.jpg) | A pair of shisa guard the red-tiled house and coral-stone gate. Pandanus and cycads break up the roofline against Yanbaru’s green hills. Real 01, 05 and 06. Games 01–03.. |
| Kouri Bridge, 5.47 km | [Before](before-kouri.jpg) | [After](after-kouri.jpg) | The bridge carries the road on a long low deck above clear shallows. Repeated piers and the distant island reveal the full crossing. Real 02–04, 07 and 14. Games 01 and 04.. |
| Mushroom islets, 8.91 km | [Before](before-rocks.jpg) | [After](after-rocks.jpg) | Limestone islets with narrow eroded feet stand in pale aqua water. Dark reef patches remain visible in the lagoon around their bases. Real 09, 12 and 13. Games 02 and 05.. |
| Coral beach, 11.83 km | [Before](before-beach.jpg) | [After](after-beach.jpg) | Fine white sand slopes into the lagoon. Parasols and swimmers sit below the road and the water deepens from pale aqua to blue. Real 08, 11–13 and 15. Games 03–05.. |
| Cape Manzamo, 16.19 km | [Before](before-manzamo.jpg) | [After](after-manzamo.jpg) | The grass-covered headland ends in a limestone elephant trunk. Deep water and pale foam show through the opening beneath its arch. Real 05, 09, 10 and 15. Games 02 and 05.. |

Route 58 passes shisa guardians and red-tiled houses before the 1,960-metre Kouri Bridge. Mushroom islets, swimmers and the grass-capped limestone arch at Cape Manzamo rise above the coral lagoon. [Credited references](../../worlds/okinawa/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Route 58 and the coral village | 0 m | 0.12 km to 0.95 km | 120.32 | 119.97 | 9.8 ms | 21.0 ms | 37 |
| Kouri Bridge over the lagoon | 5370 m | 0.12 km to 0.95 km | 119.62 | 119.37 | 9.9 ms | 95.7 ms | 37 |

Reproduce from the frontend workspace with `npm run perf -- okinawa-tablet --headed`.
