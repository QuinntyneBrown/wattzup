# Copacabana Promenade from the saddle

GCN Training’s Quick Sprint Session takes its original 16 stages from the fort towards Leme. The 4.3 km ride lasts 10:00 and rises 14 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Posto 6, 0.08 km | [Before](before-posto.jpg) | [After](after-posto.jpg) | Red ciclovia, Portuguese stone waves, the nearest kiosk and tables. Real 01–04 and games 01–02. |
| Beach court, 0.68 km | [Before](before-court.jpg) | [After](after-court.jpg) | The net, rally and palms share the sand beside the promenade. Real 05, 08–09, games 02 and 04. |
| Shaded promenade, 1.35 km | [Before](before-palms.jpg) | [After](after-palms.jpg) | Coconut and shade crowns line kiosk counters and coastal blocks. Real 01–04, 09–10 and games 01 and 03. |
| Copacabana Palace approach, 2.19 km | [Before](before-palace.jpg) | [After](after-palace.jpg) | The white hotel frontage and portico interrupt the balcony-lined apartment blocks. Real 09–11 and 14, games 01 and 03. |
| Approach to Leme, 3.32 km | [Before](before-leme.jpg) | [After](after-leme.jpg) | Granite profiles overlap the wooded headlands. Real 05–07, 12 and 15, games 04–05. |
| Northern shore, 4.00 km | [Before](before-surf.jpg) | [After](after-surf.jpg) | The shallow breakers follow the crescent beneath a warm sky. Real 05–07, 09 and 13–15, games 04–05. |

The red cycle lane bends along the crescent, with the broad black basalt waves in pale limestone on its seaward side. A repeating original stone-joint texture adds individual pavers at riding scale. The yellow kiosk chairs, coconut fronds, Copacabana Palace arcades and avenue traffic are baked at physical locations. The coconut palms and tropical almond trees use original portraits made for this course. Beachgoers use the project’s Caribana cutouts. The dark base and weathered granite above it give Sugarloaf its silhouette behind Leme. The scene condenses the bay’s more distant hills. The ball, four players on each active court and the advancing breakers follow ride time and hold on pause. [Credited references](../../worlds/copacabana/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Posto 6 and the opening kiosks | 35 m | 0.12 km to 0.95 km | 120.67 | 120.00 | 9.7 ms | 15.5 ms | 24 |
| Volleyball courts and the Palace | 1870 m | 0.12 km to 0.93 km | 119.37 | 119.16 | 10.0 ms | 123.7 ms | 24 |

Reproduce from the frontend workspace with `npm run perf -- copacabana-tablet --headed`.
