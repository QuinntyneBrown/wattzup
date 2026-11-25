import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  type Scene,
  Vector3,
} from 'three/webgpu';
import type { Course } from './course';

/** A tapered waterline and flared bow. The open upper deck has its own roof and stanchions. */
function vessel(hydrofoil: boolean): BufferGeometry {
  const parts: BufferGeometry[] = [];
  function paint(g: BufferGeometry, c: number) {
    const geometry = g.index ? g.toNonIndexed() : g;
    if (geometry !== g) g.dispose();
    geometry.deleteAttribute('uv');
    const shade = new Color(c),
      attr = geometry.getAttribute('normal').clone();
    for (let i = 0; i < attr.count; i++) attr.setXYZ(i, shade.r, shade.g, shade.b);
    geometry.setAttribute('color', attr);
    parts.push(geometry);
  }
  function box(x: number, y: number, z: number, w: number, h: number, l: number, c: number) {
    paint(new BoxGeometry(w, h, l).translate(x, y, z), c);
  }
  const beam = hydrofoil ? 2.35 : 4.25,
    len = hydrofoil ? 19 : 31;
  const rim = hydrofoil ? 1.6 : 2.0;
  const verts: number[] = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 12; i++) {
      const station = (j: number, low: boolean) => {
        const t = j / 12;
        const breadth = Math.min(1, Math.sin(Math.PI * t) * 2.7 + 0.055);
        return [
          side * breadth * beam * (low ? 0.68 : 1),
          low ? -0.14 : rim + Math.pow(2 * t - 1, 6) * 0.55,
          (t - 0.5) * len,
        ];
      };
      const a = station(i, true),
        b = station(i + 1, true),
        c = station(i + 1, false),
        d = station(i, false);
      for (const p of side === 1 ? [a, c, b, a, d, c] : [a, b, c, a, c, d]) verts.push(...p);
      const mid = [0, c[1]!, c[2]!],
        mid0 = [0, d[1]!, d[2]!];
      for (const p of side === 1 ? [d, mid, c, d, mid0, mid] : [d, c, mid, d, mid, mid0])
        verts.push(...p);
    }
  }
  const hull = new BufferGeometry();
  hull.setAttribute('position', new Float32BufferAttribute(verts, 3));
  hull.computeVertexNormals();
  paint(hull, 0xeee7d2);
  box(0, rim + 0.65, 1, beam * 1.68, 1.42, len * 0.68, 0xdad5bb);
  box(0, rim + 1.53, 1, beam * 1.78, 0.23, len * 0.73, hydrofoil ? 0x628797 : 0xddc5a0);
  for (let i = 0; i < (hydrofoil ? 7 : 12); i++) {
    const z = -len * 0.27 + i * (hydrofoil ? 1.5 : 1.6);
    for (const side of [-1, 1]) {
      box(side * beam * 0.85, rim + 0.88, z, 0.07, 0.61, 1.05, 0x375767);
      if (!hydrofoil) box(side * beam * 0.79, rim + 2.4, z, 0.1, 1.62, 0.11, 0xe9e5cf);
    }
  }
  box(0, rim + 2.03, -len * 0.22, beam * 1.6, 1.16, 3.8, 0xe4e1ca);
  box(0, rim + 2.18, -len * 0.22 - 1.92, beam * 1.43, 0.55, 0.08, 0x314d5b);
  if (!hydrofoil) {
    box(0, rim + 3.2, 1, beam * 1.72, 0.2, len * 0.63, 0xefdfbd);
    box(0, rim + 4.0, 2, 1.03, 1.54, 1.35, 0x283940);
  } else {
    for (const z of [-5, 4]) box(0, -0.26, z, beam * 2.25, 0.13, 0.7, 0x334a53);
  }
  const result = mergeGeometries(parts)!;
  parts.forEach((g) => g.dispose());
  return result;
}
function wakeShape() {
  const geometry = new BufferGeometry(),
    coords: number[] = [];
  for (const side of [-1, 1])
    for (let i = 0; i < 18; i++) {
      const z = 4 + i * 2.0,
        x = side * (1.1 + z * 0.227);
      coords.push(x, 0.04, z, x + side * 0.8, 0.04, z + 1.6, x + side * 0.31, 0.04, z + 1.96);
    }
  geometry.setAttribute('position', new Float32BufferAttribute(coords, 3));
  return geometry;
}
export class ComoFerries {
  private readonly root = new Group();
  private readonly paint = new MeshLambertMaterial({ vertexColors: true });
  private readonly foam = new MeshBasicMaterial({
    color: 0xd6e7df,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    side: 2,
  });
  private readonly shapes = [vessel(false), vessel(true)];
  private readonly wake = wakeShape();
  private readonly boats = this.shapes.map((g) => new Mesh(g, this.paint));
  private readonly wakes = this.boats.map(() => new Mesh(this.wake, this.foam));
  private readonly near = new Vector3();
  private readonly far = new Vector3();
  constructor(
    private readonly course: Course,
    scene: Scene,
  ) {
    this.root.add(...this.boats, ...this.wakes);
    scene.add(this.root);
    this.update(0, 0);
  }
  get ferryX() {
    return this.boats[0]!.visible ? this.boats[0]!.position.x : null;
  }
  get foilX() {
    return this.boats[1]!.visible ? this.boats[1]!.position.x : null;
  }
  update(seconds: number, metres: number) {
    const station = [240, 2210, 6120, 10610].find((d) => Math.abs(d - metres) < 820);
    for (const [i, boat] of this.boats.entries()) {
      const wake = this.wakes[i]!;
      boat.visible = wake.visible = station !== undefined;
      if (station === undefined) continue;
      const p = this.course.place(station, 24 + i * 15);
      this.near.set(p.x, 0, p.z);
      this.far.set(
        p.x + 200 + i * 290,
        0,
        1070 - 250 * Math.sin(p.x / 1200) - 130 * Math.sin(p.x / 390) - 140,
      );
      const phase = seconds * (i ? 0.023 : 0.0105) + i * 0.87 + 0.76;
      const progress = (1 - Math.cos(phase)) / 2;
      boat.position.lerpVectors(this.near, this.far, progress);
      boat.position.y = 0.16 * Math.sin(seconds * 0.73 + i);
      boat.rotation.set(
        0.015 * Math.cos(seconds * 0.55),
        Math.atan2(this.near.x - this.far.x, this.near.z - this.far.z) +
          (Math.sin(phase) < 0 ? Math.PI : 0),
        0.018 * Math.sin(seconds * 0.83 + i),
      );
      wake.position.copy(boat.position);
      wake.position.y = 0.13;
      wake.rotation.y = boat.rotation.y;
      wake.scale.set(
        1 + Math.sin(seconds * 0.7) * 0.12,
        1,
        0.68 + Math.abs(Math.sin(phase)) * 0.43,
      );
    }
  }
  dispose() {
    this.root.removeFromParent();
    this.shapes.forEach((g) => g.dispose());
    this.wake.dispose();
    this.paint.dispose();
    this.foam.dispose();
  }
}
