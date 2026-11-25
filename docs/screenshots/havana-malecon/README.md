# Havana Malecón from the saddle

Choose Malecón in Map Select. GCN Training’s 30 Sec On, 2 Min Off retains its sixteen stages, cadence targets, resistance, 20:00 duration and three-second video offset. The avenue covers 8.95 km and climbs 8 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Vedado, 0.08 km | [Before](before-vedado.jpg) | [After](after-vedado.jpg) | The boulevard follows the salt-stained wall. Real 01, 04, 07 and 15; games 01 and 05. |
| Hotel Nacional, 1.45 km | [Before](before-nacional.jpg) | [After](after-nacional.jpg) | Paired tiled towers rise above the garden and long hotel frontage. Real 04, 07 and 15 give the seafront setting and game 05 the horizon clearance. |
| Portales, 3.04 km | [Before](before-portales.jpg) | [After](after-portales.jpg) | Balconies and Cuban shopfronts line the pavement near two-tone taxis. Real 03 and 11–14; games 02–03. |
| Breaking surf, 4.38 km | [Before](before-breakers.jpg) | [After](after-breakers.jpg) | Ride-clock-driven surf crosses the wall above wet pavement. Real 02 and 05–08; game 04. |
| Promenade, 6.51 km | [Before](before-musicians.jpg) | [After](after-musicians.jpg) | The son trio, wall sitters, anglers and taxis occupy the two sides of the roadway. Real 01, 04, 08 and 15; games 02 and 05. |
| Harbour mouth, 8.64 km | [Before](before-morro.jpg) | [After](after-morro.jpg) | The rocky headland, lighthouse and ochre fort mark the narrowing bay. Real 09–10; games 01 and 04. |

The moving cars and pedal taxis use the same source meshes as the original class. Sixteen original street elevations preserve the Cuban flags, balcony ironwork, shutters and weathered portales in one texture atlas. Near pavement props share instances, including the fruit seller, domino players and the son trio with a guitar, maracas and bongos. A perforated, rising sheet of surf and wet patches follow ride time. The arcaded Hotel Nacional and its paired roofs stand above Vedado. Across the harbour the original Morro headland and lantern remain in place. [Original Havana class and its visual history](../havana/README.md). [Credited references](../../worlds/havana/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Vedado avenue | 0 m | 0.12 km to 0.96 km | 120.41 | 120.00 | 9.6 ms | 11.5 ms | 43 |
| Breakers and moving seafront traffic | 4160 m | 0.12 km to 0.95 km | 120.57 | 120.00 | 9.6 ms | 17.4 ms | 41 |

Reproduce from the frontend workspace with `npm run perf -- havana-tablet --headed`.
