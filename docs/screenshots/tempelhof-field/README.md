# Tempelhof Field from the saddle

Race follows both runways and the airport perimeter over 12.909 km with 5 m of climbing. The 43 stages of Intense High Tempo Bike Workout preserve the 28:45 duration and three-second sync offset. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Runway threshold, 0.12 km | [Before](before-threshold.jpg) | [After](after-threshold.jpg) | Worn threshold bars, slab joints, tyre marks and inset centreline lights lead across the broad runway under a moving Berlin sky. Real 01–05, 14 and 15. Games 01 and 03.. |
| The terminal apron, 2.48 km | [Before](before-terminal.jpg) | [After](after-terminal.jpg) | The curved limestone terminal, glazed hangar doors and projecting apron canopy stretch along the field. The old radar tower rises above the roof. Real 06–09, 14 and 15. Games 02 and 03.. |
| The kite runway, 4.91 km | [Before](before-kites.jpg) | [After](after-kites.jpg) | A kite-skater follows the wind under a swept canopy and taut lines. More colourful kites move beyond the mown runway edge. Real 01–04, 11 and 14. Games 01 and 04.. |
| Allmende-Kontor gardens, 7.16 km | [Before](before-gardens.jpg) | [After](after-gardens.jpg) | The ring road passes raised timber beds, garden sheds, picnic tables, a red information container and people tending or using the park. Real 10–13. Games 01 and 05.. |
| Skylark meadow, 9.52 km | [Before](before-meadow.jpg) | [After](after-meadow.jpg) | Tall meadow grass behind a wire fence gives way to Neukölln apartments and church spires, with the Fernsehturm sphere on its slender mast. Real 05–07 and 11–15. Games 01, 02 and 04.. |
| The windsock taxiway, 12.64 km | [Before](before-taxiway.jpg) | [After](after-taxiway.jpg) | Taxiway arrows and yellow signs guide the return to concrete. A striped windsock turns beside the old airfield lights while skaters cross the apron. Real 01–05, 09 and 14. Games 03 and 05.. |

The curved terminal, glazed bays and radar tower stand beyond the runway lights. Moving kite canopies, runners and windsocks use the race clock. Sectioned geometry and shared artwork keep the gardens, meadow and airfield readable on low. [Credited references](../../worlds/tempelhof/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| runway threshold | 0 m | 0.12 km to 0.95 km | 120.22 | 119.99 | 9.8 ms | 21.6 ms | 47 |
| kite runway | 4700 m | 0.12 km to 0.95 km | 120.34 | 119.97 | 9.9 ms | 29.4 ms | 129 |

Reproduce from the frontend workspace with `npm run perf -- tempelhof-tablet --headed`.
