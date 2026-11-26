# Verona Arena Finale from the saddle

Reverse HIIT Race Winning Intervals runs for one hour over 24 km. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Torricelle climb, 0.14 km | [Before](before-torricelle.jpg) | [After](after-torricelle.jpg) | Cypresses and vineyard rows open onto red roofs below the climbing riders. Real 07, 10, 13, 15 and games 01, 05. |
| Adige overlook, 6.31 km | [Before](before-adige.jpg) | [After](after-adige.jpg) | The river curls beneath the terracotta riverfront and the stone and brick bridge. Real 07, 08, 10 and games 03, 05. |
| Ponte Pietra, 11.43 km | [Before](before-pietra.jpg) | [After](after-pietra.jpg) | Ride between the stone parapets over the moving Adige, toward the bridge tower. Real 07, 08, 10, 14 and game 04. |
| Piazza delle Erbe, 16.72 km | [Before](before-erbe.jpg) | [After](after-erbe.jpg) | The brick Lamberti tower and octagonal belfry rise above market parasols and pink paving. Real 01, 10, 14 and games 03, 04. |
| Portoni della Bra, 21.85 km | [Before](before-bra.jpg) | [After](after-bra.jpg) | The twin arches and clock lead to the cafes of the Liston behind pink crowd barriers. Real 01, 06, 11, 15 and games 02, 04. |
| Arena finish, 23.97 km | [Before](before-arena.jpg) | [After](after-arena.jpg) | Enter the pink limestone arcade and finish inside the seating bowl under waving pink scarves. Real 02-05, 12, 13 and games 01, 02. |

Original architecture and vineyard artwork follows the Torricelle, Ponte Pietra, market and gates into the arena. Riders pedal, the Adige moves and supporters wave. [Credited references](../../worlds/verona/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Torricelle vineyards | 0 m | 0.12 km to 0.95 km | 120.21 | 119.99 | 9.9 ms | 20.0 ms | 53 |
| Arena approach | 23000 m | 0.11 km to 0.95 km | 118.24 | 118.19 | 10.8 ms | 82.7 ms | 142 |

Reproduce from the frontend workspace with `npm run perf -- verona-tablet --headed`.
