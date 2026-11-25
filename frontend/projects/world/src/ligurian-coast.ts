import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshLambertMaterial,
  Scene,
  SphereGeometry,
} from 'three/webgpu';
import type { Course } from './course';

/** Painted wooden hull with a keel, rising bow and stern, and an open cockpit. */
function gozzo(): BufferGeometry {
  const faces: number[] = [];
  const colours: number[] = [];
  function quad(a: number[], b: number[], c: number[], d: number[], paint: number): void {
    const colour = new Color(paint);
    for (const point of [a, b, c, a, c, d]) {
      faces.push(...point);
      colours.push(colour.r, colour.g, colour.b);
    }
  }
  function section(i: number, side: number): number[][] {
    const t = i / 8;
    const beam = 0.055 + 1.13 * Math.sin(Math.PI * t);
    const z = 5.8 * (t - 0.5);
    const rim = 0.57 + 0.38 * Math.pow(2 * t - 1, 4);
    return [
      [0, -0.33, z],
      [side * beam * 0.82, 0.13, z],
      [side * beam, rim - 0.1, z],
      [side * beam, rim, z],
      [side * beam * 0.87, rim, z],
      [side * beam * 0.62, 0.14, z],
    ];
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const a = section(i, side),
        b = section(i + 1, side);
      for (const [j, paint] of [0x285e70, 0xf4e3bf, 0x99382e, 0xb7834b, 0x6e927e].entries()) {
        quad(a[j]!, b[j]!, b[j + 1]!, a[j + 1]!, paint);
      }
      quad(a[5]!, b[5]!, [0, 0.14, b[5]![2]!], [0, 0.14, a[5]![2]!], 0x97734d);
    }
  }
  const hull = new BufferGeometry();
  hull.setAttribute('position', new Float32BufferAttribute(faces, 3));
  hull.setAttribute('color', new Float32BufferAttribute(colours, 3));
  hull.computeVertexNormals();
  return hull;
}

/** Batch each moving object once. The whole coast reuses the same three meshes. */
function painted(
  shape: BufferGeometry,
  colour: number,
  x: number,
  y: number,
  z: number,
  tilt = 0,
): BufferGeometry {
  const flat = shape.index ? shape.toNonIndexed() : shape;
  if (flat !== shape) shape.dispose();
  flat.deleteAttribute('uv');
  flat.rotateZ(tilt);
  flat.translate(x, y, z);
  const tint = new Color(colour);
  const rgb = new Float32Array(flat.getAttribute('position').count * 3);
  for (let i = 0; i < rgb.length; i += 3) tint.toArray(rgb, i);
  flat.setAttribute('color', new Float32BufferAttribute(rgb, 3));
  return flat;
}
function batch(parts: BufferGeometry[]): BufferGeometry {
  const result = mergeGeometries(parts)!;
  for (const part of parts) part.dispose();
  return result;
}
function boatGeometry(): BufferGeometry {
  const parts = [gozzo()];
  for (const z of [-1.4, 0, 1.4])
    parts.push(painted(new BoxGeometry(z === 0 ? 2 : 1.65, 0.09, 0.28), 0xb48a55, 0, 0.49, z));
  parts.push(painted(new BoxGeometry(0.07, 0.07, 3.1), 0xb7834b, -0.49, 0.58, 0));
  return batch(parts);
}
function hikerGeometry(): BufferGeometry {
  return batch([
    painted(new SphereGeometry(0.15, 8, 6), 0xab7552, 0, 1.55, 0),
    painted(new BoxGeometry(0.36, 0.55, 0.27), 0xdb6141, 0, 1.12, 0),
    painted(new BoxGeometry(0.3, 0.4, 0.18), 0x285665, 0, 1.15, 0.2),
    painted(new SphereGeometry(0.21, 8, 4).scale(1, 0.38, 1), 0xd5b785, 0, 1.69, 0),
    ...[-1, 1].flatMap((side) => [
      painted(new BoxGeometry(0.13, 0.83, 0.14), 0x415262, side * 0.1, 0.43, side * 0.08),
      painted(new BoxGeometry(0.1, 0.47, 0.11), 0xac795c, side * 0.23, 1.14, -0.02, side * 0.2),
      painted(new BoxGeometry(0.034, 1.09, 0.034), 0x61513c, side * 0.27, 0.52, -0.05, side * 0.11),
    ]),
  ]);
}

