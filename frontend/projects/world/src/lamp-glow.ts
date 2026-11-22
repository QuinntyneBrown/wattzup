// The lamps' light on whatever stands near the road (L2-166 AC14): the grid of lamp-light-map.ts as a texture, and
// the node a material adds to what it emits. A surface reads the grid by where it is in the world, so the same
// node lights a wall, a post, the land and a rider, and it fades with the surface's height above the road: a lamp
// lights what is beneath it.
import {
  diffuseColor,
  float,
  materialColor,
  mix,
  normalWorld,
  positionWorld,
  smoothstep,
  texture,
  vec2,
  vec3,
  vertexColor,
} from 'three/tsl';
import {
  Color,
  DataTexture,
  DoubleSide,
  LinearFilter,
  type Material,
  MeshLambertNodeMaterial,
  type MeshStandardMaterial,
  MeshStandardNodeMaterial,
  type Node,
  RGBAFormat,
  RGFormat,
  UnsignedByteType,
} from 'three/webgpu';
import { sheen, vertexFinish } from './rider-finish';

/** How bright the lamps' glow comes back off the edge of the glossiest surface. */
const SHEEN = 1.6;
import type { CourseLamps } from './course';
import {
  COLOUR_LIGHT_MAX,
  type ColourLightMap,
  LAMP_LIGHT_MAX,
  type LampLightMap,
} from './lamp-light-map';

/** Metres above the road where the lamps' light starts to fade, and where it is gone. */
const FADE_FROM = 1.5;
const FADE_TO = 9;
/** The share of a lamp's light that reaches a surface facing straight down, off the ground beneath it. */
const FROM_BELOW = 0.22;

/**
 * A rider's lit side: how many cells apart the light's slope is read, how fast the slope counts as all one way, and
 * how much more (or less) light the side facing a lamp takes.
 */
const SLOPE_CELLS = 1.5;
const SLOPE_GAIN = 9;
const SIDE_LIGHT = 0.45;

/** The lamps' light as materials read it. */
export class LampGlow {
  private readonly grid: DataTexture;
  private readonly colours: DataTexture | null = null;
  /**
   * The coloured lights' light on the ground at the surface being drawn (neon, a bridge's lit cables), where the
   * course has any: for the ground's own material, which works the lamps' light out itself.
   */
  readonly coloured: Node<'vec3'> | null = null;
  /** The lamps' light at the surface being drawn, in the lamps' colour: 1 is a lone lamp straight overhead. */
  readonly light: Node<'vec3'>;
  /** How much more or less of the lamps' light a surface takes for facing towards or away from the nearest lamp. */
  private readonly sided: Node<'float'>;

  constructor(map: LampLightMap, lamps: CourseLamps, colours: ColourLightMap | null = null) {
    const grid = new DataTexture(map.texels, map.width, map.height, RGFormat, UnsignedByteType);
    grid.magFilter = grid.minFilter = LinearFilter;
    grid.needsUpdate = true;
    this.grid = grid;
    const at = positionWorld.xz
      .sub(vec2(map.minX, map.minZ))
      .div(vec2(map.width * map.cell, map.height * map.cell));
    const cell = texture(grid, at);
    // Which way the light grows across the ground, from the grid's own slope: towards the nearest lamp. A surface
    // that faces that way is lit more and one that faces away less, so a rider has a lit side and a shaded one,
    // and they change over as each lamp is passed. Under a lamp the light is level and falls on both alike.
    const du = vec2(SLOPE_CELLS / map.width, 0);
    const dv = vec2(0, SLOPE_CELLS / map.height);
    const slope = vec2(
      texture(grid, at.add(du)).r.sub(texture(grid, at.sub(du)).r),
      texture(grid, at.add(dv)).r.sub(texture(grid, at.sub(dv)).r),
    ).mul(SLOPE_GAIN);
    const towards = slope.div(slope.length().max(1));
    this.sided = float(1).add(normalWorld.xz.dot(towards).mul(SIDE_LIGHT));
    const above = positionWorld.y.sub(cell.g.mul(map.spanY).add(map.minY));
    const tint = new Color(lamps.colour);
    let lit: Node<'vec3'> = vec3(tint.r, tint.g, tint.b).mul(
      cell.r.mul(cell.r).mul(LAMP_LIGHT_MAX),
    );
    if (colours) {
      // The coloured lights are a second grid, read the same way and added to the lamps'.
      const second = new DataTexture(
        colours.texels,
        colours.width,
        colours.height,
        RGBAFormat,
        UnsignedByteType,
      );
      second.magFilter = second.minFilter = LinearFilter;
      second.needsUpdate = true;
      this.colours = second;
      const texel = texture(
        second,
        positionWorld.xz
          .sub(vec2(colours.minX, colours.minZ))
          .div(vec2(colours.width * colours.cell, colours.height * colours.cell)),
      ).rgb;
      this.coloured = texel.mul(texel).mul(COLOUR_LIGHT_MAX);
      lit = lit.add(this.coloured);
    }
    this.light = lit
      .mul(float(1).sub(smoothstep(FADE_FROM, FADE_TO, above)))
      // A lamp is overhead: what faces up takes all of its light, a wall about two thirds, and what faces down
      // only what comes back off the ground. This is what gives a rider and a crate their shape under the lamps.
      .mul(mix(float(FROM_BELOW), float(1), normalWorld.y.mul(0.5).add(0.5).clamp(0, 1)));
  }

  /** A material for a group of the map, coloured by vertex and shaded flat, that the lamps light. */
  scenery(strength: number, doubleSided = false): Material {
    const material = new MeshLambertNodeMaterial({ vertexColors: true, flatShading: true });
    if (doubleSided) material.side = DoubleSide;
    material.emissiveNode = vertexColor().rgb.mul(this.light).mul(strength);
    return material;
  }

  /** A rider's material as the lamps light it: the same surface, with the lamps' light added. */
  rider(source: MeshStandardMaterial, strength: number): Material {
    const material = new MeshStandardNodeMaterial();
    material.color.copy(source.color);
    material.map = source.map;
    material.roughness = source.roughness ?? 1;
    material.metalness = source.metalness ?? 0;
    material.vertexColors = source.vertexColors;
    material.side = source.side;
    // A picture with holes (a wheel's spokes) keeps its holes.
    material.alphaTest = source.alphaTest;
    // The surface's colour as the material itself has worked it out: its colour, its vertices' and its map's, so
    // what is painted on a jersey is lit as painted and not washed over.
    const surface = diffuseColor.rgb;
    // What is coloured by vertex carries its finish there too (rider-finish.ts); cloth has the one it was made with.
    const gloss = source.vertexColors ? vertexFinish(material) : float(1 - material.roughness);
    // The lamps' glow is all around, so a glossy surface throws it back along its edges, in the lamps' own colour.
    material.emissiveNode = surface
      .mul(this.light)
      .mul(this.sided)
      .mul(strength)
      .add(this.light.mul(sheen(gloss)).mul(SHEEN));
    return material;
  }

  dispose(): void {
    this.grid.dispose();
    this.colours?.dispose();
  }
}
