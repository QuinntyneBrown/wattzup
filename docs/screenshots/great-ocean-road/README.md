# Great Ocean Road from the saddle

Choose The Great Ocean Road in Map Select. Hold Your Intensity retains the 14 stages, 20:00 duration and original cadence and target resistance of the GCN Training class. The route covers 8.45 km and climbs 126 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Eastern View, 0.08 km | [Before](before-arch.jpg) | [After](after-arch.jpg) | The timber Memorial Arch and its inscription span the yellow-centred road. Real 01–02 and games 01, 03. |
| Wye River bend, 1.67 km | [Before](before-wye.jpg) | [After](after-wye.jpg) | Reflective road signs, W-beam and ocean-facing slopes lead through the coastal bends. Real 01–05 and game 01. |
| Otway forest, 3.12 km | [Before](before-otway.jpg) | [After](after-otway.jpg) | Pale gum trunks and broad tree ferns enclose the road. Real 03, 13–14 and game 04. |
| Twelve Apostles, 5.05 km | [Before](before-apostles.jpg) | [After](after-apostles.jpg) | Separate sea stacks rise from breaking crests below the lookout. Real 06–08, 15 and games 01–03. |
| Loch Ard Gorge, 6.55 km | [Before](before-gorge.jpg) | [After](after-gorge.jpg) | The view into the inlet reveals the beach, headlands and surf. Real 06–10, games 03–04. |
| London Bridge, 8.24 km | [Before](before-bridge.jpg) | [After](after-bridge.jpg) | Water passes under the surviving span, separated from the mainland. Real 09–10 and game 05. |

The route compresses the Victorian coast between Eastern View and London Bridge. Wye River bends and Otway foliage precede three distinct viewing approaches. Native, separately eroded stacks stand in the surf, the Loch Ard sand crescent lies between two headlands, and the surviving London Bridge span has an open water passage. Original limestone and native flora artwork dress the surfaces. The W-beam follows the road grade. World-scale swells, white water and salt spray move with ride time, as does the light on the rock. Caribana informed the separation of near rail and heath from the distant coastline. [Credited references](../../worlds/greatocean/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Eastern View and the coastal bends | 0 m | 0.12 km to 0.95 km | 120.14 | 120.00 | 9.8 ms | 16.1 ms | 59 |
| Twelve Apostles and Loch Ard approaches | 4770 m | 0.12 km to 0.95 km | 120.15 | 120.00 | 9.5 ms | 15.8 ms | 61 |

Reproduce from the frontend workspace with `npm run perf -- greatocean-tablet --headed`.
