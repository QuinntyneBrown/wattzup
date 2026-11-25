import { texture, positionWorld, uniform, uv, vec2 } from 'three/tsl';
import type { Vector3 } from 'three/webgpu';
import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  MirroredRepeatWrapping,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  type BufferGeometry,
  type Material,
  type Texture,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { canvasTexture } from './world-kit';

const COUNT = 60;
const COATS = [0x7e4c3d, 0x674639, 0x99584c, 0xd37593, 0x42a2a1, 0xdaaa67, 0x716594];
const SHIRTS = [0xcb875b, 0x8b6b83, 0xb9a775, 0x668376, 0x658691, 0x994f55];
const pose = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
interface Batch {
  mesh: InstancedMesh;
  used: number;
}

export class JouvertBands {
  readonly group = new Group();
  readonly road = new MeshBasicNodeMaterial({ side: DoubleSide });
  readonly horizon: Mesh<SphereGeometry, MeshBasicNodeMaterial>;
  private readonly morning = uniform(0.46);
  private readonly scratch = pose();
  private readonly rider = pose();
  private readonly target = pose();
  private readonly joint = new Object3D();
  private readonly colour = new Color();
  private readonly coat = new MeshLambertMaterial({ emissive: 0x15101b });
  private readonly boxes = this.batch(new BoxGeometry(), 280);
  private readonly bodies = this.batch(new SphereGeometry(1, 9, 7), COUNT * 16 + 130);
  private readonly rings = this.batch(new TorusGeometry(1, 0.15, 5, 15), 390);
  private readonly horns = this.batch(new ConeGeometry(1, 1, 7), 120);
  private readonly pans = this.batch(new CylinderGeometry(0.94, 0.76, 1, 15), 28);
  private readonly mist = new MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  private readonly puffs = this.batch(new PlaneGeometry(), 20, this.mist);
  private readonly batches = [
    this.boxes,
    this.bodies,
    this.rings,
    this.horns,
    this.pans,
    this.puffs,
  ];
  private readonly dirt = canvasTexture(512, 512, (g) => {
    let seed = 2145;
    const rand = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    g.fillStyle = '#433b41';
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 15000; i++) {
      g.fillStyle = i % 2 ? 'rgba(24,23,29,.28)' : 'rgba(191,161,137,.23)';
      g.fillRect(rand() * 512, rand() * 512, rand() * 2.4 + 0.5, rand() * 1.8 + 0.5);
    }
    for (let i = 0; i < 38; i++) {
      const x = rand() * 512,
        y = rand() * 512,
        scale = 1 + rand() * 9;
      g.fillStyle = ['#745457', '#5d6964', '#705977', '#7d6e54', '#51453e'][i % 5]!;
      for (let j = 0; j < 23; j++) {
        const a = rand() * Math.PI * 2,
          r = rand() * scale * 1.8;
        g.beginPath();
        g.ellipse(
          x + r * Math.cos(a),
          y + r * Math.sin(a),
          rand() * scale * 0.5 + 0.35,
          rand() * scale * 0.3 + 0.24,
          a,
          0,
          Math.PI * 2,
        );
        g.fill();
      }
    }
  });
  private readonly dust = canvasTexture(96, 96, (g) => {
    const fade = g.createRadialGradient(48, 48, 2, 48, 48, 46);
    fade.addColorStop(0, 'rgba(255,255,255,.28)');
    fade.addColorStop(0.37, 'rgba(255,255,255,.18)');
    fade.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = fade;
    g.fillRect(0, 0, 96, 96);
  });
  speakerTruck = 0;
  chainSwing = 0;
  panMallet = 0;
  crowdClearance = 0;
  static async load(course: Course) {
    const hills = await new TextureLoader().loadAsync('courses/jouvert-hills.webp');
    return new JouvertBands(course, hills);
  }
  private constructor(
    private readonly course: Course,
    private readonly hills: Texture,
  ) {
    hills.colorSpace = SRGBColorSpace;
    hills.wrapS = MirroredRepeatWrapping;
    const sky = new MeshBasicNodeMaterial({
      side: DoubleSide,
      depthWrite: false,
      fog: false,
    });
    sky.colorNode = texture(
      hills,
      vec2(uv().x.mul(5), uv().y.sub(0.5).mul(5.5).add(0.26).clamp(0.01, 0.99)),
    ).rgb.mul(this.morning);
    this.horizon = new Mesh(new SphereGeometry(9600, 80, 30), sky);
    const mid = course.place(course.length / 2);
    this.horizon.position.set(mid.x, mid.y, mid.z);
    this.horizon.renderOrder = -0.5;
    this.dirt.wrapS = this.dirt.wrapT = MirroredRepeatWrapping;
    this.road.colorNode = texture(this.dirt, positionWorld.xz.mul(0.135)).rgb.mul(
      this.morning.mul(0.8).add(0.48),
    );
    this.mist.map = this.dust;
    for (const b of this.batches) {
      b.mesh.frustumCulled = false;
      b.mesh.setColorAt(0, this.colour);
      this.group.add(b.mesh);
    }
  }
  private batch(geometry: BufferGeometry, capacity: number, material: Material = this.coat): Batch {
    return { mesh: new InstancedMesh(geometry, material, capacity), used: 0 };
  }
  private shape(
    batch: Batch,
    p: CoursePlace,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: number,
    roll = 0,
    yaw = 0,
    pitch = 0,
  ) {
    const a = p.heading + Math.PI / 2,
      cs = Math.cos(a),
      sn = Math.sin(a);
    this.joint.position.set(p.x + x * cs + z * sn, p.y + y, p.z - x * sn + z * cs);
    this.joint.rotation.set(pitch, a + yaw, roll, 'YXZ');
    this.joint.scale.set(w, h, d);
    this.joint.updateMatrix();
    batch.mesh.setMatrixAt(batch.used, this.joint.matrix);
    batch.mesh.setColorAt(batch.used++, this.colour.setHex(c));
  }
  private revellers(metres: number, time: number) {
    const st =
      this.course.file.stages.find((s) => metres < s.to) ?? this.course.file.stages.at(-1)!;
    const sprint = st.level >= 24;
    const edge = Math.max(0, Math.min(1, (metres - st.from) / 16, (st.to - metres) / 16));
    const open = sprint ? edge : 0;
    this.crowdClearance = Infinity;
    let firstChain = true;
    const first = Math.floor((metres - 16) / 2.6);
    for (let i = 0; i < COUNT; i++) {
      const id = first + i,
        side = id % 2 ? 1 : -1;
      const d = id * 2.6,
        phase = time * (2.9 + (id % 5) * 0.14) + id * 0.83;
      const wave = Math.sin(phase),
        bob = 0.056 * Math.cos(phase * 2);
      const devil = d > 1280 && d < 1570 && id % 3 !== 0;
      const lane = side * (1.94 + open * 1.05 + Math.abs(id % 5) * 0.56 + 0.18 * wave);
      if (d >= metres && d < metres + 40)
        this.crowdClearance = Math.min(this.crowdClearance, Math.abs(lane));
      const p = this.course.place(d, lane, this.scratch);
      p.heading += side * (1.19 + 0.14 * wave);
      const skin = devil ? 0x285aac : COATS[Math.abs(id) % COATS.length]!;
      const fabric = devil ? 0x33669b : SHIRTS[Math.abs(id) % SHIRTS.length]!;
      const ell = (
        x: number,
        y: number,
        z: number,
        w: number,
        h: number,
        l: number,
        c: number,
        r = 0,
      ) => this.shape(this.bodies, p, x, y + bob, z, w, h, l, c, r);
      ell(0, 1.07, 0, 0.207, 0.318, 0.161, fabric, 0.08 * wave);
      ell(0.02, 1.53, 0, 0.137, 0.17, 0.13, skin);
      ell(0, 1.67, 0, 0.139, 0.063, 0.132, devil ? 0x223b5d : 0x393135);
      ell(0, 0.77, 0, 0.2, 0.15, 0.16, 0x534956);
      for (const s of [-1, 1]) {
        const step = s * wave;
        ell(s * 0.117, 0.57, 0.025 * step, 0.103, 0.21, 0.102, 0x504557, step * 0.16);
        ell(
          s * (0.134 + step * 0.028),
          0.272,
          0.065 * step,
          0.073,
          0.169,
          0.078,
          skin,
          -step * 0.21,
        );
        ell(s * (0.14 + step * 0.035), 0.106, 0.06 + 0.067 * step, 0.09, 0.067, 0.139, 0x39313d);
        const raise = 0.52 + 0.38 * Math.sin(phase + s * 0.8);
        ell(s * 0.24, 1.22 + raise * 0.09, 0, 0.078, 0.208, 0.083, fabric, s * raise);
        ell(
          s * (0.35 + 0.07 * raise),
          1.18 + 0.28 * raise,
          0.03,
          0.064,
          0.183,
          0.073,
          skin,
          -s * (0.7 + raise),
        );
        if (devil)
          this.shape(
            this.horns,
            p,
            s * 0.096,
            1.79 + bob,
            0,
            0.056,
            0.32,
            0.055,
            0xbba582,
            -s * 0.37,
          );
      }
      if (devil) {
        const swing = Math.sin(phase + 0.43);
        for (let j = 0; j < 6; j++)
          this.shape(
            this.rings,
            p,
            0.43 + 0.045 * j * swing,
            1.3 - 0.115 * j + bob,
            0,
            0.042,
            0.078,
            0.046,
            0x9a9d9e,
            -0.15 * swing,
            (j % 2) * 0.9,
          );
        if (firstChain) {
          this.chainSwing = swing;
          firstChain = false;
        }
      }
    }
  }
  private truck(metres: number, time: number) {
    const station = 2706 + 18 * Math.sin(time * 0.035);
    if (Math.abs(metres - station) > 230) return;
    const p = this.course.place(station, 2.62, this.scratch);
    const box = (x: number, y: number, z: number, w: number, h: number, l: number, c: number) =>
      this.shape(this.boxes, p, x, y, z, w, h, l, c);
    box(0, 0.94, 0, 8.5, 0.44, 2.35, 0x515062);
    box(3.16, 1.52, 0, 2, 1.23, 2.18, 0xbb774e);
    box(3.1, 2.28, 0, 1.77, 0.72, 2.05, 0x524c62);
    box(3.11, 2.7, 0, 2.05, 0.15, 2.23, 0xddae70);
    for (const s of [-1, 1]) {
      for (const x of [-3.0, -1.89, 3.15])
        this.shape(this.rings, p, x, 0.57, s * 1.11, 0.43, 0.43, 1.15, 0x33303c);
      box(-0.85, 2.53, s * 1.06, 5.85, 2.89, 0.19, 0x433d4a);
      for (let j = 0; j < 4; j++)
        for (let k = 0; k < 2; k++) {
          const x = -3 + j * 1.41,
            y = 1.92 + k * 1.14;
          box(x, y, s * 1.16, 1.27, 1.05, 0.16, 0x69616b);
          this.shape(this.bodies, p, x, y, s * 1.29, 0.47, 0.47, 0.06, 0x2a2733);
          this.shape(this.rings, p, x, y, s * 1.33, 0.395, 0.395, 0.33, 0x86818c);
          this.shape(this.bodies, p, x, y, s * 1.35, 0.17, 0.17, 0.045, 0x48434e);
        }
      for (const x of [-3.7, -1.2, 1.55]) box(x, 4.28, s * 0.99, 0.085, 0.72, 0.085, 0xbaabba);
      box(-1.05, 4.58, s * 0.99, 5.4, 0.07, 0.07, 0xb8a9c3);
      for (let j = 0; j < 8; j++)
        box(-3.55 + j * 0.74, 4.03, s * 1.2, 0.26, 0.15, 0.12, j % 2 ? 0xda689e : 0x70bfca);
    }
    box(-0.95, 3.95, 0, 5.9, 0.17, 2.43, 0x705472);
    for (let j = 0; j < 4; j++) {
      const yy = 1.88 + Math.floor(j / 2) * 1.08,
        zz = ((j % 2) - 0.5) * 1.06;
      this.shape(this.rings, p, -3.96, yy, zz, 0.44, 0.44, 0.32, 0xa69aa3, 0, Math.PI / 2);
      this.shape(this.bodies, p, -3.94, yy, zz, 0.075, 0.4, 0.4, 0x393540);
    }
    this.speakerTruck = p.x;
  }
  private steelband(metres: number, time: number) {
    const d = 3688 + 5 * Math.sin(time * 0.072);
    if (Math.abs(metres - d) > 180) return;
    const p = this.course.place(d, -2.86, this.scratch);
    for (let row = 0; row < 4; row++) {
      const x = (row - 1.5) * 1.62;
      for (const z of [-0.66, 0.66]) {
        this.shape(this.rings, p, x - 0.51, 0.2, z, 0.15, 0.15, 0.25, 0x43424a);
        this.shape(this.boxes, p, x, 0.43, z, 1.58, 0.09, 0.09, 0x9098a3);
        this.shape(this.boxes, p, x - 0.54, 0.78, z, 0.075, 0.76, 0.075, 0xbcb8b8);
      }
      for (const z of [-0.35, 0.37]) {
        this.shape(this.pans, p, x, 1.08, z, 0.65, row === 3 ? 0.77 : 0.44, 0.65, 0x8e929c);
        this.shape(this.pans, p, x, 1.32, z, 0.57, 0.023, 0.57, 0x515b72);
        this.shape(this.rings, p, x, 1.34, z, 0.315, 0.315, 0.42, 0xd9d7d4, 0, 0, Math.PI / 2);
      }
      this.shape(this.bodies, p, x, 1.13, 0.94, 0.22, 0.32, 0.16, 0xd6ad45);
      this.shape(this.bodies, p, x, 1.56, 0.94, 0.13, 0.157, 0.12, 0x9e7059);
      this.shape(this.bodies, p, x, 1.69, 0.94, 0.165, 0.072, 0.16, 0xeac155);
      for (const s of [-1, 1]) {
        this.shape(this.bodies, p, x + s * 0.12, 0.45, 0.94, 0.08, 0.4, 0.1, 0x535871);
        const lift = 0.13 * Math.sin(time * 8.5 + s * 1.2 + row);
        this.shape(this.bodies, p, x + s * 0.27, 1.24 + lift, 0.7, 0.081, 0.185, 0.12, 0xad7c5b);
        this.shape(this.boxes, p, x + s * 0.27, 1.43 + lift, 0.47, 0.035, 0.036, 0.27, 0xcdad89);
        this.shape(this.bodies, p, x + s * 0.27, 1.43 + lift, 0.32, 0.048, 0.046, 0.05, 0xeeeecc);
        if (!row && s === 1) this.panMallet = 1.43 + lift;
      }
    }
  }
  update(metres: number, time: number) {
    for (const b of this.batches) b.used = 0;
    this.morning.value = 0.44 + 1.3 * Math.min(1, metres / this.course.length);
    this.revellers(metres, time);
    this.truck(metres, time);
    this.steelband(metres, time);
    if ((metres > 1250 && metres < 1600) || (metres > 2490 && metres < 2875)) {
      for (let i = 0; i < 17; i++) {
        const offset = i * 7.5,
          span = 150;
        const d = offset + span * Math.ceil((metres - 15 - offset) / span),
          phase = (time * 0.28 + i * 0.17) % 1;
        const p = this.course.place(d, (i % 2 ? 1 : -1) * (2.95 + 0.84 * phase), this.scratch);
        const size = Math.sin(Math.PI * phase) * 3.7;
        this.shape(
          this.puffs,
          p,
          0,
          1.7 + phase * 2.2,
          0,
          size,
          size,
          1,
          [0xa3838e, 0xc89d73, 0x8376ab][i % 3]!,
          0,
          Math.PI / 2,
        );
      }
    }
    for (const b of this.batches) {
      b.mesh.count = b.used;
      b.mesh.visible = b.used > 0;
      b.mesh.instanceMatrix.needsUpdate = true;
      if (b.mesh.instanceColor) b.mesh.instanceColor.needsUpdate = true;
    }
  }
  aim(metres: number, camera: Vector3, ahead: CoursePlace) {
    if (Math.abs(metres - 4820) > 95) return;
    const q = this.course.place(metres, 0, this.rider),
      t = this.course.place(4875, -32, this.target);
    const dx = t.x - q.x,
      dz = t.z - q.z,
      len = Math.max(1, Math.hypot(dx, dz)),
      share = Math.min(1, (1 - Math.abs(metres - 4820) / 95) * 1.5);
    camera.x += (q.x - (5.3 * dx) / len - camera.x) * share;
    camera.z += (q.z - (5.3 * dz) / len - camera.z) * share;
    ahead.x += (q.x + (14 * dx) / len - ahead.x) * share;
    ahead.z += (q.z + (14 * dz) / len - ahead.z) * share;
    ahead.y += 1.05 * share;
  }
  dispose() {
    for (const b of this.batches) {
      b.mesh.geometry.dispose();
      b.mesh.dispose();
    }
    this.coat.dispose();
    this.mist.dispose();
    this.dust.dispose();
    this.road.dispose();
    this.dirt.dispose();
    this.horizon.geometry.dispose();
    this.horizon.material.dispose();
    this.hills.dispose();
    this.group.clear();
  }
}
