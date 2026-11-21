// The drawn look's banded toon shading (L2-111 technique 51, criterion 11, ADR 0024). At `low`,
// every lit surface's physically based material is swapped for a toon twin that keeps its colour,
// maps, alpha and the road bend, shades diffuse light in the bands of toonShade(), and lights its
// rim in the colour of the scene's sky. Leaving `low` puts the originals back. One WebGPURenderer
// node material serves both backends.
import {
  float,
  materialEmissive,
  normalView,
  normalWorld,
  positionViewDirection,
  uniform,
} from 'three/tsl';
import {
  Color,
  DataTexture,
  LinearFilter,
  type Material,
  type Mesh,
  MeshToonNodeMaterial,
  type MeshStandardNodeMaterial,
  type Object3D,
  RedFormat,
} from 'three/webgpu';
import { RIM, toonRamp } from './drawn-look';

const RAMP_TEXELS = 64;

type Lit = MeshStandardNodeMaterial;
type Slot = Material | Material[];

export class ToonLook {
  /** The scene's sky colour, which tints every rim. */
  private readonly sky = uniform(new Color());
  private readonly ramp: DataTexture;
  /** One twin per original, so materials shared before are shared after. */
  private readonly twins = new WeakMap<Material, MeshToonNodeMaterial>();
  /** Each swapped mesh's own materials, to put back above `low`. */
  private readonly originals = new Map<Mesh, Slot>();
  private readonly made: MeshToonNodeMaterial[] = [];

  constructor() {
    this.ramp = new DataTexture(toonRamp(RAMP_TEXELS), RAMP_TEXELS, 1, RedFormat);
    this.ramp.magFilter = this.ramp.minFilter = LinearFilter;
    this.ramp.needsUpdate = true;
  }

  /**
   * Swaps every lit material under `root` for its toon twin when `on`, or puts the originals back
   * when not. Objects in `keep` (the sky, the photographed distance) are left alone.
   */
  apply(root: Object3D, on: boolean, sky: Color, keep: ReadonlySet<Object3D> = new Set()): void {
    this.sky.value.copy(sky);
    if (!on) {
      for (const [mesh, slot] of this.originals) mesh.material = slot;
      this.originals.clear();
      return;
    }
    root.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh || keep.has(object) || this.originals.has(mesh)) return;
      const slot = mesh.material as Slot;
      const list = Array.isArray(slot) ? slot : [slot];
      if (!list.some(isLit)) return;
      this.originals.set(mesh, slot);
      const swapped = list.map((m) => (isLit(m) ? this.twin(m) : m));
      mesh.material = Array.isArray(slot) ? swapped : swapped[0];
    });
  }

  dispose(): void {
    for (const twin of this.made) twin.dispose();
    this.ramp.dispose();
  }

  private twin(source: Lit): MeshToonNodeMaterial {
    let twin = this.twins.get(source);
    if (twin) return twin;
    twin = new MeshToonNodeMaterial();
    twin.name = source.name;
    twin.color.copy(source.color);
    twin.map = source.map;
    twin.alphaMap = source.alphaMap;
    twin.alphaTest = source.alphaTest;
    twin.alphaToCoverage = source.alphaToCoverage;
    twin.transparent = source.transparent;
    twin.opacity = source.opacity;
    twin.side = source.side;
    twin.vertexColors = source.vertexColors;
    twin.depthWrite = source.depthWrite;
    twin.depthTest = source.depthTest;
    twin.blending = source.blending;
    twin.polygonOffset = source.polygonOffset;
    twin.polygonOffsetFactor = source.polygonOffsetFactor;
    twin.polygonOffsetUnits = source.polygonOffsetUnits;
    twin.fog = source.fog;
    twin.normalMap = source.normalMap;
    twin.normalScale.copy(source.normalScale);
    twin.aoMap = source.aoMap;
    twin.aoMapIntensity = source.aoMapIntensity;
    twin.lightMap = source.lightMap;
    twin.lightMapIntensity = source.lightMapIntensity;
    twin.emissive.copy(source.emissive);
    twin.emissiveIntensity = source.emissiveIntensity;
    twin.emissiveMap = source.emissiveMap;
    // The source's own nodes, the road bend's positionNode among them.
    twin.colorNode = source.colorNode ?? null;
    twin.opacityNode = source.opacityNode ?? null;
    twin.alphaTestNode = source.alphaTestNode ?? null;
    twin.normalNode = source.normalNode ?? null;
    twin.positionNode = source.positionNode ?? null;
    twin.maskNode = source.maskNode ?? null;
    twin.gradientMap = this.ramp;
    // Rim light: (1 − N·V)^power × strength, in the sky's colour, added to the glow it had. It
    // fades on surfaces facing up, so the road and ground seen edge-on do not wash out.
    const rim = float(1)
      .sub(normalView.dot(positionViewDirection).max(0))
      .pow(RIM.power)
      .mul(float(1).sub(normalWorld.y.abs()))
      .mul(RIM.strength)
      .mul(this.sky);
    // Typed as a bare Node by three, it is the vec3 glow `materialEmissive` would give.
    const glow = (source.emissiveNode ?? materialEmissive) as typeof materialEmissive;
    twin.emissiveNode = glow.add(rim);
    this.twins.set(source, twin);
    this.made.push(twin);
    return twin;
  }
}

/** A physically based surface: MeshStandard or MeshPhysical, node material or not. */
function isLit(m: Material): m is Lit {
  return (m as { isMeshStandardMaterial?: boolean }).isMeshStandardMaterial === true;
}
