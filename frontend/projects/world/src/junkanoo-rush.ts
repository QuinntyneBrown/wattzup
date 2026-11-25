import { color, mix, positionWorld, texture, uniform, uv } from 'three/tsl';
import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Texture,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { canvasTexture } from './world-kit';

const GROUPS = [
  { at: 2310, name: 'VALLEY BOYS', ink: '#f1a424', field: '#4e242d', costume: 0 },
  { at: 4760, name: 'SAXONS', ink: '#91edda', field: '#3e315c', costume: 1 },
  { at: 9480, name: 'ROOTS', ink: '#ffbee9', field: '#512954', costume: 2 },
];
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

export class JunkanooRush {
  readonly root = new Group();
  private readonly dawn = uniform(0);
  private readonly sky = new MeshBasicNodeMaterial({
    side: DoubleSide,
    fog: false,
    depthWrite: false,
  });
  private readonly dome = new Mesh(new SphereGeometry(6700, 48, 16), this.sky);
  private readonly road = new MeshBasicNodeMaterial({ side: DoubleSide });
  readonly materials = { Ground: this.road };
  private readonly grain = canvasTexture(512, 512, (g) => {
    let seed = 2146;
    const rnd = () => (seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296;
    g.fillStyle = '#504953';
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 17000; i++) {
      const x = rnd() * 512,
        y = rnd() * 512;
      g.fillStyle = i % 2 ? '#594f59' : '#453f49';
      g.fillRect(x, y, 1 + rnd() * 2, 1.6);
    }
    const paper = ['#db916d', '#bda247', '#549fab', '#a46a94', '#86a965', '#dbba9a'];
    for (let i = 0; i < 420; i++) {
      g.save();
      g.translate(rnd() * 512, rnd() * 512);
      g.rotate(rnd() * Math.PI);
      g.fillStyle = paper[i % paper.length]!;
      g.fillRect(0, 0, 1.4 + rnd() * 5, 0.9 + rnd() * 2);
      g.restore();
    }
  });
  private readonly joint = new Object3D();
  private readonly pose = place();
  private readonly landmark = place();
  private readonly colour = new Color();
  private readonly tint = new MeshLambertMaterial({ emissive: 0x171018 });
  private readonly parts = [
    new InstancedMesh(new BoxGeometry(), this.tint, 320),
    new InstancedMesh(new SphereGeometry(1, 8, 6), this.tint, 320),
    new InstancedMesh(new CylinderGeometry(0.8, 1, 1, 14), this.tint, 220),
  ];
  private readonly used = [0, 0, 0];
  private readonly costumes: InstancedMesh<PlaneGeometry, MeshBasicMaterial>[] = [];
  private readonly counts = [0, 0, 0, 0];
  private readonly banners = GROUPS.map(({ name, field, ink }) => {
    const map = canvasTexture(512, 128, (g) => {
      g.fillStyle = field;
      g.fillRect(0, 0, 512, 128);
      g.strokeStyle = ink;
      g.lineWidth = 6;
      g.strokeRect(5, 6, 502, 116);
      g.fillStyle = ink;
      g.textAlign = 'center';
      g.font = 'bold 67px sans-serif';
      g.fillText(name, 256, 84, 456);
    });
    const mesh = new Mesh(
      new PlaneGeometry(4.5, 1.12),
      new MeshBasicMaterial({ map, side: DoubleSide }),
    );
    this.root.add(mesh);
    return mesh;
  });
  private readonly submitted = {
    rushCrown: null as number | null,
    drumHand: null as number | null,
    cowbellHand: null as number | null,
  };
  static async load(course: Course) {
    const figures = await new TextureLoader().loadAsync('courses/junkanoo-costumes.webp');
    return new JunkanooRush(course, figures);
  }
  private constructor(
    private readonly course: Course,
    private readonly figures: Texture,
  ) {
    figures.colorSpace = SRGBColorSpace;
    for (let i = 0; i < 4; i++) {
      const geometry = new PlaneGeometry(1, 1),
        coords = geometry.attributes['uv']!;
      for (let j = 0; j < coords.count; j++)
        coords.setX(j, (i + 0.008 + coords.getX(j) * 0.984) / 4);
      const material = new MeshBasicMaterial({
        map: figures,
        alphaTest: 0.42,
        side: DoubleSide,
        color: 0xd9cbd3,
      });
      const batch = new InstancedMesh(geometry, material, 100);
      batch.frustumCulled = false;
      this.costumes.push(batch);
      this.root.add(batch);
    }
    this.grain.wrapS = this.grain.wrapT = RepeatWrapping;
    this.road.colorNode = texture(this.grain, positionWorld.xz.mul(0.136)).rgb;
    const height = uv().y.sub(0.48).mul(5).clamp(0, 1);
    this.sky.colorNode = mix(
      mix(color(0x584263), color(0x101733), height),
      mix(color(0xf4a6a0), color(0x697fad), height),
      this.dawn,
    );
    this.dome.renderOrder = -0.5;
    this.root.add(this.dome);
    for (const mesh of this.parts) {
      mesh.frustumCulled = false;
      this.root.add(mesh);
    }
  }
  private transform(
    p: CoursePlace,
    lane: number,
    y: number,
    along: number,
    w: number,
    h: number,
    z: number,
    tilt = 0,
  ) {
    const sin = Math.sin(p.heading),
      cos = Math.cos(p.heading);
    this.joint.position.set(
      p.x + lane * cos - along * sin,
      p.y + y,
      p.z - lane * sin - along * cos,
    );
    this.joint.rotation.set(0, p.heading, tilt, 'YXZ');
    this.joint.scale.set(w, h, z);
    this.joint.updateMatrix();
  }
  private part(
    kind: number,
    p: CoursePlace,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    l: number,
    colour: number,
    tilt = 0,
  ) {
    this.transform(p, x, y, z, w, h, l, tilt);
    const mesh = this.parts[kind]!,
      index = this.used[kind]!;
    mesh.setMatrixAt(index, this.joint.matrix);
    mesh.setColorAt(index, this.colour.setHex(colour));
    this.used[kind] = index + 1;
  }
  private performer(p: CoursePlace, slot: number, h: number, w: number, bob: number, sway: number) {
    this.transform(p, 0, h * 0.5 + bob, 0, w, h, 1, sway);
    const count = this.counts[slot]!;
    this.costumes[slot]!.setMatrixAt(count, this.joint.matrix);
    this.counts[slot] = count + 1;
  }
  update(metres: number, time: number) {
    this.counts.fill(0);
    this.used.fill(0);
    this.submitted.rushCrown = this.submitted.drumHand = this.submitted.cowbellHand = null;
    this.dawn.value = Math.max(0, Math.min(1, (metres / this.course.length - 0.38) / 0.59));
    const rider = this.course.place(metres, 0, this.pose);
    this.dome.position.set(rider.x, rider.y, rider.z);
    const first = Math.floor((metres - 14) / 3);
    for (let i = 0; i < 66; i++) {
      const id = first + i,
        side = id % 2 ? 1 : -1;
      const beat = time * 2.7 + id * 1.47;
      const p = this.course.place(
        id * 3 + 0.29 * Math.sin(beat),
        side * (3.25 + Math.abs(id % 4) * 0.43),
        this.pose,
      );
      const slot = Math.abs(id) % 4;
      this.performer(
        p,
        slot,
        slot % 2 ? 1.95 : 2.35,
        slot % 2 ? 1.13 : 1.85,
        0.09 * Math.abs(Math.sin(beat)),
        0.06 * Math.sin(beat),
      );
      if (i % 3 === 0) {
        const back = this.course.place(
          id * 3 + 1.3,
          side * (6.4 + Math.abs(id % 3) * 0.71),
          this.pose,
        );
        this.performer(
          back,
          (slot + 1) % 4,
          2.04,
          1.25,
          0.31 + 0.27 * Math.abs(id % 3),
          0.04 * Math.sin(beat),
        );
      }
    }
    GROUPS.forEach(({ at, costume }, index) => {
      const banner = this.banners[index]!;
      banner.visible = Math.abs(metres - at) < 160;
      if (!banner.visible) return;
      const march = 1.7 * Math.sin(time * 0.24);
      const standard = this.course.place(at + 22 + march, 3.65, this.pose);
      this.transform(standard, 0, 4.16, 0, 1, 1, 1, 0.035 * Math.sin(time * 1.85));
      banner.position.copy(this.joint.position);
      banner.rotation.copy(this.joint.rotation);
      for (const side of [-1, 1])
        this.part(0, standard, side * 2.17, 2.0, 0, 0.054, 4.04, 0.054, 0xb5a47f);
      const lead = this.course.place(at + 13 + march, -2.72, this.pose);
      const rock = 0.12 * Math.sin(time * 2.5);
      this.performer(lead, costume, 4.25, 3.65, 0.08 * Math.cos(time * 5), rock);
      if (!index) this.submitted.rushCrown = rock;
      for (let row = 0; row < 6; row++) {
        const p = this.course.place(at + 7 + row * 2.9 + march, 2.63, this.pose);
        const beat = time * 7.4 + row * 0.97;
        this.performer(
          p,
          index === 2 ? 3 : 1,
          2.13,
          1.42,
          0.035 * Math.sin(beat / 2),
          0.024 * Math.cos(beat),
        );
        if (index === 2) {
          for (const side of [-1, 1]) {
            const lift = 0.17 * Math.sin(beat + side);
            this.part(
              0,
              p,
              side * 0.37,
              1.16 + lift,
              -0.24,
              0.115,
              0.22,
              0.13,
              0xb2a37c,
              side * 0.35,
            );
            if (!row && side === 1) this.submitted.cowbellHand = 1.16 + lift;
          }
        } else {
          this.part(2, p, 0, 0.84, -0.32, 0.37, 0.53, 0.37, 0x975d35);
          this.part(2, p, 0, 1.116, -0.32, 0.395, 0.033, 0.395, 0xdbc49e);
          for (const side of [-1, 1]) {
            const lift = 0.14 * Math.sin(beat + side * 1.25);
            this.part(
              0,
              p,
              side * 0.19,
              1.26 + lift,
              -0.34,
              0.035,
              0.27,
              0.034,
              0xc89f67,
              -side * 0.45,
            );
            this.part(1, p, side * 0.22, 1.18 + lift, -0.35, 0.054, 0.063, 0.052, 0xe1c8a8);
            if (index === 1 && !row && side === 1) this.submitted.drumHand = 1.18 + lift;
          }
        }
      }
    });
    this.parts.forEach((m, i) => {
      m.count = this.used[i]!;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    this.costumes.forEach((m, i) => {
      m.count = this.counts[i]!;
      m.instanceMatrix.needsUpdate = true;
    });
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const wharf = metres > 11500,
      focus = wharf ? 12120 : 7240;
    const fade = 1 - Math.abs(metres - focus) / 100;
    if (fade <= 0) return;
    const p = this.course.place(metres, 0, this.pose);
    const t = this.course.place(wharf ? 12150 : 7280, wharf ? -58 : -23, this.landmark);
    const dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.max(1, Math.hypot(dx, dz));
    const share = Math.min(1, fade * 1.45);
    camera.x += (p.x - (dx / len) * 5.4 - camera.x) * share;
    camera.z += (p.z - (dz / len) * 5.4 - camera.z) * share;
    ahead.x += (p.x + (dx / len) * 15 - ahead.x) * share;
    ahead.z += (p.z + (dz / len) * 15 - ahead.z) * share;
  }
  report() {
    return this.submitted;
  }
  dispose() {
    this.dome.geometry.dispose();
    this.sky.dispose();
    this.grain.dispose();
    this.road.dispose();
    for (const mesh of this.parts) {
      mesh.geometry.dispose();
      mesh.dispose();
    }
    this.tint.dispose();
    for (const mesh of this.costumes) {
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh.dispose();
    }
    for (const mesh of this.banners) {
      mesh.geometry.dispose();
      mesh.material.map?.dispose();
      mesh.material.dispose();
    }
    this.figures.dispose();
  }
}
