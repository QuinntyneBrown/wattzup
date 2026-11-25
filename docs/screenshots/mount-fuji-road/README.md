# Mount Fuji Road from the saddle

Select Mount Fuji Road to climb the Subaru Line from the toll gate to the fifth station. The 11 stages of GCN Training’s 30 Minute HIIT Ramp Session cover 13.25 km in 30:00 and climb 855 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Toll gate, 0.08 km | [Before](before-toll.jpg) | [After](after-toll.jpg) | Toll lanes at the forest entrance. Real 01–02 and 14, games 01 and 04. |
| Forest climb, 2.21 km | [Before](before-forest.jpg) | [After](after-forest.jpg) | Conifers and moss line the road. Real 01, 04–05, games 04–05. |
| Okuniwa approach, 5.36 km | [Before](before-okuniwa.jpg) | [After](after-okuniwa.jpg) | Road markers and the changing forest edge. Real 03–05, 07 and 09, games 01 and 03. |
| Lake outlook, 7.47 km | [Before](before-lakes.jpg) | [After](after-lakes.jpg) | Lake Kawaguchi lies beyond the descending bank. Real 07–08 and 15, games 02–03. |
| Above the clouds, 9.84 km | [Before](before-clouds.jpg) | [After](after-clouds.jpg) | Stratus drifts beneath the exposed volcanic slope. Real 08–11, games 02–03. |
| Fifth station, 12.91 km | [Before](before-station.jpg) | [After](after-station.jpg) | Shuttle bays, passengers, lodges and the summit. Real 06, 09 and 12–14, games 01 and 03. |

The north flank of Fuji stays at a fixed bearing as the road winds through conifers and breaks out onto volcanic scoria. A break in the slope reveals Lake Kawaguchi and its surrounding ridges. Cloud banks move below the road. At the fifth station a shuttle moves past the marked bays, and passengers walk between the bus and shops. Their movement follows the ride clock. The original reference folders and credits were recovered from Git history. [Credited references](../../worlds/fuji/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Lower Subaru Line | 55 m | 0.12 km to 0.95 km | 120.31 | 120.00 | 9.6 ms | 18.2 ms | 42 |
| Fifth station arrival | 12410 m | 0.12 km to 0.95 km | 120.46 | 120.00 | 9.5 ms | 16.0 ms | 92 |

Reproduce from the frontend workspace with `npm run perf -- fuji-tablet --headed`.
