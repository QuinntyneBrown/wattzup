import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  SphereGeometry,
  type Object3D,
  type Scene,
} from 'three/webgpu';
import type { Course } from './course';
import { juggleClubs } from './world-edinburgh';

/** The two performers and their props are owned by the active race scene. */
export class FringePerformers {
  private readonly group = new Group();
  private readonly geometries = [
    new BoxGeometry(1, 1, 1),
    new SphereGeometry(1, 9, 7),
    new CylinderGeometry(1, 1, 1, 9),
    new ConeGeometry(1, 1, 9),
  ];
  private readonly materials = new Map<number, MeshLambertMaterial>();
  private readonly clubs: Mesh[] = [];
  private readonly torch = new Group();
  private readonly amber = new Color(0xff9d24);
  private readonly gold = new Color(0xffdc72);
  private readonly flame = new MeshBasicMaterial({ color: 0xffa636, toneMapped: false });
  constructor(course: Course, scene: Scene) {
    const spot = (d: number, l: number) => {
      const at = course.place(d, l);
      const g = new Group();
      g.position.set(at.x, at.y + 0.18, at.z);
      g.rotation.y = at.heading + 0.48;
      this.group.add(g);
      return g;
    };
    const actor = (
      parent: Object3D,
      shape: number,
      colour: number,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      depth: number,
    ) => {
      let paint = this.materials.get(colour);
      if (!paint) {
        paint = new MeshLambertMaterial({ color: colour });
        this.materials.set(colour, paint);
      }
      const m = new Mesh(this.geometries[shape]!, paint);
      m.scale.set(w, h, depth);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };
    for (const [d, l, shirt] of [
      [2604, 5.35, 0x9b2c59],
      [2654, -5.4, 0x382e37],
    ] as const) {
      const base = spot(d, l);
      for (const side of [-1, 1]) {
        actor(base, 2, 0x292b36, side * 0.12, 0.39, 0, 0.09, 0.78, 0.09);
        actor(base, 1, 0x312a27, side * 0.13, 0.078, -0.06, 0.115, 0.08, 0.19);
      }
      actor(base, 2, shirt, 0, 1.09, 0, 0.22, 0.7, 0.16);
      actor(base, 1, 0xc38d6c, 0, 1.62, 0, 0.155, 0.19, 0.145);
      actor(base, 1, 0x4e372c, 0, 1.76, 0.02, 0.156, 0.1, 0.146);
      for (const side of [-1, 1]) {
        actor(base, 2, shirt, side * 0.24, 1.23, 0, 0.073, 0.41, 0.08).rotation.z = side * 0.5;
        actor(base, 2, 0xc38d6c, side * 0.35, 1.23, -0.08, 0.058, 0.31, 0.065).rotation.z =
          -side * 0.74;
      }
      if (d === 2604) {
        for (let i = 0; i < 3; i++) {
          const c = actor(
            base,
            1,
            [0xffd23f, 0xff2d78, 0x2dd4ff][i]!,
            0,
            2,
            0,
            0.092,
            0.165,
            0.092,
          );
          actor(c, 2, 0xeee9dd, 0, -1.32, 0, 0.42, 1.5, 0.42);
          this.clubs.push(c);
        }
      } else {
        base.add(this.torch);
        this.torch.position.set(0.39, 1.4, -0.08);
        actor(this.torch, 2, 0x5c4639, 0, 0.3, 0, 0.039, 0.72, 0.039);
        actor(this.torch, 1, 0xbd6d35, 0, 0.73, 0, 0.08, 0.15, 0.08);
        const tip = new Mesh(this.geometries[3], this.flame);
        tip.scale.set(0.12, 0.38, 0.11);
        tip.position.y = 0.93;
        this.torch.add(tip);
      }
    }
    scene.add(this.group);
    this.at(0);
  }
  get clubY() {
    return this.clubs[0]!.position.y;
  }
  get torchAngle() {
    return this.torch.rotation.z;
  }
  at(time: number) {
    juggleClubs(this.clubs, time, 0.45);
    this.torch.rotation.z = 0.86 * Math.sin(time * 2.8) + 0.19;
    this.flame.color.lerpColors(this.amber, this.gold, 0.5 + 0.5 * Math.sin(time * 13));
  }
  dispose() {
    this.group.removeFromParent();
    this.group.clear();
    this.clubs.length = 0;
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.flame.dispose();
  }
}
