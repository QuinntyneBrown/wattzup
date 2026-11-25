# Bonneville Salt Flats from the saddle

Select Bonneville Salt Flats in Map Select. The original 20 stages of GCN Training’s Team Time Trial run for 20:00, covering 8.250 km on a level course. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Timing gate, 0.07 km | [Before](before-start.jpg) | [After](after-start.jpg) | The timing gate frames the scored white strip and black line. Real 01–05, 12 and 15; games 01 and 03. |
| Speed Week pits, 0.32 km | [Before](before-pits.jpg) | [After](after-pits.jpg) | Team canopies, hot rods, trailers, spectators and motorhomes line the staging lane. Real 06–10; games 02, 04 and 05. |
| Streamliner staging, 0.68 km | [Before](before-streamliner.jpg) | [After](after-streamliner.jpg) | The low red push truck follows a long enclosed streamliner beside the line. Real 06–11; games 02 and 05. |
| First measured mile, 1.57 km | [Before](before-mile.jpg) | [After](after-mile.jpg) | The rider approaches the board at 1,609.344 m with the Silver Island range behind it. Real 03–05 and 12; games 01 and 03. |
| I-80 rest area, 3.76 km | [Before](before-highway.jpg) | [After](after-highway.jpg) | The rest area sign marks the shelter and divided highway across the salt. Real 03, 12 and 15; games 01 and 04. |
| Open salt and heat shimmer, 6.34 km | [Before](before-mirage.jpg) | [After](after-mirage.jpg) | The black line and polygonal crust continue across the salt to the reflected ridge. Real 01, 04 and 12–15; games 01 and 03. |

The course shares the original Speed Week packed-salt and crust textures praised in rider feedback #918. A continuous black guide line divides the riding strip. Like Caribana’s distant skyline and close parade, the folded rock range stays fixed as crews, vehicles and mile boards pass at their physical positions. Streamliners have tapered bodies, small canopies and wheel fairings. A push truck and its crew advance together on the staging lane, a faster vehicle leaves a salt wake, and highway traffic passes the rest area. Shimmer bands compress the distant reflection into one moving surface. All vehicles and the shimmer use race time and hold on pause. The distant spectators and crews use simple coloured forms on Low. [Credited references](../../worlds/bonneville/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Speed Week staging | 110 m | 0.12 km to 0.95 km | 120.38 | 120.00 | 9.7 ms | 15.0 ms | 40 |
| Mile boards and the mirage | 1350 m | 0.12 km to 0.95 km | 120.33 | 120.00 | 9.9 ms | 16.1 ms | 45 |

Reproduce from the frontend workspace with `npm run perf -- bonneville-tablet --headed`.
