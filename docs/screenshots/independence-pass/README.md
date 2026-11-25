# Independence Pass from the saddle

Select Highway 82 to ride the 35:00 Over/Under Threshold Efforts class from the aspen forest to the Continental Divide. The 21 original stages set the distance and gradient along a 15.200 km road with 897 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Aspen approach, 0.08 km | [Before](before-aspens.jpg) | [After](after-aspens.jpg) | Golden crowns, white trunks and scattered spruce stand over the double yellow lines. Real 02 and 09, games 03 and 05. |
| Roaring Fork, 2.18 km | [Before](before-roaring-fork.jpg) | [After](after-roaring-fork.jpg) | The forest opens to reveal water breaking over boulders beside the uphill lane. Real 09 and 13, games 03 and 05. |
| Mining meadow, 5.21 km | [Before](before-cabins.jpg) | [After](after-cabins.jpg) | Brown log cabins and ruins stand in a clearing above the river. Real 11 and 14, games 02 and 04. |
| Upper switchback, 8.73 km | [Before](before-switchback.jpg) | [After](after-switchback.jpg) | The two lanes swing around a tight fold toward the thinning spruce. Real 01–03, 06 and 08, games 01 and 04. |
| Twin Lakes overlook, 12.08 km | [Before](before-twin-lakes.jpg) | [After](after-twin-lakes.jpg) | The outside of the bend opens onto two blue lakes beneath fixed, snow-streaked peaks. Real 05, 07, 10, 12 and 15, games 02 and 04. |
| Continental Divide, 15.14 km | [Before](before-divide.jpg) | [After](after-divide.jpg) | The brown Independence Pass board records 12,095 feet at the roadside. Real 03 and 04, games 01 and 02. |

The Roaring Fork runs beside the road beneath golden aspens and spruce. White ripples move around rocks in the stream; leaf motion follows the ride clock. Log cabins give way to six tighter turns, snowbanks and the timber summit sign. The camera follows the cyclist around the outside of the overlook so both lakes are visible below a fixed Sawatch range. The tree atlas and distant skyline are original generated images. The lettered board, river, lakes, rock, buildings and road were constructed for the course. [Credited references](../../worlds/independence/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Aspen grove and the Roaring Fork | 0 m | 0.12 km to 0.95 km | 120.35 | 120.00 | 9.7 ms | 19.7 ms | 62 |
| Upper switchback, snowbank and Continental Divide sign | 14370 m | 0.12 km to 0.95 km | 120.35 | 119.97 | 9.7 ms | 25.5 ms | 39 |

Reproduce from the frontend workspace with `npm run perf -- independence-tablet --headed`.
