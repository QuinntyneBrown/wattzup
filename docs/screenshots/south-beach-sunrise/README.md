# South Beach Sunrise from the saddle

GCN Training’s Calorie Burning Workout retains its 15 stages, 16:00 duration and ten-second video offset. The Ocean Drive course covers 7.025 km and climbs 67 m. The six matched comparisons keep the simulated bike at 90 rpm and the HUD visible.

| Viewpoint | Original | Revised | References and details |
| --- | --- | --- | --- |
| Colony Hotel, 0.10 km | [Before](before-colony.jpg) | [After](after-colony.jpg) | The vertical COLONY fin glows blue above white horizontal eyebrows. The first palms cast long shadows across the café frontage and painted race lane. Real 01, 04, 07 and 09. Games 01 and 03.. |
| Carlyle café terrace, 1.34 km | [Before](before-carlyle.jpg) | [After](after-carlyle.jpg) | The Carlyle’s stepped mint frontage rises behind striped umbrellas, menu stands and a parked two-tone convertible. A cleaner sweeps the sidewalk. Real 02, 03 and 08. Games 01 and 02.. |
| Breakwater neon fin, 2.64 km | [Before](before-breakwater.jpg) | [After](after-breakwater.jpg) | The central stepped fin reads BREAKWATER above the coral and cream wings. Its neon fades as the sun climbs; the original sprint paint follows the uphill grade. Real 04, 06, 07 and 09. Games 02 and 03.. |
| Lummus Park beachwalk, 4.01 km | [Before](before-lummus.jpg) | [After](after-lummus.jpg) | A rollerblader and a dog walker pass under slender royal palms beside the paved beachwalk. Sea oats and the Atlantic show through the gaps. Real 05, 10, 14 and 15. Games 01, 04 and 05.. |
| Lifeguard stand at sunrise, 5.15 km | [Before](before-lifeguard.jpg) | [After](after-lifeguard.jpg) | A turquoise and pink raised tower, stairs and railings stand on the open sand. The low orange sun and a narrow band of reflected light sit over the sea. Real 11–15. Games 03–05.. |
| Ocean Drive finish tower, 6.82 km | [Before](before-finish.jpg) | [After](after-finish.jpg) | The stepped art deco crown stands on the final sightline. A long boulevard of pastel hotels, café terraces and palms leads to the finish. Real 01–03, 06 and 09. Games 01 and 03.. |

Original hotel façades and royal palms flank the boulevard. The cleaner sweeps the Carlyle terrace, the Breakwater fin fades, and a rollerblader and dog walker pass the raised stands along Lummus Park. Graded sprint lettering and long shadows follow the road toward its stepped finish tower. Caribana keeps its Toronto skyline fixed behind moving parade figures. On Ocean Drive the Atlantic horizon and stepped tower stay in place while the nearby cleaner and skater articulate. Hotel elevations and palm silhouettes use baked artwork to keep the tablet draw count low. [Credited references](../../worlds/southbeach/SOURCES.md)

## Simulated tablet

Headed Chromium 159.0.8154.6 on Apple M5 Pro, 1024 × 768 at DPR 1, Low/WebGL 2, 4× CPU throttle and fake bike pedalling. Each one-minute moving sample followed nine seconds of warm-up. The submitted rate counts actual draws. The offset in the second sample places the bike at the busiest section.

| Section | Scene offset | HUD distance | Submitted FPS | Display FPS | p95 interval | Longest interval | Peak calls |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| the Colony and café terraces | 0 m | 0.12 km to 0.95 km | 120.19 | 119.97 | 9.8 ms | 25.7 ms | 33 |
| Lummus Park and the beachwalk | 3830 m | 0.12 km to 0.95 km | 120.08 | 119.69 | 10.0 ms | 44.8 ms | 81 |

Reproduce from the frontend workspace with `npm run perf -- southbeach-tablet --headed`.


## Bends and elevation

Fixes to how the road bends and climbs here (L2-101 AC6, L2-110 AC9), from the series that began with Old Town.

| Capture | Fix |
| --- | --- |
| [059 · The paint lies on Ocean Drive's rise](bend-059-paint-on-ocean-drive.jpg) | The words painted on Ocean Drive (CHASE IT, VAMOS) were laid level, so where the road rises 4% over an effort the far end of each word sank into the tarmac. They now lie along the slope, and the props behind the rider stand on the road there instead of at the height under the rider. |
