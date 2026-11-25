# Cinque Terre from the saddle

The original 20 stages of GCN Training’s 3 Mins On, 2 Mins Off follow the SP370 for 40:00 over 17.088 km, climbing 335 m. The seven matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| SP370, 0.08 km | [Before](before-corniche.jpg) | [After](after-corniche.jpg) | The parapet follows the bends of the cliff road. Real 01–03, 14 and game 01. |
| Sentiero Azzurro, 0.32 km | [Before](before-path.jpg) | [After](after-path.jpg) | A walker with poles crosses near the existing trail steps. Real 02, 03, 15, games 03 and 05. |
| Approach to Vernazza, 3.77 km | [Before](before-cove.jpg) | [After](after-cove.jpg) | The bend approaches the harbour below the road. Real 07–09 and game 04. |
| Vernazza, 4.04 km | [Before](before-vernazza.jpg) | [After](after-vernazza.jpg) | The Doria tower, church and piazza mark the village approach. Real 07–09 and game 02. |
| Corniglia, 5.79 km | [Before](before-corniglia.jpg) | [After](after-corniglia.jpg) | The village rises behind the headland and parapet. Real 10–11 and game 03. |
| Manarola, 12.48 km | [Before](before-manarola.jpg) | [After](after-manarola.jpg) | Boats on chocks, tall coloured houses and shutters line the road. Real 01, 04–06, 14 and game 01. |
| Riomaggiore, 15.27 km | [Before](before-riomaggiore.jpg) | [After](after-riomaggiore.jpg) | Afternoon light warms the final village streets above the ravine. Real 05, 12–13 and game 05. |

Boats sit in water sampled from each village’s actual seabed. Their curved painted strakes, gunwales, thwarts and oars share one mesh. Walkers carry packs and trekking poles across the nineteen mapped crossings. Surf, boats and walkers follow ride time. The light warms over the last third. Caribana’s moving foreground and fixed skyline informed the separation of these actors from the existing terraces, Doria tower and village façades. The connected forks and overlapping sprays of the stone pines now read as one tree against the sky. From this clifftop riding height the parapet and terrain often screen the water and boats. The movement checks cover the moorings separately. [Earlier native course views](../cinqueterre/README.md). [Credited references](../../worlds/cinqueterre/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| SP370 and Sentiero Azzurro | 25 m | 0.12 km to 0.95 km | 120.29 | 120.00 | 9.7 ms | 17.2 ms | 36 |
| Vernazza harbour and piazza | 3950 m | 0.12 km to 0.96 km | 118.76 | 118.61 | 10.3 ms | 165.1 ms | 29 |

Reproduce from the frontend workspace with `npm run perf -- cinqueterre-tablet --headed`.
