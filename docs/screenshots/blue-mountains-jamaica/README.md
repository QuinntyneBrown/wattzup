# Blue Mountains, Jamaica from the saddle

From Map Select, ride the coffee road through Mavis Bank, the sound-system yards and Hagley Gap. GCN Training’s original 36-stage Climb & Sprint to the Beat runs for 35:00 over 14.593 km with 752 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Mavis Bank approach, 0.05 km | [Before](before-works.jpg) | [After](after-works.jpg) | The factory, sheds and drying patios sit against the terraced hillside. Real 06–08, 12 and 13, games 01–02. |
| Coffee terraces, 0.57 km | [Before](before-terraces.jpg) | [After](after-terraces.jpg) | Stepped soil, coffee crowns and verge vegetation. Real 04, 06–08 and 11, game 02. |
| Roots Yard, 1.48 km | [Before](before-sound.jpg) | [After](after-sound.jpg) | Roadside speaker stacks, workers and painted shop. Real 10, 14 and 15, games 02 and 04. |
| First switchback, 3.54 km | [Before](before-hairpin.jpg) | [After](after-hairpin.jpg) | The narrow unlined road turns sharply across the forest slope. Real 04, 05 and 11, games 01 and 05. |
| Hagley Gap approach, 6.29 km | [Before](before-village.jpg) | [After](after-village.jpg) | Church, cross and village houses below the mist. Real 09, 12, 13 and 15, games 02 and 04. |
| Upper Yallahs valley, 12.90 km | [Before](before-peak.jpg) | [After](after-peak.jpg) | The coastal valley opens under the distant blue-green ridges. Real 01–03, 05, 08 and 11, games 03 and 04. |

Like Caribana’s fixed Toronto skyline, the Blue Mountain ridges and Kingston stay in world coordinates. Terraced soil, coffee cherries, split banana leaves, flowering tulip trees, drainage and asphalt wear share baked sections. Two roadside stacks carry recessed drivers and independent dancers. The moving cones and drifting mist follow ride time and hold on pause. Within earshot of a yard the existing credited Blue Mountains reggae track rises and recedes with distance, subject to World music. The ride compresses the distance between settlements. The Kingston skyline, foliage clusters and far ridges use silhouette and colour to stay legible on Low. [Credited references](../../worlds/bluemountains/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Mavis Bank coffee terraces | 0 m | 0.12 km to 0.95 km | 120.36 | 120.00 | 9.7 ms | 15.0 ms | 31 |
| Roots Yard sound system and cloud forest | 1310 m | 0.12 km to 0.95 km | 120.90 | 120.00 | 9.6 ms | 18.4 ms | 25 |

Reproduce from the frontend workspace with `npm run perf -- bluemountains-tablet --headed`.
