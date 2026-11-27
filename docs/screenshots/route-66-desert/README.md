# Route 66 Desert from the saddle

GCN Training’s High Power Tempo With Short Sprints preserves the 19 stages, 20:00 duration and zero video offset. The 8 km route climbs 115 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Painted Desert highway, 0.08 km | [Before](before-shield.jpg) | [After](after-shield.jpg) | A chipped black-and-white shield and yellow centre line stretch towards banded mesas beneath a wide blue sky. Power poles diminish along the red gravel shoulder. Real 01, 02, 04 and 06. Games 01, 04 and 05.. |
| Holbrook Wigwam Motel, 1.16 km | [Before](before-wigwam.jpg) | [After](after-wigwam.jpg) | White concrete wigwams with red trim stand in a staggered row. Turquoise station wagons and finned coupes sit by their low rectangular doors. Real 02, 10 and 11. Games 01 and 05.. |
| Seligman boardwalk, 2.64 km | [Before](before-seligman.jpg) | [After](after-seligman.jpg) | Bright western false-fronts and a timber boardwalk frame a pastel pickup and a string of original short rhyme boards. Real 06 and 11–14. Games 02 and 03.. |
| Hackberry General Store, 3.86 km | [Before](before-hackberry.jpg) | [After](after-hackberry.jpg) | A steel awning shades weathered fuel pumps and vintage signs. A red roadside Pegasus and worn storefront stand above rusting car parts. Real 06, 09 and 12. Games 02 and 04.. |
| Kingman chrome diner, 5.13 km | [Before](before-kingman.jpg) | [After](after-kingman.jpg) | A roadside diner has chrome bands, pink and turquoise panels, luminous roof trim and a glass-fronted counter with red stools. A classic car passes outside. Real 07, 08 and 11. Games 01, 04 and 05.. |
| Oatman and Sitgreaves Pass, 7.26 km | [Before](before-oatman.jpg) | [After](after-oatman.jpg) | A burro walks beside timber boardwalks and rough wooden storefronts below the broken skyline of the Black Mountains. The climbing road turns towards Sitgreaves Pass. Real 03, 05 and 13–15. Games 02, 03 and 05.. |

Painted Desert buttes frame the straight, shield-marked highway. Ride through the Holbrook wigwams, Seligman storefronts, Hackberry fuel stop, Kingman diner and Oatman boardwalk. The tumbleweed, classic car and burro follow ride time. [Credited references](../../worlds/route66/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Painted Desert highway and shield | 0 m | 0.12 km to 0.95 km | 120.53 | 119.95 | 9.8 ms | 26.7 ms | 32 |
| Kingman chrome diner and passing car | 4930 m | 0.12 km to 0.96 km | 120.04 | 119.88 | 10.0 ms | 72.0 ms | 53 |

Reproduce from the frontend workspace with `npm run perf -- route66-tablet --headed`.
