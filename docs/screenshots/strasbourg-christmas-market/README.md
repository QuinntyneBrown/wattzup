# Strasbourg Christmas Market from the saddle

GCN Training’s Festive Spin With Surprise Sprints retains all twenty-two stages, the 25:00 duration and zero video offset. The 10.15 km Grande Île itinerary climbs 10 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Garland lane, 0.12 km | [Before](before-garlands.jpg) | [After](after-garlands.jpg) | Golden star garlands cross a narrow sandstone lane. The damp cobbles carry short broken highlights between the coloured timber frames. Real 01, 02, 07 and 09. Games 01, 03 and 04.. |
| Cathedral square, 1.83 km | [Before](before-cathedral.jpg) | [After](after-cathedral.jpg) | The asymmetrical pink sandstone west front rises above the market roofs. One tall openwork spire, its rose window and recessed portals stand in warm floodlight against the deep blue sky. Real 03, 06, 08 and 12. Games 01 and 03.. |
| Market chalets, 3.57 km | [Before](before-chalets.jpg) | [After](after-chalets.jpg) | Low wooden chalets display gingerbread hearts, bredele and painted ornaments beneath pine garlands. Steam lifts from a hot-drink stall beside winter shoppers. Real 03, 04, 07, 10 and 11. Games 02 and 05.. |
| Rue Mercière, 5.32 km | [Before](before-merciere.jpg) | [After](after-merciere.jpg) | Large teddy bears and wrapped gifts cling to projecting half-timbered upper floors. Illuminated blue-and-gold angel motifs cross above the cyclists. Real 01, 08, 09 and 15. Games 01 and 02.. |
| Place Kléber, 7.21 km | [Before](before-kleber.jpg) | [After](after-kleber.jpg) | The square opens to the enormous fir. Warm bulbs, baubles and the star brighten the branches; shoppers in hats and scarves gather at its foot. Real 05, 10 and 13. Games 03 and 05.. |
| Ponts Couverts, 9.87 km | [Before](before-ill.jpg) | [After](after-ill.jpg) | The route follows the Ill to the stone bridge. The defensive towers break the low skyline, and reflections of the towers and amber lamps ripple in the dark water. Real 09 and 14. Games 04 and 05.. |

The pink sandstone cathedral and Place Kléber fir stand above the timbered lanes. Original stall artwork, shoppers and overhead lights carry into the foreground. Steam, tree lights and reflections on the Ill follow the ride clock. Caribana’s fixed skyline and repeated street detail inform the scale and separation of the market squares and canal. [Credited references](../../worlds/strasbourg/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| the garland lane | 0 m | 0.12 km to 0.96 km | 119.69 | 119.19 | 10.0 ms | 139.3 ms | 39 |
| the Place Kléber tree | 6980 m | 0.12 km to 0.95 km | 118.93 | 118.65 | 10.5 ms | 268.2 ms | 41 |

Reproduce from the frontend workspace with `npm run perf -- strasbourg-tablet --headed`.
