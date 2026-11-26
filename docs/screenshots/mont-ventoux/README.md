# Mont Ventoux from the saddle

GCN Training’s In & Out of the Saddle Hill Climb Reps retains its nine stages, twenty minutes and three-second video offset. The D974 climbs 615 m across 8.395 km. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Lower cedar road, 0.14 km | [Before](before-cedres.jpg) | [After](after-cedres.jpg) | A pair of amateur cyclists climb between cedar and pine. The shade ends sharply above the junction. Real 07–09 and games 01, 03. |
| Chalet Reynard, 1.72 km | [Before](before-chalet.jpg) | [After](after-chalet.jpg) | The broad wooden restaurant and its terrace stand at the fork. The striped summit mast rises beyond the treeline. Real 01, 09, 11–12 and game 01. |
| Limestone scree, 3.32 km | [Before](before-pierrier.jpg) | [After](after-pierrier.jpg) | The white D974 edges curve across pale broken limestone. Painted encouragement remains visible on the tarmac. Real 01–05, 11 and games 02, 05. |
| Mistral shelter, 4.94 km | [Before](before-mistral.jpg) | [After](after-mistral.jpg) | A flag snaps behind a low wall. Beyond the winding road, Provence fields, the Vaucluse hills and distant Alps fill the view. Real 04, 10, 13, 15 and games 02–03. |
| Tom Simpson memorial, 6.83 km | [Before](before-simpson.jpg) | [After](after-simpson.jpg) | The granite stele rises above its stone steps with a portrait plaque, bottles and caps at the foot. Passing riders stand on their pedals. Real 03, 06, 14 and games 01, 04. |
| Summit observatory, 8.22 km | [Before](before-sommet.jpg) | [After](after-sommet.jpg) | The cream weather station and red-white mast stand on the ridge behind the summit sign. Supporters applaud the final turn. Real 01–02, 05, 10–12, 15 and games 04–05. |

Original limestone, Chalet Reynard, memorial and Provence artwork are combined with the Valais tree and Tourmalet chalk and supporter atlases. The fixed summit station, broken scree and graded edge lines use merged geometry. Cyclists, cloth and the summit supporter follow the ride clock. [Credited references](../../worlds/ventoux/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Cedar forest | 0 m | 0.12 km to 0.95 km | 119.15 | 119.15 | 11.5 ms | 91.6 ms | 68 |
| Tom Simpson memorial | 6650 m | 0.12 km to 0.96 km | 118.45 | 118.35 | 10.9 ms | 105.5 ms | 61 |

Reproduce from the frontend workspace with `npm run perf -- ventoux-tablet --headed`.
