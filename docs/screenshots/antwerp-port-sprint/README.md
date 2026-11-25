# Antwerp Port Sprint from the saddle

Choose Antwerp Port Sprint in Map Select and start a solo race on Scheldt Quays. The original 17 stages of GCN’s *Lead Out Efforts Into Full Sprints* run for 50:00 and cover 20.9 km at target cadence. The raised lock bridges account for the course’s 18 m of climbing.

| Rider view | Original | Revised | Reference details |
| --- | --- | --- | --- |
| Het Steen, 0.03 km | [Before](before-castle.jpg) | [After](after-castle.jpg) | Embedded dock rails run along the approach below the gate, towers and pale stone of the fortress. Four riders shelter diagonally in the crosswind. Real 02, 05–07 and games 01, 02 and 05. |
| Eilandje, 0.46 km | [Before](before-mas.jpg) | [After](after-mas.jpg) | The MAS’s red storeys alternate with glass bands. Water, gantries and the roadside bollards give separate depth cues. Real 03, 04, 08–11 and 15. |
| Lock bridge, 1.06 km | [Before](before-lock.jpg) | [After](after-lock.jpg) | Barriers and rails close in on the bridge. The changing bearing reveals the old fire station and the projected glass volume above it. Real 01, 04 and 14 and game 03. |
| Port House, 1.15 km | [Before](before-port-house.jpg) | [After](after-port-house.jpg) | Look for the pointed prow, alternating glass facets, inclined supports and the old station’s repeated window bays. Real 01 and 14. |
| Final sprint, 20.81 km | [Before](before-sprint.jpg) | [After](after-sprint.jpg) | Fans, buses, Flanders flags and the railings lead from the red kite to the chequered finish. Behind the convoy the working quays include cranes, container stacks and Red Star Line sheds. Real 05, 06 and 11–13 and games 01–04. |

The port skyline stays fixed like Caribana’s skyline. The original scene’s moving wind turbines, dock cranes, shipping, working sheds and bunch finish remain part of the race. The four moving riders share the course’s rider resources. Flags share one folded mesh and a yellow lion texture. A small number of soft clouds cross the docks on ride time. Static rail joints, brick openings and window bands carry through to Low. [Original references and credits](../../worlds/antwerp/SOURCES.md) · [Rider feedback](https://github.com/QuinntyneBrown/wattzup/issues/928)

## Simulated tablet

The two runs used headed Chromium 159.0.8154.6 on an Apple M5 Pro, 1024 × 768, DPR 1, Low/WebGL 2 and 4× CPU throttle. The bike covered 0.83 km during each one-minute measurement after nine seconds of warm-up. Each submitted frame was counted after the world rendered.

| Section | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak draw calls |
| --- | ---: | ---: | ---: | ---: | ---: |
| Scheldt quays | 120.43 | 120.00 | 9.7 ms | 15.6 ms | 41 |
| Final port sprint | 120.08 | 119.84 | 9.9 ms | 39.0 ms | 37 |

Reproduce from the frontend workspace with `npm run perf -- antwerp-tablet --headed`.
