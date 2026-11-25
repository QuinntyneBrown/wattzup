import {
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  Sprite,
  SpriteMaterial,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { canvasTexture } from './world-kit';

/** Mabry Mill's open overshot wheel and the fog which settles in the Parkway valleys. */
export class MabryMill {
  readonly group = new Group();
  private readonly wheel = new Group();
  private readonly wheelAt = new Group();
  private readonly timber = new MeshStandardMaterial({ roughness: 0.93 });
  private readonly board = new BoxGeometry(1, 1, 1);
  private readonly paddles = new InstancedMesh(this.board, this.timber, 128);
  private readonly dummy = new Object3D();
  private readonly tint = new Color();
  private readonly place: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly mist = canvasTexture(128, 64, (ctx) => {
    for (let i = 0; i < 7; i++) {
      const x = 21 + i * 14,
        y = 31 + 5 * Math.cos(i * 2),
        r = 16 + 3 * Math.sin(i);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, 'rgba(225,230,229,.57)');
      gradient.addColorStop(1, 'rgba(220,226,231,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  });
  private readonly haze = new SpriteMaterial({
    map: this.mist,
    transparent: true,
    depthWrite: false,
    opacity: 0.56,
  });
  private readonly banks = Array.from({ length: 5 }, () => new Sprite(this.haze));
  private readonly reflected = new Group();
  private readonly waterColour = new MeshStandardMaterial({
    color: 0x8c9790,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  private readonly reflection: InstancedMesh;
  private readonly radius = 2.17;
  paddleHeight: number | null = null;
  valleyMist = 0;

  constructor(private readonly course: Course) {
    const wheel = this.wheelAt;
    this.course.place(6192, 8.53, this.place);
    wheel.position.set(this.place.x, this.place.y + 1.09, this.place.z);
    wheel.rotation.y = this.place.heading;
    this.wheel.add(this.paddles);
    wheel.add(this.wheel, this.reflected);
    this.group.add(wheel, ...this.banks);
    let n = 0;
    const count = 24;
    const plank = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      angle: number,
      color: number,
    ) => {
      this.dummy.position.set(x, y, z);
      this.dummy.rotation.set(angle, 0, 0);
      this.dummy.scale.set(w, h, d);
      this.dummy.updateMatrix();
      this.paddles.setMatrixAt(n, this.dummy.matrix);
      this.paddles.setColorAt(n++, this.tint.setHex(color));
    };
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const at = angle + Math.PI / count;
      const radius = this.radius;
      plank(
        0,
        radius * Math.cos(angle),
        radius * Math.sin(angle),
        1.04,
        0.35,
        0.11,
        angle,
        i % 3 === 0 ? 0x9b825d : 0x705d47,
      );
      for (const side of [-1, 1]) {
        plank(
          side * 0.52,
          radius * Math.cos(at),
          radius * Math.sin(at),
          0.13,
          0.145,
          0.59,
          at,
          0x645b4d,
        );
        if (i % 3 === 0)
          plank(
            side * 0.51,
            Math.cos(angle) * 1.09,
            Math.sin(angle) * 1.09,
            0.14,
            2.14,
            0.16,
            angle,
            0x866e50,
          );
      }
    }
    plank(0, 0, 0, 1.47, 0.36, 0.36, 0, 0x484742);
    this.paddles.count = n;
    this.paddles.computeBoundingSphere();
    this.reflection = new InstancedMesh(this.board, this.waterColour, n);
    this.reflection.instanceMatrix.copy(this.paddles.instanceMatrix);
    this.reflection.count = n;
    this.reflection.computeBoundingSphere();
    this.reflected.add(this.reflection);
    // A flattened reflection stays on the mill pond below the wooden buckets.
    this.reflected.position.set(-1.1, -1.96, 0);
    this.reflected.scale.set(1, -0.052, 1);
  }

  update(metres: number, time: number): void {
    this.wheelAt.visible = Math.abs(metres - 6192) < 185;
    this.paddleHeight = null;
    if (this.wheelAt.visible) {
      const angle = -time * 0.41;
      this.wheel.rotation.x = angle;
      this.reflection.rotation.x = angle;
      this.paddleHeight = this.wheelAt.position.y + this.radius * Math.cos(angle);
    }
    // Fixed banks drift slowly below the rider. The next bank enters behind distant trees.
    for (let i = 0; i < this.banks.length; i++) {
      const spacing = 650,
        anchor = Math.round((metres - i * 125) / spacing) * spacing + i * 125;
      const lane = 20 + i * 6 + 9 * Math.sin(time * 0.075 + anchor * 0.004);
      this.course.place(anchor, lane, this.place);
      const bank = this.banks[i]!;
      bank.position.set(this.place.x, this.place.y - 3 - i * 0.56, this.place.z);
      bank.scale.set(72 + i * 9, 8.2 + i * 0.7, 1);
      if (i === 0) this.valleyMist = bank.position.z;
    }
  }

  dispose(): void {
    this.group.removeFromParent();
    this.paddles.dispose();
    this.reflection.dispose();
    this.board.dispose();
    this.timber.dispose();
    this.waterColour.dispose();
    this.haze.dispose();
    this.mist.dispose();
  }
}
