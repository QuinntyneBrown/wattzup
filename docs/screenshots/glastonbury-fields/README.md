# Glastonbury Fields from the saddle

Choose The trackway in Map Select. GCN Training’s Sprint to the Music keeps its original 35 stages and 25:00 duration. The 10.515 km Worthy Farm circuit climbs 84 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Pyramid Stage, 0.08 km | [Before](before-pyramid.jpg) | [After](after-pyramid.jpg) | The triangular steel roof, PA towers and screens stand beyond the trackway. Real 05–06 and 15, game 02. |
| Hillside campsite, 1.57 km | [Before](before-camp.jpg) | [After](after-camp.jpg) | Multicoloured dome tents sit on the slope below the fixed Tor. Real 01, 07, 10, 13–14 and games 01 and 03. |
| West Holts approach, 3.45 km | [Before](before-west-holts.jpg) | [After](after-west-holts.jpg) | The route bends between stalls, fans and the other stages. Real 02–03 and 09, games 02 and 05. |
| Arcadia, 5.62 km | [Before](before-arcadia.jpg) | [After](after-arcadia.jpg) | Articulated legs support the suspended performance space. Real 08 and game 04. |
| The Park, 7.83 km | [Before](before-ribbon.jpg) | [After](after-ribbon.jpg) | Streamers wrap the Ribbon Tower above the crowd and tents. Real 01 and 04, game 03. |
| Pyramid field finish, 10.38 km | [Before](before-lights.jpg) | [After](after-lights.jpg) | Light strings lead back towards the lit Pyramid Stage. Real 05–06, 11–12 and 15, games 01–02. |

The Pyramid Stage stands in the same field at the beginning and end of the measured circuit. An original concert image dresses its performance opening and screens. Painted stage crowds continue behind the animated festivalgoers along the wet verge. Metal panel joints, recessed bolts and worn surfaces follow the grade. Each flag has a fixed pole and a flexing tip. Boots, sleeves and festival colours vary among the walkers. The fairy lights brighten with ride time, and pausing holds their intensity, the flags and the walkers. [Credited references](../../worlds/glastonbury/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Festival rollout | 0 m | 0.12 km to 0.95 km | 120.48 | 120.00 | 9.6 ms | 14.7 ms | 46 |
| Pyramid Stage finish crowd | 9900 m | 0.12 km to 0.95 km | 120.54 | 120.00 | 9.6 ms | 12.7 ms | 51 |

Reproduce from the frontend workspace with `npm run perf -- glastonbury-tablet --headed`.
