# Winnats Pass from the saddle

The historical 35 Minute Hill Training plan lasts 35:28 and covers 13.50 km. Its sixteen stages take in the approach, gorge and high moor. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Castleton approach, 0.14 km | [Before](before-castleton.jpg) | [After](after-castleton.jpg) | A farm wall, stone cottages and Castleton’s ridge give way to the moorland approach. Real 09, 13–15 and game 05. |
| Lower cattle grid, 4.82 km | [Before](before-grid.jpg) | [After](after-grid.jpg) | A steel cattle grid spans the unmarked lane between dry-stone wall ends at the gorge entrance. Real 01, 05, 06 and games 01, 05. |
| Crag narrows, 6.38 km | [Before](before-limestone.jpg) | [After](after-limestone.jpg) | Grey limestone teeth and loose scree interrupt steep green walls on either side of the kink. Real 02, 03, 06–10 and games 01, 02. |
| Twenty-percent ramp, 7.06 km | [Before](before-ramp.jpg) | [After](after-ramp.jpg) | The road tilts sharply between walkers and climbing cyclists, with sheep on the grassy bank. Real 01, 04, 07, 10 and games 03, 04. |
| Mam Tor shoulder, 9.86 km | [Before](before-mamtor.jpg) | [After](after-mamtor.jpg) | The broken face of Mam Tor stands above a long, exposed green ridge under shifting cloud. Real 07, 11, 12, 14 and game 04. |
| Hope Valley overlook, 12.98 km | [Before](before-hope.jpg) | [After](after-hope.jpg) | Past a low stone wall, the view opens back over Castleton and the small fields of Hope Valley. Real 02, 09, 13–15 and games 02, 05. |

The sampled upper ramp reaches 20%. Grazing sheep, climbing cyclists and walkers follow the ride clock. The limestone bands on Mam Tor belong to a continuous modeled hillside, and the cattle grids and walls stand on the road profile. [Credited references](../../worlds/winnats/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Castleton and the walls | 0 m | 0.12 km to 0.95 km | 119.83 | 119.55 | 10.5 ms | 53.4 ms | 31 |
| the steep limestone gorge | 6240 m | 0.12 km to 0.95 km | 116.85 | 116.81 | 13.3 ms | 93.9 ms | 111 |

Reproduce from the frontend workspace with `npm run perf -- winnats-tablet --headed`.
