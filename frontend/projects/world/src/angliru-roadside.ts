import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshLambertMaterial,
  PlaneGeometry,
  Sprite,
  SpriteMaterial,
} from 'three/webgpu';
import { type Course, type CoursePlace } from './course';
import { canvasTexture } from './world-kit';

/** The hillside stays fixed. Only the flags, the runners in the crowd and the summit mist move. */
export class AngliruRoadside {
  readonly root = new Group();
  private readonly at: CoursePlace = { x: 0, y: 0, z: 0, pitch: 0, heading: 0 };
  private readonly cube = new BoxGeometry(1, 1, 1);
  private readonly pole = new CylinderGeometry(0.027, 0.037, 3, 6);
  private readonly cloth = new PlaneGeometry(1.38, 0.91, 10, 1);
  private readonly fabric = canvasTexture(144, 96, (g) => {
    g.fillStyle = '#2074b9';
    g.fillRect(0, 0, 144, 96);
    g.fillStyle = '#f2c44c';
    g.fillRect(45, 12, 6, 68);
    g.fillRect(20, 36, 56, 6);
    g.font = 'bold 18px serif';
    g.fillText('Α', 17, 59);
    g.fillText('Ω', 64, 59);
  });
  private readonly blue = new MeshLambertMaterial({ map: this.fabric, side: DoubleSide });
  private readonly metal = new MeshLambertMaterial({ color: 0x777367 });
  private readonly shirt = new MeshLambertMaterial({ color: 0xd76b33 });
  private readonly skin = new MeshLambertMaterial({ color: 0xb98166 });
  private readonly shorts = new MeshLambertMaterial({ color: 0x38475b });
  private readonly vapour = canvasTexture(128, 64, (g) => {
    for (const [x, y, radius] of [
      [33, 37, 30],
      [54, 32, 31],
      [76, 31, 29],
      [96, 39, 25],
    ] as const) {
      const fade = g.createRadialGradient(x, y, 0, x, y, radius);
      fade.addColorStop(0, 'rgba(218,224,223,0.48)');
      fade.addColorStop(1, 'rgba(218,224,223,0)');
      g.fillStyle = fade;
      g.fillRect(0, 0, 128, 64);
    }
  });
  private readonly mist = new SpriteMaterial({
    map: this.vapour,
    transparent: true,
    depthWrite: false,
  });
  private readonly banks = [new Sprite(this.mist), new Sprite(this.mist), new Sprite(this.mist)];
  private readonly flag = new Group();
  private readonly clothMesh = new Mesh(this.cloth, this.blue);
  private readonly runner = new Group();
  private readonly limbs: Group[] = [];

  constructor(private readonly course: Course) {
    this.cloth.translate(0.69, 0, 0);
    const points = this.cloth.attributes['position']!;
    for (let i = 0; i < points.count; i++) points.setZ(i, 0.11 * Math.sin(points.getX(i) * 7));
    this.cloth.computeVertexNormals();
    this.clothMesh.position.y = 2.5;
    const post = new Mesh(this.pole, this.metal);
    post.position.y = 1.5;
    this.flag.add(post, this.clothMesh);
    this.root.add(this.flag, this.runner, ...this.banks);
    const part = (
      parent: Group,
      material: MeshLambertMaterial,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
    ) => {
      const mesh = new Mesh(this.cube, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      parent.add(mesh);
    };
    part(this.runner, this.shirt, 0, 1.14, 0, 0.39, 0.54, 0.25);
    part(this.runner, this.skin, 0, 1.56, -0.03, 0.23, 0.28, 0.23);
    for (const side of [-1, 1]) {
      const leg = new Group();
      leg.position.set(side * 0.105, 0.92, 0);
      part(leg, this.shorts, 0, -0.18, 0, 0.16, 0.37, 0.18);
      part(leg, this.skin, 0, -0.57, 0, 0.12, 0.43, 0.13);
      part(leg, this.shorts, 0, -0.79, -0.045, 0.16, 0.1, 0.24);
      const arm = new Group();
      arm.position.set(side * 0.245, 1.32, 0);
      part(arm, this.skin, 0, -0.14, 0, 0.11, 0.3, 0.12);
      part(arm, this.skin, 0, -0.27, -0.11, 0.11, 0.11, 0.28);
      this.runner.add(leg, arm);
      this.limbs.push(leg, arm);
    }
    this.banks.forEach((bank, i) => bank.scale.set(145 + i * 32, 25 + i * 7, 1));
  }

  draw(metres: number, time: number): number {
    const crux = metres > 13700 && metres < 15400;
    const flagAt = crux
      ? 13912 + Math.round((metres - 13912) / 52) * 52
      : metres < 500
        ? 26
        : 17598;
    this.flag.visible = Math.abs(metres - flagAt) < 110;
    if (this.flag.visible) {
      const at = this.course.place(flagAt, 3.55, this.at);
      this.flag.position.set(at.x, at.y - 0.12, at.z);
      this.flag.rotation.y = at.heading + 0.35;
      this.clothMesh.rotation.y = 0.32 * Math.sin(time * 3.1) + 0.09 * Math.sin(time * 6.3);
    }
    this.runner.visible = crux;
    if (crux) {
      const phase = 13921 + time * 2.8;
      const along = phase + Math.round((metres - phase) / 96) * 96;
      const at = this.course.place(along, -2.2, this.at);
      const stride = time * 7.6;
      this.runner.position.set(at.x, at.y + 0.035 * Math.abs(Math.cos(stride)), at.z);
      this.runner.rotation.y = at.heading;
      for (let i = 0; i < this.limbs.length; i++)
        this.limbs[i]!.rotation.x = (i === 0 || i === 3 ? 1 : -1) * 0.58 * Math.sin(stride);
    }
    for (let i = 0; i < this.banks.length; i++) {
      const bank = this.banks[i]!;
      const anchor = 14300 + Math.round((metres - 14300) / 600) * 600 + i * 190;
      bank.visible = metres > 12200;
      if (!bank.visible) continue;
      const at = this.course.place(anchor, 85 * Math.sin(i + time * 0.031), this.at);
      bank.position.set(at.x, at.y + 20 + 7 * Math.sin(time * 0.028 + i), at.z);
    }
    return this.clothMesh.rotation.y;
  }

  dispose(): void {
    this.root.removeFromParent();
    for (const resource of [
      this.cube,
      this.pole,
      this.cloth,
      this.fabric,
      this.blue,
      this.metal,
      this.shirt,
      this.skin,
      this.shorts,
      this.vapour,
      this.mist,
    ])
      resource.dispose();
  }
}
