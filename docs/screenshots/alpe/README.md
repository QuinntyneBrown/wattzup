# Alpe d’Huez

*Elevate Your Climbing Power* supplies the original 14 stages and 20-minute clock. Map Select opens a 7.4 km, 328 m course. Its 21 bends count down from Fausto Coppi’s bend 21 to Giuseppe Guerini’s bend 1. The route compresses the real climb to the class distance. The village, spectators and snow fields use original low-detail geometry. [Source credits](../../worlds/alpe/SOURCES.md) · [Course design and official sign sources](../../detailed-designs/race/render-the-race-world/README.md#alpe-dhuez)

| View | Previous world | Course | Reference and comparison |
| --- | --- | --- | --- |
| Valley approach, 0.10 km | [Before](before-valley.jpg) | [After](after-valley.jpg) | Real 01, 02, 10 and 14 and games 01–03 informed the valley opening, the approach to the ramp and the sign placement. |
| Dutch Corner approach, 4.86 km | [Before](before-dutch-corner.jpg) | [After](after-dutch-corner.jpg) | Real 03–09 informed the orange spectators, motorhomes, flags and road paint. As at Caribana, the crowd has a near line and a less detailed second line. |
| Church at bend 7, 4.90 km | [Before](before-church.jpg) | [After](after-church.jpg) | Real 11 informed the square bell tower and pointed roof. The nave, tower and nearby houses share the bend geometry. The smoke drifts with the ride clock. |
| Ski station, 7.02 km | [Before](before-station.jpg) | [After](after-station.jpg) | Real 12–15 and games 04–05 informed the lift and chalets. The Grandes Rousses skyline draws beyond the foreground like Caribana’s skyline. |

The camera follows the race distance after a gap in rendering. Before the correction a deliberately delayed 24-second sequence left the picture 247 m behind the HUD. The rider acceptance check now compares the submitted scene position with the HUD, allowing for display rounding and the distance between telemetry ticks.

## Moving tablet measurements

Headed Chromium 159.0.8154.6 on an Apple M5 Pro with 24 GB, macOS arm64. Simulated touch viewport 1024 × 768, DPR 1, 4× CPU throttling, low tier, WebGL 2 and normal GPU speed. Each sample follows nine seconds of warm-up and 60 seconds of fake pedalling. The second begins 4,550 m up the course and crosses bend 7 at 4,907 m. Submitted frames count actual course renders. Display FPS counts independent animation callbacks.

| Sample | Submitted FPS | Display FPS | p95 ms | Longest ms | Peak draw calls |
| --- | ---: | ---: | ---: | ---: | ---: |
| Valley approach | 120.16 | 119.95 | 9.90 | 21.40 | 45 |
| Dutch corner | 120.23 | 120.00 | 9.90 | 15.70 | 49 |

Run from `frontend/` with `npm run perf -- 'alpe-tablet\.perf\.ts$' --headed`. For the four HUD views use `npm run perf -- 'alpe-views\.perf\.ts$' --headed`. The baseline uses the previous production build and the same simulated bike, catalogue fixture, distances and viewport.
