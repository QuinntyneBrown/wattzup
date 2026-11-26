# Sella Ronda from the saddle

GCN Training’s Over/Under Intervals on the Passo Sella retains all seventeen stages, 28:00 and its three-second video offset. The original four-pass course measures 11.65 km and 364 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Corvara approach, 0.20 km | [Before](before-corvara.jpg) | [After](after-corvara.jpg) | The road approaches Corvara’s church and timber balconies beneath the massif. A group of cyclists leaves the village ahead of the rider. Real 03, 11 and 13. Games 02 and 05.. |
| Passo Campolongo, 2.06 km | [Before](before-campolongo.jpg) | [After](after-campolongo.jpg) | The first col has a signed roadside refuge, a mown pasture and a ski-lift line rising clear of the roofs. Real 03, 04, 06 and 07. Games 02 and 03.. |
| Arabba valley, 3.08 km | [Before](before-arabba.jpg) | [After](after-arabba.jpg) | The plunge into Arabba ends at village windows and a church tower. The next ribbon of climbing tarmac can be traced against the meadow. Real 03, 13 and 15. Games 02 and 05.. |
| Passo Pordoi, 4.90 km | [Before](before-pordoi.jpg) | [After](after-pordoi.jpg) | The numbered Pordoi switchbacks climb to the pass refuge. Sass Pordoi and the snow streaks of Marmolada rise on opposite horizons. Real 09, 10, 12 and 15. Games 01 and 04.. |
| Passo Sella approach, 7.44 km | [Before](before-sella.jpg) | [After](after-sella.jpg) | Sassolungo rises ahead on the open approach. The road then bends past the touring motorbike and the summit sign at the col. Real 01, 06, 08, 11 and 12. Games 02 and 04.. |
| Passo Gardena, 10.10 km | [Before](before-gardena.jpg) | [After](after-gardena.jpg) | The last refuge and signed col lie among summer meadows above Selva. A banner moves in the wind beside the chapel and a chairlift traverses the slope. Real 05–09 and 14. Games 03 and 05.. |

The revised course retains the native villages, four cols, cableways and paragliders. A rigged Bike Day bunch leaves Corvara, the pannier-equipped motorbike banks with the road, and tricolour cloth moves on the refuge terraces. The Corvara civic hall was moved clear of the original hairpin. Summit boards carry the pass names and altitude. [Credited references](../../worlds/sellaronda/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Corvara and the morning bunch | 0 m | 0.12 km to 0.95 km | 120.26 | 119.99 | 9.8 ms | 15.3 ms | 132 |
| Sassolungo and the Sella pass | 7350 m | 0.12 km to 0.95 km | 120.06 | 119.94 | 10.0 ms | 25.2 ms | 89 |

Reproduce from the frontend workspace with `npm run perf -- sellaronda-tablet --headed`.
