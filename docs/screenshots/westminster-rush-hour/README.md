# Westminster Rush Hour from the saddle

Time Is of the Essence follows the 6.45 km route for fifteen minutes through nineteen historical stages. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Bridge lamps, 0.14 km | [Before](before-bridge.jpg) | [After](after-bridge.jpg) | Triple lanterns and green pierced parapets frame the wet bridge deck. Elizabeth Tower rises at the west landing. Real 04–06, 15 and games 01, 04. |
| Elizabeth Tower, 0.43 km | [Before](before-clock.jpg) | [After](after-clock.jpg) | The illuminated four-faced clock and gilded details rise above the red buses. Real 01–04, 09, 10, 14 and games 01, 05. |
| Parliament Square, 1.22 km | [Before](before-square.jpg) | [After](after-square.jpg) | The route bends beside statues and the square lawn. A taxi crosses the junction beyond the signal. Real 09, 10, 13 and games 02, 03. |
| Whitehall, 2.38 km | [Before](before-whitehall.jpg) | [After](after-whitehall.jpg) | Black cabs and red buses pass lit stone buildings, phone boxes and a zebra crossing. Real 02, 09, 10, 13 and games 02, 03. |
| County Hall and London Eye, 4.62 km | [Before](before-eye.jpg) | [After](after-eye.jpg) | The Eye rotates above the South Bank and County Hall reflects its blue-hour light in the Thames. Real 07, 08, 11, 12 and game 04. |
| Westminster riverside, 6.12 km | [Before](before-palace.jpg) | [After](after-palace.jpg) | The Houses of Parliament extend along the river. The green bridge arches stand out against the lit stone. Real 03–06, 10, 15 and games 01, 05. |

The fixed Thames crossing leads from the seven green arches toward a four-dial clock tower. Original side elevations give the moving double-deckers and taxis their London forms and the rotating observation wheel keeps its capsules upright. The left bus lane retains continuous vehicle trajectories as requested in issue 897. [Credited references](../../worlds/westminster/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Westminster Bridge traffic | 0 m | 0.12 km to 0.95 km | 104.59 | 104.57 | 14.5 ms | 96.3 ms | 183 |
| Whitehall junction | 2220 m | 0.12 km to 0.95 km | 115.42 | 115.39 | 11.5 ms | 297.8 ms | 168 |

Reproduce from the frontend workspace with `npm run perf -- westminster-tablet --headed`.
