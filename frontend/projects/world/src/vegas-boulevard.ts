import {
  AdditiveBlending,
  BoxGeometry,
  CylinderGeometry,
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
  TorusGeometry,
} from 'three/webgpu';
import type { BufferGeometry, Texture, Vector3 } from 'three/webgpu';
import { color, mix, positionWorld, sin, smoothstep, texture, uniform, uv } from 'three/tsl';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course, CoursePlace } from './course';
import { welcomeTexture } from './vegas-welcome-sign';
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [140, 176, -9.5, 4.7],
  [1860, 1925, -38, 22],
  [3840, 3890, 32, 8.6],
  [4780, 4853, 45, 30],
  [6330, 6380, 37, 13],
  [8810, 8950, 75, 48],
] as const;

export class VegasBoulevard {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicMaterial | MeshBasicNodeMaterial>;
  private readonly geometries: BufferGeometry[] = [];
  private readonly paint: (MeshBasicMaterial | MeshBasicNodeMaterial)[] = [];
  private readonly time = uniform(0);
  private readonly jets: InstancedMesh;
  private readonly mist: InstancedMesh;
  private readonly rotor = new Group();
  private readonly wheelStand = new Group();
  private readonly fleet: Group[] = [];
  private readonly welcome = welcomeTexture();
  private readonly point = place();
  private readonly target = place();
  private readonly pose = new Object3D();
  private readonly ringRadius = 43;
  private readonly jetCount: number;
  private readonly poses = {
    jetHeight: null as number | null,
    limoTravel: null as number | null,
    podHeight: null as number | null,
  };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      [
        'casinos',
        'hotels',
        'marquees',
        'crowd',
        'palms',
        'horizon',
        'asphalt',
        'signs',
        'limo',
        'taxi',
        'bus',
      ].map((k) => loader.loadAsync('courses/vegas-' + k + '.webp')),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    try {
      const e = result.find((r) => r.status === 'rejected');
      if (e) throw e.reason;
      return new VegasBoulevard(course, maps, low);
    } catch (e) {
      for (const m of maps) m.dispose();
      throw e;
    }
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
    low: boolean,
  ) {
    const [casinos, hotels, marquees, crowd, palms, sky, asphalt, signs, ...vehicles] = maps;
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
      m.anisotropy = low ? 2 : 4;
    }
    for (const m of [hotels!, asphalt!]) m.wrapS = m.wrapT = RepeatWrapping;
    const xz = positionWorld.xz;
    const wash = sin(xz.x.mul(0.013).add(this.time.mul(0.25))).add(
      sin(xz.y.mul(0.47).add(xz.x.mul(0.052))),
    );
    const road = new MeshBasicNodeMaterial({ side: DoubleSide });
    road.colorNode = texture(asphalt!, xz.mul(0.39))
      .rgb.mul(0.25)
      .add(
        mix(color(0x521b38), color(0x1b3152), wash.mul(0.25).add(0.5)).mul(
          smoothstep(-0.33, 1.95, wash).mul(0.72),
        ),
      );
    const paving = new MeshBasicNodeMaterial({ side: DoubleSide });
    paving.colorNode = mix(color(0x362e35), color(0x60535a), texture(asphalt!, xz.mul(0.24)).r);
    const leds = new MeshBasicNodeMaterial({ side: DoubleSide });
    leds.colorNode = texture(marquees!, uv()).rgb.mul(
      sin(this.time.mul(0.87).add(uv().x.mul(13)))
        .mul(0.13)
        .add(0.99),
    );
    const water = new MeshBasicNodeMaterial({ side: DoubleSide });
    const ripple = sin(xz.x.mul(0.8).add(sin(xz.y.mul(0.94).add(this.time.mul(0.98)))));
    water.colorNode = mix(color(0x202537), color(0x9d9179), ripple.mul(0.19).add(0.27));
    const flat = (m: Texture) => new MeshBasicMaterial({ map: m, side: DoubleSide });
    const cut = (m: Texture) =>
      new MeshBasicMaterial({ map: m, side: DoubleSide, alphaTest: 0.48 });
    this.materials = {
      BoulevardSigns: flat(signs!),
      BoulevardAsphalt: road,
      VegasPavement: paving,
      CasinoFronts: flat(casinos!),
      HotelWindows: flat(hotels!),
      VegasMarquees: leds,
      StripPalms: cut(palms!),
      StripVisitors: cut(crowd!),
      BellagioWater: water,
      BoulevardNeon: new MeshBasicMaterial({ vertexColors: true, side: DoubleSide }),
      DesertMidnight: new MeshBasicMaterial({ map: sky, side: DoubleSide, fog: false }),
    };
    const block = new BoxGeometry();
    this.geometries.push(block);
    const mat = (c: number) => {
      const m = new MeshBasicMaterial({ color: c });
      this.paint.push(m);
      return m;
    };
    const steel = mat(0xb0b5bf),
      red = mat(0xdf452a),
      gold = mat(0xffbf56);
    const bar = (
      g: Group,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
      m: MeshBasicMaterial,
    ) => {
      const mesh = new Mesh(block, m);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, l);
      g.add(mesh);
      return mesh;
    };
    const anchor = (distance: number, lane: number, g: Group) => {
      const p = course.place(distance, lane, this.point);
      g.position.set(p.x, p.y, p.z);
      g.rotation.y = p.heading;
      this.root.add(g);
    };
    const sign = new Group();
    anchor(176, -9.6, sign);
    for (const x of [-2.1, 2.1]) bar(sign, x, 2, 0, 0.18, 4, 0.2, steel);
    const boardGeo = new PlaneGeometry(7.8, 5.6);
    this.geometries.push(boardGeo);
    const painted = cut(this.welcome);
    this.paint.push(painted);
    const welcome = new Mesh(boardGeo, painted);
    welcome.position.y = 4.7;
    sign.add(welcome);
    for (let i = 0; i < 4; i++) {
      const ray = bar(sign, -1.65, 7.66, 0, 0.1, 2.12, 0.13, i % 2 ? red : gold);
      ray.rotation.z = (i * Math.PI) / 4;
    }
    this.jetCount = low ? 52 : 80;
    const jetGeo = new CylinderGeometry(0.12, 0.35, 1, 6, 1, false);
    this.geometries.push(jetGeo);
    const spray = mat(0xffedca);
    this.jets = new InstancedMesh(jetGeo, spray, this.jetCount);
    const mistMaterial = new MeshBasicNodeMaterial({
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const spread = uv().x.sub(0.5).abs().mul(2);
    const falling = smoothstep(0.02, 0.29, uv().y).mul(smoothstep(0.72, 1, uv().y).oneMinus());
    mistMaterial.colorNode = color(0xffe1af);
    mistMaterial.opacityNode = smoothstep(0, 1, spread)
      .oneMinus()
      .mul(falling)
      .mul(
        sin(uv().y.mul(45).add(this.time.mul(4)))
          .mul(0.08)
          .add(0.25),
      );
    const mistPlane = new PlaneGeometry(3.5, 1.23);
    mistPlane.rotateY(-0.72);
    this.geometries.push(mistPlane);
    this.paint.push(mistMaterial);
    this.mist = new InstancedMesh(mistPlane, mistMaterial, this.jetCount);
    this.mist.frustumCulled = this.jets.frustumCulled = false;
    const basin = new Group();
    anchor(3890, 39, basin);
    basin.add(this.jets, this.mist);
    const wheel = this.wheelStand;
    anchor(8950, 75, wheel);
    const hoop = new TorusGeometry(this.ringRadius, 0.48, 5, 96);
    this.geometries.push(hoop);
    this.rotor.add(new Mesh(hoop, mat(0xf2c7b3)));
    this.rotor.position.y = 53;
    wheel.add(this.rotor);
    const spokes: BoxGeometry[] = [];
    const cabins: BoxGeometry[] = [];
    for (let i = 0; i < 28; i++) {
      const a = (i * Math.PI) / 14;
      const spoke = new BoxGeometry(0.13, this.ringRadius, 0.16);
      spoke.translate(0, this.ringRadius * 0.5, 0);
      spoke.rotateZ(a);
      spokes.push(spoke);
      const cabin = new BoxGeometry(2.5, 1.7, 2.05);
      cabin.translate(0, this.ringRadius, 0);
      cabin.rotateZ(a);
      cabins.push(cabin);
    }
    const ss = mergeGeometries(spokes),
      cc = mergeGeometries(cabins);
    this.geometries.push(ss, cc);
    for (const g of [...spokes, ...cabins]) g.dispose();
    this.rotor.add(new Mesh(ss, steel), new Mesh(cc, mat(0xc57ccd)));
    for (const s of [-1, 1]) {
      const leg = bar(wheel, s * 8, 26, 0, 1.3, 55, 1.4, steel);
      leg.rotation.z = s * 0.3;
    }
    for (const [i, map] of vehicles.entries()) {
      const dims = [
          [8.1, 1.48, 1.86],
          [4.65, 1.58, 1.77],
          [8.95, 2.86, 2.42],
        ][i]!,
        [l, h, w] = dims;
      const g = new Group(),
        body = mat([0x35313b, 0xc49836, 0x553f84][i]!);
      bar(g, 0, h! * 0.46, 0, w! * 0.9, h! * 0.49, l! * 0.9, body);
      bar(g, 0, h! * 0.74, 0, w! * 0.8, h! * 0.3, l! * 0.61, mat(0x667386));
      const geo = new PlaneGeometry(l!, h!);
      const coords = geo.getAttribute('uv');
      for (let j = 0; j < coords.count; j++) coords.setY(j, 1 - coords.getY(j));
      this.geometries.push(geo);
      const profile = cut(map);
      this.paint.push(profile);
      for (const side of [-1, 1]) {
        const mesh = new Mesh(geo, profile);
        mesh.position.set(side * w! * 0.5, h! * 0.5, 0);
        mesh.rotation.y = (side * Math.PI) / 2;
        g.add(mesh);
      }
      for (const x of [-0.61, 0.61]) {
        bar(g, x, h! * 0.42, l! * 0.46, 0.3, 0.13, 0.06, red);
        bar(g, x, h! * 0.42, -l! * 0.46, 0.3, 0.12, 0.06, gold);
      }
      this.fleet.push(g);
      this.root.add(g);
    }
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.time.value = t;
    this.mist.visible = this.jets.visible = Math.abs(metres - 3890) < 660;
    if (this.jets.visible) {
      for (let i = 0; i < this.jetCount; i++) {
        const u = i / (this.jetCount - 1),
          wave = Math.sin(t * 1.9 + u * 13),
          h = 2.1 + 11.5 * (0.5 + 0.5 * wave) ** 2.2;
        this.pose.position.set(8 * Math.sin(u * Math.PI * 3), h * 0.5 + 0.24, -48 + u * 96);
        this.pose.scale.set(0.8 + 0.36 * (1 + wave), h, 1);
        this.pose.updateMatrix();
        this.jets.setMatrixAt(i, this.pose.matrix);
        this.mist.setMatrixAt(i, this.pose.matrix);
        if (i === 7) this.poses.jetHeight = h;
      }
      this.jets.instanceMatrix.needsUpdate = true;
      this.mist.instanceMatrix.needsUpdate = true;
    }
    this.rotor.rotation.z = t * 0.012;
    this.poses.podHeight = 53 + this.ringRadius * Math.cos(this.rotor.rotation.z);
    for (const [i, g] of this.fleet.entries()) {
      const at = [1860, 3840, 6330][i]!;
      g.visible = Math.abs(metres - at) < 480;
      if (!g.visible) continue;
      const p = this.course.place(
        at + 34 + 16 * Math.sin(t * (0.1 + i * 0.009)),
        [-3.4, -6.6, 3.75][i]!,
        this.point,
      );
      g.position.set(p.x, p.y + 0.08, p.z);
      g.rotation.y = p.heading + (i === 1 ? Math.PI : 0);
      if (i === 0) this.poses.limoTravel = p.x + p.z;
    }
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - metres);
      if (gap > 48) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to, lane, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (48 - gap) / 24);
      camera.x += (r.x - (4.9 * dx) / len - camera.x) * w;
      camera.z += (r.z - (4.9 * dz) / len - camera.z) * w;
      camera.y += (r.y + 2.54 - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y += (r.y + 1.75 + (18.9 * (p.y + lift - r.y - 2.54)) / (len + 4.9) - ahead.y) * w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    this.jets.dispose();
    this.mist.dispose();
    this.welcome.dispose();
    for (const m of [
      ...this.maps,
      ...this.geometries,
      ...this.paint,
      ...Object.values(this.materials),
    ])
      m.dispose();
  }
}
