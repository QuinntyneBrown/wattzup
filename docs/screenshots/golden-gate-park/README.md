# Golden Gate Park from the saddle

Choose JFK Drive in Map Select. GCN Training’s 15 Minutes HIIT Sprinting Efforts retains its 17 stages over 15:00. The 6.375 km park race climbs 20 m on the way to Ocean Beach. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Conservatory approach, 0.08 km | [Before](before-conservatory.jpg) | [After](after-conservatory.jpg) | The dome and glazed wings stand beyond the palms. Real 07–09, games 01 and 05. |
| Stow Lake, 1.68 km | [Before](before-stow.jpg) | [After](after-stow.jpg) | Two open masonry arches and pedal boats stand above the green water. Real 01, 10 and 15, game 04. |
| Spreckels Lake, 3.04 km | [Before](before-spreckels.jpg) | [After](after-spreckels.jpg) | Model yachts, ducks and the park path follow the shoreline. Real 04–05 and 11, games 03–05. |
| Bison Paddock, 4.02 km | [Before](before-paddock.jpg) | [After](after-paddock.jpg) | Dark woolly shoulders and lowered heads rise above the timber fence. Real 02, games 02–03. |
| Dutch Windmill, 5.55 km | [Before](before-mill.jpg) | [After](after-mill.jpg) | Four rotating lattice sails crown the tower above the tulip beds. Real 03 and 06 informed construction, game 04 the bend. |
| Ocean Beach, 6.22 km | [Before](before-beach.jpg) | [After](after-beach.jpg) | The western promenade curves past sand, grasses and Pacific rollers. Real 12–14, games 01 and 04. |

The Conservatory of Flowers has a glazed elevation over modelled wings and dome. Bends reveal the two lake shores, stone arch bridge, paddock and Dutch Windmill before the Great Highway crossing. A fixed ocean surface, breaking crests and dunes fill the final outlook. Original eucalyptus and cypress crowns sit on branching native trunks. Bison graze, yachts tack, ducks drift, skaters roll and fog banks move through the grove. Pausing holds the motion. [Credited references](../../worlds/goldengate/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Conservatory and palms | 0 m | 0.12 km to 0.95 km | 120.77 | 120.00 | 9.6 ms | 13.7 ms | 32 |
| Spreckels Lake to Bison Paddock | 3200 m | 0.12 km to 0.95 km | 120.65 | 119.99 | 9.6 ms | 29.9 ms | 65 |

Reproduce from the frontend workspace with `npm run perf -- goldengate-tablet --headed`.
