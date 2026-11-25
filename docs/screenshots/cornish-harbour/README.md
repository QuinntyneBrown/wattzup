# Cornish Harbour from the saddle

GCN Training’s Nasty Pasty Sprint Session retains all 41 stages over 17:00. Three laps of the 2.4 km harbour circuit cover 7.2 km and climb 120 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Slate lane, 0.08 km | [Before](before-lane.jpg) | [After](after-lane.jpg) | Tight bends, painted cottage doors and granite kerbs. Real 03, 07 and 14, games 01–02. |
| Fishing harbour, 0.62 km | [Before](before-boats.jpg) | [After](after-boats.jpg) | Marked hulls, moorings, visitors and dogs beside the low-tide sand. Real 01, 04–05 and 08–09, games 02 and 04. |
| Working quay, 0.84 km | [Before](before-quay.jpg) | [After](after-quay.jpg) | Bollards, pots and stonework beside boats and pastel terraces. Real 01–02, 04–05 and 10–11, games 01 and 03. |
| Pasty shops, 1.07 km | [Before](before-shops.jpg) | [After](after-shops.jpg) | Painted fascia boards, sash windows and chalkboards along the inside of the bend. Real 06–07 and 13–14, games 01 and 03. |
| Harbour mouth, 1.15 km | [Before](before-mouth.jpg) | [After](after-mouth.jpg) | The approach opens towards the lighthouse on the granite breakwater. Real 08–12, games 04–05. |
| Cottage climb, 1.70 km | [Before](before-climb.jpg) | [After](after-climb.jpg) | Slate roofs, parked cars and stepped terraces enclose the climb. Real 03, 07, 14–15 and games 01–02. |

The three laps use the same physical lane and village. Compact groups of slate-roofed cottages and shops leave the flat quay, low-tide sand and sea open, preserving the minimalist staging praised in [rider feedback #932](https://github.com/QuinntyneBrown/wattzup/issues/932). Short yellow lines and a mottled asphalt surface mark the kerb. Iron ladders, lobster pots and bollards sit behind the granite capstones. Fishing vessels have painted hulls, fenders and glazed cabins. Afloat hulls move at their moorings while beached boats stay fixed. Gulls cross the quay, and changes in sunlight reveal the damp stone. The foreground visitors use small groups from the project’s Caribana atlas. The headlands and lighthouse stay fixed beyond them. The coast and terraces combine Cornish references within one short circuit. [Credited references](../../worlds/cornwall/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Slate lane and fishing harbour | 35 m | 0.12 km to 0.95 km | 120.23 | 120.00 | 9.6 ms | 16.1 ms | 49 |
| Quay, pasty shops and waterfront visitors | 640 m | 0.12 km to 0.95 km | 119.98 | 119.87 | 9.8 ms | 53.6 ms | 47 |

Reproduce from the frontend workspace with `npm run perf -- cornwall-tablet --headed`.
