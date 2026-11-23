// The riders' moving parts in one draw call (L2-166 AC12). A rider's kit (course-cyclist.ts) makes everything that
// never moves against the bike one mesh; the legs, the cranks and the pedals do move, and would be a draw call each.
// They are drawn here instead as one skinned mesh for every rider on the road. A rigid part (a shoe, a crank, a
// pedal) is a bone, and every vertex of it hangs on that bone alone; a leg, which is one skin on two bones of its own
// (rider-limb.ts), brings both and keeps its vertices' shares of them. Each frame every bone is put where the part
// or the leg's bone it stands for is. The part itself keeps its place in the scene, so the pedalling moves it as
// before; it is only no longer drawn.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  Bone,
  BufferAttribute,
  type BufferGeometry,
  Group,
  type Material,
  Matrix4,
  type Mesh,
  type Object3D,
  Skeleton,
  SkinnedMesh,
} from 'three/webgpu';
import type { RiderModel as Cyclist } from './course-cyclist';

/** A part that is not drawn: its bone is shrunk to nothing. */
const GONE = new Matrix4().makeScale(0, 0, 0);

export class RiderBatch {
  /** Holds the skinned mesh, which is made again whenever a rider joins. */
  readonly group = new Group();
  /** A bone for each rigid part and each bone of a leg: `source` is what it follows. */
  private readonly bones: { source: Object3D; rider: Cyclist; bone: Bone }[] = [];
  private readonly geometries: BufferGeometry[] = [];
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
      const geometry = part.geometry.clone();
      const first = this.bones.length;
      const skin = (part as SkinnedMesh).isSkinnedMesh ? (part as SkinnedMesh) : null;
      if (skin) {
        // A leg: its own bones, and its vertices' shares of them, counted from the first of them here.
        const index = geometry.getAttribute('skinIndex');
        for (let i = 0; i < index.array.length; i++) index.array[i]! += first;
      } else {
        // A rigid part: its one bone on every one of its vertices.
        const count = geometry.getAttribute('position').count;
        const index = new Uint16Array(count * 4);
        const weights = new Float32Array(count * 4);
        for (let i = 0; i < count; i++) {
          index[i * 4] = first;
          weights[i * 4] = 1;
        }
        geometry.setAttribute('skinIndex', new BufferAttribute(index, 4));
        geometry.setAttribute('skinWeight', new BufferAttribute(weights, 4));
      }
      for (const source of skin ? skin.skeleton.bones : [part]) {
        const bone = new Bone();
        bone.matrixAutoUpdate = false;
        bone.matrixWorldAutoUpdate = false;
        this.bones.push({ source, rider, bone });
      }
      this.geometries.push(geometry);
      // The part itself is drawn no more; it still moves, and its bone follows it.
      part.layers.disableAll();
    });
    this.rebuild();
  }

  /** Puts each bone where what it follows is: call it once the riders are placed and posed for the frame. */
  follow(): void {
    let rider: Cyclist | null = null;
    for (const { source, rider: owner, bone } of this.bones) {
      if (!owner.group.visible) {
        bone.matrixWorld.copy(GONE);
        continue;
      }
      if (owner !== rider) {
        rider = owner;
        owner.group.updateMatrixWorld(true);
      }
      bone.matrixWorld.copy(source.matrixWorld);
    }
  }

  dispose(): void {
    this.skinned?.geometry.dispose();
    this.skinned?.skeleton.dispose();
    for (const geometry of this.geometries) geometry.dispose();
    this.geometries.length = 0;
    this.bones.length = 0;
  }

  /** One mesh of every part there is now, each on its own bones. */
  private rebuild(): void {
    if (this.skinned) {
      this.group.remove(this.skinned);
      this.skinned.geometry.dispose();
      this.skinned.skeleton.dispose();
      this.skinned = null;
    }
    if (this.geometries.length === 0) return;
    const merged = mergeGeometries(this.geometries, false);
    if (!merged) return;
    const skinned = new SkinnedMesh(merged, this.material);
    // The bones are placed in the scene's own axes, each straight from what it follows: nothing is bound at rest.
    const still = this.bones.map(() => new Matrix4());
    skinned.bind(
      new Skeleton(
        this.bones.map(({ bone }) => bone),
        still,
      ),
      new Matrix4(),
    );
    skinned.frustumCulled = false;
    this.skinned = skinned;
    this.group.add(skinned);
  }
}
