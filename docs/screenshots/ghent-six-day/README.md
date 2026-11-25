# Ghent Six-Day from the saddle

Choose Ghent Six-Day in Map Select. GCN Training’s Level Up Your Cadence runs for 10:00 over 11 stages. The 4.575 km race follows the same 166 m measurement line each lap, with zero climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Opening lap | [Before](before-boards.jpg) | [After](after-boards.jpg) | The pine boards and markings meet the blue apron. Real 03–05, games 01 and 04. |
| First bank | [Before](before-bank.jpg) | [After](after-bank.jpg) | Timber banking rises toward the rail and fans. Real 01, 03 and 12, game 04. |
| First back straight | [Before](before-bars.jpg) | [After](after-bars.jpg) | The near boards run beside the infield; the opposite stands rise under the lamps. Real 01–03 and 13, games 02–03. |
| Return toward the line | [Before](before-board.jpg) | [After](after-board.jpg) | The lap board and bell stand on the infield. Real 03–04 and 12, game 02. |
| Fourth lap | [Before](before-madison.jpg) | [After](after-madison.jpg) | The oval brings the two sides of the racing bowl into one sightline. Real 04–11 and 15, games 01 and 04. |
| Late race | [Before](before-night.jpg) | [After](after-night.jpg) | Crowds and advertising circle the track in the evening light. Real 01–04 and 12, games 03–05. |

The stepped terraces and the continuous pine bowl follow the Kuipke’s tight oval. The bike and chase camera lean into each 52-degree bend. An original crowd illustration wraps the terraces behind the advertising boards. Infield counters, glasses, patrons, the brass bell and lap display stand beneath the low trusses. The two Madison pairs move between the racing and resting lanes and reach with their skinned arms for the hand change. The race plays the original Kuipke March. [Credited references](../../worlds/ghent/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Home straight and infield | 0 m | 0.11 km to 0.95 km | 120.62 | 119.99 | 9.6 ms | 16.0 ms | 57 |
| Madison change and crowded banking | 2040 m | 0.12 km to 0.95 km | 120.26 | 120.00 | 9.6 ms | 17.0 ms | 64 |

Reproduce from the frontend workspace with `npm run perf -- ghent-tablet --headed`.
