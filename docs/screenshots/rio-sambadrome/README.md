# Rio Sambadrome from the saddle

GCN Training’s 15-Minute Smash Fest retains all 16 stages, its 15:00 duration and zero video offset. Four passes down the 700 m runway and three return circuits total 6.3 km and climb 9 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Marquês de Sapucaí, 0.08 km | [Before](before-sapucai.jpg) | [After](after-sapucai.jpg) | Floodlights and crowded stepped stands converge on the single concrete runway. The white Apoteose arch marks the far end and the rider lane remains clear. Real 02, 07, 11 and 13–15. Games 01 and 03.. |
| Feathered alas, 0.21 km | [Before](before-alas.jpg) | [After](after-alas.jpg) | Coordinated wings of turquoise, green and pink feathered dancers fill the flanks. Bare concrete, paint joints, cast light and scattered confetti remain visible beneath them. Real 01, 07–11. Games 02 and 04.. |
| Carros alegóricos, 0.34 km | [Before](before-carros.jpg) | [After](after-carros.jpg) | Tall original floats stack moving performers, sculpted tropical birds, gold foliage and luminous blue scrolls. Nearby figures give their three-dimensional decks scale. Real 01–06 and 12. Games 03–05.. |
| Bateria, 2.34 km | [Before](before-bateria.jpg) | [After](after-bateria.jpg) | Uniformed musicians stand in deep staggered ranks with surdos, raised mallets and tamborims. The foreground drumline performs beneath the stadium lights. Real 07–09 and 11. Games 01, 02 and 04.. |
| Mestre-sala and porta-bandeira, 4.29 km | [Before](before-bandeira.jpg) | [After](after-bandeira.jpg) | A flag-bearer in a wide embroidered skirt turns an original blue-and-gold school banner beside her partner, with spectators, phones and waving flags on the terraces. Real 03, 05 and 07–11. Games 02–04.. |
| Praça da Apoteose, 6.25 km | [Before](before-apoteose.jpg) | [After](after-apoteose.jpg) | The runway opens out beneath Niemeyer’s white arch, with its central suspended sweep and two wide legs. The finish crosses the arch axis against layered Rio hills and favela windows. Real 01, 02 and 12–15. Games 01, 03 and 05.. |

Stepped grandstands and floodlights enclose Marquês de Sapucaí. Macaw floats pass between the wings. Feathered dancers, the bateria and a flag-bearing couple move on ride time beneath the Apoteose arch. [Credited references](../../worlds/sambadrome/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| opening runway and grandstands | 0 m | 0.12 km to 0.95 km | 116.96 | 116.77 | 10.4 ms | 121.3 ms | 113 |
| allegorical float and bateria | 282 m | 0.12 km to 0.95 km | 120.19 | 119.73 | 10.1 ms | 47.8 ms | 121 |

Reproduce from the frontend workspace with `npm run perf -- sambadrome-tablet --headed`.
