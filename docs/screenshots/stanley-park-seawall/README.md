# Stanley Park Seawall from the saddle

GCN Training’s 15 Minute Beginner Session retains its 12 stages, 15:00 duration and three-second video offset. The 6.2 km seawall climbs 31 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Seawall cycle path, 0.10 km | [Before](before-seawall.jpg) | [After](after-seawall.jpg) | A white line and bicycle markings follow the camber of the narrow path above coursed stone. The footpath and dark tidal rocks face open water on the right, with cedars inland. Real 01, 03 and 14. Games 01 and 04.. |
| Brockton Point poles, 1.09 km | [Before](before-brockton.jpg) | [After](after-brockton.jpg) | A break in the cedar wall reveals tall painted wooden poles of different heights in the clearing. Visitors gather on the path below the broad wings. Real 07 and 08. Games 01 and 04.. |
| Brockton Point light, 2.04 km | [Before](before-light.jpg) | [After](after-light.jpg) | The squat white lighthouse has a broad red band and lantern on its headland. A sailor trims the boom on a boat just off the seawall. Real 01, 02 and 10. Games 01 and 05.. |
| Burrard Inlet, 3.22 km | [Before](before-inlet.jpg) | [After](after-inlet.jpg) | A freighter moves across cool blue water in front of successive forested North Shore ridges. Kelp, tide pools and wet stones mark the waterline. Real 04–06, 10 and 11. Games 02 and 03.. |
| Siwash Rock, 4.48 km | [Before](before-siwash.jpg) | [After](after-siwash.jpg) | A solitary tree leans over a weathered sea stack with a narrow base amid surf and boulders. Waves rise and fall below the basalt cliff on the other side of the path. Real 03, 09, 12 and 14. Games 01 and 05.. |
| Lions Gate Bridge, 5.91 km | [Before](before-lionsgate.jpg) | [After](after-lionsgate.jpg) | The green lattice suspension towers, stiffening truss and vertical hangers grow over the rider on the closing sprint; mountains show through the open steelwork. Real 02, 04–06, 10, 11, 13 and 15. Games 02, 03 and 05.. |

The narrow graded path follows the stone wall past western red cedars and Brockton Point. A sailboat heels beneath the light, a freighter moves across Burrard Inlet and tidal wash circles the tree-topped Siwash Rock. Riders sprint toward the lattice towers and hanging cables of Lions Gate Bridge. The North Shore skyline and calm salt water use original artwork. The North Shore ridges play the role of Caribana’s fixed Toronto skyline. The lighthouse and bridge use geometry, and nearby boats and tide pools move against the distant shore. Crossed cedar silhouettes and a textured mountain ring keep that depth on Low. [Credited references](../../worlds/stanleypark/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| the cedar-lined seawall | 0 m | 0.12 km to 0.95 km | 120.47 | 119.86 | 9.9 ms | 63.7 ms | 46 |
| Siwash Rock and the tidal shelf | 4350 m | 0.12 km to 0.95 km | 120.07 | 119.85 | 10.0 ms | 31.0 ms | 49 |

Reproduce from the frontend workspace with `npm run perf -- stanleypark-tablet --headed`.


## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [085 · The paint lies on the Seawall](bend-085-paint-on-the-seawall.jpg) | The words painted on the Seawall (STANLEY, the bike symbols) were laid level, so where the path rises round the park the far end of each word sank into the asphalt. They now lie along the slope, and the barriers and props behind the rider stand on the path there instead of at the height under the rider. |
