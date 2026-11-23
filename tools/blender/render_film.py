"""Builds a map and renders its 20-second film out of the way, in Blender's background mode (ADR 0035).

All at once, for any number of maps (the film is written to blender/<id>.mp4):

  blender --background --factory-startup --python tools/blender/render_film.py -- prairie oldtown

Or in steps, which holds one map in memory at a time and lets a long render be split:

  blender --background --factory-startup --python tools/blender/render_film.py -- --stage <dir> prairie
      builds the map (its glb, course and scene, as build_course.py does) and saves the film's scene as
      <dir>/prairie.blend, set to render PNG frames into <dir>/prairie/
  blender --background <dir>/prairie.blend --frame-start 1 --frame-end 300 --render-anim
  ffmpeg -framerate 30 -i <dir>/prairie/%04d.png -c:v libx264 -pix_fmt yuv420p -crf 20 blender/prairie.mp4
"""

import sys
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build_course  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else sys.argv[1:]
stage = None
if argv and argv[0] == "--stage":
    stage, argv = Path(argv[1]), argv[2:]
for name in argv:
    film = HERE.parents[1] / "blender" / f"{name}.mp4"
    course = str(HERE / "courses" / f"{name}.json")
    if stage is None:
        print(build_course.main([course, "--video", str(film), "--render"]))
        continue
    print(build_course.main([course, "--video", str(film)]))
    scene = bpy.context.scene
    settings = scene.render.image_settings
    if hasattr(settings, "media_type"):
        settings.media_type = "IMAGE"
    settings.file_format = "PNG"
    frames = stage / name
    frames.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(frames) + "/"
    bpy.ops.wm.save_as_mainfile(filepath=str(stage / f"{name}.blend"), compress=True, copy=True)
