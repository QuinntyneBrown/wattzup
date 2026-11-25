# Ibiza Sunset Strip from the saddle

Ride Intervals to the Beat from Map Select. The original thirty-three stages last 20:00. Their 8.434 km course climbs 159 m past the original eighty clubs and seventeen effort gates. The video offset is three seconds. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Opening, 0.08 km | [Before](before-grid.jpg) | [After](after-grid.jpg) | Festoon cables and bulbs recede above the road and the terraces open on the right. Real 02–03, 05 and 12; games 01 and 03. |
| IBIZA, 0.35 km | [Before](before-letters.jpg) | [After](after-letters.jpg) | The block letters retain their position beside the promenade. Real 07, 11 and 13 inform the club frontage; game 05 the landmark scale. |
| Caló des Moro, 0.96 km | [Before](before-cove.jpg) | [After](after-cove.jpg) | An open metal rail reveals the rocky shore, water and anchored white sailboats at the effort arch. Real 08, 09 and 14; game 02. |
| Club terraces, 3.06 km | [Before](before-dj.jpg) | [After](after-dj.jpg) | The beam sweeps over the booths, with bulbs and linen beneath the pergolas. Real 02, 05–07, 11 and 12; games 01 and 04. |
| Promenade bend, 7.42 km | [Before](before-festoon.jpg) | [After](after-festoon.jpg) | The promenade curves toward the final run of lit clubs. Real 03, 04 and 13; games 02 and 03. |
| Conillera, 8.22 km | [Before](before-conillera.jpg) | [After](after-conillera.jpg) | The dark island and sunset beams frame the road toward the finish. Real 01, 06, 09–10 and 15; games 01 and 05. |

The strip keeps the original road, skyline, palms, raised drinks, sunset and IBIZA letters. Its low-tier dancers sway from the hips on the beat. Weighted vertices leave the festoon ends fixed to the posts, and the light shafts sweep above the booths. Original shade cloth, wood-footed daybeds and two-sail boats add detail. The rail at Caló des Moro opens to a lower rocky foreshore. The low promenade looks down onto the backlit sail, cabin and hull near the first effort arch. The white and coloured sail panels, terraces, foam and wind motion are original geometry and materials. Like Caribana’s dancers and fixed skyline, the local motion plays against stable landmarks. Each moving group shares a material. Pause and reduced motion hold its pose. [Credited references](../../worlds/ibiza/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Sunset strip opening | 0 m | 0.12 km to 0.96 km | 120.61 | 120.00 | 9.6 ms | 18.4 ms | 58 |
| Final clubs, DJ terrace and finish | 7820 m | 0.12 km to 0.95 km | 120.52 | 119.99 | 9.6 ms | 22.6 ms | 49 |

Reproduce from the frontend workspace with `npm run perf -- ibiza-strip-tablet --headed`.

The 16-position Low/WebGL2 bot-pack check peaked at 95,433 triangles and 87 calls. The compressed course is 1,391,036 bytes. Reproduce with `npm run perf -- ibiza-course-budget --headed`. The original class, map cards and earlier art passes are preserved.

[Opening photo](photo-grid.jpg) · [Conillera photo](photo-conillera.jpg)
