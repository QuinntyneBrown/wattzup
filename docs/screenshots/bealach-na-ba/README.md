# Bealach na Bà from the saddle

Choose Bealach na Bà in Map Select. GCN’s *22 Minute Strength Intervals* preserves sixteen original stages and 22:00 of riding on the 9.05 km single-track climb. The road rises 623 m from the shore to the 626 m summit. The physical grade reaches 20% under the headwall. The seven matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Pass warning, 0.08 km | [Before](before-foot.jpg) | [After](after-foot.jpg) | Raised lettering beside a grid and a dry-stone wall. Real 05, 08 and 15, game 03. |
| Loch Kishorn, 0.68 km | [Before](before-loch.jpg) | [After](after-loch.jpg) | Circular floating fish pens beside the first climbing road. Real 04, 07, 09 and 14, game 02. |
| Passing place, 1.72 km | [Before](before-passing.jpg) | [After](after-passing.jpg) | The single track widens by a diamond sign and fence. Real 08 and 15, games 01 and 03. |
| Open moor, 3.12 km | [Before](before-flock.jpg) | [After](after-flock.jpg) | Sheep cross the verge below red deer, broken light and rain. Real 11–13, games 01 and 05. |
| First hairpin, 6.86 km | [Before](before-bend.jpg) | [After](after-bend.jpg) | A tight turn exposes the route across the corrie. Real 01, 02 and 10, game 04. |
| Headwall, 7.31 km | [Before](before-hairpins.jpg) | [After](after-hairpins.jpg) | The 20% ramp leads between upper switchbacks and sandstone strata. Real 01–03 and 10, game 04. |
| Summit plateau, 8.97 km | [Before](before-summit.jpg) | [After](after-summit.jpg) | A cairn above the Inner Sound with Raasay and the Cuillin beyond. Real 07, 12–14 and game 05. |

Four hairpins fold beneath the corrie’s fractured sandstone beds. Patched tarmac, intermittent grass, a cattle grid, diamond passing-place signs and a dry-stone wall mark the road. Fish pens and the island ridges keep their positions as the rider turns. An instanced flock steps aside and red deer graze on the moor. Cloud banks, drizzle and breaks in the sunlight share the same ride clock. The sheep and light hold on pause and continue on resume. [Credited references](../../worlds/bealach/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Loch Kishorn passing places | 0 m | 0.12 km to 0.95 km | 120.62 | 120.00 | 9.6 ms | 15.1 ms | 21 |
| corrie headwall and hairpins | 6790 m | 0.12 km to 0.95 km | 120.40 | 120.00 | 9.7 ms | 15.2 ms | 25 |

Reproduce from the frontend workspace with `npm run perf -- bealach-tablet --headed`.
