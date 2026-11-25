# Engadin Lakes from the saddle

Choose Engadin Lakes in Map Select for the lakes road from Maloja to St. Moritz. GCN’s 60 Minute Turbo Trainer Class keeps its 28 stages and 60:00 duration. The course covers 24.625 km with 118 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Maloja, 0.08 km | [Before](before-maloja.jpg) | [After](after-maloja.jpg) | Two-lane bitumen, road markings and farm fences introduce the high valley. Real 01–03, games 01 and 05. |
| Lej da Segl, 3.14 km | [Before](before-segl.jpg) | [After](after-segl.jpg) | The shore takes the road below gold larches and glaciated ridges. Real 05, 07 and 14–15, games 02 and 04. |
| Sils, 7.44 km | [Before](before-sils.jpg) | [After](after-sils.jpg) | White houses and etched window surrounds line the village road. Real 02 and 04 for scale and openings, real 14 for the meadows, games 02–03. |
| Lake Silvaplana, 12.82 km | [Before](before-silvaplana.jpg) | [After](after-silvaplana.jpg) | Bright kites move over the water on the southern side of the village. Real 07 and 09–10 supply the shore, games 01 and 04 the view from the saddle. |
| Railway, 19.36 km | [Before](before-railway.jpg) | [After](after-railway.jpg) | A red Rhaetian passenger train moves along the adjoining steel rails and overhead supply. Real 11–12, game 03. |
| St. Moritz, 23.91 km | [Before](before-moritz.jpg) | [After](after-moritz.jpg) | The hotel terraces, leaning stone tower and parish spire emerge on the hillside beyond the lake. Real 06, 08 and 10–13, games 04–05. |

Three separate lakes occupy their respective basins below the road. Original water ripples move on ride time, and the near bank, forest and peaks pass at different rates as in Caribana’s foreground and skyline. The fixed alpine range, St. Moritz hillside, sgraffito fronts and larch and pine profiles use original atlases. The red train follows the railway through its bend, and five kites swing on the Silvaplana water. Pausing holds both. The villages and rail corridor are condensed to fit the original workout. [Credited references](../../worlds/engadin/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Maloja lakeshore | 55 m | 0.12 km to 0.95 km | 120.19 | 120.00 | 9.5 ms | 14.0 ms | 68 |
| Silvaplana kites and village | 12480 m | 0.12 km to 0.95 km | 120.57 | 120.00 | 9.5 ms | 16.1 ms | 103 |

Reproduce from the frontend workspace with `npm run perf -- engadin-tablet --headed`.
