# Col d'Aubisque from the saddle

Choose Col d'Aubisque in Map Select. GCN’s 37-stage *35 Minute Torque Power Intervals* lasts 33:00 by its original timestamps. The 12.6 km route descends from Soulor into the cirque before climbing to the Aubisque summit, with 361 m of total ascent. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Col du Soulor, 0.08 km | [Before](before-soulor.jpg) | [After](after-soulor.jpg) | Slate chalet and roadside sign at the green pass. Real 05, 07, 09, 11, 12 and 15 and game 03. |
| Cirque du Litor, 2.04 km | [Before](before-balcony.jpg) | [After](after-balcony.jpg) | Low stone blocks line the open edge over the Ouzom valley. Real 01, 12 and 14 and games 01 and 02. |
| First rock bore, 2.82 km | [Before](before-tunnel.jpg) | [After](after-tunnel.jpg) | A rough arch cuts through the grey cliff. Real 01, 14 and 15 establish the rock face and game 02 the approaching sightline. |
| Balcony herd, 3.15 km | [Before](before-herd.jpg) | [After](after-herd.jpg) | Free-roaming livestock step across the verges below the low cloud. Real 02, 04 and 11 give open-road scale and game 05 the riding view. |
| Upper pastures, 8.12 km | [Before](before-pasture.jpg) | [After](after-pasture.jpg) | Cloud thins over the sheep and horses on the ascent. Real 09–12 and 15 and game 03. |
| Col d’Aubisque, 12.50 km | [Before](before-summit.jpg) | [After](after-summit.jpg) | Summit sign, terrace and giant yellow, green and polka-dot bikes. Real 03, 06, 08 and 13 and games 04–05. |

The cliffs and stone parapets follow the physical centre line, and the small grade panel reads its elevation every 25 metres. Fixed limestone peaks and summer snow sit behind the nearer balconies. Horses, cattle and sheep share an instance buffer and step aside as riders approach. Three soft moving cloud banks shade the cirque. Both weather and animal poses follow ride time and hold on pause. The café terrace has cyclists, bike racks, a small car park and three giant tour-jersey bicycles. [Credited references](../../worlds/aubisque/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Soulor | 0 m | 0.12 km to 0.95 km | 119.99 | 119.80 | 9.7 ms | 50.5 ms | 17 |
| Litor tunnels and livestock | 2740 m | 0.12 km to 0.95 km | 120.85 | 120.00 | 9.7 ms | 17.4 ms | 19 |

Reproduce from the frontend workspace with `npm run perf -- aubisque-tablet --headed`.
