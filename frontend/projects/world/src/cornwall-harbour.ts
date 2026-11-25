import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  type Scene,
} from 'three/webgpu';
import type { Course } from './course';

/** Each painted vessel or bird is submitted as one mesh. */
function harbourShape(hullPaint: number | null): BufferGeometry {
  const parts: BufferGeometry[] = [];
  function paint(source: BufferGeometry, tint: number) {
    const geometry = source.index ? source.toNonIndexed() : source;
    if (source !== geometry) source.dispose();
    geometry.deleteAttribute('uv');
    const colour = new Color(tint);
    const attr = geometry.getAttribute('position').clone();
    for (let i = 0; i < attr.count; i++) attr.setXYZ(i, colour.r, colour.g, colour.b);
    geometry.setAttribute('color', attr);
    parts.push(geometry);
  }
  function sheet(vertices: number[], tint: number) {
    const surface = new BufferGeometry();
    surface.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    surface.computeVertexNormals();
    paint(surface, tint);
  }
  function box(x: number, y: number, z: number, w: number, h: number, l: number, c: number) {
    paint(new BoxGeometry(w, h, l).translate(x, y, z), c);
  }
  if (hullPaint !== null) {
    const stations = [
      [-4.3, 0.69],
      [-3.6, 1.19],
      [-1.8, 1.45],
      [0.6, 1.47],
      [2.7, 1.19],
      [3.8, 0.62],
      [4.45, 0.04],
    ] as const;
    for (let i = 1; i < stations.length; i++) {
      const [za, wa] = stations[i - 1]!,
        [zb, wb] = stations[i]!;
      const top = (z: number) => 1.15 + 0.34 * Math.pow(Math.abs(z) / 4.45, 3);
      for (const side of [-1, 1]) {
        const at = (z: number, w: number, level: number) => [
          side * w * (0.42 + 0.58 * level),
          -0.42 + (top(z) + 0.42) * level,
          z,
        ];
        for (const [low, high, tint] of [
          [0, 0.32, 0x563e37],
          [0.32, 0.89, hullPaint],
          [0.89, 0.95, 0xf2e8d5],
          [0.95, 1, 0x463b33],
        ] as const) {
          const a = at(za, wa, low),
            b = at(zb, wb, low),
            c = at(zb, wb, high),
            d = at(za, wa, high);
          sheet([...a, ...b, ...c, ...a, ...c, ...d], tint);
        }
      }
      sheet(
        [
          -wa,
          top(za),
          za,
          wa,
          top(za),
          za,
          wb,
          top(zb),
          zb,
          -wa,
          top(za),
          za,
          wb,
          top(zb),
          zb,
          -wb,
          top(zb),
          zb,
        ],
        0x8c7862,
      );
    }
    box(0, 1.94, 1.1, 1.89, 1.5, 1.98, 0xe5dfcc);
    box(0, 2.73, 1.1, 2.08, 0.18, 2.23, hullPaint);
    for (const side of [-1, 1]) {
      for (const z of [0.66, 1.57]) box(side * 0.954, 2.18, z, 0.05, 0.53, 0.72, 0x405e63);
      box(side * 0.44, 2.18, 2.105, 0.73, 0.54, 0.05, 0x405e63);
      for (const z of [-2.35, -0.76])
        paint(new CylinderGeometry(0.18, 0.16, 0.67, 8).translate(side * 1.46, 0.97, z), 0x313a3d);
      box(side * 0.85, 1.56, -1.42, 0.57, 0.72, 0.94, 0x957743);
    }
    box(-0.56, 2.77, -1.38, 0.1, 3.15, 0.1, 0x5b554b);
    box(0, 3.87, -1.38, 1.79, 0.09, 0.09, 0x64584e);
    box(-0.53, 4.44, -1.38, 0.08, 0.85, 0.08, 0x443e34);
  } else {
    paint(new SphereGeometry(1, 10, 7).scale(0.13, 0.12, 0.36), 0xeae9e3);
    paint(new SphereGeometry(0.115, 8, 6).translate(0, 0.1, 0.26), 0xf6f3e8);
    box(0, 0.094, 0.39, 0.065, 0.043, 0.15, 0xd3a145);
    for (const side of [-1, 1]) {
      sheet([side * 0.06, 0.05, 0.17, side * 0.54, 0.22, 0.03, side * 0.37, 0.12, -0.23], 0xa8b0b4);
      sheet([side * 0.06, 0.05, 0.17, side * 0.37, 0.12, -0.23, side * 0.07, 0, -0.27], 0xb8bfc2);
      sheet([side * 0.54, 0.22, 0.03, side * 0.9, 0.1, -0.23, side * 0.37, 0.12, -0.23], 0x52595d);
    }
  }
  const result = mergeGeometries(parts)!;
  parts.forEach((part) => part.dispose());
  return result;
}

