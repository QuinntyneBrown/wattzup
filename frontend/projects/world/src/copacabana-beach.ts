import {
  Color,
  Group,
  InstancedMesh,
  MeshLambertMaterial,
  Object3D,
  SphereGeometry,
  type Scene,
} from 'three/webgpu';
import type { Course } from './course';
import { CopacabanaPaving } from './copacabana-paving';

const COURTS = [185, 755, 1170, 1910, 2180, 2930, 3470, 4090];

/** Beach games and shorebreak share one visible window and the race clock. */
export class CopacabanaBeach {
  private readonly paving: CopacabanaPaving;
  private readonly root = new Group();
  private readonly geometry = new SphereGeometry(0.5, 12, 8);
  private readonly material = new MeshLambertMaterial();
  private readonly players = new InstancedMesh(this.geometry, this.material, 240);
  private readonly foam = new InstancedMesh(this.geometry, this.material, 420);
  private readonly pose = new Object3D();
  private readonly colour = new Color();
  volleyballY: number | null = null;
  breakerX: number | null = null;

  constructor(
    private readonly course: Course,
    scene: Scene,
  ) {
    this.players.frustumCulled = this.foam.frustumCulled = false;
    this.root.add(this.players, this.foam);
    scene.add(this.root);
    this.paving = new CopacabanaPaving(course, scene);
    this.update(0, 0);
  }

  private draw(
    batch: InstancedMesh,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    yaw: number,
    tilt: number,
    tint: number,
  ) {
    this.pose.position.set(x, y, z);
    this.pose.rotation.set(tilt, yaw, 0, 'YXZ');
    this.pose.scale.set(width, height, depth);
    this.pose.updateMatrix();
    const i = batch.count++;
    batch.setMatrixAt(i, this.pose.matrix);
    batch.setColorAt(i, this.colour.setHex(tint));
  }

  private player(
    d: number,
    lane: number,
    facing: number,
    reach: number,
    shirt: number,
    skin: number,
  ) {
    const at = this.course.place(d, lane);
    const y = at.y - 1.48;
    const yaw = at.heading + (facing < 0 ? Math.PI : 0);
    const sin = Math.sin(yaw),
      cos = Math.cos(yaw);
    const part = (
      side: number,
      up: number,
      forward: number,
      w: number,
      h: number,
      length: number,
      tilt: number,
      tint: number,
    ) => {
      this.draw(
        this.players,
        at.x + side * cos - forward * sin,
        y + up,
        at.z - side * sin - forward * cos,
        w,
        h,
        length,
        yaw,
        tilt,
        tint,
      );
    };
    const hips = 0.83 + 0.15 * reach;
    part(0, hips + 0.32, 0.06, 0.42, 0.63, 0.27, -0.14, shirt);
    part(0, hips + 0.73, 0.13, 0.27, 0.32, 0.27, 0, skin);
    part(0, hips + 0.84, 0.13, 0.275, 0.15, 0.28, 0, 0x382d2a);
    for (const side of [-1, 1]) {
      part(side * 0.12, hips - 0.12, 0, 0.23, 0.32, 0.26, 0.1, 0x364457);
      part(side * 0.14, hips - 0.34, 0.055, 0.16, 0.35, 0.17, -0.26, skin);
      part(side * 0.15, 0.24, -0.025, 0.13, 0.46, 0.14, 0.31, skin);
      part(side * 0.15, 0.055, 0.015, 0.14, 0.09, 0.25, 0, skin);
      part(side * 0.23, hips + 0.42, 0.13, 0.13, 0.33, 0.13, -0.62 - reach * 0.85, skin);
      part(
        side * 0.27,
        hips + 0.4 + reach * 0.25,
        0.31,
        0.115,
        0.32,
        0.12,
        -1.52 - reach * 0.9,
        skin,
      );
    }
  }

  update(distance: number, seconds: number): void {
    this.players.count = this.foam.count = 0;
    this.volleyballY = this.breakerX = null;
    for (const court of COURTS) {
      if (court < distance - 45 || court > distance + 210) continue;
      const t = (seconds * 0.59 + court * 0.013) % 2;
      const progress = t % 1;
      const from = t < 1 ? -1 : 1;
      const d = court + from * (4.8 - 9.6 * progress);
      const at = this.course.place(d, 23.5 + Math.sin(t * Math.PI) * 1.1);
      const ballY = at.y - 1.48 + 1.63 + 8.4 * progress * (1 - progress);
      this.draw(this.players, at.x, ballY, at.z, 0.22, 0.22, 0.22, 0, 0, 0xffd05b);
      this.volleyballY = ballY;
      for (const side of [-1, 1]) {
        const receive =
          side === from ? Math.max(0, 1 - progress * 4) : Math.max(0, progress * 4 - 3);
        this.player(
          court + side * 5.2,
          23.5,
          -side,
          receive,
          side < 0 ? 0x22867f : 0xf4bd3d,
          side < 0 ? 0xa56a49 : 0x86553d,
        );
        this.player(
          court + side * 3.2,
          26.2 + Math.sin(t * Math.PI) * 0.28,
          -side,
          0.14,
          side < 0 ? 0x337eaa : 0xc15e42,
          0xbd825b,
        );
      }
    }
    const start = Math.max(0, Math.floor((distance - 40) / 14) * 14);
    for (let d = start; d <= Math.min(this.course.end, distance + 275); d += 14) {
      const width = 54 + 20 * Math.sin((Math.PI * d) / 4300) + 8 * Math.sin(d / 670);
      for (let crest = 0; crest < 3; crest++) {
        const phase = (seconds * 0.19 + crest * 0.33 + d * 0.00064) % 1;
        for (let j = 0; j < 4; j++) {
          const station = d + j * 3.5;
          const at = this.course.place(
            station,
            width + 5.5 + (1 - phase) * 12 + 0.65 * Math.sin(station * 0.085 + crest),
          );
          const strength = Math.sin(phase * Math.PI);
          this.draw(
            this.foam,
            at.x,
            at.y - 2.39 + 0.25 * strength,
            at.z,
            0.4 + strength * 0.85,
            0.09 + strength * 0.14,
            3.9,
            at.heading,
            0,
            crest === 1 ? 0xe7e1ce : 0xd2dad1,
          );
          if (this.breakerX === null) this.breakerX = at.x;
        }
      }
    }
    for (const batch of [this.players, this.foam]) {
      batch.instanceMatrix.needsUpdate = true;
      if (batch.instanceColor) batch.instanceColor.needsUpdate = true;
    }
  }

  dispose(): void {
    this.root.removeFromParent();
    this.paving.dispose();
    this.players.dispose();
    this.foam.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }
}
