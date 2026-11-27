# Playground Park Loop from the saddle

GCN Training’s HIIT for Time-Crunched Parents retains eleven stages over 30:00 and a three-second video offset. Five 2.645 km circuits share the landmarks and climb 55 m in total. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Tree-lined park gate, 0.08 km | [Before](before-gate.jpg) | [After](after-gate.jpg) | Worn twin yellow lines lead between mature trees. Gaps in the canopy cast patches of sun across the path beside a wayfinding sign and benches. Real 11, 12 and 15. Games 01 and 03.. |
| Climbing fort, 0.43 km | [Before](before-fort.jpg) | [After](after-fort.jpg) | Two roofed climbing decks flank a rope bridge. Open steps, a curved slide and a bank of suspended swing seats are visible from the path. Real 02, 03, 07 and 09. Games 01 and 02.. |
| Splash terrace, 0.89 km | [Before](before-jets.jpg) | [After](after-jets.jpg) | Red and green spray stems stand on blue and ochre wet paving under a triangular shade sail. A child runs between staggered jets. Real 01, 03–06 and 13. Games 02 and 05.. |
| Family promenade, 1.32 km | [Before](before-families.jpg) | [After](after-families.jpg) | A parent pushes a hooded stroller along the wide shoulder. A helmeted child on a scooter passes a bench and a double-headed park lamp. Real 08–12 and 15. Games 01 and 03.. |
| Fountain pond, 1.85 km | [Before](before-pond.jpg) | [After](after-pond.jpg) | A stone lip follows the pond and its central fountain. Water gleams between reeds, with lawns and the city edge behind. Real 04, 06 and 14. Games 04 and 05.. |
| Picnic meadow, 2.30 km | [Before](before-picnic.jpg) | [After](after-picnic.jpg) | Families sit on checkered blankets beneath spreading shade trees. A pavilion and distant apartment buildings mark the return toward the playground. Real 07, 10, 11 and 13. Games 02–04.. |

The painted park path passes a climbing fort, swings, splash terrace, family promenade, fountain and picnic meadow. The swing, spray, scooter and stroller follow ride time. The race-entry test checks the same physical landmarks on all five circuits. [Credited references](../../worlds/playground/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| park gate to the climbing fort | 0 m | 0.12 km to 0.95 km | 119.96 | 119.89 | 10.4 ms | 28.8 ms | 92 |
| splash jets and family promenade | 850 m | 0.12 km to 0.95 km | 118.98 | 118.78 | 10.8 ms | 118.7 ms | 88 |

Reproduce from the frontend workspace with `npm run perf -- playground-tablet --headed`.
