# Napa Vineyards from the saddle

GCN Training’s Easy Riding retains all 19 stages and its original zero video offset. The Silverado Trail rolls 8.2 km over 20:00 and climbs 51 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Silverado Trail, 0.08 km | [Before](before-silverado.jpg) | [After](after-silverado.jpg) | A broad paved shoulder follows the yellow centre lines between the first trellises. Long oak shadows cross the tarmac. Real 01–03 and 06. Games 02 and 04.. |
| Mustard between trellises, 1.46 km | [Before](before-mustard.jpg) | [After](after-mustard.jpg) | Sunlit mustard and orange poppies edge weathered vineyard posts. Parallel vine rows run across the valley floor to the dry hills. Real 04, 05, 09–11. Games 01–03.. |
| Stone winery terrace, 3.12 km | [Before](before-terrace.jpg) | [After](after-terrace.jpg) | A gravel turnoff climbs to the fieldstone cellar. Low walls, shaded tables, wine barrels and parasols line its tasting terrace. Real 06, 08, 09 and 14. Games 02 and 03.. |
| Oak-shaded gate, 4.63 km | [Before](before-gate.jpg) | [After](after-gate.jpg) | A carved winery sign hangs between masonry piers. Iron gate leaves open under a spreading live oak. Real 02, 07, 13 and 15. Games 03 and 05.. |
| Vaca and Mayacamas ranges, 6.18 km | [Before](before-valley.jpg) | [After](after-valley.jpg) | A rise reveals both belts of tawny hills behind the vineyards. A convertible follows the bends and another rider pedals along the shoulder. Real 01, 03, 06, 10 and 12. Games 01 and 04.. |
| Mission winery, 7.84 km | [Before](before-mission.jpg) | [After](after-mission.jpg) | A red-tiled arcade meets the white stucco bell tower. The road rises toward its bell opening and the courtyard beyond. Real 07, 08 and 15. Games 02 and 05.. |

Vines on trellises and drifts of mustard follow the Silverado Trail between the Vaca and Mayacamas ranges. A fieldstone winery overlooks its shaded tasting terrace. Riders pass olive-green live oaks and the iron gate before reaching the mission winery and its open bell tower. The shoulder cyclist pedals, the convertible travels with the ride clock and the flowers sway in the breeze. [Credited references](../../worlds/napa/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Silverado Trail and trellises | 0 m | 0.12 km to 0.95 km | 119.58 | 119.07 | 10.2 ms | 115.4 ms | 68 |
| Mission winery and tasting traffic | 7730 m | 0.12 km to 0.95 km | 120.61 | 119.77 | 9.8 ms | 51.6 ms | 58 |

Reproduce from the frontend workspace with `npm run perf -- napa-tablet --headed`.
