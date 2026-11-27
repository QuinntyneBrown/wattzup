# Montmartre from the saddle

The original 16 stages of GCN Training’s Short, Sharp & Hard Efforts run for 20:00 across 8.4 km. Its class grades and rolls produce 552 m of climbing. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Le Consulat corner, 0.08 km | [Before](before-consulat.jpg) | [After](after-consulat.jpg) | Red café awnings follow the narrow wedge of Le Consulat. Bistro tables, woven chairs and green lamps frame a glimpse of the domes above the cobbles. Real 01–02, 08. Games 02–03.. |
| La Maison Rose, 1.58 km | [Before](before-rose.jpg) | [After](after-rose.jpg) | Pink stucco, deep green shutters and the sloping rue de l’Abreuvoir identify La Maison Rose. A stone gutter and short bollards turn with the lane. Real 03–04, 09–10, 13. Games 03 and 05.. |
| Clos Montmartre and Au Lapin Agile, 2.91 km | [Before](before-vines.jpg) | [After](after-vines.jpg) | Terraced vines and ivy rise above the garden wall opposite the cabaret’s green paling and ochre sign. Golden light catches the upper leaves. Real 05, 09–10, 12. Games 03 and 05.. |
| Place du Tertre, 4.38 km | [Before](before-tertre.jpg) | [After](after-tertre.jpg) | Painters lift their brushes beside tilted canvases and parasols. Red and green terrace awnings lead back into the lane beyond the square. Real 07–08, 14. Games 01 and 03.. |
| Rue Foyatier, 6.02 km | [Before](before-stairs.jpg) | [After](after-stairs.jpg) | Stone steps and twin iron rails climb beside the steep street. WATTZUP and VAS-Y follow the pavés, with a Wallace fountain and a green Métro entrance at street level. Real 03, 10–11, 15. Games 02 and 05.. |
| Sacré-Cœur, 7.91 km | [Before](before-domes.jpg) | [After](after-domes.jpg) | The tall central dome and smaller white domes of Sacré-Cœur rise beyond the rooftops. The nearest stone courses and cornices stay warm in the low sun. Real 01, 06 and 15. Games 01–02 and 04.. |

Le Consulat, La Maison Rose and Au Lapin Agile sit along the winding granite lanes. Painters work beneath parasols at Place du Tertre. Stone stairs lead past a Wallace fountain and Guimard Métro entrance to the white domes of Sacré-Cœur. [Credited references](../../worlds/montmartre/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Le Consulat corner | 0 m | 0.12 km to 0.95 km | 119.47 | 118.85 | 10.2 ms | 231.1 ms | 33 |
| Place du Tertre painters | 4260 m | 0.12 km to 0.95 km | 120.06 | 119.88 | 10.2 ms | 47.2 ms | 59 |

Reproduce from the frontend workspace with `npm run perf -- montmartre-tablet --headed`.


## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [026 · The paint lies on the butte's cobbles](bend-026-paint-on-the-butte.jpg) | The fans' WATTZUP and VAS-Y painted on the cobbled lanes up the butte were laid level, so on the 7–8% climb to the Sacré-Cœur they sank into the setts. They now lie along the slope, and the props behind the rider stand on the road there. |
