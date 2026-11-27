# Chicago Lakefront Trail from the saddle

The sixteen stages of GCN’s 25 Minute Sprint Intervals cover 10.525 km in 25:30. The course climbs 8 m and the class has a three-second video offset. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Lincoln Park, 0.08 km | [Before](before-park.jpg) | [After](after-park.jpg) | Mature park trees cast shade on a wide striped trail. Riders, runners and skaters approach between the inland lawn and the lake. Real 01, 05–07 and games 01–02. |
| Harbour, 1.78 km | [Before](before-harbour.jpg) | [After](after-harbour.jpg) | Rows of masts and mooring fingers follow the harbour curve, with sailboats moving on the sheltered water. Real 03, 06–07, 10 and games 01 and 03. |
| North Avenue Beach, 3.54 km | [Before](before-house.jpg) | [After](after-house.jpg) | The blue and white ship-shaped beach house rises beside umbrellas and a tall lifeguard chair, with lake and sand behind it. Real 02, 11 and 13–15 and games 02–03. |
| Concrete revetment, 5.68 km | [Before](before-steps.jpg) | [After](after-steps.jpg) | Low waves break against staggered concrete steps. Lake fog stays low over the water while the paved line stays legible. Real 02, 08–09, 12 and games 01 and 04. |
| Oak Street Beach, 7.84 km | [Before](before-oak.jpg) | [After](after-oak.jpg) | People sit on steps and gather around parasols. Blue Divvy bikes, runners and inline skaters pass in marked lanes. Real 02, 07–08 and 12–13 and games 03–05. |
| Skyline overlook, 9.94 km | [Before](before-skyline.jpg) | [After](after-skyline.jpg) | The dark braced Hancock tower and bundled Willis Tower stand above the shoreline cluster across turquoise water. Real 01, 07–08, 10–11 and 15 and games 03 and 05. |

A striped lakefront trail links the harbour and beaches. Park trees and runners frame the pavement, sailboats move against fixed mooring fingers, and breakers follow the stepped revetment. The North Avenue Beach House has a blue and white hull, portholes and an upper deck. The cross-braced Hancock and bundled Willis towers remain fixed on the skyline. [Credited references](../../worlds/lakefront/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Lincoln Park lakefront | 0 m | 0.12 km to 0.95 km | 120.24 | 120.00 | 9.7 ms | 19.6 ms | 66 |
| Oak Street Beach and active trail users | 7560 m | 0.12 km to 0.95 km | 120.12 | 120.00 | 9.8 ms | 18.7 ms | 79 |

Reproduce from the frontend workspace with `npm run perf -- lakefront-tablet --headed`.
