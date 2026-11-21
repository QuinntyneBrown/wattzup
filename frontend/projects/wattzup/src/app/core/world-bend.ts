// The bend in the vertex stage (L2-110 AC9, ADR 0023): every material's vertices move from the
// straight road the street modules lay onto the bending one. It follows `bendPoint`
// (scene-bend.ts) line for line, against the samples `bendAhead` fills each frame.
import {
  abs,
  clamp,
  cos,
  exp,
  float,
  floor,
  Fn,
  max,
  min,
  modelWorldMatrix,
  modelNormalMatrix,
  modelWorldMatrixInverse,
  normalLocal,
  positionLocal,
  positionPrevious,
  select,
  sign,
  sin,
  uniformArray,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import {
  type Material,
  type Mesh,
  type Node,
  type Object3D,
  type Sprite,
  Vector4,
} from 'three/webgpu';
import {
  BEND_FROM,
  BEND_SAMPLES,
  BEND_STEP,
  EASE_FROM,
  EASE_TO,
  MIN_CURVATURE,
} from './scene-bend';

type BentMaterial = Material & { positionNode?: unknown };

/** One `positionNode` for meshes and one for sprites, fed by the same 128 samples. */
export class RoadBend {
  private readonly vectors = Array.from({ length: BEND_SAMPLES }, () => new Vector4());
  private readonly samples = uniformArray(this.vectors, 'vec4');
  /** The road's height at each sample, the ground the relief beside it stands on. */
  private readonly levels: number[] = Array.from({ length: BEND_SAMPLES }, () => 0);
  private readonly heights = uniformArray(this.levels, 'float');
  private readonly bent = new WeakSet<Material>();
  private readonly onMesh: unknown;
  private readonly onSprite: unknown;

  constructor() {
    const samples = this.samples;
    const heights = this.heights;
    // The heading of the road at a world point, in radians.
    const headingAt = (p: Node<'vec3'>) => {
      const f = clamp(p.z.negate().sub(BEND_FROM).div(BEND_STEP), 0, BEND_SAMPLES - 1);
      const i = min(floor(f), BEND_SAMPLES - 2);
      const a = samples.element(i.toInt()) as unknown as Node<'vec4'>;
      const b = samples.element(i.toInt().add(1)) as unknown as Node<'vec4'>;
      return a.z.add(b.z.sub(a.z).mul(f.sub(i)));
    };
    const bendWorld = (p: Node<'vec3'>) => {
      const m = p.z.negate();
      const f = clamp(m.sub(BEND_FROM).div(BEND_STEP), 0, BEND_SAMPLES - 1);
      const i = min(floor(f), BEND_SAMPLES - 2);
      const t = f.sub(i);
      const a = samples.element(i.toInt()) as unknown as Node<'vec4'>;
      const b = samples.element(i.toInt().add(1)) as unknown as Node<'vec4'>;
      const at = a.add(b.sub(a).mul(t));
      const phi = at.z;
      const k = at.w;
      const dm = m.sub(f.mul(BEND_STEP).add(BEND_FROM));
      const normal = vec2(cos(phi), sin(phi));
      const ahead = vec2(sin(phi), cos(phi).negate());
      // On the inside of a bend, ease towards its centre, so nothing folds back over the road.
      const x = p.x;
      const ak = max(abs(k), MIN_CURVATURE);
      const inside = x.mul(sign(k));
      const from = float(EASE_FROM).div(ak);
      const room = float(EASE_TO - EASE_FROM).div(ak);
      const eased = sign(k).mul(
        from.add(room.mul(float(1).sub(exp(inside.sub(from).div(room).negate())))),
      );
      const easing = abs(k).greaterThan(MIN_CURVATURE).and(inside.greaterThan(from));
      const across = select(easing, eased, x);
      const xz = at.xy.add(normal.mul(across)).add(ahead.mul(dm));
      // The relief is squeezed down as much as the ground is squeezed across (`squeeze`), so a
      // fellside on the inside of a hairpin keeps its slope instead of standing up as a wall.
      const kept = select(easing, exp(inside.sub(from).div(room).negate()), float(1));
      const ha = heights.element(i.toInt()) as unknown as Node<'float'>;
      const hb = heights.element(i.toInt().add(1)) as unknown as Node<'float'>;
      const road = ha.add(hb.sub(ha).mul(t));
      return vec3(xz.x, road.add(p.y.sub(road).mul(kept)), xz.y);
    };
    // The velocity of motion blur and TRAA reads the previous position from the geometry: it gets
    // the bent one too, or every bent vertex would seem to fly by.
    this.onMesh = Fn(() => {
      const toWorld = modelWorldMatrix.mul(vec4(positionLocal, 1)).xyz;
      const local = modelWorldMatrixInverse.mul(vec4(bendWorld(toWorld), 1)).xyz;
      positionPrevious.assign(local);
      // The surface turns with the road, so a façade on a bend is lit as it faces, not as it
      // would face on the straight road: the world normal turns by the heading, about the up axis,
      // and goes back to local space through the transpose of the model matrix.
      const phi = headingAt(toWorld);
      const n = modelNormalMatrix.mul(normalLocal);
      const turned = vec3(
        n.x.mul(cos(phi)).sub(n.z.mul(sin(phi))),
        n.y,
        n.x.mul(sin(phi)).add(n.z.mul(cos(phi))),
      );
      normalLocal.assign(vec4(turned, 0).mul(modelWorldMatrix).xyz);
      return local;
    })();
    // A sprite's position node is its centre in local space.
    const centre = modelWorldMatrix.mul(vec4(0, 0, 0, 1)).xyz;
    this.onSprite = modelWorldMatrixInverse.mul(vec4(bendWorld(centre), 1)).xyz;
  }

  /** Loads the samples of `bendAhead` for this frame, and the road's height `metres` ahead. */
  update(samples: Float32Array, heightAt: (metres: number) => number): void {
    for (let i = 0; i < BEND_SAMPLES; i++) {
      this.vectors[i]!.fromArray(samples, i * 4);
      this.levels[i] = heightAt(BEND_FROM + i * BEND_STEP);
    }
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
