import { color, positionWorld, texture, uniform } from 'three/tsl';
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type PerspectiveCamera,
  type Vector3,
  type Texture,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { canvasTexture } from './world-kit';

const source = [
  [1526, 7.2],
  [1556, 10.8],
  [1594, 6.7],
  [2610, 7.7],
  [2645, 11.5],
  [2683, 8.2],
  [5890, -348],
  [6360, -373],
  [6940, -336],
] as const;
const pose = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

export class KilaueaVents {
  readonly root = new Group();
  private readonly tint = new Color();
  private readonly fade = uniform(1);
  private readonly lakeMaterial = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly surface = new BufferGeometry();
  private readonly lake = new Mesh(this.surface, this.lakeMaterial);
  private readonly joint = new Object3D();
  private readonly point = pose();
  private readonly lookout = pose();
  private readonly vapour = canvasTexture(128, 128, (g) => {
    let seed = 208;
    const random = () => (seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296;
    for (let i = 0; i < 77; i++) {
      const angle = random() * Math.PI * 2,
        distance = Math.sqrt(random()) * 37;
      const x = 64 + Math.cos(angle) * distance,
        y = 63 + Math.sin(angle) * distance,
        r = 12 + random() * 15;
      const cloud = g.createRadialGradient(x, y, 0, x, y, r);
      cloud.addColorStop(0, 'rgba(253,249,251,.24)');
      cloud.addColorStop(0.54, 'rgba(240,232,238,.12)');
      cloud.addColorStop(1, 'rgba(237,230,240,0)');
      g.fillStyle = cloud;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
  private readonly mist = new MeshBasicMaterial({
    map: this.vapour,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    opacity: 0.72,
    fog: false,
  });
  private readonly plumes = new InstancedMesh(
    new PlaneGeometry(1, 1),
    this.mist,
    source.length * 12,
  );
  private readonly reflected = canvasTexture(192, 128, (g) => {
    const wash = g.createRadialGradient(96, 64, 0, 96, 64, 64);
    wash.addColorStop(0, 'rgba(239,120,71,.55)');
    wash.addColorStop(0.4, 'rgba(216,79,49,.34)');
    wash.addColorStop(1, 'rgba(157,46,65,0)');
    g.fillStyle = wash;
    g.fillRect(0, 0, 192, 128);
  });
  private readonly glowMaterial = new MeshBasicMaterial({
    map: this.reflected,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    fog: false,
  });
  private readonly glowBank = new InstancedMesh(new PlaneGeometry(1, 1), this.glowMaterial, 3);
  private readonly drawn = {
    ventRise: null as number | null,
    sulphurDrift: null as number | null,
    lakeGlow: null as number | null,
  };
  static async load(course: Course) {
    const map = await new TextureLoader().loadAsync('courses/kilauea-lake.webp');
    return new KilaueaVents(course, map);
  }
  private constructor(
    private readonly course: Course,
    private readonly map: Texture,
  ) {
    map.colorSpace = SRGBColorSpace;
    map.wrapS = map.wrapT = RepeatWrapping;
    this.lakeMaterial.colorNode = texture(map, positionWorld.xz.mul(0.013))
      .rgb.mul(this.fade)
      .add(color(0x36100a));
    const points: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= 66; i++) {
      const d = 5600 + i * 25,
        width = 78 * Math.pow(Math.sin((Math.PI * i) / 66), 0.52) + 2;
      const centre = 365 + 15 * Math.sin(d / 177);
      for (const side of [-1, 1]) {
        const p = course.place(
          d,
          -centre + side * width * (1 + 0.09 * Math.sin(d / 42 + side)),
          this.point,
        );
        points.push(p.x, p.y - 143 + 1.4 * Math.sin(d / 145), p.z);
      }
      if (i) {
        const n = i * 2;
        indices.push(n - 2, n - 1, n, n - 1, n + 1, n);
      }
    }
    // Incandescent tongues reach over the nearest terrace below each overlook.
    for (const at of [5707, 7210]) {
      const start = points.length / 3;
      for (let i = 0; i < 31; i++) {
        const t = i / 30;
        const d = at - 74 + 148 * t;
        const width = 17 * Math.sin(t * Math.PI) ** 0.58 + 0.1;
        for (const side of [-1, 1]) {
          const off = 60 + width * side + 2 * Math.sin(t * 14);
          const p = course.place(d, -off, this.point);
          const depth = off < 72 ? -34 - ((off - 42) * 4) / 30 : -38 - ((off - 72) * 27) / 17;
          points.push(p.x, p.y + depth + 2.3, p.z);
        }
        if (i) {
          const n = start + i * 2;
          indices.push(n - 2, n - 1, n, n - 1, n + 1, n);
        }
      }
    }
    this.surface.setAttribute('position', new Float32BufferAttribute(points, 3));
    this.surface.setIndex(indices);
    this.plumes.frustumCulled = false;
    this.glowBank.frustumCulled = false;
    this.root.add(this.lake, this.plumes, this.glowBank);
  }
  update(metres: number, time: number, camera: PerspectiveCamera) {
    const glow = 1.27 + 0.21 * Math.sin(time * 0.81) + 0.09 * Math.sin(time * 2.33);
    this.fade.value = glow * 1.85;
    this.glowBank.count = 0;
    this.lake.visible = metres > 4800;
    this.drawn.lakeGlow = this.lake.visible ? glow : null;
    this.drawn.ventRise = this.drawn.sulphurDrift = null;
    let count = 0;
    source.forEach(([d, lane], vent) => {
      const far = vent >= 6;
      if ((far && metres < 4800) || (!far && Math.abs(d - metres) > 245)) return;
      const p = this.course.place(d, lane, this.point);
      if (far) {
        this.joint.position.set(p.x + 21, p.y - 62, p.z + 4);
        this.joint.quaternion.copy(camera.quaternion);
        this.joint.scale.set(330, 114, 1);
        this.joint.updateMatrix();
        this.glowBank.setMatrixAt(this.glowBank.count++, this.joint.matrix);
      }
      for (let j = 0; j < 12; j++) {
        const phase = (time * (far ? 0.057 : 0.13) + j / 12 + vent * 0.19) % 1;
        const ease = Math.sin(phase * Math.PI) ** 0.6;
        const rise = (far ? 95 : 8.9) * phase;
        const wind = (far ? 42 : 3.8) * phase ** 1.7;
        const spread = (far ? 31 : 1.08) * phase;
        const angle = j * 2.399 + vent * 0.72;
        const w = (far ? 22 : 1.4) + (far ? 67 : 5.6) * phase;
        this.joint.position.set(
          p.x + wind + spread * Math.cos(angle),
          p.y + (far ? -143 : 0.12) + rise,
          p.z + spread * Math.sin(angle),
        );
        this.joint.quaternion.copy(camera.quaternion);
        this.joint.rotateZ(0.34 * Math.sin(phase * 3 + j));
        this.joint.scale.set(w * ease, w * (far ? 0.68 : 1.06) * ease, 1);
        this.joint.updateMatrix();
        this.plumes.setMatrixAt(count, this.joint.matrix);
        this.tint.setHex(far && phase < 0.36 ? 0xf4764d : far ? 0xc99d9f : 0xd8ccda);
        this.plumes.setColorAt(count++, this.tint);
        if (!j && vent === 0) this.drawn.ventRise = rise;
        if (!j && vent === 3) this.drawn.sulphurDrift = wind;
      }
    });
    this.glowBank.instanceMatrix.needsUpdate = true;
    this.plumes.count = count;
    this.plumes.instanceMatrix.needsUpdate = true;
    if (this.plumes.instanceColor) this.plumes.instanceColor.needsUpdate = true;
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const station =
      metres > 6800
        ? 7240
        : metres > 5000
          ? 5680
          : metres > 3250
            ? 3940
            : metres > 2000
              ? 2620
              : 1540;
    const crater = station >= 5680;
    const fade = 1 - Math.abs(metres - station) / (crater ? 200 : 86);
    if (fade <= 0) return;
    const p = this.course.place(metres, 0, this.point);
    const t = this.course.place(
      crater ? (station === 5680 ? 5734 : 7210) : station + (station === 3940 ? 28 : 18),
      crater ? -82 : station === 3940 ? 11 : 10,
      this.lookout,
    );
    const dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.max(1, Math.hypot(dx, dz));
    const share = Math.min(1, 1.55 * fade);
    camera.x += (p.x - (dx / len) * 5.55 - camera.x) * share;
    camera.z += (p.z - (dz / len) * 5.55 - camera.z) * share;
    if (crater) camera.y += 3.7 * share;
    ahead.x += (p.x + (dx / len) * 14 - ahead.x) * share;
    ahead.z += (p.z + (dz / len) * 14 - ahead.z) * share;
    ahead.y += (p.y - (crater ? 0.85 : 0) - ahead.y) * share;
  }
  report() {
    return this.drawn;
  }
  dispose() {
    this.surface.dispose();
    this.lakeMaterial.dispose();
    this.map.dispose();
    this.plumes.geometry.dispose();
    this.plumes.dispose();
    this.mist.dispose();
    this.vapour.dispose();
    this.glowBank.geometry.dispose();
    this.glowBank.dispose();
    this.glowMaterial.dispose();
    this.reflected.dispose();
  }
}
