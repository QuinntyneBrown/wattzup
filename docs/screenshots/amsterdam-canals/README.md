# Amsterdam Canals from the saddle

Map Select → Amsterdam Canals → Herengracht → Solo. The original and revised views follow the same 8 km route fixture on Low at 1024 × 768. Both start from the same saved bike and use 90 rpm at resistance 18. The original build draws the earlier Amsterdam street scene. The new race follows all nine stages of GCN’s 20-minute *Beginner Training Session*.

| View | Earlier world | Herengracht | References and detail |
| --- | --- | --- | --- |
| Opening quay, 0.04 km | [Before](before-quay.jpg) | [After](after-quay.jpg) | Real 01, 03, 05–07, 09–10 and games 01, 02, 04. The narrower lane brings the canal into the rider’s view. The original stepped, neck and bell gables and elm textures were baked into reusable atlases. |
| First bridge approach, 0.10 km | [Before](before-bridge.jpg) | [After](after-bridge.jpg) | Real 02, 04, 08, 13–15 and games 01, 03–04. Brick arches cross the water. The crown lifts the road while the water stays level. Iron railings hold bicycles above the arch. |
| Moorings, 0.30 km | [Before](before-moorings.jpg) | [After](after-moorings.jpg) | Real 10–13 and games 03, 05. A glass tour boat and commuters travel on ride time. Planted houseboats, red-brown bollards and moored skiffs mark the quays. |

Caribana uses painted surfaces, shared geometry and a visible middle distance to keep its procession legible. Here the clinker and façade atlases retain detail at riding distance, the elms use cutout leaves, and each cluster of façades shares a material. Benchmarks count actual world draws after shader warm-up. [Reference credits](../../worlds/amsterdam/SOURCES.md) · [Earlier rider feedback](https://github.com/QuinntyneBrown/wattzup/issues/903)

## Simulated tablet

Headed Chromium 159.0.8154.6 running WebGL 2 on an Apple M5 Pro, DPR 1, touch emulation, 4× CPU throttling. Each sample warms for nine seconds and measures a minute of riding. The second starts 380 metres farther along the course. The machine supplies the GPU.

| Section | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak draw calls |
| --- | ---: | ---: | ---: | ---: | ---: |
| Opening quay | 120.16 | 120.00 | 9.8 ms | 22.1 ms | 38 |
| Herengracht bridge | 120.56 | 120.00 | 9.8 ms | 15.3 ms | 37 |

From the frontend workspace run `npm run perf -- 'amsterdam-(tablet|views)\.perf\.ts$' --headed` against the production build. To capture the earlier world, serve the main-branch build on the configured E2E port and set `AMSTERDAM_CAPTURE=before`.
