# Seven Sisters Cliffs from the saddle

GCN Training’s Sevens: Build Your VO2 Max retains all 29 stages, its 29:20 duration and forty-second video offset. The coastal route climbs 467 m in 12.483 km. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Coastguard Cottages, 0.10 km | [Before](before-cottages.jpg) | [After](after-cottages.jpg) | White cottages with dark pitched roofs and paired chimneys overlook the haven. Their foreground roofs sit below a receding sequence of chalk headlands. Real 03, 08, 13 and 15. Games 02 and 04.. |
| Cuckmere valley, 0.93 km | [Before](before-oxbow.jpg) | [After](after-oxbow.jpg) | The road looks down across a looping tidal river, grazing sheep and a timber field gate. Flint walls flank the chalk lane. Real 05, 07 and 10. Games 01 and 03.. |
| Chalk brows, 2.55 km | [Before](before-brows.jpg) | [After](after-brows.jpg) | Deep green-swarded saddles separate the white cliff brows. A gull banks above a cliff edge and the grey-blue Channel extends beyond it. Real 03, 09, 12, 13 and 15. Games 02 and 04.. |
| Birling Gap, 5.45 km | [Before](before-birling.jpg) | [After](after-birling.jpg) | The road rises above a grey flint beach. A low line of whitewater reaches the shingle and recedes beneath the worn chalk faces. Real 09, 11 and 12. Games 01 and 04.. |
| Belle Tout, 6.29 km | [Before](before-belletout.jpg) | [After](after-belletout.jpg) | The squat white tower, black-glazed lantern and attached keeper’s house mark the eastward turn. The chalk track curves up to the lighthouse. Real 02, 04, 06 and 14. Games 02 and 05.. |
| Return over the downs, 9.61 km | [Before](before-downland.jpg) | [After](after-downland.jpg) | The white-edged road pitches over open sheep-grazed downs. Flowering gorse, a National Trust waymarker and split timber fences frame the next crest. Real 01, 05, 06 and 07. Games 01 and 03.. |

The cottages stand below seven grass-capped chalk faces. An original portrait follows a folded relief mesh across the haven. Belle Tout has a glazed lantern and an attached keeper’s house. Sheep graze, gulls bank and the surf reaches the shore on the ride clock. [Credited references](../../worlds/sevensisters/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Cuckmere Haven and its cottages | 0 m | 0.12 km to 0.95 km | 120.16 | 120.00 | 9.9 ms | 19.6 ms | 175 |
| Birling Gap and the lighthouse approach | 5410 m | 0.12 km to 0.95 km | 120.23 | 119.98 | 9.9 ms | 22.9 ms | 62 |

Reproduce from the frontend workspace with `npm run perf -- sevensisters-tablet --headed`.
