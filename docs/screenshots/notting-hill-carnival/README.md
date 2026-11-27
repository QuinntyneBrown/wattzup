# Notting Hill Carnival from the saddle

GCN’s Quick HIIT Workout retains its original 21 stages and zero video offset. The carnival ride covers 5.933 km in 13:45 and climbs 87 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Ladbroke Grove, 0.08 km | [Before](before-grove.jpg) | [After](after-grove.jpg) | Plane trees frame a broad curve between London terraces. Kerbside crowds leave an open riding line through the August street party. Real 01, 04, 13 and 15. Games 01, 03 and 04.. |
| Feathered mas band, 1.04 km | [Before](before-mas.jpg) | [After](after-mas.jpg) | Red and gold plumes turn beside turquoise and magenta wings. Riders pass between the edge of the band and the crowd barriers. Real 02, 05–09. Games 02 and 04.. |
| Corner sound system, 2.13 km | [Before](before-sound.jpg) | [After](after-sound.jpg) | A stack of bass bins and horns faces Ladbroke Grove from the corner. Caribbean flags hang from the balconies and spectators film from the kerb. Real 01–04, 09 and 10. Games 02 and 05.. |
| Steel pan float, 3.09 km | [Before](before-pan.jpg) | [After](after-pan.jpg) | A flatbed carries polished steel pans on racks, players and overhead bunting through pastel terraces. Confetti and powder mark the road below. Real 03, 09–11. Games 02 and 03.. |
| Westway flyover, 4.37 km | [Before](before-westway.jpg) | [After](after-westway.jpg) | The broad concrete deck crosses above the road on paired supports. The riders move from August sun into its shade and back out to the procession. Real 01, 04, 13 and 15. Games 01 and 05.. |
| Jerk grills and food stalls, 5.61 km | [Before](before-grills.jpg) | [After](after-grills.jpg) | Thin smoke curls up from a split drum grill. Caribbean flags brighten the stall awnings and whistle-blowing spectators stand beside the serving tables. Real 04, 10–12 and 14. Games 01 and 03.. |

Ladbroke Grove passes Victorian terraces with balconies draped in Caribbean flags. Mas bands dance beside the rider, the steel pan float moves past towering speaker stacks and smoke rises from the grill beyond the Westway. Each moving feature follows the ride clock. [Credited references](../../worlds/nottinghill/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Ladbroke Grove terraces | 0 m | 0.12 km to 0.95 km | 119.64 | 119.52 | 10.3 ms | 138.8 ms | 37 |
| Steel pan float and mas band | 3010 m | 0.12 km to 0.95 km | 118.62 | 118.42 | 10.9 ms | 71.1 ms | 95 |

Reproduce from the frontend workspace with `npm run perf -- nottinghill-tablet --headed`.
