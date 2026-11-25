# Champs-Élysées Finale from the saddle

GCN Training’s 27-stage Quick & Sharp Sprinting Efforts follows three closed circuits between the Arc de Triomphe and Place de la Concorde. The original 25-minute workout covers 10.4625 km. The seven matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Opening avenue, 0.08 km | [Before](before-avenue.jpg) | [After](after-avenue.jpg) | The bunch rides the granite setts between the trees and barriers. Real 01–04 and 14. |
| Arc approach, 1.17 km | [Before](before-arc.jpg) | [After](after-arc.jpg) | The Arc rises above the avenue, with its main vault open. Real 05–07. |
| Western turn, 1.29 km | [Before](before-turn.jpg) | [After](after-turn.jpg) | The carriageways wrap around the island. Real 01–07. |
| Place de la Concorde, 2.95 km | [Before](before-concorde.jpg) | [After](after-concorde.jpg) | Fountains and the obelisk mark the eastern turn. Real 11–12. |
| Concorde sightline, 3.04 km | [Before](before-eiffel.jpg) | [After](after-eiffel.jpg) | The Eiffel Tower stands beyond the square. Real 10–12. |
| Final sprint, 10.26 km | [Before](before-sprint.jpg) | [After](after-sprint.jpg) | The peloton spreads between crowded barriers. Real 01–04 and 13. |
| Finish gantry, 10.42 km | [Before](before-finish.jpg) | [After](after-finish.jpg) | The final approach follows the same avenue in evening light. Real 08–09 and 15. |

The outward and return carriageways curve around the same two traffic islands on every lap. Granite setts repeat in physical metres. Tricolores and the eight-rider peloton move on ride time, and the riders spread across the road for the final 300 metres. Baked Haussmann façades frame the avenue. The Caribana crowd cutouts fill the stands and barriers. Evening light picks out the Arc’s piers and the lamps beside the sprint. [Credited references](../../worlds/champs/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Arc de Triomphe turn | 1450 m | 0.12 km to 0.95 km | 120.18 | 120.00 | 9.6 ms | 13.8 ms | 111 |
| Final 300 metres | 10090 m | 0.12 km to 0.95 km | 118.49 | 118.48 | 10.6 ms | 134.6 ms | 116 |

Reproduce from the frontend workspace with `npm run perf -- champs-tablet --headed`.
