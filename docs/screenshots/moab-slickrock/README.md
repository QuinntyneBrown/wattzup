# Moab Slickrock from the saddle

GCN Training’s The Hurt Locker retains 17 stages over 30:00 and 12.9 km with a four-second video offset. The course climbs 261 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Highway 128 river canyon, 0.08 km | [Before](before-river.jpg) | [After](after-river.jpg) | The double yellow line follows the Colorado River between dark Wingate walls. A gap in the canyon opens onto the snow-dusted La Sal Mountains. Real 01–02, 04–06 and 10. Games 01 and 03.. |
| Slickrock trailhead, 2.18 km | [Before](before-slickrock.jpg) | [After](after-slickrock.jpg) | Two mountain bikers roll over a rounded Navajo sandstone dome off the tarmac. Twisted juniper, sagebrush and dark soil crust mark the trailhead. Real 03, 10–11 and 13. Games 02 and 05.. |
| Balanced Rock and fins, 4.32 km | [Before](before-balanced.jpg) | [After](after-balanced.jpg) | Balanced Rock’s large rounded cap meets a narrow pedestal beside the layered Organ fins. Recesses stay dark against the orange sunlit walls. Real 08–09 and 13. Games 01 and 03.. |
| The Windows, 6.52 km | [Before](before-windows.jpg) | [After](after-windows.jpg) | The North Window opens through a thick sandstone fin, framing a second pinnacle. Pale cross-bedded rock and a dark arch underside reveal its depth. Real 03, 13–15. Games 02, 04 and 05.. |
| Delicate Arch bowl, 9.24 km | [Before](before-delicate.jpg) | [After](after-delicate.jpg) | A freestanding asymmetrical arch rises from the curved slickrock bowl. Its broad foot and slender opposite leg frame the sky, with the La Sals behind it. Real 07, 12 and 14. Games 03–04.. |
| La Sal overlook, 12.28 km | [Before](before-lasal.jpg) | [After](after-lasal.jpg) | The final bends pass low sage and glowing red-orange benches. Snow on distant La Sal summits catches the remaining light beyond the desert. Real 01, 06–08 and 10–12. Games 01, 04 and 05.. |

Highway 128 follows the moving Colorado River between sandstone walls. Two trail riders cross the slickrock beside junipers and sage. Balanced Rock, the Windows and Delicate Arch have distinct fixed silhouettes. The La Sal Mountains stand beyond the final sunlit benches. [Credited references](../../worlds/moab/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Colorado River canyon | 0 m | 0.12 km to 0.96 km | 120.30 | 120.00 | 9.7 ms | 25.4 ms | 43 |
| Delicate Arch bowl | 8980 m | 0.12 km to 0.95 km | 120.56 | 120.00 | 9.8 ms | 15.1 ms | 51 |

Reproduce from the frontend workspace with `npm run perf -- moab-tablet --headed`.
