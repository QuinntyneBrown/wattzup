# Prague Old Town from the saddle

GCN Training’s Ramp It Up: 50 Minute HIIT retains 20 stages, 50:00 duration and zero video offset. The 21.525 km Royal Way climbs 104 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Powder Tower gateway, 0.08 km | [Before](before-powder.jpg) | [After](after-powder.jpg) | The granite-sett road enters a pointed Gothic gateway beneath a steep dark roof and corner pinnacles. Pale stucco and mosaic pavements frame the portal. Real 02, 03 and 13. Games 01 and 02.. |
| Old Town Square, 3.64 km | [Before](before-square.jpg) | [After](after-square.jpg) | The lane opens onto the square. The two many-spired towers of Týn Church rise behind the arcades, the Jan Hus monument anchors the square and soap bubbles drift past sightseers. Real 04–08, 13 and 14. Games 02 and 03.. |
| Astronomical Clock, 6.12 km | [Before](before-orloj.jpg) | [After](after-orloj.jpg) | The gold astrolabe and painted calendar dial read as two distinct faces on the Old Town Hall wall. The Gothic chapel window and copper roof rise above a knot of visitors. Real 04, 06, 13 and 14. Games 01 and 03.. |
| Charles Bridge, 10.84 km | [Before](before-bridge.jpg) | [After](after-bridge.jpg) | The bridge crosses the Vltava on stone arches. Paired rows of Baroque figures on plinths frame the Gothic bridge tower. A passenger boat passes a low weir and swans swim beside the bridge. Real 01, 03, 09–11 and 15. Games 02 and 04.. |
| Nerudova climb, 16.48 km | [Before](before-nerudova.jpg) | [After](after-nerudova.jpg) | The road pitches uphill between tight pastel rows. Painted house signs stand over door portals, while a break in the roofline opens onto Malá Strana. Real 02, 10, 14 and 15. Games 01, 03 and 05.. |
| Hradčany overlook, 21.18 km | [Before](before-castle.jpg) | [After](after-castle.jpg) | The St Vitus spires and a long palace wing stand above a terrace. Red tile roofs, a verdigris dome and the river remain visible below the final ramp. Real 09–12, 14 and 15. Games 02, 04 and 05.. |

The Powder Tower opens onto cobbled lanes and Old Town Square. The astronomical dials, Charles Bridge statues, Nerudova climb and cathedral spires mark the Royal Way. Soap bubbles, an excursion boat and swans share the ride clock. [Credited references](../../worlds/prague/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Powder Tower and the cobbled lanes | 0 m | 0.12 km to 0.95 km | 120.28 | 119.89 | 9.9 ms | 29.2 ms | 33 |
| Charles Bridge statues and the Vltava | 10590 m | 0.12 km to 0.95 km | 119.72 | 119.60 | 9.9 ms | 134.6 ms | 92 |

Reproduce from the frontend workspace with `npm run perf -- prague-tablet --headed`.
