# Old Town Criterium from the saddle

The original 17-stage, 30-minute Cathedral Circuit retains its eight uphill efforts, 14.2 km distance and 140 m of climbing. Its elevation samples and starter unlock are unchanged. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Steenstraat, 0.08 km | [Before](before-steenstraat.jpg) | [After](after-steenstraat.jpg) | Shuttered townhouses crowd the narrow street. The changing sun picks out the rounded blue-grey setts and their dark joints. Real 06–09, 11 and 15. Games 01 and 03.. |
| Cathedral kick, 2.53 km | [Before](before-barriers.jpg) | [After](after-barriers.jpg) | Bannered steel crowd barriers narrow the uphill sprint. Fans three deep cheer beneath the west tower on the skyline. Real 01–05 and 13. Games 01–03.. |
| Townhouse turn, 4.31 km | [Before](before-corner.jpg) | [After](after-corner.jpg) | Bollards draw a line around the kerb of the right-angle corner. Closely spaced shutters, gables and overhead pennants turn with the bunch. Real 06–09, 11 and 12. Games 01 and 04.. |
| Café terraces, 6.98 km | [Before](before-terraces.jpg) | [After](after-terraces.jpg) | Striped parasols shade café tables, chairs and shopfronts behind the barriers. Warm plaster faces the hard midday shadows. Real 01, 02, 10, 12 and 13. Games 02 and 04.. |
| Cathedral square, 10.45 km | [Before](before-westfront.jpg) | [After](after-westfront.jpg) | Buttresses, pointed windows and a layered west portal resolve below the distant spire as the rider climbs into the square. Real 01–05, 13 and 14. Games 01 and 05.. |
| Finish straight, 14.05 km | [Before](before-bell.jpg) | [After](after-bell.jpg) | The truss gantry spans the setts beside the lap board. The bell and waving flags stand against sunlight on the cathedral stone. Real 01, 03, 05 and 13. Games 02 and 05.. |

The townhouse corner changes direction by 90 degrees between bollards. Cobbled setts, steel banner rails, three rows of supporters and stepped gables frame the sprint square. The west portal has deep tracery and layered towers, and the flags, overhead pennants and gantry bell move on the ride clock. [Credited references](../../worlds/oldtown/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Steenstraat | 0 m | 0.12 km to 0.95 km | 120.15 | 120.00 | 10.1 ms | 17.5 ms | 91 |
| Cathedral square sprint | 10320 m | 0.12 km to 0.95 km | 118.62 | 118.58 | 10.7 ms | 144.7 ms | 99 |

Reproduce from the frontend workspace with `npm run perf -- oldtown-tablet --headed`.
