import {
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  MeshLambertMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
  type Scene,
} from 'three/webgpu';
import type { Course } from './course';

const LANDINGS = [1550, 2810, 4930, 6200, 8230, 10350, 11760];
const TERRACES = [80, 660, 1570, 2820, 5280, 7470, 10370, 11900];
const UP = new Vector3(0, 1, 0);

/** Shared articulated limbs for two dancers, a musician and the people travelling on the escalator. */
export class ComunaCrews {
  private readonly box = new BoxGeometry(1, 1, 1);
  private readonly sphere = new SphereGeometry(0.5, 8, 6);
  private readonly mat = new MeshLambertMaterial();
  private readonly bodies = new InstancedMesh(this.box, this.mat, 136);
  private readonly heads = new InstancedMesh(this.sphere, this.mat, 12);
  private readonly temp = new Object3D();
  private readonly a = new Vector3();
  private readonly b = new Vector3();
  private readonly delta = new Vector3();
  private readonly colour = new Color();
  private readonly root = new Group();
  dancerY: number | null = null;
  passengerY: number | null = null;
  constructor(
    private readonly course: Course,
    scene: Scene,
  ) {
    this.bodies.frustumCulled = this.heads.frustumCulled = false;
    this.root.add(this.bodies, this.heads);
    scene.add(this.root);
    this.update(0, 0);
  }
  private bar(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    w: number,
    d: number,
    c: number,
  ) {
    this.a.set(x1, y1, z1);
    this.b.set(x2, y2, z2);
    this.delta.subVectors(this.b, this.a);
    this.temp.position.addVectors(this.a, this.b).multiplyScalar(0.5);
    this.temp.scale.set(w, this.delta.length(), d);
    this.temp.quaternion.setFromUnitVectors(UP, this.delta.normalize());
    this.temp.updateMatrix();
    const i = this.bodies.count++;
    this.bodies.setMatrixAt(i, this.temp.matrix);
    this.bodies.setColorAt(i, this.colour.setHex(c));
  }
  private person(
    x: number,
    y: number,
    z: number,
    yaw: number,
    beat: number,
    perform: boolean,
    shirt: number,
    skin: number,
  ) {
    const s = Math.sin(yaw),
      c = Math.cos(yaw);
    const dip = perform ? 0.27 * (1 + Math.sin(beat)) * 0.5 : 0;
    const turn = perform ? 0.26 * Math.sin(beat * 0.56) : 0;
    const hip = 0.85 - dip,
      shoulder = hip + 0.51;
    const point = (a: number, b: number, f: number): [number, number, number] => [
      x + c * a - s * f,
      y + b,
      z + s * a + c * f,
    ];
    const limb = (
      a: [number, number, number],
      b: [number, number, number],
      w: number,
      depth: number,
      col: number,
    ) => {
      this.bar(...point(...a), ...point(...b), w, depth, col);
    };
    limb([turn, hip, 0], [turn + 0.04, shoulder, 0], 0.38, 0.25, shirt);
    const head = point(turn + 0.04, shoulder + 0.21, 0);
    this.temp.position.set(...head);
    this.temp.quaternion.identity();
    this.temp.scale.set(0.28, 0.34, 0.29);
    this.temp.updateMatrix();
    const n = this.heads.count++;
    this.heads.setMatrixAt(n, this.temp.matrix);
    this.heads.setColorAt(n, this.colour.setHex(skin));
    for (const side of [-1, 1]) {
      const wave = perform ? Math.sin(beat + side * 0.92) : 0.07;
      const ankle: [number, number, number] = [
        side * (0.14 + dip * 0.7) + turn * 0.12,
        0.12,
        side * wave * 0.26,
      ];
      const knee: [number, number, number] = [
        side * 0.13 + turn * 0.58,
        0.46 - dip * 0.45,
        0.09 + wave * 0.13,
      ];
      limb([turn + side * 0.1, hip, 0], knee, 0.15, 0.16, 0x394556);
      limb(knee, ankle, 0.12, 0.13, 0x394556);
      limb(ankle, [ankle[0], 0.08, ankle[2] + 0.17], 0.16, 0.12, 0xf2e6cb);
      const elbow: [number, number, number] = [
        turn + side * (perform ? 0.42 : 0.23),
        shoulder - 0.24 + wave * 0.18,
        0.03 + wave * 0.13,
      ];
      limb([turn + side * 0.16, shoulder, 0], elbow, 0.11, 0.11, shirt);
      limb(
        elbow,
        [turn + side * (perform ? 0.57 : 0.25), shoulder - 0.33 + wave * 0.46, 0.13 + wave * 0.2],
        0.095,
        0.1,
        skin,
      );
    }
    return head[1];
  }
  update(seconds: number, metres: number) {
    this.bodies.count = this.heads.count = 0;
    this.dancerY = this.passengerY = null;
    const stage = TERRACES.find((d) => Math.abs(d - metres) < 170);
    if (stage !== undefined) {
      for (let i = 0; i < 3; i++) {
        const t = seconds * 3.05 + i * 1.8;
        const p = this.course.place(stage + i * 1.05 - 3, 4.4 + 0.22 * Math.sin(t * 0.45));
        const y = this.person(
          p.x,
          p.y + 0.04,
          p.z,
          p.heading + 1.4 + 0.47 * Math.sin(t * 0.62),
          t,
          i !== 2,
          [0xb64d4e, 0x468f85, 0xd69a4a][i]!,
          i % 2 ? 0xb37650 : 0x895638,
        );
        if (i === 0) this.dancerY = y;
      }
    }
    const site = LANDINGS.find((d) => Math.abs(d - metres) < 185);
    if (site !== undefined) {
      for (let i = 0; i < 6; i++) {
        const flight = i % 2,
          start = site - 30 + flight * 32,
          f = (seconds * 0.043 + i / 3) % 1;
        const p = this.course.place(start + 23 * f, -6.7);
        const y = this.course.place(start).y - 0.04 + flight * 3 + 0.18 + 7.42 * f;
        const head = this.person(
          p.x,
          y,
          p.z,
          p.heading,
          0,
          false,
          [0xbfb992, 0x4b7393, 0xa75e53][i % 3]!,
          i % 2 ? 0xba855d : 0x87533d,
        );
        if (i === 0) this.passengerY = head;
      }
    }
    for (const batch of [this.bodies, this.heads]) {
      batch.instanceMatrix.needsUpdate = true;
      if (batch.instanceColor) batch.instanceColor.needsUpdate = true;
    }
  }
  dispose() {
    this.root.removeFromParent();
    this.bodies.dispose();
    this.heads.dispose();
    this.mat.dispose();
    this.box.dispose();
    this.sphere.dispose();
  }
}
