# Lake Como from the saddle

GCN Training’s Seated Surges follows the shore road for 30 minutes over 12.4 km, with 83 m of climbing. The original plan contains 20 stages. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Tremezzo promenade, 0.08 km | [Before](before-shore.jpg) | [After](after-shore.jpg) | The shore rail passes plane trees and cafés. Real 01, 12 and games 01, 05. |
| Villa Carlotta approach, 1.32 km | [Before](before-carlotta.jpg) | [After](after-carlotta.jpg) | Terraces rise inland from the road towards the villa. Real 07–08, 11, 14 and games 01–03. |
| Ferry landing, 2.21 km | [Before](before-ferry.jpg) | [After](after-ferry.jpg) | Boats work the open water between the waterfronts. Real 02–04, 06, 10 and games 02–05. |
| Stone gallery, 4.52 km | [Before](before-gallery.jpg) | [After](after-gallery.jpg) | Individual piers and the far portal admit daylight from the lake. Real 08–09 and game 03. |
| Balbianello approach, 6.65 km | [Before](before-balbianello.jpg) | [After](after-balbianello.jpg) | A garden point carries the villa, loggia and paired towers. Real 07–08, 11, 14 and games 01–03. |
| Varenna, 10.61 km | [Before](before-varenna.jpg) | [After](after-varenna.jpg) | Warm houses and a bell tower mark the waterfront. Real 02, 04–06, 11–13, games 01 and 04. |

The opposite wooded slopes and Bellagio promontory stay anchored through the bends, as in the earlier Como scene. Caribana’s fixed skyline and moving foreground informed the layered ridges, waterfront villages and boats. White ferries with open upper decks and low hydrofoils cross between landings with their own wakes. The villa sequence condenses real distances along the SS340. The native course models terrace walls, loggias, shutters, gallery piers and café umbrellas. Its plane trees and promenade visitors share an atlas adapted from Caribana. Boats and wakes follow ride time and hold on pause. [Credited references](../../worlds/como/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Tremezzo promenade | 35 m | 0.12 km to 0.96 km | 120.70 | 120.00 | 9.9 ms | 14.2 ms | 36 |
| Ferry landing and villas | 2080 m | 0.12 km to 0.95 km | 120.81 | 120.00 | 9.6 ms | 13.2 ms | 30 |

Reproduce from the frontend workspace with `npm run perf -- como-tablet --headed`.
