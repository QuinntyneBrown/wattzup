# Fish Hill, Cotswolds from the saddle

Choose Fish Hill, Cotswolds in Map Select to ride the original 16 stages of GCN Training’s Leg Burner. The 30:00 race covers 11.6 km and climbs 245 m between Broadway and the ridge. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Broadway High Street, 0.08 km | [Before](before-broadway.jpg) | [After](after-broadway.jpg) | Honey-stone shops, broad verges, a red kiosk and walking visitors. Real 03–04, 07 and 09, games 01 and 05. |
| Cottage gardens, 1.06 km | [Before](before-cottages.jpg) | [After](after-cottages.jpg) | Stone-slate roofs, thatch, wisteria and low garden walls. Real 05–06, 08–09 and 14, games 01 and 05. |
| A44 cutting, 3.72 km | [Before](before-cutting.jpg) | [After](after-cutting.jpg) | The grade sign and white edge lines lead into the beech-lined climb. Real 01–02 and 15, games 02 and 04. |
| Vale outlook, 6.48 km | [Before](before-vale.jpg) | [After](after-vale.jpg) | The breaking wall and downhill bank open onto hedgerows and the patchwork vale. Real 12–14, games 02–03. |
| Ridge pastures, 8.63 km | [Before](before-pasture.jpg) | [After](after-pasture.jpg) | Limestone coping stones, hedges and grazing sheep mark the top of the scarp. Real 10–13, games 01 and 03. |
| Broadway Tower, 11.37 km | [Before](before-tower.jpg) | [After](after-tower.jpg) | Turrets, arched windows, balcony and walkers distinguish the summit folly. Real 10–11, game 04. |

Broadway Tower stands on the ridge as Caribana’s CN Tower does on the Toronto skyline. Its three round turrets, crenellations, tapering plinths and balconied bays have physical depth. The approach combines honey-stone shops, thatch, wisteria, dry-stone boundaries, red kiosks and shared grade signs. Beech leaves move on ride time. Walkers follow the village and tower paths, while sheep graze on the wolds. The road and Vale of Evesham outlook are condensed to the original workout duration. [Credited references](../../worlds/fishhill/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Broadway High Street | 55 m | 0.12 km to 0.95 km | 120.45 | 120.00 | 9.6 ms | 11.7 ms | 62 |
| Beech cutting and A44 bends | 3500 m | 0.12 km to 0.95 km | 120.44 | 120.00 | 9.6 ms | 16.4 ms | 35 |

Reproduce from the frontend workspace with `npm run perf -- fishhill-tablet --headed`.
