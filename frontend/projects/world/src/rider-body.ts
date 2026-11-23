// The rider's body (ADR 0036, L2-166 AC26): `public/riders/rider.glb`, built in Blender by tools/blender/rider.py.
// One connected, watertight mesh (trunk, neck, head, arms, hands and legs) at two finenesses, skinned to an armature
// of 19 bones, with one clip that holds a turn of the cranks seated and then a turn out of the saddle, baked from
// inverse kinematics in Blender: nothing of the kind is worked out here. Each rider is given a skeleton and a copy
// of the mesh of their own, which course-cyclist.ts paints in their colours and plays from the crank's angle.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import {
  type AnimationClip,
  AnimationUtils,
  type Bone,
  type BufferGeometry,
  type Material,
  type Object3D,
  type SkinnedMesh,
} from 'three/webgpu';

/** Where the app serves the rider's file. */
export const RIDER_BODY_PATH = 'riders/rider.glb';

/** The file's frames a second, and how many of them one turn of the cranks is (tools/blender/rider.py). */
const FPS = 30;
const TURN_FRAMES = 30;
/** How long one baked turn of the cranks lasts, in the clips' seconds. */
export const TURN_SECONDS = TURN_FRAMES / FPS;

/** One rider's body: their own bones, and their own copy of the mesh in its two materials' parts. */
export interface RiderBodyParts {
  /** The armature and the mesh on it, in the rider's own axes: metres, the bike pointing along -z. */
  readonly root: Object3D;
  /** What the kit's texture is drawn on: the trunk and the sleeves. */
  readonly kit: SkinnedMesh;
  /** The rest, each part marked in its vertices' colour (rider-turn.ts): skin, shorts, socks, gloves, hair. */
  readonly plain: SkinnedMesh;
  /** The bone the head and what is worn on it turn with. */
  readonly head: Bone;
  /** The geometries and skeletons that are this rider's own, to dispose with them. */
  readonly owned: readonly { dispose(): void }[];
}

export class RiderBody {
  /** A turn of the cranks in the saddle, and one out of it: both `TURN_SECONDS` long. */
  readonly seated: AnimationClip;
  readonly standing: AnimationClip;

  private constructor(
    private readonly scene: Object3D,
    clip: AnimationClip,
  ) {
    // The file's one clip is the seated turn and then the standing one, each from the crank at the top round to
    // the top again.
    this.seated = AnimationUtils.subclip(clip, 'seated', 0, TURN_FRAMES + 1, FPS);
    this.standing = AnimationUtils.subclip(
      clip,
      'standing',
      TURN_FRAMES + 1,
      2 * TURN_FRAMES + 2,
      FPS,
    );
  }

  /** Loads the rider's file from `url`; it rejects where the file is missing or is not the rider's. */
  static async load(url: string = RIDER_BODY_PATH): Promise<RiderBody> {
    const gltf = await new GLTFLoader().loadAsync(url);
    const clip = gltf.animations[0];
    if (!clip || !gltf.scene.getObjectByName('body') || !gltf.scene.getObjectByName('body-fine')) {
      throw new Error("The rider's file holds no rider.");
    }
    return new RiderBody(gltf.scene, clip);
  }

  /** A body for one rider, the finer of the two where `fine`. */
  make(fine: boolean): RiderBodyParts {
    const root = clone(this.scene);
    // The file holds both finenesses on the one armature: this rider keeps one.
    root.getObjectByName(fine ? 'body' : 'body-fine')?.removeFromParent();
    let kit: SkinnedMesh | null = null;
    let plain: SkinnedMesh | null = null;
    const owned: { dispose(): void }[] = [];
    root.traverse((child) => {
      const mesh = child as SkinnedMesh;
      if (!mesh.isSkinnedMesh) return;
      // The rider's own copy: their colours are painted in its vertices.
      mesh.geometry = mesh.geometry.clone();
      // It is wherever its bones are, which is not where it was made.
      mesh.frustumCulled = false;
      owned.push(mesh.geometry, mesh.skeleton);
      if ((mesh.material as Material).name === 'kit') kit = mesh;
      else plain = mesh;
    });
    const head = root.getObjectByName('head') as Bone | undefined;
    if (!kit || !plain || !head) throw new Error("The rider's file holds no rider.");
    return { root, kit, plain, head, owned };
  }

  dispose(): void {
    this.scene.traverse((child) => {
      const mesh = child as SkinnedMesh;
      if (!mesh.isSkinnedMesh) return;
      mesh.geometry.dispose();
      mesh.skeleton.dispose();
      (mesh.material as Material).dispose();
    });
  }
}

/** The triangles of a geometry as one point each, at its middle: indexed or not. */
export function triangleMiddles(geometry: BufferGeometry): Float32Array {
  const position = geometry.getAttribute('position');
  const index = geometry.getIndex();
  const count = (index ? index.count : position.count) / 3;
  const middles = new Float32Array(count * 3);
  for (let t = 0; t < count; t++) {
    for (let corner = 0; corner < 3; corner++) {
      const v = index ? index.getX(t * 3 + corner) : t * 3 + corner;
      middles[t * 3] = middles[t * 3]! + position.getX(v) / 3;
      middles[t * 3 + 1] = middles[t * 3 + 1]! + position.getY(v) / 3;
      middles[t * 3 + 2] = middles[t * 3 + 2]! + position.getZ(v) / 3;
    }
  }
  return middles;
}
