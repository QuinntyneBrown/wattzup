# Philadelphia Art Museum Steps from the saddle

Choose Philadelphia Art Museum Steps in Map Select. GCN’s *HIIT Leg Buster* runs for 19:40 over 8.175 km and climbs 86 m. At target cadence all seven efforts finish on the same museum terrace. The recovery loops vary in length to bring the rider back for the next climb. The captures follow a simulated bike at 90 rpm with the race HUD visible.

| View | Original | Revised | Reference details |
| --- | --- | --- | --- |
| Parkway, 0.08 km | [Before](before-parkway.jpg) | [After](after-parkway.jpg) | Plane trees and flags frame the long approach. Real 01–05, game 03. |
| Logan Circle, 0.21 km | [Before](before-swann.jpg) | [After](after-swann.jpg) | Bronze figures sit inside the Swann Fountain’s arcing spray to the right of the road. Real 03, 15 and game 03. |
| Eakins Oval, 1.65 km | [Before](before-oval.jpg) | [After](after-oval.jpg) | The mounted Washington Monument and flagpoles open onto Fairmount and the sandstone museum wings. Real 02, 06–09, 13 and games 01–02. |
| East steps, 1.84 km | [Before](before-steps.jpg) | [After](after-steps.jpg) | Six flights flank the smooth riding strip. The joggers climb toward the eight-column portico. The bronze boxer and the posing visitors stand beside the first flight. Real 07–12, games 01 and 05. |
| Return lane, 2.04 km | [Before](before-return.jpg) | [After](after-return.jpg) | City Hall and Center City’s towers reappear along the return axis. Real 03, 05, 14 and game 04. |

A fixed skyline and a separate moving foreground follow the approach used for Caribana’s CN Tower and parade. The seventy-two treads have staggered joints and weathered nosings. Flags share one texture atlas, the three joggers share one draw call, and fountain jets use static arcs. The route panel samples the baked road every five metres. [References and credits](../../worlds/artmuseum/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake Bluetooth pedalling. Both measurements began after nine seconds of warm-up and ran for sixty seconds. The race distance advanced from 0.12 to 0.95 km per sample. The terrace measurement started the scene 1,580 metres up the course. Submitted FPS counts reports from actual world draws.

| Section | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak draw calls |
| --- | ---: | ---: | ---: | ---: | ---: |
| Parkway | 120.49 | 119.99 | 10.0 ms | 17.0 ms | 25 |
| Museum approach, stairs and return | 120.86 | 120.00 | 9.6 ms | 14.2 ms | 46 |

Run `npm run perf -- artmuseum-tablet --headed` in the frontend workspace to repeat the measurement.
