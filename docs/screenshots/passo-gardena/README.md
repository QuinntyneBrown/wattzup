# Passo Gardena from the saddle

Select Passo Gardena in Map Select to ride Sellaronda Bike Day. GCN’s Progressive Efforts on the Passo Gardena keeps its ten stages and 20:00 duration. The car-free road covers 8.975 km and climbs 506 m to the saddle. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Selva approach, 0.08 km | [Before](before-selva.jpg) | [After](after-selva.jpg) | The Bike Day banner, cyclists and larches introduce the car-free road. Real 03, 06 and 14, games 01–02. |
| Hay barns and pasture, 1.44 km | [Before](before-barns.jpg) | [After](after-barns.jpg) | Cows with brass bells graze beside dark timber barns. Real 01, 07, 12 and 14, games 01 and 03. |
| Sella walls, 3.18 km | [Before](before-sella.jpg) | [After](after-sella.jpg) | Pale stratified limestone rises behind the nearer conifers. Real 02, 04, 09–11 and 15, games 02–03. |
| Hairpin approach, 5.43 km | [Before](before-hairpins.jpg) | [After](after-hairpins.jpg) | Groups of riders pass through the meadow bends. Real 03–04, 06 and 08, games 01–02. |
| Pizes de Cir, 7.13 km | [Before](before-cir.jpg) | [After](after-cir.jpg) | The separate needles appear on the left side of the approach. Real 05–06 and 12–14, games 03–05. |
| Passo Gardena, 8.76 km | [Before](before-saddle.jpg) | [After](after-saddle.jpg) | Projecting balconies, pass-top parking and the trilingual sign at 2,121 m. Real 01, 08–09 and 13, games 01, 04 and 05. |

Sella, Cir and Sassolungo are fixed separately, with different silhouettes and sightlines through the hairpins. The Ride One kit supplies pedalling Bike Day cyclists. Their wheels follow the sampled road while cattle, fences and crossed larch cutouts stand on the meadow surface. Timber hay barns and cream-stucco rifugi have distinct frontages and roofs. Cow heads, wheels and high clouds follow the ride clock. [Credited references](../../worlds/gardena/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Bike Day approach | 55 m | 0.12 km to 0.95 km | 119.58 | 119.47 | 10.4 ms | 48.9 ms | 123 |
| Sella hairpins and cyclists | 4950 m | 0.12 km to 0.95 km | 120.12 | 120.00 | 9.8 ms | 15.8 ms | 130 |

Reproduce from the frontend workspace with `npm run perf -- gardena-tablet --headed`.
