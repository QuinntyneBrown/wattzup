import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BufferGeometry } from 'three/webgpu';
import {
  BoxGeometry,
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
import { CopenhagenTrack } from './copenhagen-track';

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
  private readonly track: CopenhagenTrack;
  private readonly root = new Group();
  private readonly frameMaterial = new MeshLambertMaterial({ vertexColors: true });
  private readonly paint = new MeshLambertMaterial();
  private readonly bodies = new InstancedMesh(new SphereGeometry(0.5, 10, 7), this.paint, 680);
  private readonly markers = new InstancedMesh(new BoxGeometry(1, 1, 1), this.paint, 120);
  private readonly bikes = [0, 1, 2].map(
    (s) => new InstancedMesh(frame(s), this.frameMaterial, 48),
  );
  private readonly pose = new Object3D();
  private readonly limbAxis = new Vector3();
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
    this.track = new CopenhagenTrack(course, scene);
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
        // Align each limb with its two joints so the hand stays wrapped round the bar.
        const link = (start: Point, end: Point, width: number, tint: number) => {
          const dx = end[0] - start[0],
            dy = end[1] - start[1],
            dz = end[2] - start[2];
          const x = (start[0] + end[0]) * 0.5,
            z = (start[2] + end[2]) * 0.5;
          this.pose.position.set(
            at.x + x * c + z * s,
            at.y + (start[1] + end[1]) * 0.5,
            at.z - x * s + z * c,
          );
          this.limbAxis.set(dx * c + dz * s, dy, -dx * s + dz * c);
          this.pose.scale.set(width, this.limbAxis.length() + width * 0.52, width);
          this.pose.quaternion.setFromUnitVectors(UP, this.limbAxis.normalize());
          this.pose.updateMatrix();
          const i = this.bodies.count++;
          this.bodies.setMatrixAt(i, this.pose.matrix);
          this.bodies.setColorAt(i, this.colour.setHex(tint));
        };
        part(0, 1.23, 0.13, 0.43, 0.62, 0.28, -0.13, coat);
        part(0, 0.99, 0.16, 0.39, 0.23, 0.29, -0.04, coat);
        part(0, 1.52, 0.105, 0.14, 0.16, 0.15, 0, skin);
        part(0, 1.665, 0.075, 0.257, 0.31, 0.25, -0.025, skin);
        part(0, 1.66, -0.046, 0.077, 0.084, 0.088, 0, skin);
        part(0, 1.76, 0.096, 0.272, 0.18, 0.278, -0.12, id % 2 ? 0x584638 : 0x4c5963);
        if (id % 4 === 0) part(0, 1.57, 0.187, 0.185, 0.23, 0.15, 0, 0x644a35);
        for (const side of [-1, 1]) {
          part(side * 0.055, 1.692, -0.039, 0.026, 0.017, 0.017, 0, 0x4c453d);
          const a = phase + (side < 0 ? Math.PI : 0),
            foot = 0.32 + 0.15 * Math.sin(a),
            z = 0.14 * Math.cos(a);
          const knee: Point = [
            side * 0.13,
            0.61 + 0.07 * Math.sin(a),
            -0.075 + 0.075 * Math.cos(a),
          ];
          link([side * 0.105, 0.96, 0.17], knee, 0.167, 0x3c4850);
          link(knee, [side * 0.14, foot + 0.06, z + 0.045], 0.125, 0x44525a);
          part(side * 0.14, foot, z, 0.14, 0.105, 0.255, 0, 0x544a42);
          if (style && this.cargoPedalY === null) this.cargoPedalY = at.y + foot;
          const elbow: Point = [side * 0.248, 1.22, 0.045];
          link([side * 0.158, 1.44, 0.08], elbow, 0.139, coat);
          link(elbow, [side * 0.28, 1.13, -0.27], 0.117, coat);
          part(side * 0.28, 1.13, -0.295, 0.093, 0.105, 0.11, 0, skin);
        }
      }
    }
    // Commuter parking at cafés and services, with the bike leaning into its own stand.
    for (
      let d = Math.max(0, Math.floor((distance - 30) / 195) * 195);
      d < distance + 175;
      d += 195
    ) {
      if ((d > 2290 && d < 2870) || (d > 10170 && d < 10740)) continue;
      for (let i = 0; i < 5; i++) {
        const at = this.course.place(d + i * 0.83, 5.7);
        this.pose.position.set(at.x, at.y - 0.005, at.z);
        this.pose.rotation.set(0, at.heading + 1.14 + (i % 2) * 0.11, -0.09, 'YXZ');
        this.pose.scale.set(1, 1, 1);
        this.pose.updateMatrix();
        this.bikes[0]!.setMatrixAt(this.bikes[0]!.count++, this.pose.matrix);
      }
    }
    if (distance > 3970 && distance < 4390) {
      for (let i = 0; i < 7; i++) {
        const t = seconds * 0.52 + i,
          at = this.course.place(4225 + i * 7 + Math.sin(t * 0.16) * 4.5, 21.5 + (i % 3) * 2.1);
        this.shape(
          this.bodies,
          at.x,
          at.y - 2.42,
          at.z,
          at.heading,
          0,
          0.25,
          0.27,
          0.25,
          SKIN[i % 4]!,
        );
        this.shape(
          this.bodies,
          at.x,
          at.y - 2.31,
          at.z,
          at.heading,
          0,
          0.26,
          0.12,
          0.25,
          i % 2 ? 0xb05744 : 0xcdc3ab,
        );
        for (const side of [-1, 1]) {
          const phase = t * 2 + (side + 1) * 1.57;
          this.shape(
            this.bodies,
            at.x + side * 0.29,
            at.y - 2.51 + 0.14 * Math.sin(phase),
            at.z + 0.21 * Math.cos(phase),
            at.heading,
            phase,
            0.135,
            0.38,
            0.135,
            SKIN[i % 4]!,
          );
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
    this.track.dispose();
    for (const batch of [...this.bikes, this.bodies, this.markers]) {
      batch.dispose();
      batch.geometry.dispose();
    }
    this.frameMaterial.dispose();
    this.paint.dispose();
  }
}
