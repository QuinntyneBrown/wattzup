# Times Square New Year's Eve from the saddle

Give Me One Minute retains all nineteen stages, its twenty-minute duration and zero video offset. Broadway covers 8.700 km with 3 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Broadway approach, 0.12 km | [Before](before-broadway.jpg) | [After](after-broadway.jpg) | The dark road and yellow lane stripes run between illuminated shop windows, theatre marquees and deep rows of office windows. Real 02, 04, 11–13 and games 03 and 05. |
| The billboard canyon, 1.74 km | [Before](before-screens.jpg) | [After](after-screens.jpg) | Wraparound LED panels alternate red, blue and gold artwork on different buildings. Broken bands of colour reflect from the asphalt. Real 02–05, 11–12 and games 01, 03 and 05. |
| Duffy Square, 3.38 km | [Before](before-steps.jpg) | [After](after-steps.jpg) | The TKTS red steps rise across the Broadway and Seventh Avenue bow tie. Crossing stripes frame the narrow end of the wedge. Real 03–05, 11, 14 and games 02 and 04. |
| The crowd pens, 5.19 km | [Before](before-pens.jpg) | [After](after-pens.jpg) | Blue police barricades, officers and camera crews line the cleared lane. Winter coats, party hats and condensed breath fill the spectator pens. Real 01, 06–08, 13–15 and games 02 and 03. |
| One Times Square, 7.22 km | [Before](before-countdown.jpg) | [After](after-countdown.jpg) | A live countdown ticks beneath the illuminated faceted ball. The ball slides along the rooftop mast as spectators look up. Real 02, 06–07, 09–10 and games 01 and 05. |
| Midnight on Broadway, 8.52 km | [Before](before-midnight.jpg) | [After](after-midnight.jpg) | The 2027 sign shines above the clearing. Coloured paper flutters into the light and gathers on the marked road by the barriers. Real 01, 06–10, 14–15 and games 01 and 04. |

Original illuminated billboards, the red TKTS steps and a 2027 sign flank the race. A countdown, faceted crystal ball, instanced paper confetti and visible breath follow the ride clock. Compare the near crowd pens, street fronts and the distant tower. [Credited references](../../worlds/timessquare/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Broadway approach | 0 m | 0.12 km to 0.95 km | 119.79 | 119.59 | 10.2 ms | 57.8 ms | 47 |
| midnight crowds | 7000 m | 0.12 km to 0.95 km | 120.09 | 119.92 | 10.0 ms | 35.1 ms | 49 |

Reproduce from the frontend workspace with `npm run perf -- timessquare-tablet --headed`.
