import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
} from 'three/webgpu';
import type { Course } from './course';

/** The starter's cloth near the bricks and a release of balloons beside the Pagoda. */
export class SpeedwayFlags {
  readonly root = new Group();
  private readonly cloth = new BufferGeometry();
  private readonly checks = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide });
  private readonly positions: BufferAttribute;
  private readonly flag = new Mesh(this.cloth, this.checks);
  private readonly balloons = new InstancedMesh(
    new SphereGeometry(1, 8, 6),
    new MeshStandardMaterial({ roughness: 0.45 }),
    42,
  );
  private readonly pose = new Object3D();
  private readonly windings: { span: number; height: number }[] = [];
  balloonHeight = 0;

  constructor(course: Course) {
    const colours: number[] = [];
    for (let row = 0; row < 5; row++) {
      for (let column = 0; column < 8; column++) {
        const tint = (row + column) % 2 === 0 ? 0.9 : 0.018;
        for (const [u, v] of [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
          [1, 1],
          [0, 1],
        ] as const) {
          this.windings.push({ span: (column + u) / 8, height: (row + v) / 5 });
          colours.push(tint, tint, tint);
        }
      }
    }
    this.positions = new BufferAttribute(new Float32Array(this.windings.length * 3), 3).setUsage(
      DynamicDrawUsage,
    );
    this.cloth.setAttribute('position', this.positions);
    this.cloth.setAttribute('color', new BufferAttribute(new Float32Array(colours), 3));
    const starter = course.place(0, 12.1);
    this.flag.position.set(starter.x, starter.y + 6.7, starter.z);
    this.flag.frustumCulled = false;
    const infield = course.place(87, -38);
    this.balloons.position.set(infield.x, infield.y, infield.z);
    this.balloons.instanceMatrix.setUsage(DynamicDrawUsage);
    const palette = [0xc84237, 0x386b99, 0xf0c757, 0xf2e9d9];
    for (let i = 0; i < this.balloons.count; i++)
      this.balloons.setColorAt(i, new Color(palette[i % palette.length]));
    this.balloons.frustumCulled = false;
    this.root.add(this.flag, this.balloons);
    this.update(0, 0);
  }

  get flagTip(): number {
    return this.positions.getX(this.positions.count - 2);
  }

  update(seconds: number, metres: number): void {
    const station = metres % 4000;
    this.root.visible = station < 580 || station > 3320;
    if (!this.root.visible) return;
    const swing = Math.sin(seconds * 4.0);
    for (let i = 0; i < this.windings.length; i++) {
      const { span, height } = this.windings[i]!;
      const wave = 0.37 * Math.sin(seconds * 5.7 - span * 7.2);
      this.positions.setXYZ(
        i,
        span * (swing * 0.85 + wave),
        height * 1.31 + span * (0.35 + 0.26 * swing) - 0.19 * span * span,
        -span * 2.32,
      );
    }
    this.positions.needsUpdate = true;
    for (let i = 0; i < this.balloons.count; i++) {
      const phase = (seconds * 0.022 + i * 0.071) % 1;
      const angle = i * 2.39996;
      const radius = 3 + (i % 9) * 1.45 + phase * 7;
      const height = 12 + phase * 48 + 0.55 * Math.sin(seconds * 0.52 + i);
      this.pose.position.set(
        Math.cos(angle) * radius + phase * 20,
        height,
        Math.sin(angle) * radius + Math.sin(seconds * 0.22 + i) * 1.1,
      );
      const size = 0.72 * Math.min(1, phase * 20, (1 - phase) * 20);
      this.pose.scale.set(size, size * 1.31, size);
      this.pose.updateMatrix();
      this.balloons.setMatrixAt(i, this.pose.matrix);
      if (i === 3) this.balloonHeight = this.pose.position.y;
    }
    this.balloons.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.root.removeFromParent();
    this.cloth.dispose();
    this.checks.dispose();
    this.balloons.geometry.dispose();
    this.balloons.material.dispose();
    this.balloons.dispose();
    this.root.clear();
  }
}
