# Prairie Paceline from the saddle

The 18.4 km Route 9 course preserves the original 17 workout stages, 30-minute duration, 90 m of climbing and eight effort gates. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Route 9 shoulder, 0.08 km | [Before](before-route9.jpg) | [After](after-route9.jpg) | A dashed yellow centre line converges with the gravel shoulders. Wind-tossed wheat, wooden poles and wire fences slide past in the foreground. Real 01, 03–05 and 09. Games 01, 03 and 04.. |
| Wind farm service road, 2.48 km | [Before](before-rotors.jpg) | [After](after-rotors.jpg) | Several rows of three-blade turbines turn above the ridge. A near tower, fenced service track and distant rows show scale and parallax. Real 02, 04–07, 11 and 15. Games 01 and 02.. |
| Canola quarter section, 5.21 km | [Before](before-canola.jpg) | [After](after-canola.jpg) | Rectangular canola and wheat fields meet along a straight service track. A swath of wind-bent flower stems catches the low sun beside the road. Real 05 and 07–10. Games 03 and 04.. |
| Farmyard and bales, 8.74 km | [Before](before-farm.jpg) | [After](after-farm.jpg) | A red barn, corrugated grain bins and straw bales sit beside a shelterbelt. Power wires sag from the double crossarms above the fence. Real 01, 03, 09 and 10. Games 01 and 03.. |
| Railway grain elevator, 12.61 km | [Before](before-elevator.jpg) | [After](after-elevator.jpg) | The square elevator and its headhouse rise above the track, loading annex and hoppers. Weathered timber, a painted place name and the rails show the scale of the town. Real 12–14. Games 02, 04 and 05.. |
| Last prairie crest, 17.96 km | [Before](before-sky.jpg) | [After](after-sky.jpg) | A shallow crest reveals turbines behind a second ridge. Cumulus and high cirrus fill the amber sky above fence and field shadows. Real 04–10 and 15. Games 01, 04 and 05.. |

A straight two-lane road crosses wheat and canola fields. Paired ridges carry 116 turbines. The red wooden grain elevator rises above its railway sidings. Turbine blades, wind-bent verge grass and clouds move on the ride clock. [Credited references](../../worlds/prairie/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Route 9 wheat verge | 0 m | 0.12 km to 0.95 km | 116.41 | 116.32 | 11.4 ms | 130.7 ms | 55 |
| wind farm service road | 2280 m | 0.12 km to 0.95 km | 120.32 | 119.90 | 10.2 ms | 30.5 ms | 70 |

Reproduce from the frontend workspace with `npm run perf -- prairie-tablet --headed`.
