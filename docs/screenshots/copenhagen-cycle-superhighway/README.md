# Copenhagen Cycle Superhighway from the saddle

The 17 stages of GCN Training’s 1 Minute VO2 Max Surges run for 32 minutes along a 13.65 km route with 47 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Green-wave junction, 0.075 km | [Before](before-signals.jpg) | [After](after-signals.jpg) | The cycle signals, lane markings and green lights guide the rider. Real 01–02, 06 and 13–14, games 01 and 03. |
| City cycle track, 0.68 km | [Before](before-commuters.jpg) | [After](after-commuters.jpg) | Commuters and cargo bikes share the separated track. Real 01–02 and 06, games 01 and 03–05. |
| Cykelslangen, 2.45 km | [Before](before-snake.jpg) | [After](after-snake.jpg) | The orange deck winds above the harbour. Real 03–05 and 12, games 02 and 04. |
| Harbour baths, 4.20 km | [Before](before-baths.jpg) | [After](after-baths.jpg) | The timber decks frame the swimming area. Real 10–11 and 15, games 02 and 05. |
| Nyhavn, 7.34 km | [Before](before-nyhavn.jpg) | [After](after-nyhavn.jpg) | Colourful gables and moored boats line the quay. Real 08–09 and 15, games 02–03. |
| Inderhavnsbroen, 10.42 km | [Before](before-bridge.jpg) | [After](after-bridge.jpg) | The deck opens views to the inner harbour and skyline. Real 05, 11–12 and 15, games 02 and 04. |

The physical route links the green-wave junctions, Cykelslangen, harbour baths, Nyhavn and Inderhavnsbroen. Distances between these landmarks are compressed. Commuters pedal upright city bicycles, two-wheel front loaders and three-wheel cargo cycles. The signal LEDs form a moving sequence and hold with the commuters when the rider pauses. Like Caribana, the course combines a moving foreground with a fixed skyline. The linden and visitor atlas derives from original project artwork. Bridge railings and moored boats share baked geometry for the low tier. [Credited references](../../worlds/copenhagen/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Green-wave junction and commuter traffic | 55 m | 0.12 km to 0.95 km | 120.80 | 120.00 | 9.5 ms | 12.7 ms | 36 |
| Cykelslangen and the harbour approaches | 2180 m | 0.12 km to 0.95 km | 120.77 | 120.00 | 9.5 ms | 15.7 ms | 27 |

Reproduce from the frontend workspace with `npm run perf -- copenhagen-tablet --headed`.
