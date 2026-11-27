import { texture, positionWorld } from 'three/tsl';
import {
  MeshBasicNodeMaterial,
  MirroredRepeatWrapping,
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { canvasTexture } from './world-kit';

const PIGMENTS = [0xe74987, 0xf6c531, 0x40af75, 0x409bbb];
const CLOTH = [0xad4860, 0xf6d69a, 0x3e9290, 0xe09a40, 0x846496, 0x5584ae];
const DANCERS = 30;
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

/** A fixed roadside object re-enters ahead only after it has passed behind the camera. */
function visibleStation(metres: number, offset: number, repeat: number) {
  return offset + repeat * Math.ceil((metres - 20 - offset) / repeat);
}

export class JaipurFestival {
  readonly group = new Group();
  private readonly joint = new Object3D();
  private readonly point = place();
  readonly tarmac = new MeshBasicNodeMaterial({ side: DoubleSide });

  private readonly form = new SphereGeometry(1, 10, 7);
  private readonly block = new BoxGeometry();
  private readonly cloth = new MeshBasicMaterial();
  private readonly people = new InstancedMesh(this.form, this.cloth, DANCERS * 10);
  private readonly street = new InstancedMesh(this.block, this.cloth, 200);
  private readonly wheels = new InstancedMesh(this.form, this.cloth, 150);
  private readonly plane = new PlaneGeometry();
  private readonly dustMap = canvasTexture(128, 128, (g) => {
    let seed = 2143;
    const rand = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296;
    for (let i = 0; i < 168; i++) {
      const a = rand() * Math.PI * 2,
        r = Math.sqrt(rand()) * 44;
      const x = 64 + Math.cos(a) * r,
        y = 64 + Math.sin(a) * r,
        rad = 7 + rand() * 14;
      const glow = g.createRadialGradient(x, y, 0, x, y, rad);
      glow.addColorStop(0, 'rgba(255,255,255,.26)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = glow;
      g.fillRect(x - rad, y - rad, 2 * rad, 2 * rad);
    }
  });
  private readonly powderMaterial = new MeshBasicMaterial({
    map: this.dustMap,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  private readonly wisps = new InstancedMesh(this.plane, this.powderMaterial, 24);
  private readonly signs: InstancedMesh;
  private readonly signMaterial: MeshBasicMaterial;
  private readonly colour = new Color();
  private roadCell = NaN;
  private skinSlot = 0;
  private boxSlot = 0;
  private wheelSlot = 0;
  throwHeight = 0;
  powderRise = 0;
  rickshawPosition = 0;

  static async load(course: Course) {
    const atlas = await new TextureLoader().loadAsync('courses/jaipur-bazaar.webp');
    atlas.colorSpace = SRGBColorSpace;
    try {
      const asphalt = await new TextureLoader().loadAsync('courses/jaipur-asphalt.webp');
      return new JaipurFestival(course, atlas, asphalt);
    } catch (error) {
      atlas.dispose();
      throw error;
    }
  }

  private constructor(
    private readonly course: Course,
    private readonly atlas: Texture,
    private readonly asphalt: Texture,
  ) {
    asphalt.colorSpace = SRGBColorSpace;
    asphalt.wrapS = asphalt.wrapT = MirroredRepeatWrapping;
    this.tarmac.colorNode = texture(asphalt, positionWorld.xz.mul(0.115)).rgb;
    for (const batch of [this.people, this.street, this.wheels, this.wisps])
      batch.setColorAt(0, this.colour);
    this.signMaterial = new MeshBasicMaterial({ map: atlas, side: DoubleSide });
    this.signs = new InstancedMesh(this.plane, this.signMaterial, 22);
    for (const p of [this.people, this.street, this.wheels, this.wisps, this.signs]) {
      p.frustumCulled = false;
      this.group.add(p);
    }
  }

  private part(
    batch: InstancedMesh,
    slot: number,
    p: CoursePlace,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    tint: number,
    roll = 0,
    yaw = 0,
  ) {
    const a = p.heading + Math.PI / 2;
    this.joint.position.set(
      p.x + x * Math.cos(a) + z * Math.sin(a),
      p.y + y,
      p.z - x * Math.sin(a) + z * Math.cos(a),
    );
    this.joint.rotation.set(0, a + yaw, roll, 'YXZ');
    this.joint.scale.set(w, h, d);
    this.joint.updateMatrix();
    batch.setMatrixAt(slot, this.joint.matrix);
    batch.setColorAt(slot, this.colour.setHex(tint));
  }

  update(metres: number, time: number) {
    const cell = Math.floor(metres / 24);
    if (cell !== this.roadCell) {
      this.roadCell = cell;
      let slot = 0;
      for (let i = -1; i <= 9; i++)
        for (const side of [-1, 1]) {
          const station = (cell + i) * 24;
          if (side < 0 && Math.abs(station - 2992) < 89) continue;
          const p = this.course.place(station, side * 13.75, this.point);
          this.joint.position.set(p.x, p.y + 1.72, p.z);
          this.joint.rotation.set(0, p.heading + (side < 0 ? Math.PI / 2 : -Math.PI / 2), 0);
          this.joint.scale.set(22, 3.3, 1);
          this.joint.updateMatrix();
          this.signs.setMatrixAt(slot++, this.joint.matrix);
        }
      this.signs.count = slot;
      this.signs.instanceMatrix.needsUpdate = true;
    }
    this.skinSlot = this.boxSlot = this.wheelSlot = 0;
    const festival = metres > 4230 && metres < 4900;

    for (let i = 0; i < DANCERS; i++) {
      const side = i % 2 ? 1 : -1;
      const d = visibleStation(metres, (i * 41) % 155, 155);
      const p = this.course.place(d, side * ((festival ? 4.9 : 8.1) + (i % 4) * 0.57), this.point);
      const phase = time * (festival ? 3.8 : 1.6) + i * 1.87;
      const lift = Math.sin(phase),
        bounce = festival ? 0.07 * Math.abs(lift) : 0;
      const tint = CLOTH[i % CLOTH.length]!,
        skin = i % 3 ? 0x995f46 : 0xb78059;
      const body = (
        x: number,
        y: number,
        z: number,
        w: number,
        h: number,
        l: number,
        c: number,
        r = 0,
      ) => this.part(this.people, this.skinSlot++, p, x, y + bounce, z, w, h, l, c, r);
      body(0, 1.04, 0, 0.22, 0.36, 0.16, tint);
      body(0, 1.51, 0, 0.137, 0.173, 0.13, skin);
      body(0, 1.65, 0, 0.14, 0.074, 0.135, 0x46332e);
      body(0, 0.7, 0, 0.21, 0.2, 0.155, tint);
      for (const s of [-1, 1]) {
        body(s * 0.13, 0.39, 0, 0.078, 0.34, 0.086, 0x595663, s * lift * 0.13);
        const arm = festival ? 0.55 + 0.43 * Math.sin(phase + s * 0.8) : -0.34;
        body(s * 0.27, 1.18 + arm * 0.13, 0, 0.077, 0.22, 0.078, tint, s * arm);
        body(
          s * (0.38 + 0.07 * arm),
          1.12 + arm * 0.41,
          0.035,
          0.069,
          0.18,
          0.063,
          skin,
          -s * (0.7 + arm),
        );
      }
      if (!i) this.throwHeight = 1.12 + (0.55 + 0.43 * Math.sin(phase - 0.8)) * 0.41 + bounce;
    }
    this.wisps.visible = festival;
    if (festival) {
      for (let i = 0; i < 24; i++) {
        const phase = (time * 0.48 + i * 0.187) % 1,
          side = i % 2 ? 1 : -1;
        const p = this.course.place(
          visibleStation(metres, (i * 31) % 137, 137),
          side * (4.6 + (i % 3) * 0.64 - phase * 1.1),
          this.point,
        );
        const y = 1.6 + phase * 3 + 0.27 * Math.sin(i);
        const size = 5.2 * Math.sin(Math.PI * phase);
        this.part(
          this.wisps,
          i,
          p,
          0,
          y,
          0,
          size,
          size * 0.88,
          1,
          PIGMENTS[i % 4]!,
          0,
          Math.PI / 2,
        );
        if (!i) this.powderRise = y;
      }
    }
    for (let i = 0; i < 5; i++) {
      const d = visibleStation(metres, i * 48 - time * 2.1, 240);
      const p = this.course.place(d, i % 2 ? 5.8 : -5.5, this.point);
      const box = (x: number, y: number, z: number, w: number, h: number, l: number, c: number) =>
        this.part(this.street, this.boxSlot++, p, x, y, z, w, h, l, c);
      const oval = (x: number, y: number, z: number, w: number, h: number, l: number, c: number) =>
        this.part(this.wheels, this.wheelSlot++, p, x, y, z, w, h, l, c);
      if (i === 1) this.rickshawPosition = p.x;
      const rickshaw = i % 3 !== 2;
      for (const s of rickshaw ? [-1, 1] : [0])
        oval(-0.74, 0.32, s * 0.53, 0.31, 0.33, 0.13, 0x353635);
      oval(0.86, 0.29, 0, 0.26, 0.28, 0.12, 0x383736);
      box(-0.24, 0.58, 0, 1.75, 0.4, rickshaw ? 1.25 : 0.4, rickshaw ? 0x368753 : 0x526c9b);
      if (rickshaw) {
        box(-0.9, 1.04, 0, 0.21, 0.83, 1.25, 0x558650);
        for (const s of [-1, 1]) box(0.43, 1.35, s * 0.55, 0.08, 0.86, 0.08, 0x384749);
        box(-0.18, 1.83, 0, 1.85, 0.19, 1.33, 0xe4b93d);
        box(0.72, 0.94, 0, 0.38, 0.65, 0.91, 0xe8bb42);
        box(0.91, 0.86, 0, 0.07, 0.16, 0.33, 0xffde96);
      }
      oval(0.1, 1.12, 0, 0.16, 0.3, 0.2, 0x6f88a2);
      oval(0.1, 1.55, 0, 0.12, 0.15, 0.13, 0x9c704f);
    }
    for (let i = 0; i < 3; i++) {
      const p = this.course.place(
        visibleStation(metres, 31 + i * 79, 238),
        6.65 + 0.45 * i,
        this.point,
      );
      const cow = (x: number, y: number, z: number, w: number, h: number, l: number, c: number) =>
        this.part(this.wheels, this.wheelSlot++, p, x, y, z, w, h, l, c);
      const hide = i % 2 ? 0xb9906e : 0xc7b89f;
      cow(0, 0.88, 0, 0.84, 0.43, 0.34, hide);
      cow(0.47, 1.14, 0, 0.31, 0.33, 0.26, hide);
      cow(0.79, 1.03, 0, 0.3, 0.22, 0.21, hide);
      for (const s of [-1, 1]) {
        cow(0.7, 1.31, s * 0.15, 0.047, 0.16, 0.047, 0x7f6b55);
        for (const x of [-0.49, 0.43]) cow(x, 0.38, s * 0.18, 0.073, 0.37, 0.075, hide);
      }
    }
    this.people.count = this.skinSlot;
    this.street.count = this.boxSlot;
    this.wheels.count = this.wheelSlot;
    for (const b of [this.people, this.street, this.wheels, this.wisps]) {
      b.instanceMatrix.needsUpdate = true;
      if (b.instanceColor) b.instanceColor.needsUpdate = true;
    }
  }
  dispose() {
    for (const batch of [this.people, this.street, this.wheels, this.wisps, this.signs])
      batch.dispose();
    for (const geom of [this.form, this.block, this.plane]) geom.dispose();
    for (const m of [this.cloth, this.signMaterial, this.powderMaterial]) m.dispose();
    this.dustMap.dispose();
    this.atlas.dispose();
    this.asphalt.dispose();
    this.tarmac.dispose();
    this.group.clear();
  }
}
