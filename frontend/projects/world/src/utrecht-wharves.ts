import {
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';
import type { BufferGeometry, Texture, Vector3 } from 'three/webgpu';
import { color, mix, positionWorld, sin, smoothstep, texture, uniform, uv } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const views = [
  [140, 174, -18, -0.5],
  [4250, 4500, -2, 38],
  [8360, 8396, 13, 2.3],
  [12320, 12344, -1, 1.5],
  [16780, 16804, -15, -1],
  [22320, 22348, -19, 0.3],
] as const;
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

export class UtrechtWharves {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicMaterial | MeshBasicNodeMaterial>;
  private readonly cargo = new Group();
  private readonly boat = new Group();
  private readonly kayak = new Group();
  private readonly paddle = new Group();
  private readonly clock = uniform(0);
  private readonly geometries: BufferGeometry[] = [];
  private readonly paint: MeshBasicMaterial[] = [];
  private readonly point = place();
  private readonly target = place();
  private readonly poses = {
    cargoTravel: null as number | null,
    boatTravel: null as number | null,
    paddleAngle: null as number | null,
  };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      [
        'facades',
        'wharves',
        'tower',
        'bikes',
        'boat',
        'trees',
        'sky',
        'asphalt',
        'station-sign',
      ].map((n) => loader.loadAsync('courses/utrecht-' + n + '.webp')),
    );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    try {
      const e = results.find((r) => r.status === 'rejected');
      if (e) throw e.reason;
      return new UtrechtWharves(course, maps, low);
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
    const [homes, cellars, tower, bikes, craft, trees, sky, asphalt, stationSign] = maps;
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
      m.anisotropy = low ? 2 : 4;
    }
    asphalt!.wrapS = asphalt!.wrapT = RepeatWrapping;
    const xz = positionWorld.xz;
    const aggregate = texture(asphalt!, xz.mul(0.45)).rgb;
    const red = new MeshBasicNodeMaterial({ side: DoubleSide });
    const patches = sin(xz.x.mul(0.084).add(sin(xz.y.mul(0.14))))
      .mul(0.5)
      .add(0.5);
    red.colorNode = mix(
      color(0x9f4c46),
      color(0xc17a68),
      patches.mul(0.31).add(aggregate.r.mul(1.1)),
    );
    const paving = new MeshBasicNodeMaterial({ side: DoubleSide });
    const brick = xz.y.mul(4.3).fract();
    const courseLine = xz.x.mul(2.0).add(xz.y.mul(4.3).floor().mul(0.5)).fract();
    const mortar = smoothstep(0.03, 0.1, brick).mul(smoothstep(0.025, 0.07, courseLine));
    paving.colorNode = mix(
      color(0x8e827b),
      mix(color(0x7b6055), color(0xa48d7c), aggregate.r.add(patches.mul(0.35))),
      mortar,
    );
    const water = new MeshBasicNodeMaterial({ side: DoubleSide });
    const ripple = sin(xz.x.mul(0.74).add(xz.y.mul(1.5)).add(this.clock.mul(1.12))).add(
      sin(xz.y.mul(0.87).sub(this.clock.mul(0.75))),
    );
    water.colorNode = mix(color(0x334d46), color(0x7c9385), ripple.mul(0.14).add(0.41)).add(
      color(0xafbab3)
        .mul(smoothstep(1.88, 1.995, ripple))
        .mul(0.27),
    );
    const flat = (map: Texture) => new MeshBasicMaterial({ map, side: DoubleSide });
    const cut = (map: Texture) => new MeshBasicMaterial({ map, side: DoubleSide, alphaTest: 0.46 });
    const clouds = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
    clouds.colorNode = texture(sky!, uv().add(sin(this.clock.mul(0.007)).mul(0.005))).rgb;
    this.materials = {
      Fietspad: red,
      WharfPaving: paving,
      OudegrachtWater: water,
      WerfCellars: flat(cellars!),
      UtrechtGables: cut(homes!),
      WharfElms: cut(trees!),
      WharfBikes: cut(bikes!),
      Domtoren: flat(tower!),
      StationspleinSign: flat(stationSign!),
      UtrechtSky: clouds,
    };
    const unit = new BoxGeometry();
    this.geometries.push(unit);
    const solid = (
      g: Group,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
      col: number,
    ) => {
      const mat = new MeshBasicMaterial({ color: col });
      this.paint.push(mat);
      const mesh = new Mesh(unit, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, l);
      g.add(mesh);
      return mesh;
    };
    const profiles = (
      g: Group,
      map: Texture,
      index: number,
      count: number,
      l: number,
      h: number,
      width: number,
    ) => {
      const m = cut(map);
      this.paint.push(m);
      const geo = new PlaneGeometry(l, h);
      this.geometries.push(geo);
      const coords = geo.getAttribute('uv');
      for (let i = 0; i < coords.count; i++) {
        coords.setX(i, (index + 0.002 + 0.996 * coords.getX(i)) / count);
        coords.setY(i, 1 - coords.getY(i));
      }
      for (const dir of [-1, 1]) {
        const mesh = new Mesh(geo, m);
        mesh.position.set((dir * width) / 2, h / 2, 0);
        mesh.rotation.y = (dir * Math.PI) / 2;
        g.add(mesh);
      }
    };
    profiles(this.cargo, bikes!, 1, 3, 2.85, 1.84, 0.43);
    solid(this.cargo, 0, 0.65, -0.48, 0.47, 0.39, 0.91, 0x886344);
    profiles(this.boat, craft!, 0, 2, 8.4, 2.15, 1.77);
    solid(this.boat, 0, 0.4, 0, 1.72, 0.49, 7.85, 0x30483c);
    solid(this.boat, 0, 0.65, 0, 1.75, 0.08, 8.05, 0xe1d4b5);
    for (let i = 0; i < 4; i++)
      solid(this.boat, 0, 0.79, -2.75 + i * 1.53, 1.53, 0.16, 0.36, 0x805a46);
    profiles(this.kayak, craft!, 1, 2, 4.15, 1.09, 0.4);
    solid(this.kayak, 0, 0.16, 0, 0.39, 0.19, 3.88, 0xb34435);
    solid(this.paddle, 0, 0, 0, 2.11, 0.055, 0.07, 0x75563c);
    for (const dir of [-1, 1]) solid(this.paddle, dir * 1.02, 0, 0, 0.45, 0.14, 0.11, 0x50463c);
    this.paddle.position.set(0, 0.68, 0.1);
    this.kayak.add(this.paddle);
    this.root.add(this.cargo, this.boat, this.kayak);
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.clock.value = t;
    this.cargo.visible = Math.abs(metres - 12320) < 390;
    if (this.cargo.visible) {
      const p = this.course.place(12352 + 5 * Math.sin(t * 0.11), 1.28, this.point);
      this.cargo.position.set(p.x, p.y + 0.05, p.z);
      this.cargo.rotation.set(0, p.heading + Math.PI + 0.39 * Math.sin(t * 0.1), 0);
      this.poses.cargoTravel = p.x;
    }
    const opening = metres < 500;
    this.boat.visible = opening || Math.abs(metres - 16780) < 480;
    this.kayak.visible = Math.abs(metres - 16780) < 470;
    if (this.boat.visible) {
      const p = this.course.place(
        (opening ? 166 : 16805) + 19 * Math.sin(t * 0.092),
        -16.3,
        this.point,
      );
      this.boat.position.set(p.x, p.y - 3.43 + 0.045 * Math.sin(t * 0.8), p.z);
      this.boat.rotation.set(0, p.heading, Math.sin(t * 0.73) * 0.021);
      this.poses.boatTravel = this.boat.position.x + this.boat.position.z;
    }
    if (this.kayak.visible) {
      const p = this.course.place(16823 + 12 * Math.sin(t * 0.12), -21.3, this.point);
      this.kayak.position.set(p.x, p.y - 3.38, p.z);
      this.kayak.rotation.y = p.heading;
      this.paddle.rotation.z = Math.sin(t * 1.87) * 0.51;
      this.poses.paddleAngle = this.paddle.rotation.z;
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
      camera.y += (r.y + 2.65 - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y += (r.y + 1.84 + (18.9 * (p.y + lift - r.y - 2.65)) / (len + 4.9) - ahead.y) * w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    for (const a of [
      ...this.maps,
      ...this.geometries,
      ...this.paint,
      ...Object.values(this.materials),
    ])
      a.dispose();
  }
}
