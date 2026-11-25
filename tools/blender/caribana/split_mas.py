"""Split the dancer cutouts from each tablet art block, preserving the atlas and vertex data.

Run with the original baked GLB as input and the shipping GLB as output.
The four masqueraders occupy the middle row of the atlas. Trees and spectators stay fixed.
"""
import argparse
import json
import struct
from pathlib import Path


def split(source, destination):
    original = source.read_bytes()
    json_size = struct.unpack_from("<I", original, 12)[0]
    doc = json.loads(original[20:20 + json_size])
    binary = bytearray(original[28 + json_size:])
    if any(node.get("name", "").startswith("Mas_") for node in doc["nodes"]):
        raise ValueError("Expected the original unsplit Caribana tablet GLB")

    def accessor_values(index, fmt):
        accessor = doc["accessors"][index]
        view = doc["bufferViews"][accessor["bufferView"]]
        start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
        stride = view.get("byteStride", struct.calcsize(fmt))
        return [struct.unpack_from(fmt, binary, start + i * stride) for i in range(accessor["count"])]

    def add_indices(values):
        binary.extend(bytes(-len(binary) % 4))
        start = len(binary)
        binary.extend(struct.pack(f"<{len(values)}H", *values))
        view = len(doc["bufferViews"])
        doc["bufferViews"].append(dict(buffer=0, byteOffset=start, byteLength=2 * len(values), target=34963))
        doc["accessors"].append(dict(bufferView=view, componentType=5123, count=len(values),
                                     type="SCALAR", min=[min(values)], max=[max(values)]))
        return len(doc["accessors"]) - 1

    for node in list(doc["nodes"]):
        if not node["name"].startswith("Art_"):
            continue
        primitive, = doc["meshes"][node["mesh"]]["primitives"]
        uv = accessor_values(primitive["attributes"]["TEXCOORD_0"], "<ff")
        assert doc["accessors"][primitive["indices"]]["componentType"] == 5123
        indices = [i for i, in accessor_values(primitive["indices"], "<H")]
        fixed, dancers = [], []
        for i in range(0, len(indices), 3):
            triangle = indices[i:i + 3]
            centre_v = sum(uv[index][1] for index in triangle) / 3
            (dancers if 0.49 < centre_v < 0.81 else fixed).extend(triangle)
        assert dancers and fixed
        primitive["indices"] = add_indices(fixed)
        name = node["name"].replace("Art_", "Mas_")
        doc["meshes"].append(dict(name=name, primitives=[dict(primitive, indices=add_indices(dancers))]))
        doc["scenes"][doc.get("scene", 0)]["nodes"].append(len(doc["nodes"]))
        doc["nodes"].append(dict(node, name=name, mesh=len(doc["meshes"]) - 1))

    binary.extend(bytes(-len(binary) % 4))
    doc["buffers"][0]["byteLength"] = len(binary)
    metadata = json.dumps(doc, separators=(",", ":")).encode()
    metadata += b" " * (-len(metadata) % 4)
    header = struct.pack("<4sIIII", b"glTF", 2, 28 + len(metadata) + len(binary), len(metadata), 0x4E4F534A)
    destination.write_bytes(header + metadata + struct.pack("<I4s", len(binary), b"BIN\0") + binary)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    split(args.source, args.destination)
