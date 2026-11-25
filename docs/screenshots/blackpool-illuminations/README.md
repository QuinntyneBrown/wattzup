# Blackpool Illuminations from the saddle

Choose Blackpool Illuminations in Map Select. GCN Training’s *In and Out, Shake It All About* keeps its nine original stages, 14:00 of riding and 5.63 km of road with 3 m of climbing. The race heads north along the Illuminations, with the tramway on the seaward side. The seven matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Golden Mile tramway, 0.06 km | [Before](before-tram.jpg) | [After](after-tram.jpg) | Twin rails beside the road and the lit heritage tram, based on real 03, 04, 07, 08 and 15, and game 03. |
| Central Pier, 0.48 km | [Before](before-central.jpg) | [After](after-central.jpg) | The wheel, pier lanterns and promenade visitors rise over the stepped sea defences. Real 01, 12 and 13, game 01. |
| Golden Mile arcades, 0.82 km | [Before](before-arcades.jpg) | [After](after-arcades.jpg) | Display windows, blade signs and festoons over wet asphalt. Real 04, 05 and 09, games 02 and 05. |
| Tower approach, 0.95 km | [Before](before-tower.jpg) | [After](after-tower.jpg) | The illuminated lattice rises behind the brick arcade roofs. Real 01, 02, 06 and 11, games 01 and 04. |
| Tower headland, 1.30 km | [Before](before-carpet.jpg) | [After](after-carpet.jpg) | The seafront carpet uses original inlaid lettering, with family groups and the Tower opposite. Real 10, 11 and 14, game 04. |
| North Pier, 2.06 km | [Before](before-north.jpg) | [After](after-north.jpg) | Illuminated pavilion, pier entrance and railings along the sea wall. Real 02, 06 and 12, games 02 and 04. |
| Gynn Square, 4.93 km | [Before](before-gynn.jpg) | [After](after-gynn.jpg) | Fans, star outlines and strings of light mark the northern headland. Real 02, 05 and 08, games 02 and 05. |

The Tower has four tapered lattice legs, cross-bracing, illuminated galleries and a flagstaff. Its outline stays fixed above the arcades. As in Caribana, the nearby vehicles and people move past a fixed skyline. Original heritage double-deck and articulated Flexity trams follow a continuous schedule with dwell time at shelters. The Central Pier wheel turns and the festoon lamps chase on the ride clock, holding on pause. Families in coats stand beside the shops and tableaux. The short course compresses the coast between the piers and Gynn Square. [Credited references](../../worlds/blackpool/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Golden Mile tramway | 0 m | 0.12 km to 0.95 km | 120.28 | 120.01 | 9.9 ms | 19.4 ms | 38 |
| Blackpool Tower crowds | 1020 m | 0.12 km to 0.96 km | 120.41 | 120.00 | 9.7 ms | 15.6 ms | 28 |

Reproduce from the frontend workspace with `npm run perf -- blackpool-tablet --headed`.
