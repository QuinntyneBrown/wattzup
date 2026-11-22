// The riders' moving parts in one draw call (L2-166 AC12). merged-cyclist.ts joins the parts of a rider that never
// move against the bike; the legs, the cranks and the pedals do move, and were a draw call each, some ten a rider.
// Those of a plain colour are drawn here instead as one skinned mesh for every rider on the road: each part is a
// bone, every vertex of the part hangs on that bone alone, and each frame the bone is put where the part is. The
// part itself keeps its place in the scene, so the pedalling moves it as before; it is only no longer drawn.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  Bone,
  BufferAttribute,
  type BufferGeometry,
  Group,
  type Material,
  Matrix4,
  type Mesh,
  type MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
} from 'three/webgpu';
import type { Cyclist } from './world-cyclist';

/** A material that is one opaque colour and nothing else: its parts can be drawn by vertex colour instead. */
function plainColour(material: Material): boolean {
  const m = material as MeshStandardMaterial;
  return !!m.color && !m.map && !m.alphaMap && !m.transparent && !m.emissiveMap;
}

/** A part that is not drawn: its bone is shrunk to nothing. */
const GONE = new Matrix4().makeScale(0, 0, 0);

export class RiderBatch {
  /** Holds the skinned mesh, which is made again whenever a rider joins. */
  readonly group = new Group();
  private readonly parts: { part: Mesh; rider: Cyclist; geometry: BufferGeometry; bone: Bone }[] =
    [];
  private skinned: SkinnedMesh | null = null;

  /** `material` draws the mesh: one that takes its colour from the vertices. */
  constructor(private readonly material: Material) {}

  /**
   * Takes over a rider's plain-coloured parts but `keep` (the rider's merged still parts): call it once the still
   * parts are merged and before the rider's materials are changed.
   */
  add(rider: Cyclist, keep: ReadonlySet<BufferGeometry>): void {
    rider.group.traverse((child) => {
      const part = child as Mesh;
      if (!part.isMesh || !part.visible || keep.has(part.geometry)) return;
      const own = part.material as MeshStandardMaterial;
      if (Array.isArray(own) || !plainColour(own) || !part.geometry.getAttribute('normal')) return;
      // Position and normal only, the part's own colour on every vertex, and the part's bone.
      const geometry = part.geometry.toNonIndexed();
      for (const name of Object.keys(geometry.attributes)) {
        if (name !== 'position' && name !== 'normal') geometry.deleteAttribute(name);
      }
      const count = geometry.getAttribute('position').count;
      const colours = new Float32Array(count * 3);
      const bones = new Uint16Array(count * 4);
      const weights = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) {
        colours.set([own.color.r, own.color.g, own.color.b], i * 3);
        bones[i * 4] = this.parts.length;
        weights[i * 4] = 1;
      }
      geometry.setAttribute('color', new BufferAttribute(colours, 3));
      geometry.setAttribute('skinIndex', new BufferAttribute(bones, 4));
      geometry.setAttribute('skinWeight', new BufferAttribute(weights, 4));
      const bone = new Bone();
      bone.matrixAutoUpdate = false;
      bone.matrixWorldAutoUpdate = false;
      this.parts.push({ part, rider, geometry, bone });
      // The part itself is drawn no more; it still moves, and its bone follows it.
      part.layers.disableAll();
    });
    this.rebuild();
  }

  /** Puts each bone where its part is: call it once the riders are placed and posed for the frame. */
  follow(): void {
    let rider: Cyclist | null = null;
    for (const { part, rider: owner, bone } of this.parts) {
      if (!owner.group.visible) {
        bone.matrixWorld.copy(GONE);
        continue;
      }
      if (owner !== rider) {
        rider = owner;
        owner.group.updateMatrixWorld(true);
      }
      bone.matrixWorld.copy(part.matrixWorld);
    }
  }

  dispose(): void {
    this.skinned?.geometry.dispose();
    this.skinned?.skeleton.dispose();
    for (const { geometry } of this.parts) geometry.dispose();
    this.parts.length = 0;
  }

  /** One mesh of every part there is now, each on its own bone. */
  private rebuild(): void {
    if (this.skinned) {
      this.group.remove(this.skinned);
      this.skinned.geometry.dispose();
      this.skinned.skeleton.dispose();
      this.skinned = null;
    }
    if (this.parts.length === 0) return;
    const merged = mergeGeometries(
      this.parts.map(({ geometry }) => geometry),
      false,
    );
    if (!merged) return;
    const skinned = new SkinnedMesh(merged, this.material);
    // The bones are placed in the scene's own axes, each straight from its part: nothing is bound at rest.
    const still = this.parts.map(() => new Matrix4());
    skinned.bind(
      new Skeleton(
        this.parts.map(({ bone }) => bone),
        still,
      ),
      new Matrix4(),
    );
    skinned.frustumCulled = false;
    this.skinned = skinned;
    this.group.add(skinned);
  }
}
