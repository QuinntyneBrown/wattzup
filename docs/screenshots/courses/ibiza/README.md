# Ibiza Sunset Strip: passes

Each pass makes one upgrade to the map or to how it is drawn, then checks the frame's cost at 16 places along the
course against the budget for low-power tablets (L2-166 AC12): no more than **120,000 triangles** and **140 draw
calls** in the worst frame, and a download of no more than **3 MB gzipped**.

The check runs the real `CourseRenderer` on the real `ibiza.glb` in headless Chrome and reads what the renderer sent
the GPU. It is a budget, not a frame rate: this was drawn in software, with no GPU, and **no pass has been timed on a
real tablet**. Until one is, the budget and the renderer's tiers (it opens cheap and steps up only while frames keep
the display's pace) are what stand behind 60 fps.

| Pass | Worst frame | Download | Budget |
| --- | --- | --- | --- |
| Pass 0 (baseline) | 350,829 triangles, 784 draw calls | 3.86 MB | Over |
| Pass 1 (map in chunks, one cheap material a group, draw distances, blob shadows, byte colours) | 177,662 triangles, 479 draw calls | 4.64 MB | Over |
| Pass 2 (riders' still parts merged, nearest four riders drawn, scenery drawn nearer) | 123,020 triangles, 193 draw calls | 4.64 MB | Over |
| Pass 3 (no undersides, land and beams in longer chunks, lighter asphalt) | 127,090 triangles, 175 draw calls | 4.50 MB | Over |
| Pass 4 (coarser far land, glow and leaves in longer chunks, nearer scenery distances) | 116,656 triangles, 166 draw calls | 4.34 MB | Over |
| Pass 5 (each rider's plain-coloured parts merged into one mesh) | 116,656 triangles, 141 draw calls | 4.34 MB | Over |
| Pass 6 (verges and paint two samples long on straight even road) | 115,450 triangles, 141 draw calls | 4.27 MB | Over |
| Pass 7 (shading baked into the colours: walls, posts, trunks and the crowd darker at the foot) | 115,450 triangles, 139 draw calls | 2.25 MB gzipped | Within |
| Pass 8 (clubs: arched glowing doorways, striped awnings, windows; the crowd gets faces and legs) | 112,130 triangles, 136 draw calls | 2.26 MB gzipped | Within |
| Pass 9 (fuller palms in two greens, a glow round the sun, its path on the water, streaks of cloud) | 121,889 triangles, 141 draw calls | 2.43 MB gzipped | Over |
| Pass 9, retuned (draw distances trimmed to pay for the palms and the sky) | 117,233 triangles, 141 draw calls | 2.43 MB gzipped | Over |
| Pass 10 (smaller sun glow matched to the sky; land and beams drawn nearer) | 117,233 triangles, 141 draw calls | 2.43 MB gzipped | Over |
| Pass 11 (start lights not drawn once far behind) | 117,233 triangles, 141 draw calls | 2.43 MB gzipped | Over |
| Pass 12 (glow and leaves in chunks three long: fewer meshes on screen) | 118,270 triangles, 138 draw calls | 2.49 MB gzipped | Within |
| Pass 13 (opens on a cheap tier and steps up only while frames keep pace; beams breathe, confetti flutters) | 118,258 triangles, 126 draw calls | 2.49 MB gzipped | Within |
| Pass 13 at the top tier (bloom on), for reference | 118,270 triangles, 138 draw calls | 2.49 MB gzipped | Within |

Passes 0 to 6 give the file's size uncompressed; from pass 7 it is gzipped, as it is served.

`app-*.jpg` are frames from the top tier (bloom on) after pass 13; `blender-overview.jpg` is the Blender scene.
