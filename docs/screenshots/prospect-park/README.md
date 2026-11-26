# Prospect Park from the saddle

GCN’s 30 Minute Intervals: Fitness Training retains 17 stages over 30:00 with zero video offset. Two 6.2 km laps of the same park drive climb 72 m in total. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| East Drive beneath the canopy, 0.08 km | [Before](before-drive.jpg) | [After](after-drive.jpg) | Lane markings separate runners from the weekend pace line. Trees cast broken shadows across the asphalt. Iron park lamps mark the curve ahead. Real 01–04 and 12. Games 01 and 04.. |
| Long Meadow, 1.24 km | [Before](before-meadow.jpg) | [After](after-meadow.jpg) | The near canopy opens onto a broad lawn. A dog chases a ball past picnic blankets while a runner passes the line of green benches. Real 02, 03, 06 and 12. Games 02 and 03.. |
| Grand Army Plaza, 2.86 km | [Before](before-plaza.jpg) | [After](after-plaza.jpg) | The arch has one deep opening, paired pillars, bronze reliefs and a crowning quadriga. Brownstone stoops and apartment roofs mark the Brooklyn edge. Real 01 and 10. Games 01 and 05.. |
| Weekend market, 4.06 km | [Before](before-market.jpg) | [After](after-market.jpg) | People queue between rows of canvas tents and food trucks. The stall counters, hanging signs and stacked crates sit below the riders’ sightline. Real 01, 13 and 14. Games 03 and 05.. |
| Prospect Park Lake, 5.13 km | [Before](before-lake.jpg) | [After](after-lake.jpg) | Willows bend over the shore. Swans leave wakes across the lake and the green iron bridge spans the narrow end of the water. Real 05–07 and 11. Games 02 and 04.. |
| Boathouse on the Lullwater, 11.92 km | [Before](before-boathouse.jpg) | [After](after-boathouse.jpg) | Two storeys of white terracotta stand above their reflection. A red roof, repeated round arches and the waterside balustrade frame the Audubon Center. Real 07–09 and 15. Games 01 and 04.. |

East Drive passes Long Meadow and the triumphal arch on Grand Army Plaza. Park Slope brownstones and market stalls flank the drive. The lake opens onto the iron bridge, willows and terracotta Boathouse. The swans, runners, club cyclists and dog follow ride time. [Credited references](../../worlds/prospect/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| East Drive lanes and pace line | 0 m | 0.12 km to 0.96 km | 120.01 | 119.58 | 10.6 ms | 65.0 ms | 49 |
| weekend market and runners | 3870 m | 0.12 km to 0.95 km | 119.89 | 119.60 | 10.4 ms | 61.3 ms | 45 |

Reproduce from the frontend workspace with `npm run perf -- prospect-tablet --headed`.
