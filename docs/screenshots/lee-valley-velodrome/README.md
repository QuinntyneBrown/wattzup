# Lee Valley Velodrome from the saddle

The 8.725 km race completes 34 laps and another 225 m of the same 250 m oval. GCN Training’s Spin to Win Cadence Session retains twelve stages and twenty minutes with zero video offset. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Home straight, 0.51 km | [Before](before-boards.jpg) | [After](after-boards.jpg) | Pale pine strips run along the riding line. A blue apron separates the boards from the pens. Real 02, 05, 06 and game 01. |
| Pursuit bend, 1.58 km | [Before](before-banking.jpg) | [After](after-banking.jpg) | The outer boards climb to 42 degrees. Three pursuit riders lean together above the red sprinter line. Real 01, 03, 12–13 and game 04. |
| Team pens, 3.14 km | [Before](before-infield.jpg) | [After](after-infield.jpg) | A coach watches a rider warm up on rollers among spare wheels and the low pen dividers. Real 07, 09, 14 and games 02–03. |
| Roof lattice, 4.69 km | [Before](before-roof.jpg) | [After](after-roof.jpg) | Arched timber and roof cables cross above the far stands. Floodlights follow the straights. Real 02, 04–05, 11, 15 and game 05. |
| Back straight stands, 6.30 km | [Before](before-stands.jpg) | [After](after-stands.jpg) | Spectators rise behind clear safety panels. The lit arena screen stays legible across the track. Real 07–10 and games 01, 04. |
| Lap board, 8.51 km | [Before](before-bell.jpg) | [After](after-bell.jpg) | An official rings the bell beside the start line. The lap board changes as the rider crosses. Real 03, 06–08, 12 and game 01. |

Pine grain, team staff and close seated crowds are original artwork. The shared track geometry supplies the 42-degree bend. The roof net and floodlights remain fixed above the race. Pursuit riders, the infield roller and the officials’ bell use the ride clock; original synthesized crowd and bell audio respect the world sound setting and pause. [Credited references](../../worlds/velodrome/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Pursuit bend | 1500 m | 0.12 km to 0.95 km | 119.36 | 119.28 | 10.5 ms | 77.7 ms | 83 |
| Infield and stands | 6100 m | 0.12 km to 0.95 km | 119.24 | 119.25 | 11.0 ms | 53.1 ms | 83 |

Reproduce from the frontend workspace with `npm run perf -- velodrome-tablet --headed`.
