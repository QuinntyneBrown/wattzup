import { mix, positionWorld, smoothstep, texture, vertexColor } from 'three/tsl';
import {
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshLambertNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
} from 'three/webgpu';

type Point = readonly [number, number];

/** Clip a crust plate against the perpendicular bisector of two salt crystal centres. */
function bisect(poly: Point[], centre: Point, other: Point): Point[] {
  const nx = other[0] - centre[0],
    ny = other[1] - centre[1];
  const middle = (nx * (other[0] + centre[0]) + ny * (other[1] + centre[1])) / 2;
  const result: Point[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!,
      b = poly[(i + 1) % poly.length]!;
    const da = nx * a[0] + ny * a[1] - middle,
      db = nx * b[0] + ny * b[1] - middle;
    if (da <= 0) result.push(a);
    if (da > 0 !== db > 0) {
      const t = da / (da - db);
      result.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return result;
}

/** An eight-metre tile of gypsum crust. Mipmaps suppress shimmer as the cells recede. */
export function atacamaSalt() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  let seed = 2073;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const cells: Point[] = Array.from({ length: 64 }, () => [
    0.12 + 0.76 * random(),
    0.12 + 0.76 * random(),
  ]);
  function centre(x: number, y: number): Point {
    const shift = cells[(((y % 8) + 8) % 8) * 8 + (((x % 8) + 8) % 8)]!;
    return [(x + shift[0]) * 64, (y + shift[1]) * 64];
  }
  ctx.fillStyle = '#cec6b7';
  ctx.fillRect(0, 0, 512, 512);
  for (let y = -1; y < 9; y++)
    for (let x = -1; x < 9; x++) {
      const c = centre(x, y);
      let poly: Point[] = [
        [c[0] - 130, c[1] - 130],
        [c[0] + 130, c[1] - 130],
        [c[0] + 130, c[1] + 130],
        [c[0] - 130, c[1] + 130],
      ];
      for (let j = -2; j <= 2; j++)
        for (let i = -2; i <= 2; i++) if (i || j) poly = bisect(poly, c, centre(x + i, y + j));
      if (!poly.length) continue;
      const grey = 219 + Math.floor(random() * 22);
      ctx.beginPath();
      poly.forEach(([u, v], i) => (i ? ctx.lineTo(u, v) : ctx.moveTo(u, v)));
      ctx.closePath();
      ctx.fillStyle = 'rgb(' + grey + ',' + (grey - 2) + ',' + (grey - 7) + ')';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#c6bba7';
      ctx.stroke();
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = '#f7f3e8';
      ctx.stroke();
    }
  for (let i = 0; i < 26000; i++) {
    const v = random();
    ctx.fillStyle = v < 0.25 ? 'rgba(110,93,69,.16)' : 'rgba(253,251,244,.27)';
    ctx.fillRect(random() * 512, random() * 512, random() * 3 + 0.5, random() * 1.6 + 0.5);
  }
  const crust = new CanvasTexture(canvas);
  crust.wrapS = crust.wrapT = RepeatWrapping;
  crust.anisotropy = 4;
  const material = new MeshLambertNodeMaterial({ flatShading: true });
  const base = vertexColor().rgb;
  const tile = texture(crust, positionWorld.xz.div(8)).rgb;
  const salt = smoothstep(0.48, 0.67, base.r).mul(smoothstep(0.38, 0.55, base.g));
  material.colorNode = base.mul(mix(1, tile.mul(1.15), salt));
  return { material, crust };
}

/** A distant refracted band of sky, seen in the dry air above the sunlit road. */
export class SalarMirage {
  private readonly geometry = new PlaneGeometry(1, 1);
  private readonly material = new MeshBasicMaterial({
    color: 0xc2d3de,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  readonly mesh = new Mesh(this.geometry, this.material);
  private readonly texture: CanvasTexture;

  constructor() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const pixels = ctx.createImageData(256, 32);
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 256; x++) {
        const edge = Math.sin((x * Math.PI) / 255) ** 2;
        const t = (y - 15 - 2 * Math.sin(x * 0.041)) * 0.27;
        const alpha = edge * Math.exp(-t * t) * (0.55 + 0.45 * Math.cos(y * 2.8 + x * 0.024));
        const i = 4 * (x + 256 * y);
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 255;
        pixels.data[i + 3] = Math.round(255 * alpha);
      }
    ctx.putImageData(pixels, 0, 0);
    this.texture = new CanvasTexture(canvas);
    this.material.map = this.texture;
    this.mesh.rotation.y = Math.PI / 2;
    this.mesh.scale.set(23, 2.1, 1);
  }

  update(x: number, y: number, time: number): void {
    this.mesh.position.set(
      x + 168,
      y + 0.98 + 0.13 * Math.sin(time * 2.4),
      0.6 * Math.sin(time * 0.83),
    );
    this.material.opacity = 0.38 + 0.1 * Math.sin(time * 1.47);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.texture.dispose();
    this.material.dispose();
    this.geometry.dispose();
  }
}
