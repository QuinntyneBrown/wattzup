# Col du Tourmalet from the saddle

Four Minute Devils preserves its 19 stages, 26-minute duration and zero video offset. The D918 climbs 652 m in 10.400 km to the 2,115 m col. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| La Mongie, 0.14 km | [Before](before-mongie.jpg) | [After](after-mongie.jpg) | The road climbs between concrete ski apartments and a lift station. Empty summer chairs run toward the first bare-green ramp. Real 04, 11 and 15 and games 01 and 04. |
| The devil’s ramp, 2.17 km | [Before](before-devil.jpg) | [After](after-devil.jpg) | The red-horned devil jogs beside the rider with his trident raised. Chalk names and orange Basque flags mark the steep lane. Real 01–03, 09 and 13 and games 02 and 05. |
| The grazing slopes, 4.32 km | [Before](before-pasture.jpg) | [After](after-pasture.jpg) | A flock grazes below grey scree, with a cow and pony at the verge. A yellow-and-white borne gives the kilometres to the summit. Real 03, 06, 10–12 and 14 and games 01 and 04. |
| Pic du Midi, 6.65 km | [Before](before-pic.jpg) | [After](after-pic.jpg) | White observatory domes and the mast break the upper ridge. The climb leaves a shallow layer of mist below the next bend. Real 06, 09–11 and 14 and games 01–02. |
| The painted hairpin, 8.64 km | [Before](before-fans.jpg) | [After](after-fans.jpg) | Polka-dot and orange jerseys line a chalk-covered corner. Basque and French flags ripple at the roadside above the valley. Real 01–03, 06–09 and 13 and games 03 and 05. |
| Le Géant du Tourmalet, 10.22 km | [Before](before-geant.jpg) | [After](after-geant.jpg) | The silver cyclist stands above the 2,115 m pass sign. The rim of the saddle frames the crowd, downhill road and high peaks. Real 05–08 and 14 and games 02 and 05. |

The devil follows the rider on the steep ramps, chairs move above La Mongie and flags flutter beside the chalk names. Volumetric observatory domes and the open wheels, spokes and limbs of Le Géant retain their silhouettes on low detail. [Credited references](../../worlds/tourmalet/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| La Mongie ski station | 0 m | 0.12 km to 0.96 km | 120.07 | 119.68 | 10.2 ms | 54.2 ms | 82 |
| painted summit hairpin | 8440 m | 0.12 km to 0.95 km | 120.50 | 119.98 | 9.9 ms | 17.8 ms | 56 |

Reproduce from the frontend workspace with `npm run perf -- tourmalet-tablet --headed`.
