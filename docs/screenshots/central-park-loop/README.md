# Central Park Loop from the saddle

Select Central Park Loop in Map Select. GCN Training’s original 16-stage 15 Minute Cardio HIIT covers the 6.450 km Park Drive lap in 15:00 with 46 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Carriage Drive, 0.08 km | [Before](before-carriages.jpg) | [After](after-carriages.jpg) | Hansom traffic and the Ride One-style chase view under the tree canopy. Real 01–06, 12–13, 15 and games 01, 05. |
| Bethesda Terrace, 1.05 km | [Before](before-bethesda.jpg) | [After](after-bethesda.jpg) | Winged bronze figure above two bowls and the terrace steps. Real 10–11, games 02 and 04. |
| Engineers’ Gate, 2.00 km | [Before](before-runners.jpg) | [After](after-runners.jpg) | Joggers and cyclists share the marked lanes. Real 03, 05, 07 and games 01, 03. |
| Reservoir, 2.48 km | [Before](before-reservoir.jpg) | [After](after-reservoir.jpg) | Iron rail, cinder path and water behind the benches and park lamps. Real 08–09, 14 and games 03–04. |
| San Remo overlook, 2.55 km | [Before](before-sanremo.jpg) | [After](after-sanremo.jpg) | The towers rise past the reservoir, with a jet beside the open water. Real 08–09, 14 and game 04. |
| West Drive to Midtown, 5.94 km | [Before](before-midtown.jpg) | [After](after-midtown.jpg) | Towers of different heights stand beyond the trees as the club heads south. Real 01, 04, 06, 09, 12 and games 02 and 05. |

Park Drive closes a continuous physical lap. The reservoir, Bethesda Terrace, San Remo and Midtown stay fixed as the road turns. Mature roadside trees reuse the original tree portraits in Caribana’s tablet atlas, with two intersecting cutouts per tree and distant low-detail crowns. The hansoms use the concept scene’s driver, hood and horse, with animated diagonal leg pairs and spoked wheels. Groups of cyclists, blue dock bikes with racks, and instanced joggers follow the ride clock. The reservoir reflections and fountain spray are baked for Low. [Credited references](../../worlds/centralpark/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Carriage Drive and Bethesda Terrace | 30 m | 0.12 km to 0.95 km | 120.13 | 120.00 | 9.8 ms | 15.2 ms | 124 |
| Engineers Gate and reservoir club ride | 1960 m | 0.12 km to 0.95 km | 120.23 | 120.00 | 9.9 ms | 16.7 ms | 74 |

Reproduce from the frontend workspace with `npm run perf -- centralpark-tablet --headed`.
