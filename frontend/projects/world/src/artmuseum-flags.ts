import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
} from 'three/webgpu';

/** Eight national flags share one atlas and one draw call on the Parkway. */
function nationalFlags(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1024;
  const paint = canvas.getContext('2d')!;
  const white = '#f4eedf',
    red = '#ad3840',
    blue = '#334f83';
  const fill = (colour: string, x: number, y: number, width: number, height: number) => {
    paint.fillStyle = colour;
    paint.fillRect(x, y, width, height);
  };
  const bands = [
    [blue, white, red],
    ['#418057', white, red],
    ['#393b41', '#b44741', '#dbab43'],
    ['#4779a3', '#dbb851'],
    [white, red],
    ['#bb403c', white, '#304d81'],
    ['#40886c', white, '#d28c44'],
  ];
  for (let i = 0; i < 8; i++) {
    paint.save();
    paint.translate(0, 128 * i);
    if (i === 7) {
      fill(white, 0, 0, 256, 128);
      for (let j = 0; j < 13; j += 2) fill(red, 0, (j * 128) / 13, 256, 128 / 13);
      fill(blue, 0, 0, 100, 69);
      for (let row = 0; row < 9; row++)
        for (let col = 0; col < (row % 2 ? 5 : 6); col++)
          fill(white, 6 + col * 16 + (row % 2) * 8, 4 + row * 7, 3, 3);
    } else if (i === 3) {
      fill(bands[i][0], 0, 0, 256, 128);
      fill(bands[i][1], 72, 0, 24, 128);
      fill(bands[i][1], 0, 52, 256, 24);
    } else if (i === 4) {
      fill(white, 0, 0, 256, 128);
      paint.fillStyle = red;
      paint.beginPath();
      paint.arc(128, 64, 37, 0, 2 * Math.PI);
      paint.fill();
    } else {
      bands[i].forEach((colour, j) => {
        if (i === 2 || i === 5) fill(colour, 0, (128 * j) / 3, 256, 43);
        else fill(colour, (256 * j) / 3, 0, 86, 128);
      });
    }
    paint.restore();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

const SLOTS = 22;
const COLUMNS = 5;
const STRIP = 2 * (COLUMNS + 1);

export class ArtMuseumFlags {
  private readonly geometry = new BufferGeometry();
  private readonly texture = nationalFlags();
  private readonly material = new MeshBasicMaterial({ map: this.texture, side: DoubleSide });
  readonly mesh = new Mesh(this.geometry, this.material);
  private readonly position = new Float32BufferAttribute(
    new Float32Array(SLOTS * STRIP * 3),
    3,
  ).setUsage(DynamicDrawUsage);
  private readonly uv = new Float32BufferAttribute(new Float32Array(SLOTS * STRIP * 2), 2);
  displacement = 0;
  private lastTick = -1;
  private lastPole = -100;

  constructor() {
    const triangles: number[] = [];
    for (let slot = 0; slot < SLOTS; slot++)
      for (let col = 0; col < COLUMNS; col++) {
        const a = slot * STRIP + col * 2;
        triangles.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
      }
    this.geometry.setAttribute('position', this.position);
    this.geometry.setAttribute('uv', this.uv);
    this.geometry.setIndex(triangles);
    // Slots follow a fixed window along the Parkway; no flags move between poles.
    this.mesh.frustumCulled = false;
    this.update(-1900, 0);
  }

  update(riderX: number, seconds: number): void {
    const tick = Math.floor(seconds * 20);
    const pole = Math.round((riderX + 1960) / 33);
    if (tick === this.lastTick && pole === this.lastPole) return;
    const newPoles = pole !== this.lastPole;
    this.lastTick = tick;
    this.lastPole = pole;
    for (let slot = 0; slot < SLOTS; slot++) {
      const j = pole + Math.floor(slot / 2) - 5;
      const side = slot % 2 ? 1 : -1;
      const x = -1960 + 33 * j;
      const shown = x >= -1960 && x < -95;
      const flag = (Math.abs(j) + (slot % 2) * 3) % 8;
      for (let col = 0; col <= COLUMNS; col++) {
        const u = col / COLUMNS;
        const billow = 0.31 * u * Math.sin((tick / 20) * 3.3 + j * 0.77 + side - u * 6);
        for (let row = 0; row < 2; row++) {
          const idx = slot * STRIP + 2 * col + row;
          this.position.setXYZ(
            idx,
            x + 1.12 * u + billow,
            shown ? 5.0 + row * 1.32 - 0.18 * u : -4,
            side * 7.55 + 1.93 * u,
          );
          if (newPoles) this.uv.setXY(idx, u, 1 - (flag + (0.998 - 0.996 * row)) / 8);
        }
        if (slot === 10 && col === COLUMNS) this.displacement = billow;
      }
    }
    this.position.needsUpdate = true;
    if (newPoles) this.uv.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}
