import { positionWorld, texture, vec2, vertexColor } from 'three/tsl';
import {
  TextureLoader,
  SRGBColorSpace,
  MeshBasicMaterial,
  CanvasTexture,
  DoubleSide,
  MeshLambertNodeMaterial,
  RepeatWrapping,
} from 'three/webgpu';
import { seeded } from './world-kit';

/** A shared tile per surface. The road and dunes keep their baked shadows and mineral colour. */
export function gizaSurfaces() {
  const owned: { dispose(): void }[] = [];
  const rng = seeded(2126);
  function surface(kind: 'sand' | 'limestone' | 'asphalt', metres: number) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 512;
    const ctx = tile.getContext('2d')!,
      data = ctx.createImageData(512, 512);
    for (let y = 0; y < 512; y++)
      for (let x = 0; x < 512; x++) {
        const u = (x / 512) * Math.PI * 2,
          v = (y / 512) * Math.PI * 2;
        const grain = (rng() - 0.5) * (kind === 'asphalt' ? 96 : 45);
        const ripple =
          kind === 'sand' ? 25 * Math.sin(12 * v + 3 * Math.sin(u) + Math.cos(2 * u + v)) : 0;
        const bed = kind === 'limestone' ? 12 * Math.sin(7 * v + Math.cos(3 * u)) : 0;
        const shade = Math.round(211 + grain + ripple + bed + 7 * Math.sin(2 * u + v));
        const i = (y * 512 + x) * 4;
        data.data.set([shade, shade, shade, 255], i);
      }
    ctx.putImageData(data, 0, 0);
    for (let i = 0; i < (kind === 'sand' ? 1750 : 3600); i++) {
      const x = rng() * 512,
        y = rng() * 512,
        r = 0.27 + rng() ** 4 * (kind === 'sand' ? 3 : 1.8);
      ctx.fillStyle = 'rgba(73,64,52,' + (0.12 + rng() * 0.3) + ')';
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.45, r * 0.64, -0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,253,238,.52)';
      ctx.fillRect(x - r * 0.7, y - r * 0.56, r * 0.9, r * 0.44);
    }
    const map = new CanvasTexture(tile);
    map.wrapS = map.wrapT = RepeatWrapping;
    map.anisotropy = 4;
    const material = new MeshLambertNodeMaterial({ side: DoubleSide, flatShading: true });
    const coords = positionWorld.xz.add(positionWorld.y.mul(vec2(0.32, 0.64))).div(metres);
    material.colorNode = vertexColor().rgb.mul(texture(map, coords).r.mul(1.16));
    owned.push(map, material);
    return material;
  }
  const stone = surface('limestone', 3.4);
  const carving = new TextureLoader().load('courses/giza-sphinx-relief.webp');
  carving.colorSpace = SRGBColorSpace;
  const relief = new MeshBasicMaterial({ map: carving, alphaTest: 0.44, side: DoubleSide });
  owned.push(relief, carving);
  return {
    materials: {
      Khafre: stone,
      Khufu: stone,
      Menkaure: stone,
      Sphinx: stone,
      Relief: relief,
      Dunes: surface('sand', 2.7),
      Tarmac: surface('asphalt', 1.9),
    },
    dispose() {
      for (const item of owned) item.dispose();
    },
  };
}
