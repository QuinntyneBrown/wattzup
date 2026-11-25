import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  MeshLambertMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type Scene,
} from 'three/webgpu';
import type { Course } from './course';

type Point = readonly [number, number, number];
const UP = new Vector3(0, 1, 0);
const COATS = [0x5e7062, 0xb9825a, 0x44526a, 0x9c705c, 0xd1aa51, 0x6a5260];
const SKIN = [0xb77b58, 0xd8aa83, 0x936445, 0xe2bb98];

/** Build one coloured mesh per frame type: city step-through, Christiania trike and Bullitt long-john. */
function frame(style: number): BufferGeometry {
  const parts: BufferGeometry[] = [];
  function paint(source: BufferGeometry, shade: number) {
    const g = source.index ? source.toNonIndexed() : source;
    if (g !== source) source.dispose();
    g.deleteAttribute('uv');
    const c = new Color(shade),
      n = g.getAttribute('position').count,
      values = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      values[i * 3] = c.r;
      values[i * 3 + 1] = c.g;
      values[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new Float32BufferAttribute(values, 3));
    parts.push(g);
  }
  function rod(a: Point, b: Point, r: number, shade: number) {
    const start = new Vector3(...a),
      end = new Vector3(...b),
      v = end.clone().sub(start);
    const g = new CylinderGeometry(r, r, v.length(), 6);
    g.applyQuaternion(new Object3D().quaternion.setFromUnitVectors(UP, v.normalize()));
    g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    paint(g, shade);
  }
  function box(x: number, y: number, z: number, w: number, h: number, l: number, shade: number) {
    paint(new BoxGeometry(w, h, l).translate(x, y, z), shade);
  }
  const front = style === 0 ? -0.53 : style === 1 ? -1.02 : -1.52;
  const wheel = (x: number, z: number, r: number) => {
    paint(
      new TorusGeometry(r, 0.025, 5, 28).rotateY(Math.PI / 2).translate(x, r + 0.025, z),
      0x323a39,
    );
    paint(
      new TorusGeometry(r - 0.026, 0.009, 4, 24).rotateY(Math.PI / 2).translate(x, r + 0.025, z),
      0xafb4ab,
    );
    for (let j = 0; j < 8; j++) {
      const a = (j * Math.PI) / 8,
        dy = (r - 0.035) * Math.cos(a),
        dz = (r - 0.035) * Math.sin(a);
      rod([x, r + 0.025 - dy, z - dz], [x, r + 0.025 + dy, z + dz], 0.006, 0x9ba5a1);
    }
  };
  wheel(0, 0.53, 0.325);
  if (style === 1) {
    wheel(-0.36, front, 0.24);
    wheel(0.36, front, 0.24);
  } else wheel(0, front, style === 2 ? 0.23 : 0.325);
  const enamel = [0x42615a, 0x655244, 0x9e5638][style]!;
  rod([0, 0.35, 0.53], [0, 0.28, 0], 0.028, enamel);
  rod([0, 0.35, 0.53], [0, 0.87, 0.18], 0.021, enamel);
  rod([0, 0.28, 0], [0, 0.91, 0.19], 0.034, enamel);
  rod([0, 0.28, 0], [0, 0.66, -0.36], 0.039, enamel);
  rod([0, 0.66, -0.36], [0, 1.07, -0.36], 0.026, 0x858e87);
  rod([0, 1.07, -0.36], [-0.29, 1.12, -0.29], 0.022, 0x5c615c);
  rod([0, 1.07, -0.36], [0.29, 1.12, -0.29], 0.022, 0x5c615c);
  rod([0, 0.66, -0.36], [0, 0.27, front], 0.028, enamel);
  box(0, 0.94, 0.18, 0.19, 0.065, 0.28, 0x4b423b);
  box(0, 0.71, 0.53, 0.2, 0.038, 0.46, 0x777f77);
  if (style) {
    const centre = style === 1 ? -0.89 : -0.98,
      w = style === 1 ? 0.74 : 0.57,
      len = style === 1 ? 0.68 : 0.85;
    box(0, 0.34, centre, w, 0.1, len, 0x8a6a49);
    for (const side of [-1, 1]) {
      box(side * w * 0.5, 0.51, centre, 0.04, 0.32, len, 0xb18d62);
      box(0, 0.51, centre + side * len * 0.5, w, 0.32, 0.04, 0xa47750);
    }
  } else {
    box(0, 0.91, -0.62, 0.33, 0.22, 0.24, 0x8d7d60);
  }
  const merged = mergeGeometries(parts)!;
  for (const p of parts) p.dispose();
  return merged;
}

export class CopenhagenCommuters {
  private readonly root = new Group();
  private readonly frameMaterial = new MeshLambertMaterial({ vertexColors: true });
  private readonly paint = new MeshLambertMaterial();
  private readonly bodies = new InstancedMesh(new SphereGeometry(0.5, 10, 7), this.paint, 680);
  private readonly markers = new InstancedMesh(new BoxGeometry(1, 1, 1), this.paint, 120);
  private readonly bikes = [0, 1, 2].map(
    (s) => new InstancedMesh(frame(s), this.frameMaterial, 36),
  );
  private readonly pose = new Object3D();
  private readonly colour = new Color();
  cargoPedalY: number | null = null;
  markerCount: number | null = null;

  constructor(
    private readonly course: Course,
    scene: Scene,
  ) {
    for (const batch of [...this.bikes, this.bodies, this.markers]) {
      batch.frustumCulled = false;
      this.root.add(batch);
    }
    scene.add(this.root);
    this.update(0, 0);
  }

