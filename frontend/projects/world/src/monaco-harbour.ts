import { mix, positionWorld, sin, smoothstep, uniform, vec3, vertexColor } from 'three/tsl';
import {
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { HarbourEquipment } from './harbour-equipment';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 112, -27, 2.7],
  [1620, 1660, 12, 3.2],
  [3220, 3271, 29, 4.4],
  [4860, 4905, 0, 2.5],
  [6540, 6576, -7, 1.9],
  [9320, 9430, -79, 4.8],
] as const;

function fenceImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const c = canvas.getContext('2d')!;
  c.strokeStyle = 'rgba(114,128,136,.94)';
  c.lineWidth = 1.7;
  for (let j = -256; j < 850; j += 17)
    for (const direction of [-1, 1]) {
      c.beginPath();
      c.moveTo(j, 0);
      c.lineTo(j + direction * 212, 256);
      c.stroke();
    }
  return new CanvasTexture(canvas);
}
export class MonacoHarbour {
  readonly root = new Group();
  private readonly equipment = new HarbourEquipment();
  private readonly p = point();
  private readonly origin = point();
  private readonly phase = uniform(0);
  private readonly meshFence = fenceImage();
  readonly materials = {
    RaceTarmac: new MeshBasicNodeMaterial({ side: DoubleSide }),
    HerculeWater: new MeshBasicNodeMaterial({ side: DoubleSide }),
    CircuitFronts: new MeshBasicMaterial({ side: DoubleSide }),
    CasinoFront: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 }),
    RivieraPalms: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 }),
    PalaceRock: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.35, fog: false }),
    CircuitBoards: new MeshBasicMaterial({ side: DoubleSide }),
    TrackWords: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.25 }),
    DebrisFence: new MeshBasicMaterial({ side: DoubleSide, map: this.meshFence, alphaTest: 0.38 }),
    TunnelLamps: new MeshBasicNodeMaterial({ side: DoubleSide, fog: false }),
  };
  private readonly fountain = new Group();
  private readonly stone = new MeshBasicMaterial({ color: 0xbcb7a4 });
  private readonly water = new MeshBasicMaterial({ color: 0x66abb1 });
  private readonly jets = new LineBasicMaterial({
    color: 0xdaf3f4,
    transparent: true,
    opacity: 0.79,
  });
  private readonly base = new CylinderGeometry(3.45, 3.53, 0.42, 32);
  private readonly pool = new CylinderGeometry(3.23, 3.23, 0.07, 32);
  private readonly drops = new BufferGeometry();
  private readonly coords = new Float32BufferAttribute(new Float32Array(18 * 12 * 6), 3);
  private readonly drawn = {
    yachtRoll: null as number | null,
    fountainPhase: null as number | null,
    safetyStation: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader(),
      res = await Promise.allSettled(
        ['circuit', 'casino', 'palm', 'palace', 'road-paint', 'boards'].map((n) =>
          loader.loadAsync('courses/monaco-' + n + '.webp'),
        ),
      );
    const images = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      fail = res.find((r) => r.status === 'rejected');
    if (fail) {
      for (const image of images) image.dispose();
      throw fail.reason;
    }
    return new MonacoHarbour(course, images);
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    const [circuit, casino, palm, palace, words, boards] = images as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    for (const img of images) {
      img.colorSpace = SRGBColorSpace;
      img.flipY = false;
    }
    this.materials.CircuitFronts.map = circuit;
    this.materials.CasinoFront.map = casino;
    this.materials.RivieraPalms.map = palm;
    this.materials.PalaceRock.map = palace;
    this.materials.TrackWords.map = words;
    this.materials.CircuitBoards.map = boards;
    const pos = positionWorld,
      tint = vertexColor().rgb;
    this.materials.RaceTarmac.colorNode = tint.mul(
      sin(pos.x.mul(63).add(pos.z.mul(92)))
        .mul(0.035)
        .add(0.94),
    );
    const ripple = sin(
      pos.x
        .mul(0.91)
        .add(sin(pos.z.mul(0.84)))
        .add(this.phase),
    )
      .mul(0.5)
      .add(0.5);
    this.materials.HerculeWater.colorNode = mix(
      tint.mul(vec3(0.68, 0.85, 1)),
      vec3(0.4, 0.61, 0.7),
      smoothstep(0.93, 0.998, ripple).mul(0.41),
    );
    this.materials.TunnelLamps.colorNode = tint.mul(1.8);
    this.root.add(this.equipment.yacht, this.equipment.safety, this.fountain);
    const y = course.place(111, -38, this.p);
    this.equipment.yacht.position.set(y.x, 1.8, y.z);
    this.equipment.yacht.rotation.y = y.heading + Math.PI / 2;
    const f = course.place(3253, 13.5, this.p);
    this.fountain.position.set(f.x, f.y + 0.19, f.z);
    const bowl = new Mesh(this.base, this.stone),
      surface = new Mesh(this.pool, this.water);
    surface.position.y = 0.21;
    this.drops.setAttribute('position', this.coords);
    const lines = new LineSegments(this.drops, this.jets);
    lines.frustumCulled = false;
    this.fountain.add(bowl, surface, lines);
  }
  update(metres: number, time: number) {
    this.phase.value = time * 0.81;
    const yacht = this.equipment.yacht;
    yacht.visible = metres < 500;
    this.drawn.yachtRoll = null;
    if (yacht.visible) {
      yacht.rotation.z = 0.018 * Math.sin(time * 0.79);
      yacht.position.y = 1.8 + 0.085 * Math.sin(time * 0.9);
      this.drawn.yachtRoll = yacht.rotation.z;
    }
    this.fountain.visible = Math.abs(metres - 3253) < 210;
    this.drawn.fountainPhase = null;
    if (this.fountain.visible) {
      const phase = time * 1.62;
      this.drawn.fountainPhase = phase;
      for (let j = 0; j < 18; j++) {
        const a = (j * Math.PI) / 9,
          r = 2.12 + 0.13 * Math.sin(phase + j),
          high = 2.1 + 0.26 * Math.sin(phase + j * 0.92);
        for (let i = 0; i < 12; i++) {
          for (let n = 0; n < 2; n++) {
            const u = (i + n) / 12,
              rad = r * (1 - u) + u * 0.22;
            this.coords.setXYZ(
              (j * 12 + i) * 2 + n,
              rad * Math.cos(a),
              0.27 + 4 * high * u * (1 - u),
              rad * Math.sin(a),
            );
          }
        }
      }
      this.coords.needsUpdate = true;
    }
    const safety = this.equipment.safety;
    safety.visible = Math.abs(metres - 6540) < 240;
    this.drawn.safetyStation = null;
    if (safety.visible) {
      const station = 6573 + 18 * Math.sin(time * 0.17),
        p = this.course.place(station, -2.72, this.p);
      safety.position.set(p.x, p.y + 0.015, p.z);
      safety.rotation.set(-p.pitch, p.heading, 0, 'YXZ');
      this.equipment.beacon.color.setRGB(1, 0.44 + 0.31 * Math.sin(time * 9), 0.055);
      this.drawn.safetyStation = station;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const stop = stops.find((s) => Math.abs(metres - s[0]) < 94);
    if (!stop) return;
    const blend = Math.min(1, (1 - Math.abs(metres - stop[0]) / 94) * 1.65);
    const p = this.course.place(metres, 0, this.origin),
      t = this.course.place(stop[1], stop[2], this.p),
      dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.hypot(dx, dz);
    camera.x += (p.x - (5.0 * dx) / len - camera.x) * blend;
    camera.z += (p.z - (5.0 * dz) / len - camera.z) * blend;
    camera.y += (p.y + 2.17 - camera.y) * blend;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * blend;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * blend;
    ahead.y += (p.y + stop[3] + ((t.y - p.y) * 14) / len - ahead.y) * blend;
  }
  report() {
    return this.drawn;
  }
  dispose() {
    this.root.clear();
    this.fountain.clear();
    this.equipment.dispose();
    for (const item of [
      this.meshFence,
      this.base,
      this.pool,
      this.drops,
      this.water,
      this.stone,
      this.jets,
      ...Object.values(this.materials),
      ...this.images,
    ])
      item.dispose();
  }
}
