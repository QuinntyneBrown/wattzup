# Stelvio Pass from the saddle

GCN Training’s Conquer the Climb retains all twenty stages, its 20:00 duration and three-second video offset. The 8.175 km route climbs 630 m to the 2,757 m summit. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Trafoi larches, 0.10 km | [Before](before-trafoi.jpg) | [After](after-trafoi.jpg) | Tall larch and pine frame the lower road, a rider climbs ahead and the first tornante plaque counts down from 48. The inner rock cut and outside posts follow the grade. Real 01, 02 and 15. Games 04 and 05.. |
| Stone retaining wall, 1.57 km | [Before](before-retaining.jpg) | [After](after-retaining.jpg) | The next traverse sits on a battered dry-stone wall. A motorbike leans through the bend between white edge markings and scuffed stone parapets. Real 01–03, 06 and 12. Games 02 and 05.. |
| Trafoi wall of hairpins, 3.83 km | [Before](before-stack.jpg) | [After](after-stack.jpg) | A view across the slope shows real traverses stacked above and below. The stone walls keep their positions as the rider turns through the numbered bend. Real 04, 05, 07–09, 12 and 13. Games 02–04.. |
| Painted climbers’ bend, 5.21 km | [Before](before-paint.jpg) | [After](after-paint.jpg) | Original rider names and encouragement follow the worn tarmac uphill. A slow camper takes the outside of the next bend while other cyclists climb on the right. Real 01, 05 and 14. Games 03 and 05.. |
| Ortler snowfield, 6.73 km | [Before](before-ortler.jpg) | [After](after-ortler.jpg) | The larches give way to fractured grey scree and lingering banks. Pale glacier tongues cut the dark Ortler massif while cloud moves below the peaks. Real 02, 06–08 and 14. Games 01–04.. |
| Passo dello Stelvio summit, 8.05 km | [Before](before-summit.jpg) | [After](after-summit.jpg) | The last numbered tornante opens below the pale yellow summit hotel, sausage stand and souvenir shops. The 2,757 m sign and snowfields remain visible past the finish. Real 10, 11 and 14. Games 01 and 05.. |

All 48 numbered bends are physical turns in the road. Retaining walls follow the grades and the signs count down from 48 to 1. Original Ortler, stone and summit artwork frames a peloton, motorbike and camper, while the finish passes a hotel, food kiosk and souvenir stalls. Like Caribana’s fixed Toronto horizon, the glacier remains anchored while the road turns. The 48 turns fit the original class distance. [Credited references](../../worlds/stelvio/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| the Trafoi larches | 0 m | 0.12 km to 0.95 km | 119.03 | 118.94 | 10.7 ms | 101.9 ms | 117 |
| the upper wall of hairpins | 6500 m | 0.12 km to 0.95 km | 119.70 | 119.38 | 10.2 ms | 102.1 ms | 78 |

Reproduce from the frontend workspace with `npm run perf -- stelvio-tablet --headed`.
