# Chicago Loop Crit from the saddle

GCN Training’s 20 Minute Crit Sprints retains 14 stages over 20:00. Five 1.75 km laps run beneath the elevated Wabash tracks and back along State Street with 21 m of total ascent. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Wabash under the L, 0.07 km | [Before](before-wabash.jpg) | [After](after-wabash.jpg) | Paired steel columns flank patched asphalt and repeated track shadows. Real 01–04 and games 01–02. |
| Elevated railway, 0.22 km | [Before](before-train.jpg) | [After](after-train.jpg) | Station steps and overhead structures frame the moving train. Real 01–07 and games 01–03. |
| River crossing, 0.46 km | [Before](before-bridge.jpg) | [After](after-bridge.jpg) | Steel grating runs between the red-brown bascule trusses. Real 14 and games 02, 04. |
| Northern cross street, 0.67 km | [Before](before-marina.jpg) | [After](after-marina.jpg) | The side street leads towards the riverfront towers. Real 03–05, 10, 14 and game 02. |
| State Street marquee, 1.13 km | [Before](before-theatre.jpg) | [After](after-theatre.jpg) | The vertical Chicago Theatre sign faces the rider above the crowds. Real 07–13, 15 and games 01, 03. |
| South Loop corner, 1.53 km | [Before](before-corner.jpg) | [After](after-corner.jpg) | Corner barriers, shops and the next cross street frame the return. Real 01–04, 07–10 and games 03–05. |

Built-up columns, platform steps, girder flanges, rail joints and cross-street trains share the same physical alignment on every lap. A moving four-car train drives a filtered rumble through Ride sound. Steam curls above street grates and freezes with the trains on pause. The two bascule bridges carry grating, riveted trusses and bridgehouses. The Chicago Theatre sign has individual illuminated letters. Marina City’s balcony rings and the Willis Tower’s bundled tubes stand beyond the closer blocks. Spectator rows share the existing Caribana atlas. Streets and façades are condensed to the length of the workout. [Credited references](../../worlds/chicago/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Wabash train and downtown corner | 20 m | 0.12 km to 0.96 km | 119.29 | 119.14 | 10.5 ms | 100.9 ms | 45 |
| Theatre, spectators and CTA stairs | 987 m | 0.12 km to 0.96 km | 120.19 | 120.00 | 9.9 ms | 14.8 ms | 50 |

Reproduce from the frontend workspace with `npm run perf -- chicago-tablet --headed`.
