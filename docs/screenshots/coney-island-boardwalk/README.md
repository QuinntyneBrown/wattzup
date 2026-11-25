# Coney Island Boardwalk from the saddle

Spin to Win (GCN Training) retains its 11 original stages over 19:00. The 8.475 km boardwalk course climbs 5 m following the original rolling gradient. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Riegelmann Boardwalk, 0.08 km | [Before](before-planks.jpg) | [After](after-planks.jpg) | The weathered herringbone wood and chalk remain beneath the rider. Real 01–03, games 01–02. |
| Clam bars, 0.27 km | [Before](before-clams.jpg) | [After](after-clams.jpg) | Painted signs, striped awnings, service counters and bunting. Real 03–05, games 01 and 04. |
| Wonder Wheel approach, 1.54 km | [Before](before-wheel.jpg) | [After](after-wheel.jpg) | The green rim and inner cars rise above the boardwalk. Real 08–09, games 02 and 05. |
| Luna Park approach, 2.46 km | [Before](before-cyclone.jpg) | [After](after-cyclone.jpg) | Timber lattice contrasts with the Thunderbolt’s steel supports. Real 04, 10–11 and 15, games 02 and 04. |
| Steeplechase Pier approach, 4.24 km | [Before](before-pier.jpg) | [After](after-pier.jpg) | The pier lies seaward behind the umbrellas and railing. Real 06–07, 13–14, games 03 and 05. |
| Parachute Jump, 8.23 km | [Before](before-jump.jpg) | [After](after-jump.jpg) | The red lattice and its circular crown mark the far end of the boardwalk. Real 04, 12–14 and game 05. |

The historic boardwalk scene supplies its original seeded chevron planks, chalk lettering, green railings, lamps, beach and shop fronts. The native course adds Steeplechase Pier and the Thunderbolt’s orange steel track. The Wonder Wheel and Cyclone occupy fixed chainages, with the distant Parachute Jump kept visible by compressing its distance beyond the shops. Gravity slides the inner gondolas along paired tracks while each cabin hangs upright. The articulated Cyclone train follows the timber hills. Each ride holds its pose on pause. Batching the gondolas and beach umbrellas preserves their colours and reduces draw calls. Riding straight ahead gives an oblique view of the pier through the beach furniture. The original road was specifically singled out in [rider feedback #926](https://github.com/QuinntyneBrown/wattzup/issues/926). [Credited references](../../worlds/coney/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Boardwalk and clam bars | 35 m | 0.12 km to 0.95 km | 91.31 | 91.30 | 13.6 ms | 25.6 ms | 445 |
| Luna Park and the Cyclone | 2440 m | 0.12 km to 0.95 km | 107.23 | 107.22 | 11.6 ms | 18.1 ms | 436 |

Reproduce from the frontend workspace with `npm run perf -- coney-tablet --headed`.