export class CornwallHarbour {
  private readonly root = new Group();
  private readonly material = new MeshLambertMaterial({ vertexColors: true, side: DoubleSide });
  private readonly hulls = [0x385e82, 0x9d443a, 0xe7e1cf, 0x46766d].map(harbourShape);
  private readonly wings = harbourShape(null);
  private readonly boats;
  private readonly gulls;
  constructor(course: Course, scene: Scene) {
    this.boats = Array.from({ length: 32 }, (_, i) => {
      const station = 554 + i * 21 + Math.sin(i * 4) * 7;
      const beached = i % 5 === 2;
      const lane = beached ? 13 + (i % 8) : 37 + ((i * 19) % 46);
      const p = course.place(station, lane);
      const mesh = new Mesh(this.hulls[i % 4], this.material);
      mesh.position.set(p.x, beached ? 1.71 : 1.05, p.z);
      mesh.rotation.y = p.heading + 0.31 * Math.sin(i * 5.9);
      mesh.scale.setScalar(0.67 + (i % 4) * 0.17);
      this.root.add(mesh);
      return { mesh, station, beached, water: mesh.position.y };
    });
    this.gulls = Array.from({ length: 14 }, (_, i) => {
      const station = 553 + i * 53;
      const p = course.place(station, 9 + (i % 5) * 3);
      const mesh = new Mesh(this.wings, this.material);
      this.root.add(mesh);
      return { mesh, station, p };
    });
    scene.add(this.root);
    this.update(0, 0);
  }
  get boatRoll() {
    return this.boats.find((b) => b.mesh.visible && !b.beached)?.mesh.rotation.z ?? null;
  }
  get gullY() {
    return this.gulls.find((g) => g.mesh.visible)?.mesh.position.y ?? null;
  }
  update(time: number, metres: number) {
    const here = metres % 2400;
    for (const [i, b] of this.boats.entries()) {
      b.mesh.visible = Math.abs(here - b.station) < 330;
      if (!b.mesh.visible) continue;
      b.mesh.rotation.z = b.beached ? 0.17 : 0.045 * Math.sin(time * 0.87 + i);
      b.mesh.position.y = b.water + (b.beached ? 0 : 0.11 * Math.sin(time * 0.62 + i));
    }
    for (const [i, g] of this.gulls.entries()) {
      g.mesh.visible = Math.abs(here - g.station) < 200;
      if (!g.mesh.visible) continue;
      const phase = time * 0.31 + i;
      g.mesh.position.set(
        g.p.x + Math.cos(phase) * 7,
        g.p.y + 4.5 + Math.sin(phase * 2) * 1.2,
        g.p.z + Math.sin(phase) * 5,
      );
      g.mesh.rotation.set(
        0,
        Math.atan2(-7 * Math.sin(phase), 5 * Math.cos(phase)),
        -0.2 + 0.1 * Math.sin(phase),
      );
    }
  }
  dispose() {
    this.root.removeFromParent();
    this.hulls.forEach((g) => g.dispose());
    this.wings.dispose();
    this.material.dispose();
  }
}
