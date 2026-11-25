# Yorkshire Dales from the saddle

GCN’s Race Winning Intervals retains its original 24 stages over 52:48. The 24.047 km course climbs 334 m, following the Buttertubs from Hawes towards Swaledale. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Hawes, 0.08 km | [Before](before-hawes.jpg) | [After](after-hawes.jpg) | Sash windows, pub frontage and bunting along the narrow village street. Real 06–07, 13–14 and game 01. |
| Lower meadows, 3.26 km | [Before](before-barns.jpg) | [After](after-barns.jpg) | Field barns and open pasture sit beyond two courses of dry-stone wall. Real 08–10, 13, 15 and games 01 and 03. |
| Buttertubs edge, 7.48 km | [Before](before-edge.jpg) | [After](after-edge.jpg) | Narrow roadside posts mark the drop to the right of the road. Real 01–05 and games 02–03. |
| Race-day ramp, 9.12 km | [Before](before-fans.jpg) | [After](after-fans.jpg) | Yorkshire flags, road paint, cheering fans and heather mark the crest. Real 02–07 and games 02, 04–05. |
| Swaledale flock, 14.52 km | [Before](before-flock.jpg) | [After](after-flock.jpg) | Curled horns, black faces and pale fleeces stand out against the green verge. Real 03, 09, 12–13 and games 01 and 03. |
| Muker, 22.88 km | [Before](before-muker.jpg) | [After](after-muker.jpg) | Terraces and pub signs close around the lane below the open fells. Real 08–11, 14–15 and games 01 and 04. |

Village terraces and pubs give way to field barns, stone walls with irregular coping, heather and an exposed edge above the valley. Yellow bikes and blue, white and yellow bunting mark the villages. The final ramps carry painted encouragement and spectators wearing caps, rain shells and cycling kit. The five-petalled Yorkshire rose moves on the flag fabric with ride time. The original spectator atlas adapts Caribana’s technique of batching the crowd. The native field boundaries sit in front of a panoramic landscape matte of the far fells. This condenses the valleys and villages to the class route. Black-faced, horned Swaledale sheep cross or graze the verge and hold when paused. [Credited references](../../worlds/dales/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Hawes village and field walls | 45 m | 0.12 km to 0.95 km | 120.13 | 119.82 | 10.3 ms | 44.9 ms | 58 |
| Buttertubs race crowds and moorland ramps | 8920 m | 0.12 km to 0.95 km | 120.42 | 119.92 | 10.0 ms | 28.3 ms | 61 |

Reproduce from the frontend workspace with `npm run perf -- dales-tablet --headed`.
