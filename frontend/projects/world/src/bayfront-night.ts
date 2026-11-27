import { mix, positionWorld, texture, uniform, vec2, vertexColor } from 'three/tsl';
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
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
import type { Course, CoursePlace } from './course';
import { SingaporeFlyer } from './singapore-flyer';

const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [80, 750, -655, 3.35],
  [1840, 1867, -10.9, 2.35],
  [3620, 3676, 36, 2.65],
  [5360, 5428, -5.5, 2.2],
  [7580, 7635, 53, 5.9],
  [10120, 10180, 57, 7.9],
] as const;
export class BayfrontNight {
  readonly root = new Group();
  private readonly palms = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 });
  private readonly visitors = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 });
  private readonly statue = new MeshBasicMaterial({
    side: DoubleSide,
    alphaTest: 0.41,
    fog: false,
  });
  private readonly hotel = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  private readonly offices = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  private readonly paving = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly ripple = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  private readonly sea = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  private readonly lights = new MeshBasicMaterial({
    side: DoubleSide,
    vertexColors: true,
    fog: false,
  });
  private readonly blossom = new MeshBasicMaterial({ side: DoubleSide, fog: false });
  readonly materials = {
    BayPalms: this.palms,
    BayVisitors: this.visitors,
    Merlion: this.statue,
    SkyParkTowers: this.hotel,
    RafflesWindows: this.offices,
    BayPavers: this.paving,
    BayReflections: this.ripple,
    Sea: this.sea,
    BayLandmarks: this.lights,
    SupertreeCrowns: this.blossom,
  };
  private readonly phase = uniform(0);
  private readonly wheel = new SingaporeFlyer();
  private readonly runners = new InstancedMesh(new PlaneGeometry(1, 1), this.visitors, 8);
  private readonly rayMaterial = new MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
  });
  private readonly rays = new InstancedMesh(new BoxGeometry(1, 1, 1), this.rayMaterial, 8);
  private readonly laserShow = new Group();
  private readonly p = point();
  private readonly origin = point();
  private readonly pose = new Object3D();
  private readonly drawn = {
    joggerStation: null as number | null,
    groveHue: null as number | null,
    capsuleHeight: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      ['hotel', 'offices', 'palms', 'visitors', 'merlion'].map((n) =>
        loader.loadAsync('courses/marinabay-' + n + '.webp'),
      ),
    );
    const images: Texture[] = [];
    for (const r of results) if (r.status === 'fulfilled') images.push(r.value);
    const bad = results.find((r) => r.status === 'rejected');
    if (bad) {
      for (const i of images) i.dispose();
      throw bad.reason;
    }
    return new BayfrontNight(course, images);
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    const [hotel, offices, palm, people, lion] = images as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    for (const t of images) t.colorSpace = SRGBColorSpace;
    for (const t of [hotel, offices]) {
      t.wrapS = t.wrapT = RepeatWrapping;
      t.anisotropy = 4;
    }
    for (const t of [palm, people, lion]) t.flipY = false;
    this.palms.map = palm;
    this.visitors.map = people;
    this.statue.map = lion;
    const uv = vec2(positionWorld.x.add(positionWorld.z.mul(0.76)), positionWorld.y.negate());
    this.hotel.colorNode = texture(hotel, uv.mul(0.039)).rgb.mul(1.26);
    this.offices.colorNode = texture(offices, uv.mul(0.045)).rgb.mul(1.22);
    const variation = positionWorld.x
      .mul(0.71)
      .fract()
      .smoothstep(0.004, 0.027)
      .mul(positionWorld.z.mul(1.37).fract().smoothstep(0.004, 0.039));
    this.paving.colorNode = vertexColor().rgb.mul(variation.mul(0.22).add(0.68));
    const wave = positionWorld.z.mul(0.41).add(positionWorld.x.mul(0.058)).add(this.phase).sin();
    this.ripple.colorNode = vertexColor().rgb.mul(wave.mul(0.44).add(0.78));
    this.sea.colorNode = mix(vertexColor().rgb, vec2(0.017, 0.027).xyy, wave.mul(0.09).add(0.1));
    const hub = course.place(10180, 57, this.p);
    this.wheel.root.position.set(hub.x, hub.y + 45, hub.z);
    const lookout = course.place(10120, 0, this.origin);
    this.wheel.root.rotation.y = Math.atan2(lookout.x - hub.x, lookout.z - hub.z);
    const hotelBase = course.place(750, -655, this.p);
    this.laserShow.position.set(hotelBase.x, hotelBase.y + 189, hotelBase.z);
    this.runners.frustumCulled = this.rays.frustumCulled = false;
    const runnerUv = this.runners.geometry.getAttribute('uv');
    for (let i = 0; i < runnerUv.count; i++)
      runnerUv.setXY(i, 0.006 + runnerUv.getX(i) * 0.225, 0.994 - runnerUv.getY(i) * 0.988);
    this.runners.geometry.translate(0, 0.5, 0);
    for (let i = 0; i < 8; i++)
      this.rays.setColorAt(i, new Color([0x7da4ff, 0x73ee93, 0xb78aff, 0x71deef][i % 4]));
    this.laserShow.add(this.rays);
    this.root.add(this.wheel.root, this.runners, this.laserShow);
  }
  update(metres: number, time: number) {
    this.phase.value = time * 0.83;
    const hue = 0.77 + 0.115 * Math.sin(time * 0.16);
    this.blossom.color.setHSL(hue, 0.86, 0.67);
    this.drawn.groveHue = Math.abs(metres - 7650) < 350 ? hue : null;
    const capsule = this.wheel.update(time);
    this.drawn.capsuleHeight = Math.abs(metres - 10180) < 350 ? capsule : null;
    for (let j = 0; j < 8; j++) {
      const offset = time * (j % 2 === 0 ? 2.8 : -2.27) + 29 + j * 24;
      const d = Math.ceil((metres - 13 - offset) / 175) * 175 + offset;
      const p = this.course.place(d, -5 - (j % 3) * 0.46, this.p);
      this.pose.position.set(p.x, p.y + 0.09 + 0.035 * Math.sin(time * 4.8 + j), p.z);
      this.pose.rotation.set(0, p.heading, 0);
      this.pose.scale.set(0.89, 1.83, 1);
      this.pose.updateMatrix();
      this.runners.setMatrixAt(j, this.pose.matrix);
      if (j === 0) this.drawn.joggerStation = d;
      const tilt = (j - 3.5) * 0.185 + 0.12 * Math.sin(time * 0.19 + j * 0.28);
      const length = 145 + (j % 3) * 33;
      this.pose.position.set(Math.sin(tilt) * length * 0.5, Math.cos(tilt) * length * 0.5, 0);
      this.pose.rotation.set(0, 0, -tilt);
      this.pose.scale.set(0.29, length, 0.29);
      this.pose.updateMatrix();
      this.rays.setMatrixAt(j, this.pose.matrix);
    }
    this.runners.instanceMatrix.needsUpdate = this.rays.instanceMatrix.needsUpdate = true;
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const view = views.find((s) => Math.abs(metres - s[0]) < 83);
    if (!view) return;
    const p = this.course.place(metres, 0, this.origin),
      t = this.course.place(view[1], view[2], this.p);
    const dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.max(0.01, Math.hypot(dx, dz)),
      w = Math.min(1, (1 - Math.abs(view[0] - metres) / 83) * 1.64);
    camera.x += (p.x - (5 * dx) / len - camera.x) * w;
    camera.z += (p.z - (5 * dz) / len - camera.z) * w;
    camera.y += (p.y + 2.25 - camera.y) * w;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * w;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * w;
    ahead.y += (p.y + view[3] - ahead.y) * w;
  }
  report() {
    return this.drawn;
  }
  dispose() {
    this.root.clear();
    this.laserShow.clear();
    this.wheel.dispose();
    for (const item of [
      ...this.images,
      ...Object.values(this.materials),
      this.runners.geometry,
      this.runners,
      this.rays.geometry,
      this.rays,
      this.rayMaterial,
    ])
      item.dispose();
  }
}
