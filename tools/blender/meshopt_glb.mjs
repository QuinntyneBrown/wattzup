#!/usr/bin/env node
// Compresses a map's glb with the meshopt codec (EXT_meshopt_compression), which Three.js's loader reads with the
// small decoder it ships. Nothing about the map changes: every mesh, name, attribute and number is kept as
// pack_glb.py left it. Each mesh's vertices and triangles are put in an order the codec packs well, and each
// buffer is then written with the codec in place of raw bytes: about a third of the size once gzipped.
//
//   node tools/blender/meshopt_glb.mjs <file.glb>
//
// build_course.py runs it after pack_glb.py. (gltfpack does the same and more, but drops attributes no texture
// uses and triangles with no area: the maps' materials read both.)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const { MeshoptEncoder } = await import(
  pathToFileURL(path.join(here, '..', '..', 'frontend', 'node_modules', 'meshoptimizer', 'meshopt_encoder.js')).href
);
await MeshoptEncoder.ready;

const EXT = 'EXT_meshopt_compression';
const WIDTH = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const SIZE = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };

const file = process.argv[2];
if (!file) {
  console.error('usage: node tools/blender/meshopt_glb.mjs <file.glb>');
  process.exit(2);
}
const raw = fs.readFileSync(file);
if (raw.toString('latin1', 0, 4) !== 'glTF') throw new Error(`${file} is not a glTF binary.`);
const jsonLength = raw.readUInt32LE(12);
const doc = JSON.parse(raw.toString('utf8', 20, 20 + jsonLength));
if (doc.extensionsUsed?.includes(EXT)) {
  console.log(`${file}: already compressed`);
  process.exit(0);
}
const bin = raw.subarray(20 + jsonLength + 8, 20 + jsonLength + 8 + raw.readUInt32LE(20 + jsonLength));

/** An accessor's bytes, a copy, and how many bytes one element of it takes in its buffer view. */
const stride = (accessor) =>
  doc.bufferViews[accessor.bufferView].byteStride ?? WIDTH[accessor.type] * SIZE[accessor.componentType];
const bytes = doc.accessors.map((accessor) => {
  const view = doc.bufferViews[accessor.bufferView];
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return Uint8Array.from(bin.subarray(start, start + accessor.count * stride(accessor)));
});

// Each mesh's triangles in an order that reuses recent vertices, and its vertices in the order they are first used.
const indexed = new Set();
for (const mesh of doc.meshes) {
  for (const primitive of mesh.primitives) {
    if (primitive.indices === undefined || (primitive.mode ?? 4) !== 4) continue;
    const at = primitive.indices;
    const accessor = doc.accessors[at];
    const wide = SIZE[accessor.componentType];
    const from = new DataView(bytes[at].buffer);
    const indices = new Uint32Array(accessor.count);
    for (let i = 0; i < accessor.count; i++) {
      indices[i] = wide === 4 ? from.getUint32(i * 4, true) : wide === 2 ? from.getUint16(i * 2, true) : from.getUint8(i);
    }
    const [remap, unique] = MeshoptEncoder.reorderMesh(indices, true, false);
    const attributes = Object.values(primitive.attributes);
    const count = doc.accessors[attributes[0]].count;
    // A vertex no triangle uses is kept, after the rest.
    let next = unique;
    for (let i = 0; i < count; i++) if (remap[i] === 0xffffffff) remap[i] = next++;
    for (const attribute of attributes) {
      const each = stride(doc.accessors[attribute]);
      const moved = new Uint8Array(bytes[attribute].length);
      for (let i = 0; i < count; i++) {
        moved.set(bytes[attribute].subarray(i * each, (i + 1) * each), remap[i] * each);
      }
      bytes[attribute] = moved;
    }
    const to = new DataView(bytes[at].buffer);
    for (let i = 0; i < accessor.count; i++) {
      if (wide === 4) to.setUint32(i * 4, indices[i], true);
      else if (wide === 2) to.setUint16(i * 2, indices[i], true);
      else to.setUint8(i, indices[i]);
    }
    indexed.add(at);
  }
}

// One buffer view an accessor, written with the codec where the codec can take it (an element of 4 bytes or a
// multiple of them for vertices; 2 or 4 for triangles), raw otherwise.
const chunks = [];
let length = 0;
let spare = 0;
const views = doc.accessors.map((accessor, at) => {
  const each = stride(accessor);
  const old = doc.bufferViews[accessor.bufferView];
  const triangles = indexed.has(at) && (each === 2 || each === 4) && accessor.count % 3 === 0;
  const vertices = !indexed.has(at) && old.target !== 34963 && each % 4 === 0 && each <= 256;
  const data = triangles
    ? MeshoptEncoder.encodeGltfBuffer(bytes[at], accessor.count, each, 'TRIANGLES', 0)
    : vertices
      ? MeshoptEncoder.encodeGltfBuffer(bytes[at], accessor.count, each, 'ATTRIBUTES', 0)
      : bytes[at];
  const offset = length;
  chunks.push(data);
  length += data.length;
  const pad = (4 - (length % 4)) % 4;
  if (pad) chunks.push(new Uint8Array(pad));
  length += pad;
  accessor.bufferView = at;
  delete accessor.byteOffset;
  const view = { buffer: 0, byteOffset: offset, byteLength: data.length };
  if (old.target !== undefined) view.target = old.target;
  if (old.byteStride !== undefined) view.byteStride = old.byteStride;
  if (!triangles && !vertices) return view;
  // The view names where its bytes would be if they were not compressed: a second buffer that is never written.
  const plain = { ...view, buffer: 1, byteOffset: spare, byteLength: bytes[at].length };
  spare += bytes[at].length + ((4 - (bytes[at].length % 4)) % 4);
  plain.extensions = {
    [EXT]: {
      buffer: 0,
      byteOffset: offset,
      byteLength: data.length,
      byteStride: each,
      count: accessor.count,
      mode: triangles ? 'TRIANGLES' : 'ATTRIBUTES',
    },
  };
  return plain;
});
doc.bufferViews = views;
doc.buffers = [{ byteLength: length }, { byteLength: spare, extensions: { [EXT]: { fallback: true } } }];
for (const key of ['extensionsUsed', 'extensionsRequired']) {
  doc[key] = [...new Set([...(doc[key] ?? []), EXT])].sort();
}

let text = Buffer.from(JSON.stringify(doc), 'utf8');
if (text.length % 4) text = Buffer.concat([text, Buffer.alloc(4 - (text.length % 4), 0x20)]);
const body = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength)));
const header = Buffer.alloc(12);
header.write('glTF', 0, 'latin1');
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + text.length + 8 + body.length, 8);
const jsonHead = Buffer.alloc(8);
jsonHead.writeUInt32LE(text.length, 0);
jsonHead.write('JSON', 4, 'latin1');
const binHead = Buffer.alloc(8);
binHead.writeUInt32LE(body.length, 0);
binHead.write('BIN\0', 4, 'latin1');
fs.writeFileSync(file, Buffer.concat([header, jsonHead, text, binHead, body]));
console.log(`${file}: ${(raw.length / 1e6).toFixed(2)} MB -> ${((28 + text.length + body.length) / 1e6).toFixed(2)} MB`);
