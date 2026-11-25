import { cypressAsphalt } from './cypress-asphalt';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  type Scene,
  Vector3,
} from 'three/webgpu';
import type { Course } from './course';

const LOWER = 17985,
  UPPER = 18118;

/** A loop of open four-person ski chairs travels between the terminal sheaves. */
export class CypressLift {
  private readonly asphalt;
  private readonly root = new Group();
  private readonly metal = new MeshLambertMaterial({ color: new Color(0x485459) });
  private readonly bench = new MeshLambertMaterial({ color: new Color(0x38453e) });
  private readonly cable = new CylinderGeometry(0.035, 0.035, 1, 6);
  private readonly frame;
  private readonly seat;
  private readonly chairs;
  private readonly from = new Vector3();
  private readonly to = new Vector3();
  private readonly up = new Vector3(0, 1, 0);
  constructor(course: Course, scene: Scene) {
    this.asphalt = cypressAsphalt(course, scene);
    const p = course.place(LOWER, 15),
      q = course.place(UPPER, 73);
    this.from.set(p.x, p.y + 5.85, p.z);
    this.to.set(q.x, q.y + 17, q.z);
    const steel = [
      new BoxGeometry(0.09, 2.32, 0.09).translate(-0.92, 1.61, 0),
      new BoxGeometry(1.93, 0.09, 0.09).translate(0, 2.73, 0),
      new BoxGeometry(0.09, 0.94, 0.09).translate(0.93, 0.64, 0),
      new BoxGeometry(2.05, 0.08, 0.08).translate(0, 0.38, -0.33),
      new BoxGeometry(2.05, 0.08, 0.08).translate(0, -0.47, -0.42),
      new BoxGeometry(0.07, 0.84, 0.07).translate(-0.88, -0.06, -0.41),
      new BoxGeometry(0.07, 0.84, 0.07).translate(0.88, -0.06, -0.41),
    ];
    this.frame = mergeGeometries(steel)!;
    steel.forEach((g) => g.dispose());
    const slats = [
      new BoxGeometry(2.05, 0.13, 0.64),
      new BoxGeometry(2.05, 0.5, 0.1).translate(0, 0.26, 0.25),
    ];
    this.seat = mergeGeometries(slats)!;
    slats.forEach((g) => g.dispose());
    for (const side of [-1, 1]) {
      const a = this.from.clone(),
        b = this.to.clone();
      a.z += side * 1.65;
      b.z += side * 1.65;
      const rope = new Mesh(this.cable, this.metal);
      const dir = b.clone().sub(a);
      rope.position.copy(a).addScaledVector(dir, 0.5);
      rope.scale.y = dir.length();
      rope.quaternion.setFromUnitVectors(this.up, dir.normalize());
      this.root.add(rope);
    }
    this.chairs = Array.from({ length: 18 }, () => {
      const chair = new Group();
      chair.add(new Mesh(this.frame, this.metal), new Mesh(this.seat, this.bench));
      this.root.add(chair);
      return chair;
    });
    scene.add(this.root);
  }
  get chairX() {
    return this.root.visible ? this.chairs[0]!.position.x : null;
  }
  update(time: number, distance: number) {
    this.root.visible = distance > 17540;
    if (!this.root.visible) return;
    for (const [i, chair] of this.chairs.entries()) {
      const progress = (time * 0.014 + i / this.chairs.length) % 1;
      const ascending = progress < 0.5;
      const along = ascending ? 2 * progress : 2 * (1 - progress);
      chair.position.lerpVectors(this.from, this.to, along);
      chair.position.z += (ascending ? 1 : -1) * 1.65;
      chair.position.y -= 2.73;
      chair.rotation.y =
        Math.atan2(this.to.x - this.from.x, this.to.z - this.from.z) + (ascending ? 0 : Math.PI);
    }
  }
  dispose() {
    this.asphalt.dispose();
    this.root.removeFromParent();
    for (const obj of [this.frame, this.seat, this.cable, this.metal, this.bench]) obj.dispose();
  }
}
