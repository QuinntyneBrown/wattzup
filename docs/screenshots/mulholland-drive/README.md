# Mulholland Drive from the saddle

GCN Training’s Repeat Your Max retains its 17 stages over 40 minutes, with the original three-second video offset. The ridge road covers 17.1 km and climbs 347 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Ridge road and chaparral, 0.08 km | [Before](before-ridge.jpg) | [After](after-ridge.jpg) | Double yellow lines turn around a dry chaparral bank, past chevrons, a timber power pole and the first open view of the ridge. Real 01–04 and 10. Games 01, 03 and 05.. |
| Los Angeles basin, 2.63 km | [Before](before-basin.jpg) | [After](after-basin.jpg) | A pull-out opens over the folded Hollywood Hills to the distant downtown towers. Sage and a galvanized rail frame the near edge. Real 03, 05, 07 and 13. Games 02–04.. |
| Modernist hillside houses, 5.19 km | [Before](before-houses.jpg) | [After](after-houses.jpg) | White modernist volumes, shaded glass and decks on stilts step down the hillside above gated driveways. Eucalyptus and palms stand on the bends. Real 08–10 and 14. Games 02–04.. |
| Hollywood Sign on Mount Lee, 8.27 km | [Before](before-lee.jpg) | [After](after-lee.jpg) | Separate white letters read HOLLYWOOD across the brush-covered flank of Mount Lee. A slender broadcast mast rises above the sign. Real 01, 06, 12 and 15. Games 01, 03 and 05.. |
| San Fernando Valley, 12.06 km | [Before](before-valley.jpg) | [After](after-valley.jpg) | The northern shoulder opens onto the valley’s straight street grid below the foothills. Golden grass gives way to distant blue-grey mountains. Real 03–05, 07 and 11. Games 02–05.. |
| Scenic overlook, 16.42 km | [Before](before-overlook.jpg) | [After](after-overlook.jpg) | Visitors use a viewing scope beside curved rails on a paved turnout. Palms and poles silhouette against sunset haze over Los Angeles. Real 05–07, 10 and 12–14. Games 01–04.. |

A roadster follows the winding ridge past chaparral and modernist homes on stilts. The Hollywood letters stand on the flank of Mount Lee. Visitors at the overlook turn toward the basin, while the northern shoulder looks across the street grid of the San Fernando Valley. [Credited references](../../worlds/mulholland/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Mulholland ridge road | 0 m | 0.12 km to 0.95 km | 120.48 | 119.94 | 9.8 ms | 31.3 ms | 51 |
| Scenic overlook and Los Angeles basin | 16280 m | 0.12 km to 0.95 km | 120.20 | 120.00 | 9.8 ms | 16.3 ms | 33 |

Reproduce from the frontend workspace with `npm run perf -- mulholland-tablet --headed`.