export class LigurianCoast {
  private readonly group = new Group();
  private readonly material = new MeshLambertMaterial({ vertexColors: true, side: DoubleSide });
  private readonly boatShape = boatGeometry();
  private readonly hikerShape = hikerGeometry();
  private readonly foamShape = painted(
    new SphereGeometry(1, 8, 4).scale(3.6, 0.07, 0.53),
    0xd4e9df,
    0,
    0,
    0,
  );
  private readonly boats = Array.from({ length: 3 }, () => new Mesh(this.boatShape, this.material));
  private readonly hikers = Array.from(
    { length: 2 },
    () => new Mesh(this.hikerShape, this.material),
  );
  private readonly foam = Array.from({ length: 5 }, () => new Mesh(this.foamShape, this.material));
  private readonly daylight: Color;
  private readonly evening = new Color(0xffb478);
  constructor(
    private readonly course: Course,
    scene: Scene,
    private readonly sun: DirectionalLight,
  ) {
    this.daylight = sun.color.clone();
    this.group.add(...this.boats, ...this.hikers, ...this.foam);
    scene.add(this.group);
    this.update(0, 0);
  }
  get hikerX(): number | null {
    return this.hikers[0]!.visible ? this.hikers[0]!.position.x : null;
  }
  get boatRoll(): number | null {
    return this.boats[0]!.visible ? this.boats[0]!.rotation.z : null;
  }
  update(seconds: number, metres: number): void {
    const coast = this.course.file.ligurianCoast!;
    const crossing = coast.crossings.find((d) => Math.abs(d - metres) < 160);
    for (const [i, hiker] of this.hikers.entries()) {
      hiker.visible = crossing !== undefined;
      if (crossing === undefined) continue;
      const phase = seconds * 0.12 + i * 0.34;
      const p = this.course.place(crossing + 2 + i * 0.9, Math.sin(phase) * 4.3);
      hiker.position.set(p.x, p.y + 0.025 * Math.abs(Math.sin(seconds * 4 + i)), p.z);
      hiker.rotation.y = p.heading + (Math.cos(phase) > 0 ? -0.5 : 0.5) * Math.PI;
    }
    const harbour = coast.harbours.find((h) => Math.abs(h.station - metres) < 420);
    for (const [i, boat] of this.boats.entries()) {
      boat.visible = !!harbour;
      if (!harbour) continue;
      const [x, z] = harbour.shore[i + 1]!;
      const swell = seconds * 0.85 + i * 1.8;
      boat.position.set(x, 0.11 * Math.sin(swell), z - 6 - i * 2);
      boat.rotation.set(
        0.025 * Math.cos(swell),
        0.37 + i * 0.8 + 0.04 * Math.sin(swell * 0.38),
        0.074 * Math.sin(swell),
      );
    }
    for (const [i, crest] of this.foam.entries()) {
      crest.visible = !!harbour;
      if (!harbour) continue;
      const [x, z] = harbour.shore[i]!;
      const swell = (1 + Math.sin(seconds * 0.73 + i * 1.8)) * 0.5;
      crest.position.set(x, 0.08, z + swell * 1.4);
      crest.scale.set(0.36 + swell, 1, 0.3 + swell * 0.65);
    }
    this.sun.color
      .copy(this.daylight)
      .lerp(this.evening, Math.max(0, metres / this.course.end - 0.66) / 0.34);
  }
  dispose(): void {
    this.group.removeFromParent();
    this.boatShape.dispose();
    this.hikerShape.dispose();
    this.foamShape.dispose();
    this.material.dispose();
  }
}
