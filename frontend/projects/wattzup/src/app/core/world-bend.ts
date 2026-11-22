// The bend in the vertex stage (L2-110 AC9, ADR 0023): every material's vertices move from the
// straight road the street modules lay onto the bending one. It follows `bendPoint`
// (scene-bend.ts) line for line, against the samples `bendAhead` fills each frame.
import {
  abs,
  buffer,
  clamp,
  cos,
  exp,
  float,
  floor,
  Fn,
  max,
  min,
  modelNormalMatrix,
  modelWorldMatrix,
  modelWorldMatrixInverse,
  nodeObject,
  normalLocal,
  positionLocal,
  positionPrevious,
  select,
  sign,
  sin,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import { type Material, type Mesh, type Node, type Object3D, type Sprite } from 'three/webgpu';
import {
  BEND_FROM,
  BEND_SAMPLES,
  BEND_STEP,
  EASE_FROM,
  EASE_TO,
  MIN_CURVATURE,
} from './scene-bend';

type BentMaterial = Material & { positionNode?: unknown };
/** `nodeObject(buffer(...))` registers `.element()` via `addMethodChaining`, omitted from `@types/three`. */
interface Vec4Buffer {
  element(index: Node): Node<'vec4'>;
}

/** One `positionNode` for meshes and one for sprites, fed by the same 128 samples. */
export class RoadBend {
  readonly sampleData = new Float32Array(BEND_SAMPLES * 4);
  /** Per-sample `[height, nextHeight - height, 0, 0]`, read with a single vec4 fetch per vertex. */
  readonly heightData = new Float32Array(BEND_SAMPLES * 4);
  private readonly samples = nodeObject(
    buffer(this.sampleData, 'vec4', BEND_SAMPLES),
  ) as unknown as Vec4Buffer;
  private readonly heights = nodeObject(
    buffer(this.heightData, 'vec4', BEND_SAMPLES),
  ) as unknown as Vec4Buffer;
  private readonly bent = new WeakSet<Material>();
  private readonly onMesh: unknown;
  private readonly onSprite: unknown;

  constructor() {
    const samples = this.samples;
    const heights = this.heights;
    const bendAt = (p: Node<'vec3'>) => {
      const m = p.z.negate().toVar();
      const f = clamp(m.sub(BEND_FROM).div(BEND_STEP), 0, BEND_SAMPLES - 1).toVar();
      const i = min(floor(f), BEND_SAMPLES - 2).toVar();
      const idx = i.toInt().toVar();
      const t = f.sub(i).toVar();
      const a = samples.element(idx);
      const b = samples.element(idx.add(1));
      const at = a.add(b.sub(a).mul(t)).toVar();
      const phi = at.z;
      const c = cos(phi).toVar();
      const s = sin(phi).toVar();
      const k = at.w;
      const dm = m.sub(f.mul(BEND_STEP).add(BEND_FROM));
      const normal = vec2(c, s);
      const ahead = vec2(s, c.negate());
      // On the inside of a bend, ease towards its centre, so nothing folds back over the road.
      const x = p.x;
      const ak = max(abs(k), MIN_CURVATURE);
      const inside = x.mul(sign(k));
      const from = float(EASE_FROM).div(ak);
      const room = float(EASE_TO - EASE_FROM).div(ak);
      const decay = exp(inside.sub(from).div(room).negate()).toVar();
      const eased = sign(k).mul(from.add(room.mul(float(1).sub(decay))));
      const easing = abs(k).greaterThan(MIN_CURVATURE).and(inside.greaterThan(from));
      const across = select(easing, eased, x);
      const xz = at.xy.add(normal.mul(across)).add(ahead.mul(dm));
      // The relief is squeezed down as much as the ground is squeezed across (`squeeze`), so a
      // fellside on the inside of a hairpin keeps its slope instead of standing up as a wall.
      const kept = select(easing, decay, float(1));
      const h = heights.element(idx);
      const road = h.x.add(h.y.mul(t));
      return { bent: vec3(xz.x, road.add(p.y.sub(road).mul(kept)), xz.y), c, s };
    };
    // The velocity of motion blur and TRAA reads the previous position from the geometry: it gets
    // the bent one too, or every bent vertex would seem to fly by.
    this.onMesh = Fn(() => {
      const toWorld = modelWorldMatrix.mul(vec4(positionLocal, 1)).xyz.toVar();
      const { bent, c, s } = bendAt(toWorld);
      const local = modelWorldMatrixInverse.mul(vec4(bent, 1)).xyz.toVar();
      positionPrevious.assign(local);
      // The surface turns with the road, so a façade on a bend is lit as it faces, not as it
      // would face on the straight road: the world normal turns by the heading, about the up axis,
      // and goes back to local space through the transpose of the model matrix.
      const n = modelNormalMatrix.mul(normalLocal).toVar();
      const turned = vec3(n.x.mul(c).sub(n.z.mul(s)), n.y, n.x.mul(s).add(n.z.mul(c)));
      normalLocal.assign(vec4(turned, 0).mul(modelWorldMatrix).xyz);
      return local;
    })();
    // A sprite's position node is its centre in local space.
    this.onSprite = Fn(() => {
      const centre = modelWorldMatrix.mul(vec4(0, 0, 0, 1)).xyz.toVar();
      return modelWorldMatrixInverse.mul(vec4(bendAt(centre).bent, 1)).xyz;
    })();
  }

  /** Loads the samples of `bendAhead` for this frame, and the road's height `metres` ahead. */
  update(samples: Float32Array, heightAt: (metres: number) => number): void {
    this.sampleData.set(samples);
    const hd = this.heightData;
    let h0 = Math.fround(heightAt(BEND_FROM));
    for (let i = 0; i < BEND_SAMPLES - 1; i++) {
      const h1 = Math.fround(heightAt(BEND_FROM + (i + 1) * BEND_STEP));
      const base = i * 4;
      hd[base] = h0;
      hd[base + 1] = h1 - h0;
      h0 = h1;
    }
    const last = (BEND_SAMPLES - 1) * 4;
    hd[last] = h0;
    hd[last + 1] = 0;
  }

  /** Bends every mesh and sprite under `root`, except those in `keep`. */
  apply(root: Object3D, keep: ReadonlySet<Object3D> = new Set()): void {
    root.traverse((object) => {
      if (keep.has(object)) return;
      const mesh = object as Mesh;
      const sprite = object as Sprite;
      if (!mesh.isMesh && !sprite.isSprite) return;
      object.frustumCulled = false;
      const materials = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as
        BentMaterial[] | undefined;
      for (const material of materials ?? []) {
        if (!material || this.bent.has(material)) continue;
        this.bent.add(material);
        material.positionNode = sprite.isSprite ? this.onSprite : this.onMesh;
        material.needsUpdate = true;
      }
    });
  }
}
