# San Francisco Hills from the saddle

GCN Training’s Max Effort Up & Overs retains all 12 stages, its 20:00 duration and zero video offset. The 8.9 km city ride climbs 210 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Russian Hill row houses, 0.10 km | [Before](before-painted.jpg) | [After](after-painted.jpg) | Stepped, painted bay windows and raised stoops mark each lot. Overhead wires, ficus crowns, a flat zebra crossing and a cast manhole mark the first block. Real 01, 03, 04, 10 and 13. Games 02 and 03.. |
| Powell–Hyde line, 1.38 km | [Before](before-powell.jpg) | [After](after-powell.jpg) | A red-and-cream cable car moves along the steel running rails and central grip slot. Its clerestory and open riding platform remain distinct at rider height. Real 02, 07 and 08. Games 02 and 04.. |
| Filbert wall, 2.82 km | [Before](before-filbert.jpg) | [After](after-filbert.jpg) | A 31.5 percent concrete pitch rises between stepped sidewalks. Parked cars lean with the road, with their wheels turned toward the curb. A level landing breaks the steep block. Real 01, 11, 12 and 13. Games 02 and 05.. |
| Telegraph Hill crest, 4.22 km | [Before](before-telegraph.jpg) | [After](after-telegraph.jpg) | Coit Tower’s pale fluted shaft and arched crown rise above Telegraph Hill. Alcatraz and the Bay Bridge appear beyond the sudden drop in the street. Real 03, 04, 09 and 14. Games 01 and 04.. |
| Lombard switchbacks, 6.72 km | [Before](before-lombard.jpg) | [After](after-lombard.jpg) | Eight tight bends wind down a continuous red-brick street. Hydrangea beds fill the inside of each turn. A local car threads the bends below the rider. Real 05 and 06. Games 03 and 04.. |
| Bay overlook, 8.36 km | [Before](before-bay.jpg) | [After](after-bay.jpg) | A fog bank slides over the water beyond the foreground wires. The island and bridge stay fixed while warm light picks out projecting bay windows on the last descent. Real 02, 07, 11 and 15. Games 01 and 05.. |

Stepped Victorian bays and Powell cable slots flank the road. Filbert reaches 31.5 percent before the level intersection. Eight brick Lombard bends pass planted hydrangeas. Fixed Coit Tower and a layered original bay panorama give the two crests separate sightlines. The cable car, turning car and fog bank move on the ride clock. [Credited references](../../worlds/sfhills/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Russian Hill opening blocks | 0 m | 0.12 km to 0.96 km | 120.47 | 120.00 | 9.6 ms | 13.7 ms | 32 |
| Lombard brick switchbacks | 6490 m | 0.12 km to 0.96 km | 119.87 | 119.58 | 9.7 ms | 59.3 ms | 46 |

Reproduce from the frontend workspace with `npm run perf -- sfhills-tablet --headed`.
