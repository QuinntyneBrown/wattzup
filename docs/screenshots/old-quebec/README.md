# Old Québec from the saddle

GCN Training’s 30 Minute Short Sharp Efforts retains 11 stages, 30:00 duration and a three-second video offset. The two circuits total 13.225 km and climb 158 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Place Royale, 0.08 km | [Before](before-royale.jpg) | [After](after-royale.jpg) | Fieldstone houses with steep dormered roofs frame the cobbled square. A clear gap above the eaves places the copper-roofed château on the cliff. Real 01, 12, 13 and 15. Games 01 and 04.. |
| Petit-Champlain and the steps, 1.08 km | [Before](before-champlain.jpg) | [After](after-champlain.jpg) | Shop signs, iron globe lamps, flower boxes and café tables line the tight lane. The Escalier Casse-Cou climbs between the façades beside the rider. Real 04–07 and 12. Games 01, 02 and 04.. |
| Côte de la Montagne, 2.26 km | [Before](before-montagne.jpg) | [After](after-montagne.jpg) | The twisting cobbled road climbs sharply between the stone wall and houses. Château Frontenac shows its brick wings, tall central tower and oxidized copper roofs above the bend. Real 01, 02, 04, 08 and 14. Games 02 and 03.. |
| Porte Saint-Louis, 3.39 km | [Before](before-saintlouis.jpg) | [After](after-saintlouis.jpg) | The road passes beneath the grey limestone gate. A round turret, crenellations and the grass-topped wall read against autumn maples. Real 03, 04 and 09. Games 02 and 04.. |
| Terrasse Dufferin, 4.63 km | [Before](before-dufferin.jpg) | [After](after-dufferin.jpg) | The iron rail and boardwalk run above the St. Lawrence. Green-and-white gazebos, globe lamps, flags and a moving ferry share the view with the far shore. Real 08, 10, 11, 14 and 15. Games 03 and 05.. |
| Porte Kent and the ramparts, 12.17 km | [Before](before-ramparts.jpg) | [After](after-ramparts.jpg) | A second castellated opening and the long grassy glacis carry the penultimate descent. Historic cannon carriages sit along the wall under red and gold maples. Real 03, 08, 09 and 15. Games 01, 04 and 05.. |

Climb from Place Royale past the Petit-Champlain shops and steps to Château Frontenac. The road passes through the two limestone gates and follows the planked Terrasse Dufferin above the St. Lawrence. The Canadian flag, ferry and hanging shop sign follow the ride clock. [Credited references](../../worlds/quebec/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Place Royale cobbles | 0 m | 0.12 km to 0.95 km | 120.88 | 120.00 | 9.6 ms | 18.4 ms | 66 |
| Dufferin gazebos and river ferry | 4410 m | 0.12 km to 0.95 km | 120.22 | 120.00 | 9.6 ms | 23.0 ms | 50 |

Reproduce from the frontend workspace with `npm run perf -- quebec-tablet --headed`.
