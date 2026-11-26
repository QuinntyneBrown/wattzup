# Silverstone Track Day from the saddle

GCN Training’s Flat Out Efforts retains all 21 stages, its 25:30 duration and three-second video offset. The two-lap 11.0875 km course climbs 26 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Hamilton Straight and the Wing, 0.10 km | [Before](before-wing.jpg) | [After](after-wing.jpg) | The silver folded roof kicks up over the pit exit. Level garage doors, the fenced pit wall and an empty grandstand frame the timing line. Real 01–03 and 09. Games 02 and 04.. |
| BRDC clubhouse, 1.42 km | [Before](before-clubhouse.jpg) | [After](after-clubhouse.jpg) | White canopy peaks and a glass front stand beyond the catch fence. A pit crew member rolls a trolley along the service apron. Real 04, 06 and 07. Games 01 and 03.. |
| Maggotts and Becketts, 3.18 km | [Before](before-maggotts.jpg) | [After](after-maggotts.jpg) | Red-and-white inner kerbs alternate through the esses. The racing line switches sides below the long empty roof of the Becketts stand. Real 05, 07, 08 and 13. Games 03 and 05.. |
| Hangar Straight, 4.15 km | [Before](before-hangar.jpg) | [After](after-hangar.jpg) | The uninterrupted straight rises gently toward Stowe. Paired distance boards and a sparse line of hedges recede into a grey horizon. Real 08, 11 and 13. Games 01 and 02.. |
| Stowe gravel trap, 4.85 km | [Before](before-stowe.jpg) | [After](after-stowe.jpg) | A track-day sports car steers around the right apex. The grey gravel fan, alternating tyre stacks and orange marshal post follow the outside of the bend. Real 10–15. Games 03 and 05.. |
| Club and the pit entrance, 5.48 km | [Before](before-pitlane.jpg) | [After](after-pitlane.jpg) | The white pit-entry divider leads back to the Wing. A marshal waves beside the orange shelter while the second lap begins beneath the start gantry. Real 01, 04, 07 and 09. Games 02 and 04.. |

The circuit centreline follows the credited survey. The stepped Wing roof and pit garages, grandstands, painted kerbs, gravel, tyres and braking boards sit beside the measured road. The GT coupe wheels rotate, a crew member pushes a trolley and a marshal waves a yellow flag. [Credited references](../../worlds/silverstone/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| the Wing and Hamilton Straight | 0 m | 0.12 km to 0.95 km | 120.83 | 119.98 | 9.6 ms | 29.7 ms | 36 |
| Becketts, Chapel and Hangar Straight | 3090 m | 0.12 km to 0.95 km | 120.37 | 120.00 | 9.7 ms | 17.3 ms | 38 |

Reproduce from the frontend workspace with `npm run perf -- silverstone-tablet --headed`.
