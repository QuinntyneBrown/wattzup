# Provence Lavender from the saddle

GCN Training’s Get Fit Fast: 40 Minute Sweet Spot retains its 15 original stages, 41:00 duration and three-second video offset. The 18.545 km course climbs 118 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| D8 plateau road, 0.08 km | [Before](before-d8.jpg) | [After](after-d8.jpg) | The narrow patched road runs between gold wheat and violet lavandin. Pale dirt separates the rounded rows. Distant Alpine ridges remain fixed as the rider moves. Real 01–04, 10 and 11. Games 02 and 05.. |
| Stone mas and almond tree, 3.31 km | [Before](before-mas.jpg) | [After](after-mas.jpg) | Blue shutters and a terracotta roof distinguish the pale limestone farmhouse. An isolated broad almond tree breaks the skyline, and a dry stone borie stands by the track. Real 04–08 and 14. Games 01 and 03.. |
| Apiary among the rows, 6.44 km | [Before](before-hives.jpg) | [After](after-hives.jpg) | Coloured wooden hive boxes, honey supers and flying bees are visible at shoulder height. Bent lavender stems and poppies give the sandy verge a different scale from the planted rows. Real 02, 06, 14 and 15. Games 03 and 05.. |
| Mechanical harvest, 9.63 km | [Before](before-harvest.jpg) | [After](after-harvest.jpg) | A yellow tractor tows the blue lavender harvester. The reel turns at the row ends beside cut swaths, a trailer and round straw bales. Real 02, 12–14. Games 02 and 03.. |
| Valensole market square, 13.72 km | [Before](before-valensole.jpg) | [After](after-valensole.jpg) | Overlapping tiled roofs lead to the church tower. Plane trees shade a lavender stall, visitors and a distillery sign beside the road. Real 04, 08, 09 and 11. Games 01, 03 and 04.. |
| Puimoisson ridge, 17.96 km | [Before](before-puimoisson.jpg) | [After](after-puimoisson.jpg) | Sunflowers and wheat border the final ranks of purple. Puimoisson’s village roofs and steeple sit on the near ridge with blue-grey mountains behind. Real 03–07 and 09–11. Games 02, 04 and 05.. |

The D8 winds between violet lavandin, ripe wheat and sunflowers. A blue-shuttered mas, apiary, blue harvester and village market mark the route toward Puimoisson. The lavender spikes, bees and cutting reel share the ride clock. [Credited references](../../worlds/provence/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| D8 lavender rows | 0 m | 0.12 km to 0.95 km | 120.10 | 120.00 | 9.8 ms | 16.2 ms | 121 |
| Valensole market square | 13510 m | 0.12 km to 0.95 km | 120.16 | 119.98 | 10.0 ms | 32.2 ms | 71 |

Reproduce from the frontend workspace with `npm run perf -- provence-tablet --headed`.
