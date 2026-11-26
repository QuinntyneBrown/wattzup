# Mount Tamalpais from the saddle

GCN’s 30 Minute Hill Climb Training retains fourteen stages, the 30:13 duration and the three-second video offset. The 12.149 km Panoramic Highway climbs 634 m to the 784 m East Peak. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Muir Woods approach, 0.12 km | [Before](before-redwoods.jpg) | [After](after-redwoods.jpg) | Furrowed redwood trunks rise beside the striped two-lane road, with cool shade, fern banks, a timber rail and pools of sunlight. Real 03, 08 and 09. Games 01 and 02.. |
| Panoramic Highway, 2.31 km | [Before](before-riders.jpg) | [After](after-riders.jpg) | A club group pedals through the uphill bend. Its jerseys stand out against the red bark and the dark cut bank. Real 01, 08 and 09. Games 01, 03 and 05.. |
| Marine inversion, 4.77 km | [Before](before-fog.jpg) | [After](after-fog.jpg) | Fog curls around the shoulder below the road. The crest, oak and red-barked manzanita stay clear against the golden grass. Real 02, 05, 06 and 15. Games 03 and 04.. |
| Golden Gate turnout, 6.95 km | [Before](before-gate.jpg) | [After](after-gate.jpg) | A timber rail overlooks the two vermilion towers above the fog, with the San Francisco skyline and bay beyond. Real 01, 02, 06 and 13. Games 03 and 04.. |
| Ridgecrest Boulevard, 9.42 km | [Before](before-stinson.jpg) | [After](after-stinson.jpg) | The land drops away through chaparral to the arc of Stinson Beach. Thin lines of surf move onto the sand below the ridge. Real 07, 10–12 and 15. Games 03 and 05.. |
| East Peak, 11.92 km | [Before](before-lookout.jpg) | [After](after-lookout.jpg) | A glass-walled fire lookout and its railed walkway stand on the East Peak rocks above a gravel turnout and trailhead sign. Real 04, 12–14. Games 02 and 03.. |

Four riders use the Ride One cyclist kit on the lower bends. Textured redwood bark, golden grass and branching manzanita distinguish the two elevations. The fixed Golden Gate towers, Stinson shore and Gardner Lookout retain their positions while cloud, surf and cyclists move on ride time. The foreground riders and distant landmarks follow the layering used in Caribana. [Credited references](../../worlds/tamalpais/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Muir Woods approach | 0 m | 0.12 km to 0.95 km | 120.23 | 119.93 | 9.9 ms | 25.6 ms | 49 |
| Golden Gate turnout | 6730 m | 0.12 km to 0.95 km | 119.70 | 119.22 | 10.2 ms | 61.3 ms | 56 |

Reproduce from the frontend workspace with `npm run perf -- tamalpais-tablet --headed`.
