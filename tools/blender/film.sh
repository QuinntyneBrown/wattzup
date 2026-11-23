#!/usr/bin/env bash
# Renders one map's 20-second film in steps (render_film.py --stage), one Blender at a time:
#   tools/blender/film.sh <scratch dir> <step: stage|a|b|encode> <map>
set -euo pipefail
BLENDER="${BLENDER:-/c/Program Files/Blender Foundation/Blender 5.3/blender.exe}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SP="$1"; STEP="$2"; MAP="$3"
case "$STEP" in
  stage) "$BLENDER" --background --factory-startup --python "$ROOT/tools/blender/render_film.py" -- --stage "$SP" "$MAP" 2>&1 | grep -E "^\{|Error|Traceback" | cut -c1-220 ;;
  a) "$BLENDER" --background "$SP/$MAP.blend" --frame-start 1 --frame-end 300 --render-anim 2>&1 | grep -E "Error|Traceback" || true; ls "$SP/$MAP" | wc -l ;;
  b) "$BLENDER" --background "$SP/$MAP.blend" --frame-start 301 --frame-end 600 --render-anim 2>&1 | grep -E "Error|Traceback" || true; ls "$SP/$MAP" | wc -l ;;
  encode) ffmpeg -y -loglevel error -framerate 30 -i "$SP/$MAP/%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart "$ROOT/blender/$MAP.mp4"
          ffprobe -v error -show_entries format=duration -of csv=p=0 "$ROOT/blender/$MAP.mp4"; rm -rf "$SP/$MAP" "$SP/$MAP.blend" ;;
esac
