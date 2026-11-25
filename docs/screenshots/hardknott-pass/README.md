# Hardknott Pass from the saddle

Choose The lane over the fells in Map Select. GCN’s 25 Minute Hill Training keeps its eleven stages over 25:00 and three-second video offset. The 10.3 km lane climbs 387 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Warning boards, 0.08 km | [Before](before-sign.jpg) | [After](after-sign.jpg) | The 30% triangle, 1 in 3 plate and caravan advisory stand beside the lane. Real 08–09 and games 02 and 05. |
| Eskdale, 1.76 km | [Before](before-eskdale.jpg) | [After](after-eskdale.jpg) | The rising road looks out towards the green valley floor. Real 04, 07, 12–14 and games 02 and 04. |
| Mediobogdum, 3.26 km | [Before](before-fort.jpg) | [After](after-fort.jpg) | Low grey gate piers, perimeter and internal stone courses sit left of the road. Real 01, 07 and 11–13 inform the spur. Game 01 guides the riding scale. |
| Herdwicks, 5.28 km | [Before](before-herdwick.jpg) | [After](after-herdwick.jpg) | White-faced ewes graze by the grassy verge. One moves across the lane and turns. Real 01 and 11, games 01 and 03. |
| Upper ramps, 7.42 km | [Before](before-hairpin.jpg) | [After](after-hairpin.jpg) | A narrow switchback climbs across the exposed fell. Its preceding ramp reaches 30%. Real 01–03, 05–06 and game 05. |
| Duddon approach, 9.86 km | [Before](before-summit.jpg) | [After](after-summit.jpg) | Beyond the watershed the road descends among crags and opening valleys. Real 10 and 12–15, games 02–04. |

Eleven turns share a continuous fell surface. The narrow tarmac carries intermittent grass, with dry-stone walls set back from the inside of each hairpin. The remains of Mediobogdum occupy a levelled spur. Grey Herdwicks lower their white heads to graze, and a single ewe crosses and turns along the lane. Farther out, farmsteads and the watercourses stay anchored below the road. Original Eskdale and Scafell landscape paintings extend the native fells. Sheep, low mist and breaks in the light follow ride time. The warning triangle and bracken retain the original Hardknott class art. [Earlier class ride views](../hardknott/README.md). [Credited references](../../worlds/hardknott/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Eskdale single-track | 0 m | 0.12 km to 0.95 km | 120.18 | 120.00 | 9.7 ms | 15.4 ms | 63 |
| Upper 30% hairpins | 7200 m | 0.12 km to 0.95 km | 120.52 | 120.01 | 9.6 ms | 17.1 ms | 72 |

Reproduce from the frontend workspace with `npm run perf -- hardknott-tablet --headed`.
