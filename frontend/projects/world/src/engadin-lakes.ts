import {
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course, CoursePlace } from './course';

/** Each carriage follows the bend under its own bogies. Its windows and panels draw together. */
function carriage(driving: boolean) {
  const parts: BufferGeometry[] = [];
  function panel(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    length: number,
    tone: number,
  ) {
    const g = new BoxGeometry(w, h, length).toNonIndexed();
    g.translate(x, y, z);
    const color = new Color(tone),
      colours: number[] = [];
    for (let i = 0; i < g.attributes['position']!.count; i++)
      colours.push(color.r, color.g, color.b);
    g.setAttribute('color', new Float32BufferAttribute(colours, 3));
    parts.push(g);
  }
  panel(0, 1.81, 0, 2.67, 2.22, 14.08, 0xc32936);
  panel(0, 3.07, 0, 2.66, 0.33, 13.95, 0xa39c94);
  panel(0, 0.73, 0, 2.31, 0.35, 13.31, 0x494746);
  for (const side of [-1, 1]) {
    panel(side * 1.34, 1.65, 0, 0.04, 0.12, 14, 0xf6e8c9);
    for (let z = -5.52; z <= 5.6; z += 1.63)
      panel(side * 1.355, 2.27, z, 0.045, 0.83, 1.25, 0x515f6b);
    for (const z of [-4.57, 4.57]) panel(side * 0.92, 0.43, z, 0.33, 0.7, 1.85, 0x3b3940);
  }
  if (driving) {
    panel(0, 2.28, -7.055, 2.12, 0.9, 0.06, 0x4b5a65);
    for (const side of [-1, 1]) panel(side * 0.97, 1.27, -7.06, 0.34, 0.22, 0.06, 0xffe1a0);
  }
  const geometry = mergeGeometries(parts)!;
  for (const p of parts) p.dispose();
  return geometry;
}

export async function engadinLakes(course: Course) {
  const atlas: Texture = await new TextureLoader().loadAsync('courses/engadin-bernina.webp');
  atlas.colorSpace = SRGBColorSpace;
  const ridge = new MeshBasicMaterial({
    map: atlas,
    alphaTest: 0.42,
    side: DoubleSide,
    fog: false,
    color: 0xe0e5e8,
  });
  const painted = new MeshLambertMaterial({ vertexColors: true, side: DoubleSide });
  const rigging = new MeshBasicMaterial({ color: 0x4d5054 });
  const group = new Group(),
    geometries: BufferGeometry[] = [];
  const origin = course.place(0),
    destination = course.place(course.length);
  const valleyLength = Math.hypot(destination.x - origin.x, destination.z - origin.z);
  const dx = (destination.x - origin.x) / valleyLength,
    dz = (destination.z - origin.z) / valleyLength;
  const range = new PlaneGeometry(1, 1);
  geometries.push(range);
  // Continuous, fixed mountain faces beyond both shores, joined edge to edge at matching heights.
  function ridgeFace(along: number, lane: number, width: number, side: boolean, mirror: boolean) {
    const m = new Mesh(range, ridge);
    m.rotation.y = side ? Math.atan2(-dz, dx) : Math.atan2(-dx, -dz);
    m.scale.set(width * (mirror ? -1 : 1), 1960, 1);
    m.position.set(origin.x + dx * along - dz * lane, 2610, origin.z + dz * along + dx * lane);
    group.add(m);
  }
  const margin = 4200,
    length = valleyLength + 2 * margin,
    halfWidth = 3600;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++)
      ridgeFace(
        -margin + (length * (i + 0.5)) / 5,
        side * halfWidth,
        length / 5 + 0.5,
        true,
        Boolean(i % 2),
      );
    ridgeFace(side < 0 ? -margin : valleyLength + margin, 0, 2 * halfWidth + 0.5, false, false);
  }
  const coach = carriage(false),
    cab = carriage(true);
  geometries.push(coach, cab);
  const train = Array.from({ length: 4 }, (_, i) => new Mesh(i === 0 ? cab : coach, painted));
  group.add(...train);
  const kites: Group[] = [];
  for (const [i, tone] of [0xe64f3d, 0x28a999, 0xf2bb34, 0x4356bc, 0xe85c86].entries()) {
    const d = 13010 + i * 29,
      p = course.place(d, -58 - (i % 3) * 12);
    const base = new Group();
    base.position.set(p.x, 1790.11, p.z);
    base.rotation.y = p.heading;
    group.add(base);
    const sail = new Group();
    base.add(sail);
    kites.push(sail);
    const pos: number[] = [],
      col: number[] = [],
      idx: number[] = [];
    for (let j = 0; j <= 12; j++) {
      const t = (j - 6) / 6,
        x = 6.8 * t,
        y = 21 - 4 * t * t;
      pos.push(x, y, 0, x, y + 1.8 * (1 - 0.55 * Math.abs(t)), 1.15);
      const tint = new Color(j % 6 === 1 ? 0xf5e8c9 : tone);
      col.push(tint.r, tint.g, tint.b, tint.r, tint.g, tint.b);
      if (j < 12) {
        const n = j * 2;
        idx.push(n, n + 1, n + 2, n + 2, n + 1, n + 3);
      }
    }
    const wing = new BufferGeometry();
    wing.setAttribute('position', new Float32BufferAttribute(pos, 3));
    wing.setAttribute('color', new Float32BufferAttribute(col, 3));
    wing.setIndex(idx);
    wing.computeVertexNormals();
    geometries.push(wing);
    sail.add(new Mesh(wing, painted));
    for (const side of [-1, 1]) {
      const g = new BoxGeometry(0.033, 17.7, 0.033);
      geometries.push(g);
      const line = new Mesh(g, rigging);
      line.rotation.z = -side * 0.35;
      line.position.set(side * 3.02, 9.05, 0);
      sail.add(line);
    }
    const board = new BoxGeometry(2.1, 0.14, 0.55),
      body = new BoxGeometry(0.46, 1.32, 0.45);
    geometries.push(board, body);
    base.add(new Mesh(board, rigging));
    const rider = new Mesh(body, rigging);
    rider.position.y = 0.74;
    base.add(rider);
  }
  const at: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  return {
    group,
    get trainPosition() {
      return train[0]!.position.x;
    },
    get kiteHeight() {
      return kites[0]!.rotation.z;
    },
    at(time: number, metres: number) {
      for (const [i, car] of train.entries()) {
        car.visible = Math.abs(metres - 19450) < 840;
        const p = course.place(19492 + 71 * Math.sin(time * 0.079) - i * 14.8, 16.4, at);
        car.position.set(p.x, p.y + 0.65, p.z);
        car.rotation.y = p.heading;
      }
      for (const [i, kite] of kites.entries()) {
        kite.parent!.visible = Math.abs(metres - 12915) < 800;
        kite.rotation.z = 0.24 * Math.sin(time * 0.66 + i * 0.81);
        kite.rotation.x = 0.14 + 0.12 * Math.sin(time * 0.38 + i);
      }
    },
    dispose() {
      group.removeFromParent();
      for (const g of geometries) g.dispose();
      atlas.dispose();
      ridge.dispose();
      painted.dispose();
      rigging.dispose();
    },
  };
}
