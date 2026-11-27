# Loire Châteaux from the saddle

GCN Training’s Sweet Spot Endurance Training supplies nineteen stages, 30:00 of riding and 12.2 km. The course climbs 19 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Loire à Vélo levee, 0.08 km | [Before](before-levee.jpg) | [After](after-levee.jpg) | Green cycle signs mark the embankment above sandbars and willow islands. Passing touring cyclists and the narrow ground shadows of poplars give scale to the wide Loire. Real 01–04, 12–13 and games 01 and 03. |
| Chambord gardens, 2.12 km | [Before](before-chambord.jpg) | [After](after-chambord.jpg) | Round corner towers and a crowded slate roofline of chimneys, lanterns and turrets rise beyond symmetrical hedges and a still moat. Real 04–05 and games 02 and 04. |
| Vouvray vineyards, 4.32 km | [Before](before-vouvray.jpg) | [After](after-vouvray.jpg) | Vine rows converge up the slope. Chalk cave doors punctuate a tuffeau ledge above the lane. Real 03–04, 11–12 and games 01 and 05. |
| Chenonceau on the Cher, 6.58 km | [Before](before-chenonceau.jpg) | [After](after-chenonceau.jpg) | The château’s long pale gallery lies across five open arches, with a separate tower at the bank. Moving water breaks the reflected arch rhythm. Real 06, 13 and 15 and games 02 and 04. |
| Amboise river town, 8.92 km | [Before](before-amboise.jpg) | [After](after-amboise.jpg) | The high terrace and round riding tower overlook a town of slate-roofed limestone houses. A flat-bottomed riverboat passes the quay. Real 02, 08–10 and 14 and games 03–05. |
| Chaumont overlook, 11.60 km | [Before](before-chaumont.jpg) | [After](after-chaumont.jpg) | Pointed grey roofs crown the round towers of Chaumont above the slope. The final levee passes willows and low sandbanks in hazy summer light. Real 07, 08, 10 and 13–14 and games 02 and 05. |

The road follows willow islands and vineyards. Chambord rises behind parterres. The gallery of Chenonceau crosses the Cher on five open arches. Amboise and Chaumont stand above the river on limestone cliffs. Touring cyclists, riverboats and broken reflections move with ride time. [Credited references](../../worlds/loire/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Loire à Vélo levee | 0 m | 0.12 km to 0.95 km | 118.99 | 118.73 | 10.0 ms | 230.9 ms | 64 |
| Chenonceau gallery, trees and water | 6300 m | 0.12 km to 0.95 km | 120.57 | 120.00 | 9.7 ms | 29.8 ms | 67 |

Reproduce from the frontend workspace with `npm run perf -- loire-tablet --headed`.
