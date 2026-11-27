import {
  BoxGeometry,
  CylinderGeometry,
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
import { mix, positionWorld, sin, texture } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [140, 174, 1, 2],
  [2350, 2375, 14, 3],
  [4650, 4697, 2, 9],
  [6730, 6752, 6.2, 1.3],
  [8920, 8952, 1.7, 2.3],
  [11760, 11777, 90, 8],
] as const;

export class ValaisStations {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicMaterial | MeshBasicNodeMaterial>;
  private readonly geometries: BufferGeometry[] = [];
  private readonly paints: MeshBasicMaterial[] = [];
  private readonly bus = new Group();
  private readonly cows: { head: Group; bell: Group }[] = [];
  private readonly point = place();
  private readonly target = place();
  private readonly poses = { busTravel: null as number | null, grazingAngle: 0, bellAngle: 0 };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      [
        'horizon',
        'pasture',
        'houses',
        'conifers',
        'signs',
        'asphalt',
        'postauto',
        'bus-front',
        'cow-body',
        'cow-head',
        'calf',
        'cladding',
        'rhone',
      ].map((k) => loader.loadAsync('courses/valais-' + k + '.webp')),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    try {
      const e = result.find((r) => r.status === 'rejected');
      if (e) throw e.reason;
      return new ValaisStations(course, maps, low);
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
    const [
      horizon,
      pasture,
      houses,
      trees,
      signs,
      asphalt,
      bus,
      front,
      body,
      head,
      calf,
      cladding,
      rhone,
    ] = maps;
    for (const map of maps) {
      map.flipY = false;
      map.colorSpace = SRGBColorSpace;
      map.anisotropy = low ? 2 : 4;
    }
    for (const map of [asphalt!, pasture!, cladding!]) map.wrapS = map.wrapT = RepeatWrapping;
    const xz = positionWorld.xz;
    const grass = new MeshBasicNodeMaterial({ side: DoubleSide });
    grass.colorNode = mix(
      texture(pasture!, xz.mul(0.36)).rgb,
      texture(pasture!, xz.mul(0.059)).rgb,
      0.31,
    ).mul(
      sin(xz.x.mul(0.041).add(xz.y.mul(0.038)))
        .mul(0.095)
        .add(0.92),
    );
    const road = new MeshBasicNodeMaterial({ side: DoubleSide });
    road.colorNode = texture(asphalt!, xz.mul(0.47)).rgb.mul(0.84);
    const cut = (map: Texture) => new MeshBasicMaterial({ map, side: DoubleSide, alphaTest: 0.46 });
    this.materials = {
      RhoneValley: new MeshBasicMaterial({
        map: rhone,
        side: DoubleSide,
        transparent: true,
        depthWrite: false,
      }),
      MazotLogs: new MeshBasicMaterial({ map: cladding, side: DoubleSide }),
      StationRoad: road,
      AlpineMeadow: grass,
      ValaisTimber: cut(houses!),
      ValaisPines: cut(trees!),
      ValaisSigns: cut(signs!),
      ValaisRange: new MeshBasicMaterial({ map: horizon, side: DoubleSide, fog: false }),
    };
    const box = new BoxGeometry();
    this.geometries.push(box);
    const plain = (c: number) => {
      const m = new MeshBasicMaterial({ color: c });
      this.paints.push(m);
      return m;
    };
    const plate = (map: Texture, w: number, h: number) => {
      const geo = new PlaneGeometry(w, h);
      this.geometries.push(geo);
      const coords = geo.getAttribute('uv');
      for (let i = 0; i < coords.count; i++) coords.setY(i, 1 - coords.getY(i));
      const mat = cut(map);
      this.paints.push(mat);
      return new Mesh(geo, mat);
    };
    const coach = new Mesh(box, plain(0xe3ad35));
    coach.scale.set(2.3, 1.96, 8.9);
    coach.position.y = 1.49;
    this.bus.add(coach);
    for (const s of [-1, 1]) {
      const side = plate(bus!, 9.55, 2.94);
      side.position.set(s * 1.21, 1.47, 0);
      side.rotation.y = (s * Math.PI) / 2;
      this.bus.add(side);
    }
    const nose = plate(front!, 2.45, 2.94);
    nose.rotation.y = Math.PI;
    nose.position.set(0, 1.47, -4.79);
    this.bus.add(nose);
    const rear = new Mesh(box, plain(0x65808b));
    rear.scale.set(1.96, 0.78, 0.03);
    rear.position.set(0, 1.97, 4.47);
    this.bus.add(rear);
    this.root.add(this.bus);
    const brass = plain(0xa78347);
    const bellGeo = new CylinderGeometry(0.055, 0.12, 0.19, 9, 1, true);
    this.geometries.push(bellGeo);
    // The head turns around the printed neck and the brass bell swings from the collar.
    for (const [distance, lane, facing] of [
      [201, 6.2, 0.23],
      [6754, 6.4, -0.83],
      [6770, 9.6, -0.43],
    ] as const) {
      const p = course.place(distance, lane, this.point);
      const cow = new Group(),
        neck = new Group(),
        bell = new Group();
      const torso = plate(body!, 2.8, 1.68),
        face = plate(head!, 2.8, 1.68);
      torso.position.y = 0.84;
      neck.position.set(0.65, 0.83, 0.012);
      face.position.set(-0.65, 0.01, 0);
      neck.add(face);
      bell.position.set(0.08, -0.29, 0.036);
      const cup = new Mesh(bellGeo, brass);
      cup.position.y = -0.085;
      bell.add(cup);
      neck.add(bell);
      cow.add(torso, neck);
      cow.position.set(p.x, p.y - 0.59, p.z);
      cow.rotation.y = p.heading + facing;
      this.root.add(cow);
      this.cows.push({ head: neck, bell });
      const young = plate(calf!, 1.5, 1.03);
      young.position.set(p.x + 1.35, p.y - 0.075, p.z + 1.54);
      young.rotation.y = p.heading - 0.41;
      this.root.add(young);
    }
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.bus.visible = Math.abs(metres - 8920) < 420;
    if (this.bus.visible) {
      const p = this.course.place(8970 + 6 * Math.sin(t * 0.105), 1.58, this.point);
      this.bus.position.set(p.x, p.y + 0.085, p.z);
      this.bus.rotation.set(-p.pitch, p.heading + Math.PI, 0, 'YXZ');
      this.poses.busTravel = this.bus.position.x + this.bus.position.z;
    }
    for (const [i, c] of this.cows.entries()) {
      c.head.rotation.z = 0.125 * Math.sin(t * 0.94 + i * 0.9) - 0.036;
      c.bell.rotation.z =
        0.38 * Math.sin(t * 1.88 + i * 0.83) + 0.14 * Math.sin(t * 0.94 + i * 0.9);
      if (i === 1) {
        this.poses.grazingAngle = c.head.rotation.z;
        this.poses.bellAngle = c.bell.rotation.z;
      }
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
      camera.y += (r.y + (at === 11760 ? 3.65 : 2.5) - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y += (r.y + 1.7 + (18.9 * (p.y + lift - r.y - 2.5)) / (len + 4.9) - ahead.y) * w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      ...this.maps,
      ...this.geometries,
      ...this.paints,
      ...Object.values(this.materials),
    ])
      item.dispose();
  }
}
