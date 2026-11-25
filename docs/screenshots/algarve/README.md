# Algarve Cliffs

The original GCN *Get Fit in 40* plan has 22 stages. The 16.8 km race climbs 113 m on the clifftop road. These paired captures follow the simulated rider at 90 rpm in the production solo race with the HUD visible, using the 1024 × 768 Low/WebGL 2 profile.

| Rider view | Previous world | Coastal course | References |
| --- | --- | --- | --- |
| Starting straight | [Before](before-opening.jpg) | [After](after-opening.jpg) | Real 05–07 and 14 show stepped white façades above the coves. Real 09–11 and game 01–02 inform the sightline past the pines. |
| Headland approach, 0.21 km | [Before](before-arch.jpg) | [After](after-arch.jpg) | Real 01–03, 08, 12 and 13 show sandstone beds, shadowed arch mouths and the beach below. Game 03–04 show the space to leave to either side of the cyclist. |
| Cove bend, 0.53 km | [Before](before-cove.jpg) | [After](after-cove.jpg) | Real 04 and 15 inform the sea cave and the lighthouse beyond it. Game 05 informs how the landmark reads against the horizon. |

Caribana keeps buildings readable behind its foreground spectators. Here the road turns inland so the rider can see the offshore rock opening before the bend. The rock strata use coloured vertices, and only the moored boats in the cove move with the swell. The coastal ride compresses the distance between Carvoeiro, Ponta da Piedade, Benagil and Cape St Vincent. [Photo and game credits](../../worlds/algarve/SOURCES.md) · [Caribana comparison](../caribana/README.md)

## Moving-frame measurement

The race crossed the arch, cave and cape during the 60-second sample from 0.12 to 0.95 km. The renderer submitted 120.04 frames/s, and independent display callbacks averaged 119.58/s. The p95 interval between submissions was 9.80 ms, the longest interval was 161.90 ms and draw calls peaked at 21. The average met the nominal 60 FPS criterion, with one long stall still present in the sample. Headed Chromium 159.0.8154.6 ran on an Apple M5 Pro with 24 GB RAM at 1024 × 768, DPR 1, Low/WebGL 2 and 4× CPU throttling after a nine-second warm-up. The GPU ran at its normal speed.
