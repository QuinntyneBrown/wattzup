# Outback Highway from the saddle

Running on Empty retains 16 stages, 25:00 and a four-second video offset. This 10.775 km stretch of the Lasseter Highway climbs 25 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Erldunda turnoff, 0.08 km | [Before](before-erldunda.jpg) | [After](after-erldunda.jpg) | Green direction boards lead onto straight bitumen. White edge lines separate the riding surface from red wheel ruts and golden spinifex. Real 01, 06–08 and 15. Games 02 and 03.. |
| Road train, 1.71 km | [Before](before-roadtrain.jpg) | [After](after-roadtrain.jpg) | A long-bonneted prime mover and three articulated trailers pass in the opposing lane. Dust trails off the outer wheels and the apparent wind shifts as the vehicle passes. Real 01, 05 and 15. Games 02, 03 and 05.. |
| Curtin Springs, 3.62 km | [Before](before-curtin.jpg) | [After](after-curtin.jpg) | Fuel bowsers stand on a red-sand apron below the corrugated roadhouse veranda. The next-fuel sign, desert oaks and timber fencing stand apart from its frontage. Real 07, 08, 11 and 14. Games 02 and 03.. |
| Mount Conner lookout, 5.41 km | [Before](before-conner.jpg) | [After](after-conner.jpg) | The distant mesa has a long level summit and sloping shoulders. A wedge-tailed eagle circles above roadside scrub and the yellow wildlife-warning signs. Real 06, 10, 13 and 14. Games 02 and 05.. |
| Kata Tjuta, 7.88 km | [Before](before-domes.jpg) | [After](after-domes.jpg) | A cluster of rounded rock domes rises beyond the desert oaks. Sunset begins to catch the shoulders of the domes. Real 03, 04, 09 and 15. Games 02–04.. |
| Uluru at dusk, 10.21 km | [Before](before-uluru.jpg) | [After](after-uluru.jpg) | Uluru rises as a broad single monolith, warm orange-red across a dark spinifex plain. Erosion channels mark its face under a pink and purple sky. Real 02, 09 and 12. Games 01, 03 and 04.. |

The red prime mover and three trailers pass in the opposing lane. A wedge-tailed eagle circles the verge. Mount Conner, Kata Tjuta and Uluru have distinct fixed silhouettes as the desert light changes. [Credited references](../../worlds/outback/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Erldunda and the desert highway | 0 m | 0.12 km to 0.95 km | 119.15 | 118.86 | 10.7 ms | 72.2 ms | 173 |
| Road train and its dust plume | 1570 m | 0.12 km to 0.95 km | 119.78 | 119.52 | 10.7 ms | 121.9 ms | 188 |

Reproduce from the frontend workspace with `npm run perf -- outback-tablet --headed`.
