# Caribana Parade from the saddle

Race → Caribana Parade opens GCN Training’s *Intense Interval Blast*. The 19 original stages total 15:00 and cover 6.555 km, with 151 m of climbing in the catalogue profile. The normal Map Select and setup screens now reach the same ride as the benchmark.

| Rider view | Before | After | What to look for |
| --- | --- | --- | --- |
| Opening, 0.04 km | [Before](before-opening.jpg) | [After](after-opening.jpg) | Painted lanes, barricades, island flags, tree shadows and the Ride One cyclist. Real 01–04, 08–10, 15 and games 01–02. |
| Mas band, 0.18 km | [Before](before-band.jpg) | [After](after-band.jpg) | The dancers have advanced relative to the stilt walkers and barricades. The King, music truck and CN Tower read at different distances. Real 05–07, 10–11 and games 03 and 05. |
| Waterfront, 0.32 km | [Before](before-waterfront.jpg) | [After](after-waterfront.jpg) | Sound truck and flags in the foreground, trees along the park and the pavilion roof on the lake side. Real 08–09, 12–14 and games 04–05. |

The baseline uses the historical plan in a fixture so a rider can enter the original release. The upper tiers already animate the parade. On Low the four feathered masquerader cutouts now march at the same 0.6 m/s as the detailed street. Spectators, trees and skyline retain their positions and the original cutout atlas. Baked figures hold their poses. The bend, grade, camera and cadence-driven Ride One model follow the existing renderer. [Reference credits](../../worlds/caribana/SOURCES.md) · [Original iteration record](../caribana/README.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768, DPR 1, CPU throttled 4×, Low/WebGL 2 and fake Bluetooth pedalling. Each moving sample lasts 60 seconds after nine seconds of warm-up. Sampling the renderer’s draw-call update after each submission distinguishes rendered frames from display callbacks. The second run rides into the busiest section before warm-up.

| Section | HUD distance | Submitted FPS | Display FPS | p95 | Longest frame | Peak draw calls |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Opening band | 0.12 km to 0.95 km | 118.94 | 118.91 | 10.4 ms | 66.4 ms | 63 |
| Parade and waterfront | 0.29 km to 1.11 km | 119.55 | 119.51 | 10.6 ms | 48.9 ms | 52 |

Run from the frontend workspace with `npm run perf -- caribana-tablet --headed`.
