# Brighton Pride from the saddle

Select Brighton Pride in Map Select. The 13 original stages of GCN Training’s Emily’s Short Mix run for 30:00 over 13.075 km, with 37 m of climbing between Madeira Drive and Marine Parade. The seven matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Madeira Drive, 0.07 km | [Before](before-madeira.jpg) | [After](after-madeira.jpg) | The lower road opens beside lamp posts, flags, crowd barriers and the cliff. Real 01–08, 13; games 01–03. |
| Madeira Terrace and lift, 0.43 km | [Before](before-arches.jpg) | [After](after-arches.jpg) | Cast-iron arches, tracery, upper rail and square lift tower mark the inland side. Real 07–09, 13; games 02 and 04. |
| Colour guard and bus, 0.85 km | [Before](before-parade.jpg) | [After](after-parade.jpg) | Rainbow decoration, Progress Pride flags, moving performers and the bus keep to a separate lane. Real 01–06; games 01–03. |
| Volk’s railway, 1.24 km | [Before](before-railway.jpg) | [After](after-railway.jpg) | Twin rails, open station shelter and the railcar sit above the shingle. Real 07, 09, 12–13; games 04–05. |
| Palace Pier approach, 1.71 km | [Before](before-pier.jpg) | [After](after-pier.jpg) | The curve opens onto iron piles, white pavilion bays, roof lanterns and the grey-green Channel beyond. Real 10–12, 15; games 01 and 05. |
| Marine Parade, 2.85 km | [Before](before-regency.jpg) | [After](after-regency.jpg) | The upper road runs between cream bay windows, cornices and the promenade rail. Real 12–14; games 02 and 04. |
| Western seafront, 6.35 km | [Before](before-pod.jpg) | [After](after-pod.jpg) | The slender observation tower and its glazed pod mark the westward approach on the second circuit. Real 10, 12 and 14 inform the coastal scale; games 01 and 05. |

Three circuits keep Palace Pier, the cliff lift, Volk’s railway and the observation tower fixed to the same shoreline. Caribana’s separate parade and riding lanes, flag bearers, layered crowd and distant landmarks informed the moving colour guard, the decorated open-top bus and the spectators behind the barriers. The bus crew, waving Progress Pride flags, marching participants, railcar and sea ripples use race time. The pier uses repeated iron piles and pavilion gables, the arcade uses open bays, and upper floors and the far procession use simpler geometry on Low. [Credited references](../../worlds/brighton/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Madeira parade and cast-iron terraces | 590 m | 0.12 km to 0.95 km | 120.11 | 120.00 | 9.5 ms | 12.5 ms | 54 |
| Palace Pier and Channel | 1450 m | 0.12 km to 0.95 km | 120.11 | 120.00 | 9.6 ms | 15.3 ms | 38 |

Reproduce from the frontend workspace with `npm run perf -- brighton-tablet --headed`.
