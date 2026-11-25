# Hoover Dam from the saddle

Choose The dam road in Map Select. The eleven original stages of GCN Training’s 30 Minutes of Threshold Power cover 13.175 km in 30:00 with a three-second video offset. The approach descends from the Nevada rock cuts and the shore road climbs 65 m in total. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Old US 93, 0.08 km | [Before](before-approach.jpg) | [After](after-approach.jpg) | Roadside creosote, rough gravel, a stone parapet and a rocky skyline. Real 03–06; games 01–02. |
| Switchbacks, 2.31 km | [Before](before-switchback.jpg) | [After](after-switchback.jpg) | The road doubles past exposed dark breccia on its descent. Real 03–05; games 02 and 04. |
| Downstream arch, 4.34 km | [Before](before-bridge.jpg) | [After](after-bridge.jpg) | The western shoulder opens across the Colorado to the paired arches and columns below the bypass deck. Real 07–09 and 14; games 01 and 04. |
| Crest, 4.91 km | [Before](before-crest.jpg) | [After](after-crest.jpg) | The pale curved parapet, Deco lamps, visitors and ribbed intake towers define the crossing. Real 02, 07, 09–13; game 05. |
| Memorial plaza, 5.09 km | [Before](before-plaza.jpg) | [After](after-plaza.jpg) | The Winged Figures and flagpole stand on their terrazzo terrace, with transmission lines up the canyon walls. Real 02, 05 and 15; games 03 and 05. |
| Lake Mead, 10.63 km | [Before](before-lake.jpg) | [After](after-lake.jpg) | A pale mineral band traces the blue reservoir below the dry hills. Real 01, 04, 10 and 12–13; games 03–05. |

The previously repeating crest is now a fixed 380 m curve above the Colorado. Its downstream face thickens toward the toe. Four ribbed intake towers stand in the reservoir, reached on separate footbridges. Two carry the original clock artwork. Downstream, twin concrete arches carry the bypass deck and its rows of spandrel columns. The powerhouses and lattice pylons rise above the canyon; perched on a terrace near the crest are the bronze figures and a terrazzo star map. The injected road clock places a walking visitor and animates the hot air above the shore. An original Black Canyon rock texture gives the road cuts visible grain. A separate original landscape painting extends the native volcanic terrain. The full ride uses the existing cyclist kit and retains the original class’s surface artwork. [Credited references](../../worlds/hoover/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Old US 93 rock cut | 0 m | 0.12 km to 0.96 km | 120.71 | 120.00 | 9.7 ms | 12.4 ms | 40 |
| Crest, intake towers and memorial plaza | 4690 m | 0.12 km to 0.95 km | 120.51 | 120.00 | 9.6 ms | 12.3 ms | 60 |

Reproduce from the frontend workspace with `npm run perf -- hoover-tablet --headed`.
