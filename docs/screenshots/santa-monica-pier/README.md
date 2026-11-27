# Santa Monica Pier from the saddle

GCN Training’s 20 Minute Cardio: Lose Weight Fast retains all 14 stages, its 20:00 duration and zero video offset. The 8.85 km path climbs 4 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Marvin Braude beach path, 0.08 km | [Before](before-braude.jpg) | [After](after-braude.jpg) | A dashed yellow stripe follows a narrow concrete ribbon through windblown sand. Thin fan palms, beach hotels and the Santa Monica Mountains stand inland. Real 01, 02, 11 and 12. Games 01 and 04.. |
| Lifeguard tower, 1.86 km | [Before](before-tower.jpg) | [After](after-tower.jpg) | A turquoise lifeguard hut stands on legs. Its long wooden access ramp, white safety rails, observation windows, number and flag read above the sand. Real 03, 04, 09 and 11. Games 01 and 02.. |
| Pacific breakers, 3.21 km | [Before](before-breakers.jpg) | [After](after-breakers.jpg) | A bend reveals parallel foamy breakers, wet sand and a surfer waiting beyond the break. A low western sun casts a warm reflection on the water. Real 06, 08, 10 and 11. Games 01 and 02.. |
| Palisades palms, 5.06 km | [Before](before-palisades.jpg) | [After](after-palisades.jpg) | Slender fan palms line the bluff beyond raised beach houses. A skater and a cruiser travel along the path edge while shadows stretch across the concrete. Real 01, 02, 11, 12 and 14. Games 03 and 04.. |
| Pacific Park, 8.49 km | [Before](before-park.jpg) | [After](after-park.jpg) | The pier crosses the shore on dark timber piles. The turning Pacific Wheel has open spokes and upright passenger cars; the coaster runs over its red-and-yellow track. Real 05–08 and 15. Games 03–05.. |
| Yacht Harbor and Route 66, 8.80 km | [Before](before-harbor.jpg) | [After](after-harbor.jpg) | The last sprint reaches the timber pier and its elevated approach with the blue-and-gold Yacht Harbor arch, End of the Trail shield, deck rail and shadow beneath the pilings. Real 05–08, 13 and 15. Games 03–05.. |

The Marvin Braude path passes lifeguard huts, palms, skaters and surfers. A fixed timber pier carries the Yacht Harbor sign, Pacific Wheel and West Coaster. Gondolas stay upright while the train runs along the same rail geometry the native course exports. [Credited references](../../worlds/santamonica/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| beach path and palm front | 0 m | 0.12 km to 0.95 km | 120.55 | 119.97 | 9.9 ms | 26.9 ms | 62 |
| Pacific Park wheel and coaster | 8260 m | 0.12 km to 0.95 km | 120.47 | 119.97 | 10.1 ms | 17.8 ms | 66 |

Reproduce from the frontend workspace with `npm run perf -- santamonica-tablet --headed`.
