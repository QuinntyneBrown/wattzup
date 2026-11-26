# La Mercè, Barcelona from the saddle

GCN Training’s 90 On 30 Off Intervals retains 24 stages over 29:55 and 12.817 km. The course climbs 21 m and the video starts with the workout. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Via Laietana, 0.08 km | [Before](before-laietana.jpg) | [After](after-laietana.jpg) | Rows of five- to seven-storey stone office blocks frame the broad striped avenue. Low sodium pools, striped senyeres and spectators at the barriers guide the riding line. Real 01, 05–07. Games 01 and 03.. |
| Gegants and capgrossos, 2.24 km | [Before](before-gegants.jpg) | [After](after-gegants.jpg) | A giant in a red barretina and a tall skirted partner turn above their handlers. The big-headed dancers weave below them at the edge of the avenue. Real 09–12. Games 01 and 04.. |
| Correfoc, 4.58 km | [Before](before-correfoc.jpg) | [After](after-correfoc.jpg) | Hooded devils flank a blue horned fire beast. Airborne sparks arc through street smoke, lighting the paving and the faces behind the barriers. Real 02–04 and 14–15. Games 02 and 05.. |
| Plaça Sant Jaume, 6.76 km | [Before](before-castells.jpg) | [After](after-castells.jpg) | The castellers form a broad pinya under narrowing rows of red shirts, white trousers and dark waist sashes. The Ajuntament and Palau de la Generalitat face each other across the plaza. Real 08–09. Games 01 and 04.. |
| Cathedral and Gothic Quarter, 9.32 km | [Before](before-cathedral.jpg) | [After](after-cathedral.jpg) | Narrow limestone lanes open onto the Cathedral’s pointed windows and central spire. Warm light grazes projecting stonework and balconies. Real 06–07 and 13. Games 02–03.. |
| Piromusical finale, 12.26 km | [Before](before-piromusical.jpg) | [After](after-piromusical.jpg) | Coloured projection light washes across the avenue façades. Fireworks break above the distant Montjuïc ridge behind lit festival bunting. Real 02, 05 and 14–15. Games 03 and 05.. |

Via Laietana’s balconies, senyeres and barriers lead to the giants and a fire beast under a shower of sparks. A castell rises in Plaça Sant Jaume. A separate Gothic façade marks the cathedral, and the finale projects coloured light on stone while fireworks break over Montjuïc. [Credited references](../../worlds/merce/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Via Laietana and festival crowds | 0 m | 0.12 km to 0.95 km | 120.38 | 120.00 | 9.8 ms | 14.6 ms | 33 |
| Correfoc fire run | 4400 m | 0.12 km to 0.95 km | 120.44 | 119.90 | 10.0 ms | 71.1 ms | 36 |

Reproduce from the frontend workspace with `npm run perf -- merce-tablet --headed`.
