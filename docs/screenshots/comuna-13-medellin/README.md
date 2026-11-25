# Comuna 13, Medellín from the saddle

GCN’s Sufferfest Ramp Session: The Escalator covers 13.583 km in 30:50. The 22 stages climb 672 m through a condensed version of San Javier. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Carrera 109, 0.08 km | [Before](before-entrada.jpg) | [After](after-entrada.jpg) | Painted kerbs, concrete and the first brick terraces. Real 03–05 and 09, games 01 and 03. |
| Mural lane, 0.64 km | [Before](before-murales.jpg) | [After](after-murales.jpg) | Large portraits and bird panels face the bend. Real 03–05, 07, 11, 12 and 14, games 01–03. |
| Lower escalator landing, 1.49 km | [Before](before-escaleras.jpg) | [After](after-escaleras.jpg) | The covered flights rise on the uphill side with a separate footway. Real 01, 02, 06, 07 and 15, games 02 and 04. |
| Dance terrace, 2.78 km | [Before](before-terraza.jpg) | [After](after-terraza.jpg) | Performers, speakers and street vendors share the terrace. Real 02–05, 08–10, games 01, 02 and 05. |
| Upper climb, 6.19 km | [Before](before-laderas.jpg) | [After](after-laderas.jpg) | The steep concrete lane edges the hillside. Real 06, 08 and 13–15, games 03–05. |
| Valley overlook, 11.31 km | [Before](before-mirador.jpg) | [After](after-mirador.jpg) | The outer kerb opens towards the opposite slope. Real 06, 13–15, games 03–05. |

Four original paintings repeat across masonry panels. Mortar seams, exposed rebar, corrugated roofs, painted kerbs and iron railings give the closest blocks their scale. Escalator passengers and metal treads share the ride clock with the dancers on the market terraces. The valley skyline and mountain ridges use the fixed horizon group on Low. Stalls carry mangoes, salpicón, arepas and crafts. Visitor groups use the Caribana atlas on level decks behind the kerb. [Credited references](../../worlds/comuna13/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Carrera 109 and the mural lane | 35 m | 0.12 km to 0.95 km | 120.22 | 119.82 | 9.7 ms | 48.9 ms | 37 |
| Escalator landing and dance terrace | 2420 m | 0.12 km to 0.95 km | 120.42 | 120.00 | 9.6 ms | 15.8 ms | 35 |

Reproduce from the frontend workspace with `npm run perf -- comuna13-tablet --headed`.
