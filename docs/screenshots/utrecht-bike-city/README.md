# Utrecht Bike City from the saddle

The route carries GCN Training’s twenty-stage Cadence Drills for Strength & Speed through a full hour with its two-second video offset. The old wharves and the modern Stationsplein garage connect across 22.59 km. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Oudegracht aan de Werf, 0.14 km | [Before](before-oudegracht.jpg) | [After](after-oudegracht.jpg) | An upper brick street looks across a lower cafe terrace, vaulted cellar doors and the green canal beneath the gabled houses. Real 01–03, 10, 13 and games 01–02. |
| The Dom Tower approach, 4.25 km | [Before](before-domtoren.jpg) | [After](after-domtoren.jpg) | A straight street frames the square Gothic tower. The open bell lantern rises above the rooftops. Real 01, 04, 12–13 and games 02–03. |
| Stationsplein bicycle garage, 8.36 km | [Before](before-stationsplein.jpg) | [After](after-stationsplein.jpg) | A red two-way bicycle ramp leads under the station canopy. Two tiers of parked bikes line the illuminated garage entrance. Real 05, 07–09 and game 05. |
| The red cycle lane, 12.32 km | [Before](before-junction.jpg) | [After](after-junction.jpg) | White shark teeth and dashed lane markings lead up to traffic lights where a cargo bike joins waiting Dutch cyclists. Real 05–07, 12, 15 and games 03–04. |
| Nieuwegracht bridge, 16.78 km | [Before](before-nieuwegracht.jpg) | [After](after-nieuwegracht.jpg) | A low brick arch with iron railings spans the green canal. A tour boat and a paddler pass beneath the trees. Real 02–03, 10–11, 14 and games 01, 04. |
| The wharf finish, 22.32 km | [Before](before-werf.jpg) | [After](after-werf.jpg) | Gabled trading houses, lit cellar cafes, hanging greenery and the distant Dom mark the return to the old wharves. Real 01–03, 10, 13–14 and games 01–02. |

The lower wharf and cafe entrances sit below the cycling street. Fixed architectural landmarks, including a 112 m Dom Tower, establish distance. Boats, a paddler and a cargo cyclist share the ride clock; the station ramp and two levels of racks occupy their own space. [Credited references](../../worlds/utrecht/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Oudegracht wharves | 0 m | 0.11 km to 0.95 km | 120.14 | 119.86 | 10.1 ms | 67.0 ms | 54 |
| Nieuwegracht bridge | 16450 m | 0.12 km to 0.96 km | 118.36 | 118.01 | 10.3 ms | 251.6 ms | 60 |

Reproduce from the frontend workspace with `npm run perf -- utrecht-tablet --headed`.
