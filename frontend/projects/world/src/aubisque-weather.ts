import { Group, Sprite, SpriteMaterial, type DirectionalLight } from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { canvasTexture } from './world-kit';

/** Atlantic air rises from the Ouzom valley and shades the balcony above it. */
export class AubisqueWeather {
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
  private readonly clearSun: number;

  constructor(
    private readonly course: Course,
    private readonly sun: DirectionalLight,
  ) {
    this.root.add(...this.banks);
    this.clearSun = sun.intensity;
  }

  update(metres: number, seconds: number): void {
    const inCirque = Math.max(0, Math.min(1, (metres - 480) / 600, (9100 - metres) / 900));
    const wind = seconds * 0.095 + metres / 610;
    this.sun.intensity = this.clearSun * (1 - inCirque * (0.22 + 0.19 * Math.sin(wind)));
    for (let i = 0; i < this.banks.length; i++) {
      const bank = this.banks[i]!;
      const first = 1230 + 180 * i;
      const anchor = first + 540 * Math.round((metres - first) / 540);
      const fade = Math.min(1, Math.max(0, (265 - Math.abs(anchor - metres)) / 70)) * inCirque;
      bank.visible = fade > 0;
      if (!bank.visible) continue;
      const wave = Math.sin(seconds * 0.095 + anchor / 610);
      const at = this.course.place(anchor, -55 + 27 * wave, this.place);
      bank.position.set(at.x, at.y - 6 + 18 * wave, at.z);
      bank.scale.set(117 * fade, 23 * fade, 1);
    }
  }

  dispose(): void {
    this.root.removeFromParent();
    this.vapour.dispose();
    this.material.dispose();
  }
}
