import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { canvasTexture } from './world-kit';

/** A two-column Jamaican sound system and its audience, below the afternoon cloud banks. */
export class BlueMountainsYard {
  readonly group = new Group();
  private readonly yard = new Group();
  private readonly body = new MeshStandardMaterial({ roughness: 0.92 });
  private readonly wood = new BoxGeometry(1, 1, 1);
  private readonly cabinet = new InstancedMesh(this.wood, this.body, 56);
  private readonly driver = new CylinderGeometry(0.82, 1, 1, 20);
  private readonly cones = new InstancedMesh(this.driver, this.body, 18);
  private readonly rounded = new SphereGeometry(1, 9, 7);
  private readonly dancers = new InstancedMesh(this.rounded, this.body, 40);
  private readonly dummy = new Object3D();
  private readonly tint = new Color();
  private readonly at: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly vapour = canvasTexture(128, 64, (ctx) => {
    for (let i = 0; i < 9; i++) {
      const x = 21 + i * 10.5,
        y = 33 + 6 * Math.sin(i * 1.8),
        r = 15 + 4 * Math.cos(i);
      const fade = ctx.createRadialGradient(x, y, 0, x, y, r);
      fade.addColorStop(0, 'rgba(218,232,225,.51)');
      fade.addColorStop(1, 'rgba(230,240,237,0)');
      ctx.fillStyle = fade;
      ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  });
  private readonly haze = new SpriteMaterial({
    map: this.vapour,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  });
  private readonly clouds = Array.from({ length: 4 }, () => new Sprite(this.haze));
  mistPosition = 0;
  speakerDepth: number | null = null;

  constructor(private readonly course: Course) {
    this.yard.add(this.cabinet, this.cones, this.dancers);
    this.group.add(this.yard, ...this.clouds);
    this.cabinet.frustumCulled = this.cones.frustumCulled = this.dancers.frustumCulled = false;
    let n = 0;
    for (const x of [-0.59, 0.59]) {
      for (let row = 0; row < 3; row++) {
        const y = 0.56 + row * 0.94;
        this.instance(this.cabinet, n++, x, y, 0, 1.12, 0.92, 0.88, 0x554230);
        this.instance(this.cabinet, n++, x, y, 0.448, 1.01, 0.81, 0.034, 0x192426);
        for (const edge of [-1, 1]) {
          this.instance(this.cabinet, n++, x + edge * 0.51, y, 0.49, 0.045, 0.91, 0.05, 0xb29c74);
          this.instance(this.cabinet, n++, x, y + edge * 0.41, 0.49, 1.04, 0.052, 0.05, 0x857659);
        }
        this.instance(this.cabinet, n++, x, y - 0.31, 0.48, 0.59, 0.08, 0.04, 0x080c0d);
      }
      this.instance(this.cabinet, n++, x, 3.12, -0.04, 1.07, 0.47, 0.72, 0x323b36);
      this.instance(this.cabinet, n++, x, 3.14, 0.324, 0.85, 0.28, 0.04, 0x13191c);
    }
    this.cabinet.count = n;
    this.yard.visible = false;
  }

  update(metres: number, time: number): void {
    const site = metres < 5200 ? 1540 : 8860;
    this.yard.visible = Math.abs(metres - site) < 165;
    this.speakerDepth = null;
    if (this.yard.visible) {
      this.course.place(site - 5, 4.65, this.at);
      this.yard.position.set(this.at.x, this.at.y - 0.12, this.at.z);
      this.yard.rotation.y = this.at.heading - 0.55;
      const beat = Math.max(0, Math.cos(time * Math.PI * 2 * 1.5)) ** 4;
      let n = 0;
      for (const x of [-0.59, 0.59]) {
        for (let j = 0; j < 3; j++) {
          const y = 0.56 + j * 0.94;
          this.instance(
            this.cones,
            n++,
            x,
            y + 0.065,
            0.5,
            0.347,
            0.065,
            0.347,
            0x595745,
            Math.PI / 2,
          );
          this.instance(
            this.cones,
            n++,
            x,
            y + 0.065,
            0.55 + beat * 0.051,
            0.263,
            0.066,
            0.263,
            0x262b2a,
            Math.PI / 2,
          );
          this.instance(
            this.cones,
            n++,
            x,
            y + 0.065,
            0.6 + beat * 0.051,
            0.115,
            0.068,
            0.115,
            0x464a44,
            Math.PI / 2,
          );
        }
      }
      this.speakerDepth = this.dummy.position.z;
      this.cones.instanceMatrix.needsUpdate = true;
      let person = 0;
      for (let i = 0; i < 5; i++) {
        const x = -1.6 - (i % 2) * 0.83,
          z = -1.1 + i * 0.74;
        const sway = 0.093 * Math.sin(time * 4.71 + i);
        const shirt = [0xd6a63f, 0xa04339, 0x419075, 0x638cac, 0xe3d4a2][i]!;
        const skin = [0x784b36, 0x51372b, 0x97674b][i % 3]!;
        for (const side of [-1, 1]) {
          this.instance(
            this.dancers,
            person++,
            x + side * 0.107,
            0.49,
            z,
            0.11,
            0.46,
            0.13,
            0x3a4952,
          );
          this.instance(
            this.dancers,
            person++,
            x + sway + side * 0.241,
            1.15 + 0.055 * beat,
            z,
            0.085,
            0.27,
            0.09,
            skin,
          );
        }
        this.instance(this.dancers, person++, x + sway, 1.21, z, 0.23, 0.34, 0.17, shirt);
        this.instance(this.dancers, person++, x + sway, 1.68, z, 0.145, 0.2, 0.15, skin);
        this.instance(this.dancers, person++, x + sway, 1.805, z, 0.151, 0.103, 0.153, 0x322d27);
      }
      this.dancers.count = person;
      this.dancers.instanceMatrix.needsUpdate = true;
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const anchor = Math.round((metres - 1510 - i * 76) / 340) * 340 + 1510 + i * 76;
      const lane = (i % 2 === 0 ? 1 : -1) * (3 + 9 * Math.sin(time * 0.1 + anchor * 0.013));
      this.course.place(anchor, lane, this.at);
      const cloud = this.clouds[i]!;
      cloud.position.set(this.at.x, this.at.y + 3.5 + i * 1.3, this.at.z);
      cloud.scale.set(29 + i * 7, 5.6 + i * 0.8, 1);
      if (i === 0) this.mistPosition = cloud.position.z;
    }
  }

  private instance(
    mesh: InstancedMesh,
    i: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    colour: number,
    rotation = 0,
  ): void {
    this.dummy.position.set(x, y, z);
    this.dummy.rotation.set(rotation, 0, 0);
    this.dummy.scale.set(w, h, d);
    this.dummy.updateMatrix();
    mesh.setMatrixAt(i, this.dummy.matrix);
    mesh.setColorAt(i, this.tint.setHex(colour));
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const mesh of [this.cabinet, this.cones, this.dancers]) mesh.dispose();
    for (const geometry of [this.wood, this.driver, this.rounded]) geometry.dispose();
    this.body.dispose();
    this.haze.dispose();
    this.vapour.dispose();
  }
}
