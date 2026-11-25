# Holi in Jaipur from the saddle

Johari Bazaar follows GCN Training’s Short 20 Minute Sprint Blitz. The 8.625 km course climbs 57 m and preserves all 25 cadence and resistance stages and the three-second video offset. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Sanganeri Gate, 0.08 km | [Before](before-sanganeri.jpg) | [After](after-sanganeri.jpg) | A pale arch spans both lanes with pink shops beyond. Real 01, 05 and 11, game 01. |
| Johari Bazaar, 1.36 km | [Before](before-arcades.jpg) | [After](after-arcades.jpg) | Lime outlines and awnings above the merchandise separate the shop bays. Real 03, 10 and 12–14, game 05. |
| Hawa Mahal, 2.92 km | [Before](before-hawa-mahal.jpg) | [After](after-hawa-mahal.jpg) | The projecting window bays and small domed crowns narrow towards the top of the palace. Real 06 and 12–13, game 04. |
| Holi crowd, 4.58 km | [Before](before-gulal.jpg) | [After](after-gulal.jpg) | Dancers lift their arms below bursts of coloured powder. The road remains legible between them. Real 02, 04, 07–09 and 15, games 02–03. |
| Market traffic, 6.21 km | [Before](before-traffic.jpg) | [After](after-traffic.jpg) | An auto-rickshaw, scooters and cattle share the street with the rider. Real 03, 07, 10 and 14, game 01. |
| Chandpole Gate, 8.12 km | [Before](before-chandpole.jpg) | [After](after-chandpole.jpg) | The pink gate and rooftop chhatris frame the approach to the fort ridge. Real 01, 05 and 11–13, games 04–05. |

Like Caribana’s fixed Toronto skyline and moving street parade, Jaipur separates the distant fort ridge, modelled gates and palace, and a foreground crowd. Original shop and asphalt textures add surface detail beneath the awnings and bicycle. Instanced people, cattle, rickshaws and scooters share geometry. The powder uses a seeded translucent texture and a bounded set of expanding puffs. The route compresses the distances between landmarks and simplifies the palace windows into five tiers of repeating bays. [Credited references](../../worlds/jaipur/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Sanganeri Gate and Johari Bazaar | 0 m | 0.12 km to 0.95 km | 120.49 | 120.00 | 9.6 ms | 14.3 ms | 36 |
| Gulal throwers and market traffic | 4350 m | 0.12 km to 0.95 km | 120.45 | 120.00 | 9.7 ms | 21.4 ms | 30 |

Reproduce from the frontend workspace with `npm run perf -- jaipur-tablet --headed`.
