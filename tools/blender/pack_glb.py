"""Packs a map's glb smaller: vertex colours as bytes rather than floats (a quarter of their size), and each mesh's
positions as 16-bit steps of its own box rather than floats (two thirds of their size, and they compress far better).

Blender's glTF exporter writes COLOR_0 and POSITION as 32-bit floats. The Ride app's loader reads normalised bytes
and, with KHR_mesh_quantization, normalised 16-bit positions just as well: each mesh's node is given the box's corner
as its translation and the box's size as its scale, which put the positions back. A step is a centimetre, or more for a
mesh more than 655 m across (1 km across is held to 1.5 cm).
build_course.py runs this over the glb it exports. Usage: python tools/blender/pack_glb.py <file.glb>
"""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

FLOAT, UBYTE, USHORT = 5126, 5121, 5123
WIDTH = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}
SIZE = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
# Meshes the app moves by setting their place (the confetti flutters): their nodes must keep their own.
MOVED = ("Confetti",)
# The smallest step a position is held to, in metres.
STEP = 0.01


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
    # A mesh whose positions can be stepped: one primitive, one node of its own with no place yet, positions no other
    # mesh shares.
    nodes_of: dict[int, list[dict]] = {}
    for node in doc.get("nodes", []):
        if "mesh" in node:
            nodes_of.setdefault(node["mesh"], []).append(node)
    shared: dict[int, int] = {}
    for mesh in doc["meshes"]:
        for prim in mesh["primitives"]:
            at = prim["attributes"].get("POSITION")
            if at is not None:
                shared[at] = shared.get(at, 0) + 1
    stepped: dict[int, dict] = {}
    for index, mesh in enumerate(doc["meshes"]):
        nodes = nodes_of.get(index, [])
        plain = all(not ({"translation", "rotation", "scale", "matrix"} & set(node)) for node in nodes)
        at = mesh["primitives"][0]["attributes"].get("POSITION")
        moved = mesh.get("name", "").startswith(MOVED)
        if len(mesh["primitives"]) == 1 and len(nodes) == 1 and plain and at is not None and shared[at] == 1 and not moved:
            stepped[at] = nodes[0]

    out = bytearray()
    views = []
    quantised = False
    for index, accessor in enumerate(doc["accessors"]):
        view = doc["bufferViews"][accessor["bufferView"]]
        width, count = WIDTH[accessor["type"]], accessor["count"]
        start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
        data = blob[start : start + count * width * SIZE[accessor["componentType"]]]
        stride = None
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
        elif index in stepped and accessor["componentType"] == FLOAT and count:
            values = struct.unpack(f"<{count * 3}f", data)
            low = [min(values[axis::3]) for axis in range(3)]
            # A step is a centimetre, or more where a mesh is more than 655 m across: whole centimetres repeat, and
            # what repeats compresses.
            size = [max(max(values[axis::3]) - low[axis], STEP * 65535) for axis in range(3)]
            # Eight bytes a vertex: three 16-bit steps and two bytes of nothing, so each vertex starts on a 4-byte edge.
            packed = bytearray()
            for i in range(count):
                x, y, z = (max(0, min(65535, round((values[i * 3 + a] - low[a]) / size[a] * 65535))) for a in range(3))
                packed += struct.pack("<HHHH", x, y, z, 0)
            data = bytes(packed)
            accessor.update({"componentType": USHORT, "normalized": True, "min": [0, 0, 0], "max": [65535, 65535, 65535]})
            stepped[index].update({"translation": low, "scale": size})
            stride = 8
            quantised = True
        while len(out) % 4:
            out += b"\x00"
        new_view = {"buffer": 0, "byteOffset": len(out), "byteLength": len(data)}
        if "target" in view:
            new_view["target"] = view["target"]
        if stride:
            new_view["byteStride"] = stride
        views.append(new_view)
        accessor["bufferView"] = len(views) - 1
        accessor.pop("byteOffset", None)
        out += data
    if quantised:
        for key in ("extensionsUsed", "extensionsRequired"):
            doc[key] = sorted({*doc.get(key, []), "KHR_mesh_quantization"})
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
