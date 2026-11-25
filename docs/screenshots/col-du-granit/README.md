# Col du Granit from the saddle

Earn three stars on Dolomites to open Col du Granit. The 16.1 km race preserves the original 17 stages over 30:00, all 4,097 elevation samples and 1,240 m of total climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Lower forest, 0.08 km | [Before](before-forest.jpg) | [After](after-forest.jpg) | Larch and stone pine stand beside the narrow worn road. Real 01 and 07, games 01 and 03. |
| Stacked hairpins, 3.68 km | [Before](before-hairpins.jpg) | [After](after-hairpins.jpg) | Stone retaining courses and two-tone posts mark the outside of the switchback. Real 02, 04 and 10, games 02 and 04. |
| North face, 6.24 km | [Before](before-face.jpg) | [After](after-face.jpg) | Steep grey granite buttresses catch first light along the upper beds. Real 05, 08–09 and 12, games 01 and 05. |
| Snow gully, 9.13 km | [Before](before-gully.jpg) | [After](after-gully.jpg) | Late snow and meltwater flank the road and the painted rider names. Real 03, 06 and 11, games 02 and 03. |
| Drop-side parapet, 12.51 km | [Before](before-parapet.jpg) | [After](after-parapet.jpg) | Courses of stone hold the steep bench above the neighbouring traverse. Real 02, 04 and 13, games 01 and 04. |
| Col refuge, 15.95 km | [Before](before-saddle.jpg) | [After](after-saddle.jpg) | The stone refuge, cairn and pass sign mark the last saddle. Real 14–15, games 03 and 05. |

The height field joins consecutive traverses, allowing glimpses of retaining walls and other ramps. Two ranges carry the original granite surface and warm-edged summit rock. Native conifer trunks and crossed larch and stone pine crowns thin above the lower forest. The original road signs use the baked altitude and the following kilometre’s average gradient. The last section descends to the refuge as specified by the original workout profile. Meltwater crests and drifting mist advance on the ride clock and hold on pause. [Credited references](../../worlds/granite/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Lower north face | 0 m | 0.12 km to 0.96 km | 120.41 | 120.00 | 9.7 ms | 17.0 ms | 48 |
| Stacked hairpins | 5650 m | 0.12 km to 0.96 km | 120.26 | 120.00 | 9.8 ms | 14.9 ms | 63 |

Reproduce from the frontend workspace with `npm run perf -- granite-tablet --headed`.
