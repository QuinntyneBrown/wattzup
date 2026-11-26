# Strade Bianche from the saddle

GCN Training’s 20 Minutes to Work on Your Cadence retains all eighteen stages, its 20:00 duration and the three-second video offset. The 8.25 km course climbs 132 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| White gravel sector, 0.12 km | [Before](before-gravel.jpg) | [After](after-gravel.jpg) | Pale crushed limestone follows the contour of a bare ridge. The worn wheel lines and loose darker stones read separately at riding speed. A race sector board stands at the verge. Real 01, 02 and 05. Games 01 and 02.. |
| Cypress avenue, 1.54 km | [Before](before-cypress.jpg) | [After](after-cypress.jpg) | Tall pencil cypresses frame the crest. A narrow drive rises to a stone farmhouse with a terracotta roof and an olive grove. Real 02, 04, 05 and 09. Games 03 and 04.. |
| Crete Senesi, 3.10 km | [Before](before-crete.jpg) | [After](after-crete.jpg) | Spring green and harvested ochre fields sweep over the clay hills. Chalk cuts form pale ribs in the calanchi beyond the turn. Real 03, 07, 10 and 11. Games 03 and 04.. |
| Dust behind the bunch, 4.59 km | [Before](before-dust.jpg) | [After](after-dust.jpg) | A small racing group attacks the white rise. Dust trails from the rear tyres and drifts over the verge below the cypresses. Real 01, 05 and 06. Games 01 and 02.. |
| Tifosi on the gravel bank, 6.37 km | [Before](before-tifosi.jpg) | [After](after-tifosi.jpg) | Fans lean over barriers and wave flags on the last gravel bank. A numbered sector arch spans the road. The brick Mangia tower stands in the distance. Real 01, 08 and 15. Games 01 and 05.. |
| Piazza del Campo, 8.05 km | [Before](before-campo.jpg) | [After](after-campo.jpg) | The brick pavement opens into the Campo beneath the narrow Torre del Mangia. The striped Duomo bell tower and pale dome rise on their own ridge. Finish barriers guide the rider into the square. Real 12–15. Games 03 and 05.. |

Pale limestone ruts cross the Crete Senesi between cypress avenues and stone poderi. A small attacking bunch kicks up dust and tifosi wave along the last bank. The Torre del Mangia and the striped cathedral campanile anchor the approach to Siena. Caribana’s separation of detailed foreground figures from a fixed skyline informs the race sightlines. [Credited references](../../worlds/strade/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| the first white sector | 0 m | 0.12 km to 0.95 km | 120.13 | 120.03 | 9.8 ms | 15.4 ms | 78 |
| the dusty attacking bunch | 4380 m | 0.12 km to 0.95 km | 120.36 | 120.02 | 9.9 ms | 17.6 ms | 83 |

Reproduce from the frontend workspace with `npm run perf -- strade-tablet --headed`.