  private shape(
    batch: InstancedMesh,
    x: number,
    y: number,
    z: number,
    yaw: number,
    pitch: number,
    w: number,
    h: number,
    depth: number,
    tint: number,
  ) {
    this.pose.position.set(x, y, z);
    this.pose.rotation.set(pitch, yaw, 0, 'YXZ');
    this.pose.scale.set(w, h, depth);
    this.pose.updateMatrix();
    const i = batch.count++;
    batch.setMatrixAt(i, this.pose.matrix);
    batch.setColorAt(i, this.colour.setHex(tint));
  }

  update(distance: number, seconds: number): void {
    for (const b of this.bikes) b.count = 0;
    this.bodies.count = this.markers.count = 0;
    this.cargoPedalY = this.markerCount = null;
    for (const direction of [1, -1]) {
      const speed = direction > 0 ? 4.1 : -4.8,
        spacing = direction > 0 ? 14 : 20;
      const first = Math.floor((distance - 25 - seconds * speed) / spacing);
      for (let j = first; ; j++) {
        const d = j * spacing + seconds * speed;
        if (d > Math.min(this.course.end, distance + 165)) break;
        if (d < 0) continue;
        const id = Math.abs(j + 91),
          style = id % 7 === 1 ? 1 : id % 5 === 1 ? 2 : 0;
        const lane = direction * (1.24 + 0.4 * Math.sin(j * 9));
        const at = this.course.place(d, lane);
        const yaw = at.heading + (direction < 0 ? Math.PI : 0),
          c = Math.cos(yaw),
          s = Math.sin(yaw);
        this.pose.position.set(at.x, at.y, at.z);
        this.pose.scale.set(1, 1, 1);
        this.pose.rotation.set(at.pitch * direction, yaw, 0, 'YXZ');
        this.pose.updateMatrix();
        const batch = this.bikes[style]!;
        batch.setMatrixAt(batch.count++, this.pose.matrix);
        const coat = COATS[id % COATS.length]!,
          skin = SKIN[id % SKIN.length]!,
          phase = seconds * 5 + j * 1.83;
        const part = (
          side: number,
          y: number,
          z: number,
          w: number,
          h: number,
          l: number,
          tilt: number,
          tint: number,
        ) =>
          this.shape(
            this.bodies,
            at.x + side * c + z * s,
            at.y + y,
            at.z - side * s + z * c,
            yaw,
            tilt,
            w,
            h,
            l,
            tint,
          );
        part(0, 1.24, 0.13, 0.4, 0.59, 0.25, -0.15, coat);
        part(0, 1.66, 0.07, 0.26, 0.32, 0.26, 0, skin);
        part(0, 1.77, 0.065, 0.28, 0.16, 0.29, 0, id % 2 ? 0x51483e : 0x505d66);
        for (const side of [-1, 1]) {
          const a = phase + (side < 0 ? Math.PI : 0),
            foot = 0.32 + 0.15 * Math.sin(a),
            z = 0.14 * Math.cos(a);
          part(side * 0.12, 0.74, 0.11, 0.175, 0.39, 0.17, -0.68 + 0.18 * Math.sin(a), 0x39464d);
          part(
            side * 0.13,
            (foot + 0.6) / 2,
            -0.04,
            0.128,
            0.37,
            0.14,
            0.22 + 0.34 * Math.cos(a),
            0x424b50,
          );
          part(side * 0.14, foot, z, 0.13, 0.09, 0.24, 0, 0x594c42);
          if (style && this.cargoPedalY === null) this.cargoPedalY = at.y + foot;
          part(side * 0.2, 1.31, -0.015, 0.13, 0.31, 0.145, -0.5, coat);
          part(side * 0.25, 1.16, -0.19, 0.115, 0.32, 0.115, -1.09, coat);
          part(side * 0.28, 1.12, -0.3, 0.095, 0.1, 0.11, 0, skin);
        }
      }
    }
    for (
      let d = 124 + 260 * Math.floor((distance - 45 - 124) / 260);
      d < distance + 235;
      d += 260
    ) {
      if (d < 0 || (d >= 2380 && d < 2780) || (d >= 10280 && d < 10660)) continue;
      const step = Math.floor((seconds * 3 + d / 260) % 12);
      let lit = 0;
      for (let j = 0; j < 9; j++) {
        const at = this.course.place(d - 2 - j * 2.4, 2.48),
          on = j <= step && step < 10;
        if (on) lit++;
        this.shape(
          this.markers,
          at.x,
          at.y + 0.037,
          at.z,
          at.heading,
          0,
          0.14,
          0.038,
          0.65,
          on ? 0x82eab1 : 0x506960,
        );
      }
      for (let j = 0; j < 3; j++) {
        const at = this.course.place(d - 0.18, 3.4),
          on = j === (step < 9 ? 0 : step === 9 ? 1 : 2);
        this.shape(
          this.markers,
          at.x,
          at.y + 1.92 + j * 0.21,
          at.z,
          at.heading,
          0,
          0.14,
          0.14,
          0.04,
          on ? [0x53f99a, 0xffd45f, 0xf7574b][j]! : 0x394641,
        );
      }
      if (this.markerCount === null) this.markerCount = lit;
    }
    for (const batch of [...this.bikes, this.bodies, this.markers]) {
      batch.instanceMatrix.needsUpdate = true;
      if (batch.instanceColor) batch.instanceColor.needsUpdate = true;
    }
  }

  dispose(): void {
    this.root.removeFromParent();
    for (const batch of [...this.bikes, this.bodies, this.markers]) {
      batch.dispose();
      batch.geometry.dispose();
    }
    this.frameMaterial.dispose();
    this.paint.dispose();
  }
}
