# Machu Picchu Road from the saddle

GCN Training’s Step It Up supplies nineteen stages over 25:07 and 10.945 km. The two-second video offset is preserved. The course climbs 386 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Aguas Calientes bridge, 0.08 km | [Before](before-bridge.jpg) | [After](after-bridge.jpg) | The bridge’s cross-bracing frames the town, the railway embankment and the first glimpse of brown water. Real 03, 10 and 12. Games 01 and 02.. |
| Urubamba gorge, 1.74 km | [Before](before-gorge.jpg) | [After](after-gorge.jpg) | Fast brown water breaks against granite boulders below the outside verge. Overlapping green ridges enclose the gorge. Real 03, 10 and 11. Games 01 and 05.. |
| Hiram Bingham switchbacks, 3.88 km | [Before](before-hairpin.jpg) | [After](after-hairpin.jpg) | A two-tone shuttle rounds a bend above the exposed retaining wall. The narrow outer verge reveals the next cut in the forest. Real 01–05. Games 03–05.. |
| Cloud forest, 6.22 km | [Before](before-canopy.jpg) | [After](after-canopy.jpg) | Ferns and climbing bromeliads frame the patched road as cloud crosses the distant rock faces. Real 04, 06 and 09. Games 03 and 04.. |
| Inca agricultural terraces, 8.40 km | [Before](before-andenes.jpg) | [After](after-andenes.jpg) | Grassed terrace tops step down between dry granite retaining walls. Stone stairs cut diagonally across the rider’s view. Real 07–09 and 13–15. Games 03 and 05.. |
| Citadel saddle, 10.37 km | [Before](before-citadel.jpg) | [After](after-citadel.jpg) | Roofless gabled walls and temple courts sit on the saddle in front of the steep asymmetric peak of Huayna Picchu. Real 07–09 and 13–15. Games 02 and 05.. |

The Hiram Bingham alignment uses the original World Ride turning function recorded in #939. Two shuttles share the bends with the rider. The Urubamba runs beneath the exposed verge. Mossy trees, ferns, orchids and bromeliads flank the climb. Stepped andenes and roofless Inca courts occupy the saddle below Huayna Picchu. Cloud and white water move on ride time. [Credited references](../../worlds/machupicchu/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Urubamba gorge | 0 m | 0.12 km to 0.96 km | 118.34 | 118.22 | 11.0 ms | 265.8 ms | 43 |
| Shuttle switchbacks and cloud forest | 3660 m | 0.11 km to 0.95 km | 118.23 | 118.07 | 10.9 ms | 148.4 ms | 44 |

Reproduce from the frontend workspace with `npm run perf -- machupicchu-tablet --headed`.
