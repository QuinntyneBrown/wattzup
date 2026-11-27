# Alto de Letras from the saddle

GCN Training’s Hank’s Hardest Training Session supplies twenty-seven stages, 48:30 of riding and 22.150 km. Its first stage starts with the video. The course gains 1,156 m on the way to the 3,679 m summit. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Coffee slopes, 0.08 km | [Before](before-coffee.jpg) | [After](after-coffee.jpg) | Low rows of glossy coffee bushes and broad plantain leaves climb above the first switchback in warm sunlight. Real 09–10 and games 01 and 04. |
| Fresno, 3.62 km | [Before](before-fresno.jpg) | [After](after-fresno.jpg) | A painted chiva passes timber balconies, a bakery and a stall selling fruit and arepas. Its roof luggage and open rows of seats stay visible around the bend. Real 06–08 and game 03. |
| Wax palm ridge, 7.68 km | [Before](before-palms.jpg) | [After](after-palms.jpg) | Slender wax palms rise above an exposed green ridge. The road folds back below the rider and local cyclists climb alongside. Real 01, 10–12 and games 01 and 05. |
| Padua, 11.84 km | [Before](before-padua.jpg) | [After](after-padua.jpg) | A loaded lorry climbs past painted shopfronts and an aguapanela stall as the first cloud crosses the road. Real 04, 06–08 and games 02–03. |
| Cloud forest, 16.92 km | [Before](before-forest.jpg) | [After](after-forest.jpg) | Tree canopies frame switchbacks that disappear into a moving band of mist. Patches of cloud fill the valley beneath the asphalt. Real 01, 04–05 and 14–15 and games 02 and 04. |
| Páramo de Letras, 21.49 km | [Before](before-paramo.jpg) | [After](after-paramo.jpg) | Silver-leaved frailejones, ochre tussocks and moss replace forest near the signed 3,679 m summit under cool grey light. Real 02–03, 05 and 13–14 and games 02 and 05. |

A painted chiva and a loaded lorry move through Fresno and Padua. Brightly dressed local cyclists share the road. Rows of coffee plants give way to wax palms, cloud-forest trees and tree ferns. Bands of cloud drift across the road, and silver frailejón rosettes grow up through tussocks by the upper bends. The changing light, landscape and traffic remain visible on Low. [Credited references](../../worlds/letras/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Coffee slopes and local riders | 0 m | 0.12 km to 0.95 km | 120.45 | 120.00 | 9.7 ms | 14.2 ms | 71 |
| Padua chiva and truck | 11620 m | 0.12 km to 0.95 km | 119.98 | 119.73 | 10.0 ms | 98.1 ms | 79 |

Reproduce from the frontend workspace with `npm run perf -- letras-tablet --headed`.
