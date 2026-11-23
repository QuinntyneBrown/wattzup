# Courses: the frame budget

L2-166 AC12 sets a budget for low-power tablets: in the worst frame along a course no more than **120,000
triangles** and **140 draw calls**, and a map file of no more than **3 MB gzipped**.

The check runs the real `CourseRenderer` on each map's real glb in headless Chrome, at the tier a ride opens on,
at 16 places along the course, with a pack of six riders, and reads what the renderer sent the GPU. It is a budget,
not a frame rate: it was drawn in software with no GPU, and **nothing here has been timed on a real tablet**.

| Map | Worst frame: triangles | Draw calls | File, gzipped | Within the budget |
| --- | --- | --- | --- | --- |
| `ibiza` | 109,821 | 124 | 2.53 MB | Yes |
| `cinqueterre` | 101,086 | 73 | 1.78 MB | Yes |
| `haleakala` | 108,144 | 85 | 0.88 MB | Yes |
| `prairie` | 108,863 | 108 | 3.20 MB | No: file |
| `coast` | 74,722 | 108 | 5.11 MB | No: file |
| `docklands` | 83,737 | 117 | 3.37 MB | No: file |
| `dolomites` | 102,832 | 116 | 5.66 MB | No: file |
| `granite` | 130,148 | 113 | 3.18 MB | No: triangles, file |
| `oldtown` | 139,183 | 112 | 4.61 MB | No: triangles, file |
| `vicecity` | 89,430 | 116 | 4.87 MB | No: file |

Triangles and draw calls for `coast`, `docklands`, `dolomites` and `vicecity` were read with scenery drawn a little
further than it is now (solid to 320 m, not 250 m), so theirs are now somewhat lower than shown.

Before the maps were cut into chunks, every frame drew the whole map: 300,000 to 520,000 triangles for these maps.
`ibiza/README.md` logs the passes that brought Ibiza Sunset Strip within the budget.
