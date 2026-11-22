"""Packs a map's glb smaller: vertex colours as bytes rather than floats (a quarter of their size).

Blender's glTF exporter writes COLOR_0 as 32-bit floats. The Ride app's loader reads normalised bytes just as well, so
build_course.py runs this over the glb it exports. Usage: python tools/blender/pack_glb.py <file.glb>
"""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

FLOAT, UBYTE = 5126, 5121
WIDTH = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}
SIZE = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}


def pack(path: Path) -> tuple[int, int]:
    raw = path.read_bytes()
    magic, version, _ = struct.unpack_from("<4sII", raw, 0)
    if magic != b"glTF" or version != 2:
        raise ValueError(f"{path} is not a glTF 2 binary.")
    json_len, _ = struct.unpack_from("<II", raw, 12)
    doc = json.loads(raw[20 : 20 + json_len])
    bin_at = 20 + json_len
    bin_len, _ = struct.unpack_from("<II", raw, bin_at)
    blob = raw[bin_at + 8 : bin_at + 8 + bin_len]

    colours = {p["attributes"]["COLOR_0"] for m in doc["meshes"] for p in m["primitives"] if "COLOR_0" in p["attributes"]}
    out = bytearray()
    views = []
    for index, accessor in enumerate(doc["accessors"]):
        view = doc["bufferViews"][accessor["bufferView"]]
        width, count = WIDTH[accessor["type"]], accessor["count"]
        start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
        data = blob[start : start + count * width * SIZE[accessor["componentType"]]]
        if index in colours and accessor["componentType"] == FLOAT:
            values = struct.unpack(f"<{count * width}f", data)
            packed = bytearray()
            for i in range(count):
                rgb = values[i * width : i * width + 3]
                packed += bytes(max(0, min(255, round(v * 255))) for v in rgb) + b"\xff"
            data = bytes(packed)
            accessor.update({"componentType": UBYTE, "normalized": True, "type": "VEC4"})
            accessor.pop("min", None)
            accessor.pop("max", None)
        while len(out) % 4:
            out += b"\x00"
        new_view = {"buffer": 0, "byteOffset": len(out), "byteLength": len(data)}
        if "target" in view:
            new_view["target"] = view["target"]
        views.append(new_view)
        accessor["bufferView"] = len(views) - 1
        accessor.pop("byteOffset", None)
        out += data
    while len(out) % 4:
        out += b"\x00"
    doc["bufferViews"] = views
    doc["buffers"] = [{"byteLength": len(out)}]
    text = json.dumps(doc, separators=(",", ":")).encode()
    text += b" " * (-len(text) % 4)
    total = 12 + 8 + len(text) + 8 + len(out)
    path.write_bytes(
        struct.pack("<4sII", b"glTF", 2, total) + struct.pack("<I4s", len(text), b"JSON") + text + struct.pack("<I4s", len(out), b"BIN\x00") + bytes(out)
    )
    return len(raw), total


if __name__ == "__main__":
    before, after = pack(Path(sys.argv[1]))
    print(f"{sys.argv[1]}: {before / 1e6:.2f} MB -> {after / 1e6:.2f} MB")
