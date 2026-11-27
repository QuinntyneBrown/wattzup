# Oktoberfest, Munich from the saddle

Calorie Crush retains its 11 original stages and 26-second video offset. The 24:48 ride covers 10.651 km and climbs 39 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Wiesn main street, 0.08 km | [Before](before-wiesn.jpg) | [After](after-wiesn.jpg) | The wide festival avenue runs between timber beer halls, their painted gables rising above linked crowds in Dirndls and Lederhosen. Real 01–03 and 08–09. Games 01 and 03.. |
| Brass procession, 1.86 km | [Before](before-band.jpg) | [After](after-band.jpg) | Rows of musicians carry brass instruments and drums past the Schottenhamel bandstand. Blue-and-white pennants cross overhead. Real 04–07. Games 01 and 02.. |
| Brewery dray, 3.41 km | [Before](before-dray.jpg) | [After](after-dray.jpg) | Draught horses pull a decorated brewery wagon past the Paulaner tower. Harness, wheels, casks and greenery move together along the street. Real 04 and 07. Games 02 and 03.. |
| Bavaria and Ruhmeshalle, 5.79 km | [Before](before-bavaria.jpg) | [After](after-bavaria.jpg) | Bavaria raises her wreath on the grassy hill beside the lion. The long Doric colonnade stands behind the bronze statue. Real 02, 11 and 14. Games 04 and 05.. |
| Gingerbread market, 7.71 km | [Before](before-markt.jpg) | [After](after-markt.jpg) | Heart-shaped Lebkuchen, pretzels and roasted almonds line the lit stalls. People gather beneath striped awnings as the sky warms. Real 01, 03, 08 and 09. Games 01 and 03.. |
| Fairground at night, 10.19 km | [Before](before-riesenrad.jpg) | [After](after-riesenrad.jpg) | Gondolas hang beneath the turning Ferris wheel. The five Olympia Looping rings and carousel canopy stand above the glowing tent roofs. Real 02, 10–13 and 15. Games 03 and 05.. |

The festival avenue passes painted beer halls, a brass procession and a horse-drawn brewery dray. Bavaria overlooks the market before the course reaches the turning Riesenrad and the five coloured coaster rings. [Credited references](../../worlds/oktoberfest/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Wiesn main street | 0 m | 0.12 km to 0.95 km | 120.10 | 119.92 | 9.9 ms | 36.4 ms | 35 |
| Evening fairground and Ferris wheel | 10080 m | 0.12 km to 0.95 km | 120.38 | 119.98 | 9.8 ms | 15.8 ms | 105 |

Reproduce from the frontend workspace with `npm run perf -- oktoberfest-tablet --headed`.
