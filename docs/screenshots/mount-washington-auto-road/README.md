# Mount Washington Auto Road from the saddle

GCN Training’s The Climb retains the 17 original stages over 30:00. The 12.725 km Auto Road climbs 1,453 m and starts at zero video offset. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Auto Road forest gate, 0.08 km | [Before](before-forest.jpg) | [After](after-forest.jpg) | Mile posts and a timber entrance sign frame a narrow patched road. Autumn hardwoods give way to dense spruce up the climb. Real 03–04, 07 and 11. Games 01 and 05.. |
| Gravel shoulder and krummholz, 3.62 km | [Before](before-gravel.jpg) | [After](after-gravel.jpg) | Worn asphalt breaks into gravel along an exposed bend. Wind-stunted firs lean beside the unguarded drop. Real 03–07. Games 01–02 and 05.. |
| Great Gulf treeline break, 6.37 km | [Before](before-gulf.jpg) | [After](after-gulf.jpg) | Low shrubs give way to lichen-covered talus. The Great Gulf falls away beneath the long silhouettes of Adams and Madison. Real 01, 03–04, 08 and 12. Games 02–04.. |
| Cog Railway trestle, 8.49 km | [Before](before-cog.jpg) | [After](after-cog.jpg) | The steam locomotive pushes a red passenger coach up an inclined rack railway. The plume drifts across the timber trestle. Real 08, 11 and 13–14. Games 03 and 05.. |
| Cloud bank above treeline, 10.32 km | [Before](before-cloud.jpg) | [After](after-cloud.jpg) | Wind drives broken cloud over the road. Roadside cairns and rime pick out the edge at the entrance to the fog. Real 02, 08–10, 12 and 15. Games 01 and 04.. |
| Sherman Adams summit, 12.31 km | [Before](before-summit.jpg) | [After](after-summit.jpg) | Spectators ring cowbells at the final steep wall below the visitor centre. The cylindrical observatory tower and low stone Tip-Top House stand above the boulder field. Real 01–02 and 08–10. Games 02–05.. |

Hardwoods turn to firs and krummholz before the treeline opens onto the Great Gulf. A steam locomotive pushes its red coach up the cog railway, cloud blows across the upper road, and cowbells ring beneath the Sherman Adams summit tower. [Credited references](../../worlds/mountwashington/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Auto Road forest gate | 0 m | 0.12 km to 0.95 km | 120.59 | 120.00 | 9.9 ms | 19.6 ms | 32 |
| Summit wall and observatory | 12150 m | 0.12 km to 0.95 km | 120.15 | 119.90 | 9.8 ms | 50.1 ms | 81 |

Reproduce from the frontend workspace with `npm run perf -- mountwashington-tablet --headed`.
