# St. Patrick’s Day, Dublin from the saddle

GCN Training’s 30 Second Sprints keeps all seventeen stages, its 30:01 duration and the three-second video offset. O’Connell Street is extended to the class distance of 12.006 km, with 11 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Luas median, 0.12 km | [Before](before-median.jpg) | [After](after-median.jpg) | Steel Luas rails run beside the planted median. Pale March light picks out wet wheel tracks, overhead wires, plane trees and tricolour bunting. Real 06, 07 and 09. Games 01 and 04.. |
| The Spire, 2.18 km | [Before](before-spire.jpg) | [After](after-spire.jpg) | The Spire rises from its broad brushed-steel base to a needle point 120 metres above the stone island. The street turns just enough to separate its silhouette from the flags. Real 07, 09 and 15. Games 02 and 05.. |
| General Post Office, 4.29 km | [Before](before-gpo.jpg) | [After](after-gpo.jpg) | Six Ionic columns cast shadows beneath the GPO pediment. Across the street, a projecting clock and recessed shop windows mark Clerys. Real 06, 08 and 10. Games 03 and 05.. |
| Pipe band, 6.58 km | [Before](before-band.jpg) | [After](after-band.jpg) | Pipers in dark tunics, patterned kilts and tall caps march in ranks. Drones, upright bass drums and moving drumsticks stand above rows of spectators in green behind steel barriers. Real 01, 02, 04 and 05. Games 01 and 03.. |
| Parade puppet, 8.71 km | [Before](before-puppet.jpg) | [After](after-puppet.jpg) | An oversized puppet nods above a rolling float. Spectators wave Irish flags beside a camera platform and a temporary grandstand. Real 03, 11, 12 and 14. Games 01 and 04.. |
| O’Connell Bridge, 11.79 km | [Before](before-liffey.jpg) | [After](after-liffey.jpg) | The bronze O’Connell Monument marks the bridge approach. Stone balusters and lanterns open onto the Liffey; the shopfronts drop away until the opposite quay. Real 09, 10, 13 and 15. Games 02 and 05.. |

The tapered Spire, six-column GPO and monument stand above the Luas median and Liffey bridge. Original Dublin shopfronts and parade spectators give the street its middle distance, while nearby flags, drummers, pipers and a giant puppet move on the ride clock. The reference technique comes from Caribana’s fixed Toronto skyline and batched near figures. [Credited references](../../worlds/stpatricks/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Luas median and Spire | 0 m | 0.12 km to 0.95 km | 120.44 | 119.96 | 9.8 ms | 20.9 ms | 34 |
| marching pipe band | 6360 m | 0.12 km to 0.96 km | 120.69 | 119.94 | 9.8 ms | 40.6 ms | 24 |

Reproduce from the frontend workspace with `npm run perf -- stpatricks-tablet --headed`.
