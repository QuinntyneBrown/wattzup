// The riders' moving parts in one draw call (L2-166 AC12). A rider's kit (course-cyclist.ts) makes everything that
// never moves against the bike one mesh; the shoes, the cranks and the pedals do move, and would be a draw call each,
// six a rider. They are drawn here instead as one skinned mesh for every rider on the road: each part is a bone,
// every vertex of the part hangs on that bone alone, and each frame the bone is put where the part is. The part
// itself keeps its place in the scene, so the pedalling moves it as before; it is only no longer drawn. (The
// rider's body is a skinned mesh of its own, rider-body.ts, and is not part of this.)
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  Bone,
  BufferAttribute,
  type BufferGeometry,
  Group,
  type Material,
  Matrix4,
  type Mesh,
  Skeleton,
  SkinnedMesh,
} from 'three/webgpu';
import type { RiderModel as Cyclist } from './course-cyclist';

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
   * Takes over the parts of a rider that the pedalling moves (those the rider's kit marks `moving`): call it before
   * the rider's materials are changed. Each part's geometry carries its own colours.
   */
  add(rider: Cyclist): void {
    rider.group.traverse((child) => {
      const part = child as Mesh;
      if (!part.isMesh || part.userData['moving'] !== true) return;
      // The part's own vertices, and the part's bone on every one of them.
      const geometry = part.geometry.clone();
      const count = geometry.getAttribute('position').count;
      const bones = new Uint16Array(count * 4);
      const weights = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) {
        bones[i * 4] = this.parts.length;
        weights[i * 4] = 1;
      }
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
