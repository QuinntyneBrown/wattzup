# Chichén Itzá from the saddle

GCN Training’s The Full Pyramid still has 21 stages and runs for 30 minutes. The 12.7 km white sacbé runs through the forest to the cenote, the Group of a Thousand Columns, the Temple of the Warriors and the Great Plaza. The physical route gains 18 metres. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Raised sacbé, 0.08 km | [Before](before-sacbe.jpg) | [After](after-sacbe.jpg) | Broken limestone kerbs and forest edge. Real 01, 03, 05, 08 and games 01–03. |
| Textile stalls, 0.64 km | [Before](before-vendors.jpg) | [After](after-vendors.jpg) | Bright woven cloth and people line the shaded outside of the bend. Real 01, 03, 08 and game 02. |
| Sacred Cenote rim, 3.18 km | [Before](before-cenote.jpg) | [After](after-cenote.jpg) | The banks fall to still green water between vines and limestone ledges. Real 03, 08, 13 and games 03–04. |
| Colonnade, 7.26 km | [Before](before-columns.jpg) | [After](after-columns.jpg) | Ranks of stone drums lead towards the temple. Real 09–12, 15 and game 05. |
| Temple of the Warriors, 8.10 km | [Before](before-warriors.jpg) | [After](after-warriors.jpg) | Terraces and low carved platforms appear on the plaza edge. Real 04, 09–11, 14–15 and game 01. |
| Great Plaza, 12.56 km | [Before](before-castillo.jpg) | [After](after-castillo.jpg) | The sacbé opens onto the pyramid and its summit temple. Real 02, 06–07, 09, 14 and games 02, 04 and 05. |

The old class scene repeated a 400 m causeway. Its original limestone, carved stelae and woven textile textures now also appear in the authored race. The route opens beside a recessed green pool and reaches two fixed temple sites. El Castillo has nine stepped terraces, four stairs and feathered serpent heads at its base. Foreground palms, broadleaf trees and undergrowth are batched by distance. The going changes from duff to limestone rubble to plaza grass. Parrots, walking visitors and cumulus follow ride time, holding on pause. [Earlier class views](../chichen/README.md). [Credited references](../../worlds/chichen/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Shaded causeway and vendors | 45 m | 0.12 km to 0.95 km | 120.33 | 120.00 | 9.9 ms | 19.9 ms | 62 |
| Warriors temple and colonnade | 7180 m | 0.12 km to 0.96 km | 120.58 | 120.00 | 9.6 ms | 16.1 ms | 44 |

Reproduce from the frontend workspace with `npm run perf -- chichen-tablet --headed`.
