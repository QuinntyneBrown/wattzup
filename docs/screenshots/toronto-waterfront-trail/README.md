# Toronto Waterfront Trail from the saddle

The 30 Minute Sprint and Threshold HIIT class preserves 15 stages, a three-second offset and 30 minutes of riding. Its trail covers 13.075 km with 7 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Queens Quay trailhead, 0.14 km | [Before](before-trail.jpg) | [After](after-trail.jpg) | A red cycleway, square granite curbs and pale maple-leaf markers lead past summer joggers and bike-share riders. Real 01–03, 10–11 and games 01–02. |
| The Queens Quay streetcar, 2.63 km | [Before](before-streetcar.jpg) | [After](after-streetcar.jpg) | An articulated red streetcar rolls under overhead wires on its own rails, with glazed condo balconies on the north side. Real 01–03, 12 and games 01, 02 and 04. |
| Simcoe WaveDeck, 4.91 km | [Before](before-wavedeck.jpg) | [After](after-wavedeck.jpg) | Long curved timber ribs dip toward the harbour edge. The Rogers Centre dome and CN Tower rise behind the condo roofs. Real 01, 03–04, 12, 15 and games 03 and 05. |
| HTO Park, 7.05 km | [Before](before-hto.jpg) | [After](after-hto.jpg) | Canary-yellow parasols and Muskoka chairs stand in pale sand. Breezy water, railings and white sails separate the park from the islands. Real 04, 08, 11 and 14 and games 03–05. |
| Jack Layton Ferry Terminal, 9.88 km | [Before](before-ferry.jpg) | [After](after-ferry.jpg) | A double-ended white island ferry glides away from the landing with a wake. Lake Ontario extends past the low island shore. Real 05–06, 09, 12–13 and 15 and games 02–03. |
| Sugar Beach, 12.81 km | [Before](before-sugar.jpg) | [After](after-sugar.jpg) | Pink umbrellas and waterfront boardwalk seating open a final sightline across the harbour. Local pedestrians and cyclists use the red trail. Real 07–08, 12–15 and games 03 and 05. |

The waterfront uses the Caribana CN Tower geometry, the Rogers Centre dome, condo elevations and an open island skyline. A red articulated streetcar, a double-ended ferry and joggers follow the ride clock. Timber wave decking, granite pavers, maple-leaf markers and coloured beach umbrellas distinguish the near shore. [Credited references](../../worlds/toronto/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Martin Goodman Trail | 0 m | 0.12 km to 0.95 km | 120.41 | 120.00 | 9.8 ms | 16.5 ms | 125 |
| Jack Layton ferry landing | 9700 m | 0.12 km to 0.95 km | 120.15 | 120.00 | 9.8 ms | 16.9 ms | 126 |

Reproduce from the frontend workspace with `npm run perf -- toronto-tablet --headed`.
