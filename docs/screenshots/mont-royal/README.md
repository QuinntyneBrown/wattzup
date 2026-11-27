# Mont Royal from the saddle

GCN Training’s Progressive Intervals: Steps to Glory retains its 22 stages, one-hour duration and three-second video offset. Repeated climbs cover 25.49 km and 571 m of ascent. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Voie Camillien-Houde, 0.08 km | [Before](before-climb.jpg) | [After](after-climb.jpg) | Club cyclists climb in pairs inside the painted bike lane. Québec park markers and maple crowns frame the road. Real 01–05 and 07. Games 02–03.. |
| Camillien-Houde hairpin, 4.42 km | [Before](before-hairpin.jpg) | [After](after-hairpin.jpg) | The sweeping turn cuts through exposed grey stone. Guardrail sections wrap around the outside of the turn and the bike lane holds its width. Real 01–04, 06 and 09. Games 01–03.. |
| Olmsted Road, 8.19 km | [Before](before-olmsted.jpg) | [After](after-olmsted.jpg) | Runners use a gravel carriage path beside golden birches and deep red maples. Trunks and overhanging branches cast broken patches of shade. Real 04, 06, 08–09 and 14. Games 01 and 04.. |
| Lac aux Castors, 13.03 km | [Before](before-lake.jpg) | [After](after-lake.jpg) | The trees open onto Beaver Lake, its curved lawn and a low glass pavilion. Reflections shift on the water while the shore stays fixed. Real 06, 09, 13–14. Games 01 and 05.. |
| Croix du mont Royal, 18.64 km | [Before](before-cross.jpg) | [After](after-cross.jpg) | The illuminated lattice cross rises through an opening in the upper forest. Steel bracing and horizontal arms remain legible from the saddle. Real 06, 09, 12 and 14. Games 01 and 04.. |
| Belvédère Kondiaronk, 24.56 km | [Before](before-lookout.jpg) | [After](after-lookout.jpg) | Stone balustrades frame the chalet terrace, the towers of downtown Montréal and the distant St. Lawrence and bridges. Real 10–11 and 15. Games 02 and 05.. |

Four club cyclists pedal the Camillien-Houde bike lane. A runner follows Olmsted Road, the lake house sits beside Beaver Lake, the steel cross rises out of hardwoods and the Kondiaronk terrace looks across downtown Montréal to the St. Lawrence. [Credited references](../../worlds/montroyal/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Camillien-Houde club climb | 0 m | 0.12 km to 0.96 km | 115.14 | 115.08 | 12.3 ms | 127.9 ms | 75 |
| Kondiaronk lookout approach | 24410 m | 0.12 km to 0.95 km | 120.30 | 120.00 | 9.7 ms | 16.7 ms | 29 |

Reproduce from the frontend workspace with `npm run perf -- montroyal-tablet --headed`.
