import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Sprite,
  SpriteMaterial,
  type DirectionalLight,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { canvasTexture } from './world-kit';

/** Low cloud and slanting drizzle blow across the Applecross headwall. */
export class HighlandWeather {
  readonly root = new Group();
  private readonly vapour = canvasTexture(128, 64, (g) => {
    for (const [x, y, r] of [
      [25, 35, 24],
      [47, 32, 30],
      [73, 36, 25],
      [97, 39, 26],
    ] as const) {
      const fog = g.createRadialGradient(x, y, 0, x, y, r);
      fog.addColorStop(0, 'rgba(224,232,231,.55)');
      fog.addColorStop(1, 'rgba(224,232,231,0)');
      g.fillStyle = fog;
      g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  });
  private readonly material = new SpriteMaterial({
    map: this.vapour,
    depthWrite: false,
    transparent: true,
  });
  private readonly banks = [
    new Sprite(this.material),
    new Sprite(this.material),
    new Sprite(this.material),
  ];
  private readonly place: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly drops = new Float32Array(72 * 6);
  private readonly rainGeometry = new BufferGeometry();
  private readonly rainMaterial = new LineBasicMaterial({
    color: 0xc1ced2,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  private readonly rain = new LineSegments(this.rainGeometry, this.rainMaterial);
  private readonly clearSun: number;

  constructor(
    private readonly course: Course,
    private readonly sun: DirectionalLight,
  ) {
    this.rainGeometry.setAttribute('position', new Float32BufferAttribute(this.drops, 3));
    this.rain.frustumCulled = false;
    this.root.add(...this.banks, this.rain);
    this.clearSun = sun.intensity;
  }

  update(metres: number, seconds: number): void {
    const exposure = Math.max(0, Math.min(1, (metres + 50) / 550, (9280 - metres) / 540));
    const wind = seconds * 0.095 + metres / 610;
    this.sun.intensity = this.clearSun * (1 - exposure * (0.31 + 0.27 * Math.sin(wind)));
    const at = this.course.place(metres + 8, 0, this.place);
    this.rain.position.set(at.x, at.y + 1.5, at.z);
    this.rain.visible = exposure > 0.3;
    if (this.rain.visible) {
      const points = this.rainGeometry.getAttribute('position');
      for (let i = 0; i < 72; i++) {
        const fall = (i * 1.618 + seconds * 0.84) % 1;
        const x = ((i * 9.741) % 18) - 9 + 1.7 * fall;
        const y = 6 - 6 * fall;
        const z = ((i * 7.173) % 18) - 9;
        points.setXYZ(i * 2, x, y, z);
        points.setXYZ(i * 2 + 1, x + 0.065, y - 0.21, z);
      }
      points.needsUpdate = true;
    }
    for (let i = 0; i < this.banks.length; i++) {
      const bank = this.banks[i]!;
      const first = 1230 + 180 * i;
      const anchor = first + 540 * Math.round((metres - first) / 540);
      const fade = Math.min(1, Math.max(0, (265 - Math.abs(anchor - metres)) / 70)) * exposure;
      bank.visible = fade > 0;
      if (!bank.visible) continue;
      const wave = Math.sin(seconds * 0.095 + anchor / 610);
      const at = this.course.place(anchor, -55 + 27 * wave, this.place);
      bank.position.set(at.x, at.y - 6 + 18 * wave, at.z);
      bank.scale.set(145 * fade, 31 * fade, 1);
    }
  }

  dispose(): void {
    this.root.removeFromParent();
    this.rainGeometry.dispose();
    this.rainMaterial.dispose();
    this.vapour.dispose();
    this.material.dispose();
  }
}
