# Isle of Skye Fog from the saddle

GCN Training’s Into the Unknown retains all 18 stages, its 30:00 duration and three-second video offset. The 12.725 km ride gains 172 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Carbost crofts, 0.10 km | [Before](before-carbost.jpg) | [After](after-carbost.jpg) | White harled houses, a chapel bellcote and dark slate roofs step down to Loch Harport. A white diamond marks a passing place on the narrow damp road. Real 02, 03 and 14. Games 01 and 02.. |
| Loch Harport, 1.78 km | [Before](before-harport.jpg) | [After](after-harport.jpg) | Grey water and a handful of moorings lie below the grassy bank. The road leaves the coastal strip for rough heather, with rounded red granite ahead. Real 03, 12 and 14. Games 01 and 05.. |
| Red Cuillin shoulder, 3.98 km | [Before](before-redhills.jpg) | [After](after-redhills.jpg) | The Red Cuillin rises in smooth russet screes. A horned Highland cow turns its head beside the passing bay while sheep crop the unfenced verge. Real 06, 11 and 15. Games 03 and 05.. |
| Fairy Pools burn, 6.32 km | [Before](before-fairypools.jpg) | [After](after-fairypools.jpg) | Under the footbridge a short white cascade drops into a clear blue-green rock pool. The dark gabbro skyline rises behind the boulders. Real 04, 05 and 07. Games 03 and 04.. |
| Black Cuillin mist, 8.84 km | [Before](before-blackridge.jpg) | [After](after-blackridge.jpg) | A ragged gabbro ridge appears through moving low cloud. The white passing-place diamond and near sheep stay readable against the heather. Real 01, 05, 08, 09 and 13. Games 02 and 04.. |
| Glen Brittle shore, 12.14 km | [Before](before-brittle.jpg) | [After](after-brittle.jpg) | The glen opens onto grey sea water below the crofts. A shaft of light touches the last grassy shoulder; the dark ridge stays fixed on the horizon. Real 01, 04, 10 and 11. Games 01 and 05.. |

Original terrain relief distinguishes the jagged Black Cuillin from the rounded Red Cuillin. The Harport panorama looks past moorland towards the boats and crofts. Crossed heather and bracken, rough grazing, diamond signs and a flowing Fairy Pools burn mark the glen. Highland cattle bend at the shoulder to graze and low cloud drifts between the rider and ridge. [Credited references](../../worlds/skye/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Carbost on Loch Harport | 0 m | 0.12 km to 0.95 km | 120.32 | 120.00 | 9.9 ms | 24.5 ms | 96 |
| Fairy Pools and gabbro ridge | 6040 m | 0.12 km to 0.95 km | 120.70 | 120.00 | 9.8 ms | 21.1 ms | 87 |

Reproduce from the frontend workspace with `npm run perf -- skye-tablet --headed`.
