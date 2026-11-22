// The cyclist kit builds a rider from some fifty meshes, each a draw call. On a course every rider is on screen at
// once, so the parts that never move against the bike (the frame, the wheels, the torso, the head) are merged here
// into one mesh a material, and those of a plain colour into one mesh between them, coloured by vertex; the legs and
// cranks, which the pedalling moves, stay as they are (ADR 0032).
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  BufferAttribute,
  type BufferGeometry,
  type Material,
  type Matrix4,
  Mesh,
  type MeshStandardMaterial,
} from 'three/webgpu';
import type { Cyclist } from './world-cyclist';

/** Two pedal angles far enough apart that every part the pedalling moves has moved. */
const POSES = [0, 1.9] as const;

/** A material that is one opaque colour and nothing else: its parts can be drawn by vertex colour instead. */
function plainColour(material: Material): boolean {
  const m = material as MeshStandardMaterial;
  return !!m.color && !m.map && !m.alphaMap && !m.transparent && !m.emissiveMap;
}

/**
 * Merges the cyclist's still parts, and returns the geometries made, for their owner to dispose. Call it once the
 * cyclist wears their final materials. `plain` draws the parts of a plain colour: a material that takes its colour
 * from the vertices.
 */
export function mergeStillParts(cyclist: Cyclist, plain: Material): BufferGeometry[] {
  const group = cyclist.group;
  const meshes: Mesh[] = [];
  group.traverse((part) => {
    if ((part as Mesh).isMesh) meshes.push(part as Mesh);
  });
  // Where each part sits against the bike: the whole bike rocks with the pedals, so the world would not tell.
  const places = (angle: number): Matrix4[] => {
    cyclist.pose(angle);
    group.updateMatrixWorld(true);
    const toBike = group.matrixWorld.clone().invert();
    return meshes.map((mesh) => toBike.clone().multiply(mesh.matrixWorld));
  };
  const moved = places(POSES[1]);
  const rest = places(POSES[0]);
  const same = (a: Matrix4, b: Matrix4) =>
    a.elements.every((v, i) => Math.abs(v - b.elements[i]!) < 1e-6);
  const still = meshes.filter(
    (mesh, i) => mesh.visible && !Array.isArray(mesh.material) && same(rest[i]!, moved[i]!),
  );

  // Only parts that share a material and a vertex layout can share a mesh.
  const toGroup = group.matrixWorld.clone().invert();
  const alike = new Map<string, { material: Material; parts: Mesh[] }>();
  for (const mesh of still) {
    const own = mesh.material as Material;
    const coloured = plainColour(own);
    const material = coloured ? plain : own;
    const layout = Object.keys(mesh.geometry.attributes).sort().join(',');
    const key = coloured
      ? 'plain'
      : `${own.uuid}|${layout}|${mesh.geometry.index ? 'indexed' : 'plain'}|${mesh.renderOrder}`;
    const bucket = alike.get(key) ?? { material, parts: [] };
    bucket.parts.push(mesh);
    alike.set(key, bucket);
  }
  const made: BufferGeometry[] = [];
  for (const { material, parts } of alike.values()) {
    if (parts.length < 2) continue;
    const placed = parts.map((mesh) => {
      const at = toGroup.clone().multiply(mesh.matrixWorld);
      if (material !== plain) return mesh.geometry.clone().applyMatrix4(at);
      // Position and normal only, and the part's own colour on every vertex.
      const geometry = mesh.geometry.toNonIndexed().applyMatrix4(at);
      for (const name of Object.keys(geometry.attributes)) {
        if (name !== 'position' && name !== 'normal') geometry.deleteAttribute(name);
      }
      const { r, g, b } = (mesh.material as MeshStandardMaterial).color;
      const count = geometry.getAttribute('position').count;
      const colours = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) colours.set([r, g, b], i * 3);
      geometry.setAttribute('color', new BufferAttribute(colours, 3));
      return geometry;
    });
    const merged = mergeGeometries(placed, false);
    for (const geometry of placed) geometry.dispose();
    if (!merged) continue;
    const mesh = new Mesh(merged, material);
    mesh.castShadow = parts.some((part) => part.castShadow);
    mesh.renderOrder = parts[0]!.renderOrder;
    for (const part of parts) part.removeFromParent();
    group.add(mesh);
    made.push(merged);
  }
  return made;
}
