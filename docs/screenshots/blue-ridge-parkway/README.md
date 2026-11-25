# Blue Ridge Parkway from the saddle

Select Blue Ridge Parkway in Map Select to ride the original 13 stages of FTP Booster Extended Efforts (GCN Training), 55:00 and 24.250 km. The physical course climbs 391 m and follows a condensed sequence of Appalachian landmarks. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Memphis Ridge overlook, 0.07 km | [Before](before-overlook.jpg) | [After](after-overlook.jpg) | The timber sign, stone parapet and layered horizon identify the Parkway. Real 05, 07, 09–12 and 14, games 01 and 02. |
| Linn Cove approach, 1.15 km | [Before](before-viaduct.jpg) | [After](after-viaduct.jpg) | The curved deck, repeated piers and crown colours reference real 02, 03, 06 and 15. Games 04 and 05 inform riding sightlines. |
| Creek crossing, 2.23 km | [Before](before-arch.jpg) | [After](after-arch.jpg) | The stone arch crosses a wooded draw. Real 01, 07 and 09, games 01 and 04. |
| Rock tunnel approach, 4.83 km | [Before](before-tunnel.jpg) | [After](after-tunnel.jpg) | The open bore sits beneath a pale masonry ring with changing light at its portals. Real 04, 07 and 08, games 04 and 05. |
| Mabry Mill pond, 6.15 km | [Before](before-mill.jpg) | [After](after-mill.jpg) | The timber buildings, waterwheel and pond follow real 13, with canopy and autumn light from real 01 and 09 and games 01–03. |
| Grandview overlook, 13.21 km | [Before](before-ridge.jpg) | [After](after-ridge.jpg) | Morning mist lies under the blue ridges and autumn hardwoods. Real 05, 08, 10–12 and 14, games 02–04. |

Like Caribana’s tower and skyline, the ridgelines are fixed behind closer autumn trees and stonework. The Linn Cove deck follows the course in short segments over a cut ravine. Stone voussoirs surround a real tunnel bore, with a separate masonry bridge over a creek. Maples, hickories and oaks use different crowns and colours above laurel, split rails and grassy slopes. The mill’s timber wheel and its pond reflection rotate together on ride time. Bounded mist banks drift in the valley and hold on pause. The locations are brought together to fit the length of the original workout. [Credited references](../../worlds/blueridge/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Linn Cove Viaduct | 970 m | 0.12 km to 0.95 km | 120.24 | 119.87 | 9.9 ms | 34.2 ms | 30 |
| Mabry Mill pond and wheel | 5950 m | 0.11 km to 0.95 km | 120.54 | 120.00 | 9.6 ms | 12.5 ms | 32 |

Reproduce from the frontend workspace with `npm run perf -- blueridge-tablet --headed`.
