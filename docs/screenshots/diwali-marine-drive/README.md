# Diwali, Marine Drive from the saddle

Select Diwali, Marine Drive in Map Select to ride the 22 stages of GCN’s 25 Minute High Intensity Intervals. The 25:05 ride covers 10.163 km with 4 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Nariman Point, 0.08 km | [Before](before-nariman.jpg) | [After](after-nariman.jpg) | The seaside boulevard, lit apartment blocks and palms draw on real 01–04 and game 01. |
| Art Deco frontage, 1.27 km | [Before](before-deco.jpg) | [After](after-deco.jpg) | Rounded balconies and horizontal bands reference real 05–06, with street proportions from game 02. |
| Promenade lamps, 2.68 km | [Before](before-lamps.jpg) | [After](after-lamps.jpg) | Lanterns, rangoli, families and the black-and-yellow taxi draw on real 11–15 and game 03. |
| Back Bay, 4.84 km | [Before](before-necklace.jpg) | [After](after-necklace.jpg) | Rows of lamps trace the curve ahead. Real 07–08 and games 03 and 05 informed their spacing. |
| Festival waterfront, 6.46 km | [Before](before-fireworks.jpg) | [After](after-fireworks.jpg) | Fireworks over the bay take their colours and form from real 09–10. Game 04 informed foreground scale. |
| Malabar Hill approach, 9.21 km | [Before](before-malabar.jpg) | [After](after-malabar.jpg) | Buildings, coastal lights and taxis reference real 01, 07–08 and 14, with road legibility from game 02. |

Original balcony and family atlases bring detail to the Art Deco blocks and promenade. Paper lanterns, rangoli, oil lamps and family groups are batched by section. Across the sea wall, concrete tetrapods break the shoreline. Fireworks and their reflections share the ride clock with the black-and-yellow Premier Padmini taxis. Distant buildings and palm silhouettes stay fixed as the rider rounds the bay. [Credited references](../../worlds/diwali/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Nariman Point and Art Deco blocks | 55 m | 0.12 km to 0.95 km | 118.77 | 118.74 | 11.2 ms | 204.6 ms | 70 |
| Festival promenade and fireworks over the bay | 6040 m | 0.12 km to 0.95 km | 118.92 | 118.84 | 11.6 ms | 150.8 ms | 70 |

Reproduce from the frontend workspace with `npm run perf -- diwali-tablet --headed`.
