# Isle of Man Mountain Course from the saddle

Ride the A18 from the slate walls up to Snaefell and the Bungalow, then down toward Creg-ny-Baa. GCN Training’s Full Gas Sprints runs its nineteen stages over 20:00 with a three-second video offset. The course covers 8.133 km and climbs 206 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Lower Mountain Road, 0.08 km | [Before](before-walls.jpg) | [After](after-walls.jpg) | Tight dry-stone walls, hedges and ash frame the dashed centre line. Real 03, 06 and 09; games 01 and 04. |
| Snaefell, 1.81 km | [Before](before-snaefell.jpg) | [After](after-snaefell.jpg) | The rounded grassy hill and grazing sheep rise above the open road. Real 10 and 14; games 01 and 05. |
| Bungalow railway, 3.54 km | [Before](before-tram.jpg) | [After](after-tram.jpg) | The crossing, wires and cream-windowed mountain tram come into view together. Real 04, 12, 13 and 15; game 03. |
| Bungalow footbridge, 3.87 km | [Before](before-footbridge.jpg) | [After](after-footbridge.jpg) | Two staircases descend from the dark sponsor fascia over the carriageway. Real 02 and 05; games 02 and 03. |
| Creg-ny-Baa, 6.10 km | [Before](before-creg.jpg) | [After](after-creg.jpg) | The white hotel fronts a protected corner opposite the stands and painted kerb blocks. Real 01, 07, 08 and 11; games 01 and 03. |
| Descent, 7.41 km | [Before](before-sea.jpg) | [After](after-sea.jpg) | Sheep line the open fell under sunbreaks in the maritime sky. Real 09, 14 and 15; games 04 and 05. |

White dashes are part of the asphalt surface. The lower road passes dry-stone coping, hawthorn and ash, while sheep graze the open fell beneath Snaefell’s summit masts. At the Bungalow, the maroon and cream tram follows the track under suspended wires. A steel footbridge spans the A18 on separate piers. Creg-ny-Baa has slate roofs, painted fascia, recessed windows, stands, corner bales and an orange marshal. The train, flag and patches of light on the moor follow ride time. The distant sky uses original generated artwork. [Credited references](../../worlds/isleofman/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Lower road and hedge banks | 0 m | 0.12 km to 0.95 km | 120.43 | 120.00 | 9.8 ms | 17.1 ms | 35 |
| Bungalow tram and the mountain footbridge | 3290 m | 0.12 km to 0.95 km | 120.93 | 120.00 | 9.7 ms | 17.3 ms | 45 |

Reproduce from the frontend workspace with `npm run perf -- isleofman-tablet --headed`.
