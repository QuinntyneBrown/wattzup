// The drawn look's banded toon shading (L2-111 technique 51, criterion 11, ADR 0024). At `low`,
// every lit surface's physically based material is swapped for a toon twin that keeps its colour,
// maps, alpha and the road bend, shades diffuse light in the bands of toonShade(), and lights its
// rim in the colour of the scene's sky. Leaving `low` puts the originals back. One WebGPURenderer
// node material serves both backends.
import {
  clamp,
  color,
  float,
  materialAlphaTest,
  materialEmissive,
  mix,
  normalView,
  normalWorld,
  positionViewDirection,
  screenCoordinate,
  screenUV,
  texture,
  uniform,
} from 'three/tsl';
import {
  Color,
  DataTexture,
  LinearFilter,
  NearestFilter,
  RepeatWrapping,
  type Material,
  type Mesh,
  MeshToonNodeMaterial,
  type MeshStandardNodeMaterial,
  type Object3D,
  RedFormat,
} from 'three/webgpu';
import { BAYER_4, DITHER, RIM, SKY_AT, skyStops, toonRamp } from './drawn-look';

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
  /** The 4 × 4 ordered dither, tiled over the screen one threshold per pixel (technique 54). */
  private readonly bayer: DataTexture;
  /** Twins whose alpha cut-off is dithered. */
  private readonly ditheredTwins = new Set<MeshToonNodeMaterial>();
  /** Shared rim-light node (`(1 − N·V)³ × (1 − |N.y|) × strength × sky`), avoiding `pow` log2/exp2. */
  private readonly rimNode: ReturnType<typeof float>;
  /** Shared ordered-dither alphaTest node across all cut-out toon twins (technique 54). */
  private readonly ditherAlphaNode: MeshToonNodeMaterial['alphaTestNode'];

  constructor() {
    this.ramp = new DataTexture(toonRamp(RAMP_TEXELS), RAMP_TEXELS, 1, RedFormat);
    this.ramp.magFilter = this.ramp.minFilter = LinearFilter;
    this.ramp.needsUpdate = true;
    this.bayer = new DataTexture(
      Uint8Array.from(BAYER_4, (t) => Math.round(t * 255)),
      4,
      4,
      RedFormat,
    );
    this.bayer.magFilter = this.bayer.minFilter = NearestFilter;
    this.bayer.wrapS = this.bayer.wrapT = RepeatWrapping;
    this.bayer.generateMipmaps = false;
    this.bayer.needsUpdate = true;
    const facing = float(1).sub(normalView.dot(positionViewDirection).max(0)).toVar();
    const facingPow = RIM.power === 3 ? facing.mul(facing).mul(facing) : facing.pow(RIM.power);
    this.rimNode = facingPow
      .mul(float(1).sub(normalWorld.y.abs()))
      .mul(RIM.strength)
      .mul(this.sky) as unknown as ReturnType<typeof float>;
    const bayerSample = texture(this.bayer, screenCoordinate.xy.div(4)).r;
    this.ditherAlphaNode = clamp(
      materialAlphaTest.add(bayerSample.sub(0.5).mul(DITHER.spread)),
      0.02,
      0.98,
    );
  }

  /** How many of the twins now in the scene are cut by the dither (technique 54). */
  dithered(root: Object3D): number {
    const seen = new Set<Material>();
    root.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        if (this.ditheredTwins.has(m as MeshToonNodeMaterial)) seen.add(m);
      }
    });
    return seen.size;
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

  /**
   * Marks the toon twins under `root` as inked warmer: they write 1 to the scene pass's `ink`
   * target (technique 52). Only twins, which exist only at `low`, where the outline pass runs.
   */
  inkWarm(root: Object3D, ink: NonNullable<MeshToonNodeMaterial['mrtNode']>): void {
    root.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const twin = m as MeshToonNodeMaterial;
        if (!twin.isMeshToonNodeMaterial || twin.mrtNode === ink) continue;
        twin.mrtNode = ink;
        twin.needsUpdate = true;
      }
    });
  }

  dispose(): void {
    for (const twin of this.made) twin.dispose();
    this.ramp.dispose();
    this.bayer.dispose();
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
    twin.mrtNode = source.mrtNode ?? null;
    twin.gradientMap = this.ramp;
    // A cut-out (leaves, flags, crowds) is edged by the ordered dither, not a hard cut, since no
    // tier draws alpha-to-coverage at low. The pattern is fixed to the screen, so it holds still
    // while the camera does (technique 54).
    if (source.alphaTest > 0 && !source.alphaTestNode) {
      twin.alphaTestNode = this.ditherAlphaNode;
      this.ditheredTwins.add(twin);
    }
    // Typed as a bare Node by three, it is the vec3 glow `materialEmissive` would give.
    const glow = (source.emissiveNode ?? materialEmissive) as typeof materialEmissive;
    twin.emissiveNode = glow.add(this.rimNode);
    this.twins.set(source, twin);
    this.made.push(twin);
    return twin;
  }
}

/** A physically based surface: MeshStandard or MeshPhysical, node material or not. */
function isLit(m: Material): m is Lit {
  return (m as { isMeshStandardMaterial?: boolean }).isMeshStandardMaterial === true;
}

/**
 * The drawn look's flat sky (technique 53): the scene's sky in three stops down the screen, deeper
 * overhead and paler at the horizon, mirroring skyAt().
 */
export function flatSky(sky: number) {
  const stops = skyStops(sky);
  const y = screenUV.y;
  const overhead = mix(color(stops.zenith), color(stops.middle), clamp(y.div(SKY_AT.middle), 0, 1));
  return mix(
    overhead,
    color(stops.horizon),
    clamp(y.sub(SKY_AT.middle).div(SKY_AT.horizon - SKY_AT.middle), 0, 1),
  );
}
