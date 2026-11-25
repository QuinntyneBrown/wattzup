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

/** The wind comes across the quay from the Scheldt. Flags and turbines share the race clock. */
export class AntwerpWind {
  readonly root = new Group();
  private readonly pole = new CylinderGeometry(0.033, 0.045, 4.0, 6);
  private readonly cloth = new PlaneGeometry(1.65, 0.98, 12, 1);
  private readonly steel = new MeshLambertMaterial({ color: 0x889397 });
  private readonly blade = new BoxGeometry(0.42, 8.2, 0.23);
  private readonly white = new MeshLambertMaterial({ color: 0xdfe4df });
  private readonly flagTexture = canvasTexture(128, 76, (g) => {
    g.fillStyle = '#efca40';
    g.fillRect(0, 0, 128, 76);
    // Rampant lion in silhouette, hind feet on the ground and forepaws raised.
    g.fillStyle = '#26292a';
    const shape = (points: number[][]) => {
      g.beginPath();
      points.forEach(([x, y], i) => (i ? g.lineTo(x!, y!) : g.moveTo(x!, y!)));
      g.closePath();
      g.fill();
    };
    shape([
      [43, 64],
      [53, 49],
      [50, 40],
      [57, 28],
      [54, 20],
      [58, 14],
      [66, 10],
      [71, 12],
      [78, 10],
      [80, 14],
      [89, 17],
      [86, 21],
      [77, 21],
      [74, 26],
      [76, 32],
      [94, 25],
      [99, 17],
      [102, 20],
      [100, 29],
      [93, 33],
      [78, 38],
      [74, 43],
      [88, 42],
      [93, 36],
      [97, 38],
      [92, 48],
      [70, 52],
      [65, 57],
      [71, 65],
      [78, 66],
      [76, 70],
      [64, 70],
      [57, 59],
      [51, 66],
      [47, 70],
      [35, 70],
      [36, 66],
    ]);
    g.strokeStyle = '#26292a';
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(56, 47);
    g.bezierCurveTo(35, 49, 31, 39, 38, 32);
    g.bezierCurveTo(49, 21, 38, 19, 34, 24);
    g.stroke();
    shape([
      [35, 24],
      [29, 24],
      [28, 15],
      [33, 20],
      [41, 15],
      [39, 23],
    ]);
    g.fillStyle = '#b44836';
    g.fillRect(85, 20, 6, 2);
  });
  private readonly vapour = canvasTexture(128, 64, (g) => {
    for (const [x, y, r] of [
      [30, 35, 27],
      [56, 30, 29],
      [80, 32, 26],
      [100, 40, 19],
    ] as const) {
      const tint = g.createRadialGradient(x, y, 0, x, y, r);
      tint.addColorStop(0, 'rgba(157,174,182,.57)');
      tint.addColorStop(1, 'rgba(185,196,200,0)');
      g.fillStyle = tint;
      g.fillRect(0, 0, 128, 64);
    }
  });
  private readonly cloudMaterial = new SpriteMaterial({
    map: this.vapour,
    transparent: true,
    depthWrite: false,
  });
  private readonly clouds = [
    new Sprite(this.cloudMaterial),
    new Sprite(this.cloudMaterial),
    new Sprite(this.cloudMaterial),
  ];
  private readonly gold = new MeshLambertMaterial({ map: this.flagTexture, side: DoubleSide });
  private readonly flags: { post: Group; fabric: Mesh }[] = [];
  private readonly turbines: { tower: Group; rotor: Group }[] = [];
  private readonly at: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };

  constructor(private readonly course: Course) {
    this.root.add(...this.clouds);
    this.cloth.translate(0.825, 0, 0);
    const points = this.cloth.attributes['position']!;
    for (let i = 0; i < points.count; i++) points.setZ(i, 0.095 * Math.sin(points.getX(i) * 7));
    this.cloth.computeVertexNormals();
    this.blade.translate(0, 4.1, 0);
    for (let i = 0; i < 3; i++) {
      const post = new Group();
      const mast = new Mesh(this.pole, this.steel);
      mast.position.y = 2;
      const fabric = new Mesh(this.cloth, this.gold);
      fabric.position.y = 3.42;
      post.add(mast, fabric);
      this.root.add(post);
      this.flags.push({ post, fabric });
      const tower = new Group();
      const shaft = new Mesh(this.pole, this.white);
      shaft.scale.set(18, 7.5, 18);
      shaft.position.y = 15;
      const rotor = new Group();
      rotor.position.set(0, 29.9, 1.0);
      for (let j = 0; j < 3; j++) {
        const arm = new Mesh(this.blade, this.white);
        arm.rotation.z = (j * Math.PI * 2) / 3;
        rotor.add(arm);
      }
      tower.add(shaft, rotor);
      this.root.add(tower);
      this.turbines.push({ tower, rotor });
    }
  }

  draw(metres: number, time: number): void {
    const spacing = 72;
    this.flags.forEach(({ post, fabric }, i) => {
      const first = 18 + i * spacing;
      const d = first + Math.round((metres - first) / (3 * spacing)) * 3 * spacing;
      post.visible = d >= 0 && d < this.course.length && Math.abs(metres - d) < 100;
      if (!post.visible) return;
      const p = this.course.place(d, i % 2 ? 5.35 : -5.35, this.at);
      post.position.set(p.x, p.y, p.z);
      post.rotation.y = p.heading + 0.44;
      fabric.rotation.y = 0.21 * Math.sin(time * 5.3 + i) + 0.075 * Math.sin(time * 9.1);
    });
    this.clouds.forEach((cloud, i) => {
      const first = 220 + i * 320;
      const d = first + Math.round((metres - first) / 960) * 960;
      const fade = Math.min(1, Math.max(0, (475 - Math.abs(metres - d)) / 100));
      cloud.visible = fade > 0;
      if (!cloud.visible) return;
      const at = this.course.place(d, 70 * Math.sin(time * 0.013 + i * 2), this.at);
      cloud.position.set(at.x, at.y + 57 + 9 * i, at.z);
      cloud.scale.set(235 * fade, 39 * fade, 1);
    });
    this.turbines.forEach(({ tower, rotor }, i) => {
      const first = 200 + i * 350;
      const d = first + Math.round((metres - first) / 1050) * 1050;
      tower.visible = Math.abs(metres - d) < 480;
      if (!tower.visible) return;
      const p = this.course.place(d, -208 - i * 20, this.at);
      tower.position.set(p.x, p.y, p.z);
      tower.rotation.y = p.heading + 0.52;
      rotor.rotation.z = time * 0.46 + i * 1.3;
    });
  }

  dispose(): void {
    this.root.removeFromParent();
    for (const item of [
      this.pole,
      this.cloth,
      this.steel,
      this.blade,
      this.white,
      this.flagTexture,
      this.gold,
      this.cloudMaterial,
      this.vapour,
    ])
      item.dispose();
  }
}
