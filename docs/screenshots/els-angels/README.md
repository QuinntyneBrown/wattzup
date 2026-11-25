# Els Àngels, Girona from the saddle

Open Els Àngels in Map Select and ride Solo toward Santuari dels Àngels. These paired views follow the same race and simulated bike on Low, with the HUD at 1024 × 768. The earlier build uses the repeating Girona class scene. The revised course takes the rider 17.05 km from the river to the sanctuary and climbs 505 m. It follows all 22 stages of GCN’s 40-minute *Drop Ollie at All Costs*.

| Viewpoint | Original | Course | What to look for |
| --- | --- | --- | --- |
| Onyar, 0.05 km | [Before](before-onyar.jpg) | [After](after-onyar.jpg) | Coloured houses at the river, old city wall, cathedral above the roofline and a local training group. Real 01–03, 05, 13–14 and game 02. |
| Lower climb, 0.29 km | [Before](before-masia.jpg) | [After](after-masia.jpg) | The shoulder beyond the river opens onto ochre masies and the first wooded bend. Real 09–12 and games 01, 05. |
| Forest, 1.42 km | [Before](before-forest.jpg) | [After](after-forest.jpg) | The gap downhill looks out over the plain. Cork trunks, white bend posts and drystone walls mark the road. Groups ride staggered lines and pedal at their own cadence. Real 01–03, 07–10 and games 03–04. |
| Summit, 17.01 km | [Before](before-sanctuary.jpg) | [After](after-sanctuary.jpg) | The church approaches at rider scale. Pale plaster, the stone portal and adjoining guest house frame the terrace above the coast. Real 04, 06 and 15. |

Caribana uses a fixed skyline, batches its foreground and keeps the parade moving on the ride clock. Girona uses fixed ridgelines and baked road lettering. Three reusable club cyclists represent passing training groups. Stone and roof colours stand in for distant masonry. [Original references and credits](../../worlds/angels/SOURCES.md) · [Previous rendering work](../angels/README.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro with a 1024 × 768 touch viewport, DPR 1, 4× CPU throttle and Low/WebGL 2. Each sample warms for nine seconds, then measures one minute of fake pedalling. Frame intervals come from submitted world draws.

| Section | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak draw calls |
| --- | ---: | ---: | ---: | ---: | ---: |
| Onyar riverfront | 120.50 | 120.00 | 9.6 ms | 13.8 ms | 32 |
| Wooded training climb | 120.59 | 120.00 | 9.7 ms | 18.5 ms | 47 |

These measurements cover the first training-group build. A separate run checks the revised summit model. Reproduce from the frontend workspace with `npm run perf -- 'angels-(views|tablet)\.perf\.ts$' --headed`.
