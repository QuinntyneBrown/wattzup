# Han River Parks, Seoul from the saddle

Choose The riverside path in Map Select. GCN’s 20 Minute High Intensity Workout retains its original 15 stages and 20:40 duration. The path covers 8.708 km with 12 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Yeouido, 0.08 km | [Before](before-yeouido.jpg) | [After](after-yeouido.jpg) | Gold and red towers separate across the dark river. Real 05, 13–14 and games 01 and 03. |
| Hangang park, 1.48 km | [Before](before-park.jpg) | [After](after-park.jpg) | A green rental rack, seated and standing visitors and passing cyclists occupy the park. Real 01, 07, 11, 15 and games 02 and 05. |
| Bridge underpass, 3.02 km | [Before](before-piers.jpg) | [After](after-piers.jpg) | The lane dips between illuminated deck fascias and a broad pier. Real 03, 08–09 and game 04. |
| Banpo fountain, 4.62 km | [Before](before-banpo.jpg) | [After](after-banpo.jpg) | Coloured water arcs drop into the river along the double-deck crossing. Real 02, 08–09 and game 04. |
| Namsan, 6.39 km | [Before](before-namsan.jpg) | [After](after-namsan.jpg) | The tapered shaft, observation decks and aerial stand above the ridge. Real 12–14 and games 01 and 03. |
| Promenade, 8.45 km | [Before](before-promenade.jpg) | [After](after-promenade.jpg) | Twin lamps, glowing bollards and lane markings lead past the river and bridge. Real 01, 05–07 and 10; games 02 and 05. |

The Banpo approach reveals the Moonlight Rainbow Fountain across the river before the path passes under the bridge. The deck, its lower Jamsu crossing, jet ribbons and reflected light occupy fixed world positions. The stepped banks support benches, walkers, picnickers and green rental racks. One instanced cyclist mesh carries ten riders along the actual cycleway. Water, fountain and riders advance on ride time. Yeouido’s buildings stand on the opposite shore, with red Parc1 frames, a gold 63 Building and pale IFC slabs. N Seoul Tower rises above Namsan. [Credited references](../../worlds/hanriver/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Yeouido park | 0 m | 0.12 km to 0.95 km | 120.85 | 120.00 | 9.6 ms | 13.3 ms | 25 |
| Banpo fountain and bridge reflections | 4380 m | 0.12 km to 0.95 km | 120.13 | 120.00 | 9.5 ms | 15.3 ms | 25 |

Reproduce from the frontend workspace with `npm run perf -- hanriver-tablet --headed`.
