import {
  DoubleSide,
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
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { mix, sin, smoothstep, uniform, uv, vec3 } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const LAP = 4225;
const ASSETS = [
  'asphalt',
  'flats',
  'rock',
  'pool',
  'palm',
  'families',
  'runner',
  'jogger',
  'swimmer',
  'tablecloth',
  'spume',
] as const;
const VIEWS = [
  [80, 122, -15, 3],
  [690, 723, -38, -2],
  [1130, 1160, -35, -0.6],
  [1940, 1947, -14, 13],
] as const;
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const painted = (cutout = false) =>
  new MeshBasicMaterial({ side: DoubleSide, alphaTest: cutout ? 0.45 : 0 });
export class SeaPointPromenade {
  readonly root = new Group();
  readonly materials = {
    BeachRoad: painted(),
    SeaPointFlats: painted(),
    TidalRock: painted(),
    PavilionWater: painted(),
    CapePalms: painted(true),
    SeaPointFamilies: painted(true),
    CapeAtlantic: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly clock = uniform(0);
  private readonly card = new PlaneGeometry(1, 1);
  private readonly runnerPaint = painted(true);
  private readonly joggerPaint = painted(true);
  private readonly swimPaint = painted(true);
  private readonly mistPaint = new MeshBasicMaterial({
    transparent: true,
    opacity: 0.63,
    depthWrite: false,
    side: DoubleSide,
  });
  private readonly foamPaint = new MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  private readonly breakers = new InstancedMesh(this.card, this.foamPaint, 84);
  private readonly persons: Mesh[] = [];
  private readonly swim: Mesh[] = [];
  private readonly cloth = new InstancedMesh(this.card, this.mistPaint, 14);
  private readonly matrix = new Object3D();
  private readonly station = point();
  private readonly target = point();
  private readonly reads = {
    seapointStation: 0,
    runnerStride: 0,
    breakerCrest: 0,
    swimmerStroke: 0,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      ASSETS.map((n) => loader.loadAsync('courses/seapoint-' + n + '.webp')),
    );
    const textures = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      for (const texture of textures) texture.dispose();
      throw failure.reason;
    }
    return new SeaPointPromenade(course, textures);
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    const faces = [
      this.materials.BeachRoad,
      this.materials.SeaPointFlats,
      this.materials.TidalRock,
      this.materials.PavilionWater,
      this.materials.CapePalms,
      this.materials.SeaPointFamilies,
      this.runnerPaint,
      this.joggerPaint,
      this.swimPaint,
      this.mistPaint,
      this.foamPaint,
    ];
    for (const [i, material] of faces.entries()) {
      const texture = textures[i]!;
      texture.colorSpace = SRGBColorSpace;
      texture.flipY = i >= 6;
      if (i === 0) {
        texture.wrapS = texture.wrapT = RepeatWrapping;
        texture.anisotropy = 4;
      }
      material.map = texture;
    }
    const offshore = uv().y.oneMinus();
    const phase = offshore
      .mul(0.45)
      .add(sin(uv().x.mul(0.11)).mul(0.85))
      .sub(this.clock.mul(1.6));
    const ripple = sin(phase).mul(0.5).add(0.5);
    const surf = smoothstep(0.77, 0.98, ripple).mul(smoothstep(7, 29, offshore).oneMinus());
    const blue = mix(vec3(0.035, 0.28, 0.32), vec3(0.018, 0.15, 0.23), smoothstep(0, 84, offshore));
    this.materials.CapeAtlantic.colorNode = mix(
      blue.mul(ripple.mul(0.14).add(0.86)),
      vec3(0.78, 0.89, 0.86),
      surf,
    );
    for (let i = 0; i < 12; i++) {
      const m = new Mesh(this.card, i % 2 ? this.joggerPaint : this.runnerPaint);
      this.persons.push(m);
      this.root.add(m);
    }
    for (let i = 0; i < 5; i++) {
      const m = new Mesh(this.card, this.swimPaint);
      this.swim.push(m);
      this.root.add(m);
    }
    this.root.add(this.cloth, this.breakers);
    this.breakers.frustumCulled = false;
    this.cloth.frustumCulled = false;
    this.update(0, 0);
  }
  update(metres: number, time: number) {
    this.clock.value = time;
    const r = this.course.place(metres, 0, this.station);
    this.reads.seapointStation = metres;
    for (let i = 0; i < this.breakers.count; i++) {
      const x = 705 + (i - 30) * 24;
      const shore = 33 + 4.8 * Math.sin(x / 138) + 3.1 * Math.sin(x / 61);
      const phase = time * 0.79 + i * 1.74;
      const crest = 0.24 + 0.34 * Math.sin(phase);
      this.matrix.position.set(x, crest, -(shore + 4.8 + 2.8 * Math.cos(phase) + (i % 3) * 3.1));
      this.matrix.rotation.set(-Math.PI / 2 + 0.16 * Math.sin(phase), 0, 0.07 * Math.cos(i * 1.19));
      this.matrix.scale.set(21 + (i % 5) * 1.2, 1.7 + 0.72 * Math.sin(phase), 1);
      this.matrix.updateMatrix();
      this.breakers.setMatrixAt(i, this.matrix.matrix);
      if (i === 30) this.reads.breakerCrest = this.matrix.position.y;
    }
    this.breakers.instanceMatrix.needsUpdate = true;
    for (const [i, m] of this.persons.entries()) {
      const anchor = i < 4 ? 100 + i * 18 : 268 + (i - 4) * 208;
      const x = anchor + 14 * Math.sin(time * 0.108 + i),
        pt = this.course.place(x, -(16.7 + (i % 3) * 1.75), this.target);
      const stride = Math.sin(time * 4.4 + i);
      m.position.set(pt.x, pt.y + 0.88 + Math.abs(stride) * 0.085, pt.z);
      m.scale.set(0.82, 1.76, 1);
      m.rotation.set(0, Math.atan2(r.x - pt.x, r.z - pt.z), stride * 0.06);
      m.visible = Math.hypot(pt.x - r.x, pt.z - r.z) < 240;
      if (!i) this.reads.runnerStride = m.rotation.z;
    }
    for (const [i, m] of this.swim.entries()) {
      const stroke = time * 3.1 + i * 1.21,
        x = 1160 + 21 * Math.sin(time * 0.084 + i),
        z = -(29 + i * 3);
      m.position.set(x, 3.91 + 0.095 * Math.sin(stroke), z);
      m.scale.set(1.72, 0.76, 1);
      m.rotation.set(0, Math.atan2(r.x - x, r.z - z), 0.12 * Math.cos(stroke));
      m.visible = Math.abs(r.x - 1160) < 280;
      if (!i) this.reads.swimmerStroke = m.rotation.z;
    }
    for (let i = 0; i < this.cloth.count; i++) {
      this.matrix.position.set(
        -15 + 99 * i + 16 * Math.sin(time * 0.023 + i * 0.4),
        569 + 15 * Math.sin(i * 0.9 + time * 0.04),
        2080 - (i % 3) * 17,
      );
      this.matrix.scale.set(260 + (i % 4) * 24, 57 + (i % 3) * 15, 1);
      this.matrix.rotation.set(0, 0, 0.09 * Math.sin(i));
      this.matrix.updateMatrix();
      this.cloth.setMatrixAt(i, this.matrix.matrix);
    }
    this.cloth.instanceMatrix.needsUpdate = true;
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const d = metres % LAP,
      view = VIEWS.find((v) => Math.abs(d - v[0]) < 45);
    let x, y, z, w;
    if (view) {
      const p = this.course.place(view[1], view[2], this.target);
      x = p.x;
      y = p.y + view[3];
      z = p.z;
      w = Math.min(1, (1 - Math.abs(d - view[0]) / 45) * 1.62);
    } else {
      const lion = Math.abs(d - 3020),
        table = Math.abs(d - 3645);
      if (Math.min(lion, table) >= 120) return;
      x = lion < table ? 550 : 500;
      y = lion < table ? 325 : 410;
      z = lion < table ? 1080 : 2130;
      w = Math.min(1, (1 - Math.min(lion, table) / 120) * 1.4);
    }
    const r = this.course.place(metres, 0, this.station),
      dx = x - r.x,
      dz = z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5.1 * dx) / len - camera.x) * w;
    camera.z += (r.z - (5.1 * dz) / len - camera.z) * w;
    camera.y += (r.y + 2.38 - camera.y) * w;
    ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
    ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
    ahead.y += (r.y + 2.38 + (19 * (y - r.y - 2.38)) / (len + 5.1) - ahead.y) * w;
  }
  report() {
    return this.reads;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      this.card,
      this.cloth,
      this.breakers,
      this.foamPaint,
      this.runnerPaint,
      this.joggerPaint,
      this.swimPaint,
      this.mistPaint,
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
  }
}
