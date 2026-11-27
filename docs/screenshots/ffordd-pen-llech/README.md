# Ffordd Pen Llech from the saddle

GCN Training’s Steepest Climb in the World retains its three stages, 45:40 duration and zero video offset. The 14.267 km ride climbs 180 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Morfa Harlech approach, 0.08 km | [Before](before-morfa.jpg) | [After](after-morfa.jpg) | The coastal plain leads toward the castle on its rock. A break in the rain lights the dunes while cloud stays on the mountain ridge. Real 11–15. Games 01 and 04.. |
| Stryd Fawr terraces, 3.42 km | [Before](before-terrace.jpg) | [After](after-terrace.jpg) | Slate-roofed stone terraces, narrow shopfronts, chimneys and bilingual street furniture mark the transition from the plain into Harlech. Real 04–10. Games 02 and 05.. |
| Ffordd Pen Llech foot, 10.86 km | [Before](before-foot.jpg) | [After](after-foot.jpg) | A Welsh street-name plate and steep-gradient warning guard a narrow wet lane. Mossy walls leave only a single track with no pavement. Real 01–03 and 05–06. Games 02–03.. |
| The steepest metres, 11.12 km | [Before](before-wall.jpg) | [After](after-wall.jpg) | The 37.45% section pitches the rider upward between level cottage sills and stepped walls. Locals wave from doorways and the wall top. Real 01–04. Games 02–03 and 05.. |
| Upper left hairpin, 11.20 km | [Before](before-hairpin.jpg) | [After](after-hairpin.jpg) | A tight left-hand bend interrupts the wall. The blockwork and standing spectators stay vertical while the road changes direction on the grade. Real 01–04, 07 and 15. Games 02–03.. |
| Castle and bay overlook, 13.68 km | [Before](before-castle.jpg) | [After](after-castle.jpg) | Round towers and curtain walls rise out of the castle rock. Beyond them the coastal fields, Morfa dunes, Tremadog Bay and the mountains recede under broken grey cloud. Real 11–15. Games 01, 04 and 05.. |

Terraced cottages and stone walls narrow around the measured 37.45% ramp. Drizzle, a wall-side spectator and the castle flag move with ride time. Harlech Castle overlooks the dunes and Tremadog Bay. [Credited references](../../worlds/penllech/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| the Morfa Harlech approach | 0 m | 0.12 km to 0.96 km | 118.64 | 118.43 | 10.8 ms | 120.8 ms | 32 |
| the steep lane and upper hairpin | 10840 m | 0.14 km to 0.96 km | 118.07 | 117.73 | 10.8 ms | 328.1 ms | 45 |

Reproduce from the frontend workspace with `npm run perf -- penllech-tablet --headed`.
