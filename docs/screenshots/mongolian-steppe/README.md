# Mongolian Steppe from the saddle

The 19.15 km route climbs 131 m during GCN Training’s 45-minute Un-Paced Efforts class. All 18 stages and the three-second video offset follow the recovered class. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Branching double-track, 0.12 km | [Before](before-ruts.jpg) | [After](after-ruts.jpg) | Twin strips of pale gravel cut across the grass. An older pair branches off and rejoins over the rise. The broad horizon stays open between the rider and the blue hills. Real 01–04. Games 01 and 03.. |
| Ger camp, 3.16 km | [Before](before-gers.jpg) | [After](after-gers.jpg) | A cluster of round white felt gers sits below a ridge. Roof poles, low chimneys, dark binding ropes and orange timber doors read against the grass. Real 05, 06 and 14. Games 02 and 05.. |
| Running horses, 6.55 km | [Before](before-horses.jpg) | [After](after-horses.jpg) | Stocky dun and brown horses with short upright manes run beside the rider. Their legs lift in staggered groups, then the herd crosses the far track. Real 09, 10 and 15. Games 01 and 03.. |
| Ovoo cairn, 9.74 km | [Before](before-ovoo.jpg) | [After](after-ovoo.jpg) | Irregular stone piles rise beside the crest. Blue khadag scarves flutter on the poles; far below, tracks diverge across a treeless river valley. Real 07, 08 and 13. Games 01 and 04.. |
| Herders and livestock, 13.42 km | [Before](before-herders.jpg) | [After](after-herders.jpg) | A mounted herder in a deel collects sheep, goats and shaggy yaks off the track. Small wildflowers and gravel pick out the near verge. Real 09–13. Games 02 and 05.. |
| Evening grassland, 18.74 km | [Before](before-sunset.jpg) | [After](after-sunset.jpg) | Low warm light stretches the horse and ger shadows across the grass. The silhouettes of the hills remain fixed below the clouds. Real 03, 05, 13–15. Games 01 and 05.. |

A dirt double-track branches through open grassland. Felt gers, stone ovoos, khadag scarves, a running horse herd and a mounted herder mark the route. The fixed cumulus panorama and moving foreground use the same depth cues as Caribana. Physical ger roofs and poles, original felt and track artwork and repeated wildflowers keep the distant plain and the ground beside the bike distinct. [Credited references](../../worlds/steppe/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| the branching double-track | 0 m | 0.12 km to 0.95 km | 120.72 | 120.00 | 9.8 ms | 14.7 ms | 78 |
| the running horse herd | 6340 m | 0.12 km to 0.95 km | 120.18 | 120.00 | 9.7 ms | 13.3 ms | 62 |

Reproduce from the frontend workspace with `npm run perf -- steppe-tablet --headed`.
