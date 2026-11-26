# The Palouse from the saddle

GCN Training’s Rolling With the Hills retains its 23 original stages across 45:00 with zero video offset. The 18.153 km ride climbs 293 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Wheat-hill road, 0.08 km | [Before](before-wheat.jpg) | [After](after-wheat.jpg) | A narrow striped country road crests between fresh barley and ripe wheat. The next two folds overlap against a broad afternoon sky. Real 01, 07 and 13. Games 02 and 04.. |
| Red barn hollow, 2.76 km | [Before](before-barn.jpg) | [After](after-barn.jpg) | A red gambrel barn with white doors sits below the road with a farm silo, gravel apron and a line of tall poplars. Real 02, 05 and 10. Games 01 and 04.. |
| Harvest turn, 5.48 km | [Before](before-harvest.jpg) | [After](after-harvest.jpg) | The gravel section runs beside a weathered hillside combine with a cutting reel. An old grain truck waits at the edge of the stubble. Real 03, 09 and 12. Games 01–03.. |
| Colfax grain siding, 8.25 km | [Before](before-colfax.jpg) | [After](after-colfax.jpg) | White grain elevators tower over the low country buildings. A rail siding, loading spout and grain hoppers distinguish the elevator from the farm silo. Real 02, 07, 12 and 13. Games 03 and 04.. |
| Steptoe Butte, 12.32 km | [Before](before-butte.jpg) | [After](after-butte.jpg) | A single steep rounded butte rises above the softer loess ridges. The road skirts its base between contour-ploughed fields. Real 01, 06 and 15. Games 02 and 05.. |
| Golden-hour overlook, 17.62 km | [Before](before-folds.jpg) | [After](after-folds.jpg) | The last crest reveals green lentils, yellow barley and brown stubble in curved strips across the folds. Sunlit shoulders alternate with long blue-brown shadows. Real 03–04, 06, 11 and 14. Games 01, 03 and 05.. |

A barn and windbreak, hillside combine, Colfax grain elevators and rail siding precede Steptoe Butte and the golden-hour outlook. Wheat heads, the reel and the hoppers move with ride time. [Credited references](../../worlds/palouse/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| the rolling wheat road | 0 m | 0.12 km to 0.95 km | 119.88 | 119.35 | 10.2 ms | 152.4 ms | 39 |
| the Colfax grain siding | 8060 m | 0.12 km to 0.96 km | 119.08 | 118.92 | 10.8 ms | 57.3 ms | 155 |

Reproduce from the frontend workspace with `npm run perf -- palouse-tablet --headed`.
