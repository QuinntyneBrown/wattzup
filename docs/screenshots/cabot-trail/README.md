# Cabot Trail from the saddle

Select Cabot Trail in Map Select. GCN’s 60 Minute Endurance Intervals takes exactly 60:00 through seven stages. This 25.075 km interpretation of the western Cape Breton Highlands climbs 584 m between Chéticamp and Pleasant Bay. The seven matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Chéticamp, 0.08 km | [Before](before-cheticamp.jpg) | [After](after-cheticamp.jpg) | Clapboard houses and Saint-Pierre’s silver steeple mark the fishing village. Real 10–12 and game 02. |
| Coastal cut, 2.24 km | [Before](before-cut.jpg) | [After](after-cut.jpg) | The road passes weathered rock, gravel shoulders and the Gulf. Real 01, 02, 04, 08 and game 04. |
| French Mountain, 7.32 km | [Before](before-french.jpg) | [After](after-french.jpg) | Graded switchbacks, steel guardrail and gravel turnout climb toward the headlands. Real 03, 05–08, 13 and game 04. |
| Plateau, 10.46 km | [Before](before-plateau.jpg) | [After](after-plateau.jpg) | A yellow moose crossing sign, grazing wildlife, pools and boreal forest replace the coastal rock cut. Real 09, 12, 15 and games 01, 03. |
| Highland valley, 13.84 km | [Before](before-valley.jpg) | [After](after-valley.jpg) | The road drops below successive wooded ridges. Real 04, 07, 15 and games 01, 03 and 05. |
| MacKenzie Mountain, 19.55 km | [Before](before-mackenzie.jpg) | [After](after-mackenzie.jpg) | The outside of the descent opens to the Gulf and autumn headlands. Real 03, 05–07, 13 and games 03–04. |
| Pleasant Bay, 24.46 km | [Before](before-pleasant.jpg) | [After](after-pleasant.jpg) | The road returns to the shore, timber wharf and working fishing boats. Real 10, 11, 14 and game 02. |

Like the layered Caribana skyline, Cape Breton’s successive headlands and forest ridges occupy fixed positions. The silver steeple, wooden wharves and fishing boats mark the villages. Switchbacks, yellow centre lines, gravel pullouts and steel guardrails follow the two passes. Crests of fir and autumn hardwoods give way to peat pools on the plateau. The moose grazes beside a yellow crossing sign. Working boats heel with the swell and carry lobster traps and a small dinghy. Their motion follows the race clock. The two mountain passes and their village approaches are compressed to the class distance. [Credited references](../../worlds/cabot/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| French Mountain lookout | 7050 m | 0.12 km to 0.95 km | 119.58 | 119.22 | 11.3 ms | 57.8 ms | 37 |
| Pleasant Bay fishing harbour | 23900 m | 0.12 km to 0.95 km | 120.07 | 119.42 | 10.1 ms | 59.7 ms | 29 |

Reproduce from the frontend workspace with `npm run perf -- cabot-tablet --headed`.
