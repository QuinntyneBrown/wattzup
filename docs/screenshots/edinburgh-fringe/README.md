# Edinburgh Fringe from the saddle

Choose Edinburgh Fringe in Map Select to climb the Royal Mile. GCN Training’s 20 Minute HIIT keeps all 17 stages over 20:00. The 8.655 km route climbs 90 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Canongate, 0.08 km | [Before](before-canongate.jpg) | [After](after-canongate.jpg) | Cambered granite setts run between sandstone lands, narrow closes and shopfronts. Real 01–02, 06 and 15, games 01 and 05. |
| Tron Kirk, 1.34 km | [Before](before-tron.jpg) | [After](after-tron.jpg) | A clock tower and narrow spire mark the High Street. Real 06–07 and 13, games 02–03. |
| High Street, 2.57 km | [Before](before-players.jpg) | [After](after-players.jpg) | Audience circles, colourful flyers and temporary stages gather around the street acts. Real 01–05 and 12, games 03 and 05. |
| St Giles, 4.68 km | [Before](before-giles.jpg) | [After](after-giles.jpg) | The open crown and stone window tracery distinguish the cathedral. Real 08–11, games 02 and 04. |
| Heart of Midlothian, 5.41 km | [Before](before-heart.jpg) | [After](after-heart.jpg) | A pale border surrounds the differently coloured setts of the heart. Real 08–11 give the cathedral setting, game 01 the riding scale. |
| Castle Esplanade, 8.39 km | [Before](before-castle.jpg) | [After](after-castle.jpg) | The Castle and Half Moon Battery rise above the rock at the end of the climb. Real 13–15, games 04–05. |

The High Street preserves the class’s juggling cascade and adds a fire performer, groups of festival visitors and original show posters. The props and intermittent drizzle follow ride time. Fixed architecture and distant crags provide the depth of Caribana’s parade skyline. The royal landmarks combine native meshes and detailed elevations for the approaching rider. Blocks between landmarks are compressed to fit the workout. [Credited references](../../worlds/edinburgh/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Canongate and the tenements | 55 m | 0.12 km to 0.95 km | 120.40 | 120.00 | 9.6 ms | 13.0 ms | 72 |
| High Street performance pitches | 2480 m | 0.12 km to 0.95 km | 120.40 | 120.00 | 9.6 ms | 18.9 ms | 56 |

Reproduce from the frontend workspace with `npm run perf -- edinburgh-tablet --headed`.
