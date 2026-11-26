# Great St Bernard Pass from the saddle

GCN Training’s Climb Time: Boost Your Climbing Power retains its 22 stages, 40:00 duration and zero video offset. The 17.4125 km climb gains 871 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Avalanche gallery, 0.12 km | [Before](before-gallery.jpg) | [After](after-gallery.jpg) | Heavy concrete piers and a thick roof shelter the road. Spaced openings reveal a rising granite wall, roadside snow poles and the cold light at the gallery mouth. Real 01, 04 and 06. Games 01 and 03.. |
| Granite switchbacks, 4.12 km | [Before](before-hairpins.jpg) | [After](after-hairpins.jpg) | The narrow road doubles back across scree and rough tundra. Hairpins remain visible on the opposing slope; roadside posts and granite blocks mark the outside of the bend. Real 01, 03–06, 13 and 15. Games 02 and 05.. |
| Snow cutting, 8.24 km | [Before](before-snowcut.jpg) | [After](after-snowcut.jpg) | A tall cut bank stands just outside the tarmac. Dirty melt layers, wind scallops and shallow runoff interrupt the pale face; high cloud moves past jagged peaks. Real 02, 04 and 14. Games 01–04.. |
| Summit lake, 12.75 km | [Before](before-lake.jpg) | [After](after-lake.jpg) | The cold lake fills its rocky basin beside the road. Wind shifts patches of exposed water between irregular sheets of shore ice. The roof of the hospice rises at the far end. Real 08, 09, 12 and 14. Games 01 and 05.. |
| Hospice and kennels, 15.51 km | [Before](before-hospice.jpg) | [After](after-hospice.jpg) | The steep grey roofs, many rows of small windows and contrasting granite wings form the hospice court. A heavy-coated Saint Bernard turns its head by the kennel rail. Real 07, 09 and 11. Games 01 and 03.. |
| Swiss–Italian border, 17.09 km | [Before](before-border.jpg) | [After](after-border.jpg) | Customs huts and flags mark the road across the col. A bronze figure stands on a rocky knoll beyond the border signs while the flags move in the wind. Real 07, 10 and 11. Games 02 and 04.. |

Concrete piers shelter the opening road. Narrow hairpins climb the scree above the tree line, and the cut snowbanks carry plough scars and melt channels. Ice floes break the surface of the summit lake, a Saint Bernard turns in the hospice court and flags move beside the Swiss and Italian signs. As in Caribana, a fixed skyline sits behind sections of near scenery. Here the granite ridge stays visible across switchbacks while the gallery piers, snow walls and stone hospice pass close to the bike. A textured dog with a moving neck keeps its coat and markings readable on Low. [Credited references](../../worlds/stbernard/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| the avalanche gallery | 0 m | 0.12 km to 0.95 km | 120.23 | 119.85 | 9.8 ms | 30.5 ms | 54 |
| the hospice and kennels | 15300 m | 0.12 km to 0.95 km | 120.38 | 120.00 | 9.8 ms | 14.5 ms | 101 |

Reproduce from the frontend workspace with `npm run perf -- stbernard-tablet --headed`.
