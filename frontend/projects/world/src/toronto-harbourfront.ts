import type { Texture, Vector3 } from 'three/webgpu';
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';
import { color, mix, positionWorld, sin, smoothstep, texture, uniform } from 'three/tsl';
import { cnTower } from './cn-tower';
import type { Course, CoursePlace } from './course';
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [140, 275, 0, 7],
  [2630, 2664, -14, 2.1],
  [4910, 4952, 13, 1.2],
  [7050, 7093, 18, 2],
  [9880, 9942, 70, 4.2],
  [12810, 12849, 18, 2.2],
] as const;
function grains() {
  const c = document.createElement('canvas');
  c.width = c.height = 384;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#98938c';
  ctx.fillRect(0, 0, 384, 384);
  let seed = 423;
  const r = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  for (let j = 0; j < 46000; j++) {
    ctx.globalAlpha = r() * 0.5;
    ctx.fillStyle = j % 2 ? '#dedbd4' : '#514a44';
    ctx.fillRect(r() * 384, r() * 384, r() * 2.6 + 0.3, r() * 1.7 + 0.3);
  }
  const m = new CanvasTexture(c);
  m.wrapS = m.wrapT = RepeatWrapping;
  m.colorSpace = SRGBColorSpace;
  return m;
}
export class TorontoHarbourfront {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicMaterial | MeshBasicNodeMaterial>;
  private readonly geometries = new Set<BufferGeometry>();
  private readonly paints: MeshBasicMaterial[] = [];
  private readonly clock = uniform(0);
  private readonly skyline = new Group();
  private readonly tram = new Group();
  private readonly ferry = new Group();
  private readonly runner = new Group();
  private readonly sailboats: Group[] = [];
  private readonly point = place();
  private readonly target = place();
  private readonly poses = {
    streetcarPosition: null as number | null,
    ferryCrossing: null as number | null,
    runnerStride: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const res = await Promise.allSettled(
      [
        'condos',
        'lakesky',
        'shoretrees',
        'trail-users',
        'streetcar',
        'ferry',
        'mark',
        'beach',
        'stone',
        'beach-sand',
      ].map((n) => loader.loadAsync('courses/toronto-' + n + '.webp')),
    );
    const maps = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const err = res.find((r) => r.status === 'rejected');
    if (err) {
      for (const m of maps) m.dispose();
      throw err.reason;
    }
    return new TorontoHarbourfront(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const map of maps) {
      map.flipY = false;
      map.colorSpace = SRGBColorSpace;
      map.anisotropy = 4;
    }
    const [condos, sky, tree, people, streetcar, ferry, mark, furniture, slabs, sand] = maps;
    const grit = grains();
    maps.push(grit);
    const stone = texture(grit, positionWorld.xz.mul(0.5)).rgb;
    const paving = (tone: number) => {
      const m = new MeshBasicNodeMaterial({ side: DoubleSide });
      m.colorNode = stone.mul(color(tone)).mul(2.16);
      return m;
    };
    const water = new MeshBasicNodeMaterial({ side: DoubleSide });
    const x = positionWorld.x,
      z = positionWorld.z,
      t = this.clock;
    const crest = sin(x.mul(0.21).add(z.mul(0.53)).add(t.mul(0.83)))
      .add(sin(z.mul(0.28).sub(t.mul(0.62))))
      .add(sin(x.mul(0.31).sub(z.mul(0.11)).add(t.mul(0.48))));
    water.colorNode = mix(color(0x316a83), color(0x71a8be), crest.mul(0.15).add(0.53)).add(
      color(0xe5edf0)
        .mul(smoothstep(2.57, 2.95, crest))
        .mul(0.73),
    );
    const tile = (map: Texture, scale: number) => {
      map.wrapS = map.wrapT = RepeatWrapping;
      const material = new MeshBasicNodeMaterial({ side: DoubleSide });
      material.colorNode = texture(map, positionWorld.xz.mul(scale)).rgb;
      return material;
    };
    const timber = paving(0xb29372);
    this.materials = {
      TrailPaving: paving(0xb86b60),
      QuayGranite: tile(slabs!, 0.25),
      QuayRoad: paving(0x79777a),
      BeachSand: tile(sand!, 0.35),
      WaveTimber: timber,
      BeachFurniture: new MeshBasicMaterial({ map: furniture, side: DoubleSide, alphaTest: 0.47 }),
      HarbourWater: water,
      QuayCondos: new MeshBasicMaterial({ map: condos, side: DoubleSide }),
      IslandHorizon: new MeshBasicMaterial({ map: sky, side: DoubleSide, fog: false }),
      TrailVisitors: new MeshBasicMaterial({ map: people, side: DoubleSide, alphaTest: 0.46 }),
      MapleTrees: new MeshBasicMaterial({ map: tree, side: DoubleSide, alphaTest: 0.66 }),
      TrailMarkings: new MeshBasicMaterial({ map: mark, side: DoubleSide, alphaTest: 0.42 }),
    };
    const paint = (hex: number) => {
      const m = new MeshBasicMaterial({ color: hex, side: DoubleSide });
      this.paints.push(m);
      return m;
    };
    const concrete = paint(0xbab8b0),
      grey = paint(0xe0dcd0),
      glass = paint(0x536878);
    const tower = cnTower(concrete, grey, glass);
    tower.position.set(0, 0, 0);
    tower.scale.y = 553 / 539;
    this.skyline.add(tower);
    this.root.add(this.skyline);
    tower.traverse((node) => {
      if (node instanceof Mesh) this.geometries.add(node.geometry);
    });
    const dome = new SphereGeometry(1, 48, 16, 0, 2 * Math.PI, 0, Math.PI / 2);
    const roof = new Mesh(dome, grey);

    roof.scale.set(128, 55, 101);
    roof.position.set(60, 24, 176);
    this.skyline.add(roof);
    this.geometries.add(dome);
    const base = new CylinderGeometry(1, 1, 1, 48);
    const drum = new Mesh(base, concrete);
    drum.scale.set(130, 24, 104);
    drum.position.set(60, 12, 176);
    this.skyline.add(drum);
    this.geometries.add(base);
    const unit = new BoxGeometry();
    this.geometries.add(unit);
    const box = (
      parent: Group,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
      material: MeshBasicMaterial,
    ) => {
      const m = new Mesh(unit, material);
      m.scale.set(w, h, l);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };
    const skylineGlass = paint(0x96aab4);
    const skylineShade = paint(0x80919d);
    for (let i = 0; i < 28; i++) {
      const x = -450 + i * 34;
      if (x > -75 && x < 185) continue;
      const h = 41 + Math.abs(Math.sin(i * 3.31)) * 106;
      box(
        this.skyline,
        x,
        h / 2,
        -122 + Math.sin(i * 38) * 72,
        21 + (i % 4) * 6,
        h,
        26 + (i % 5) * 5,
        skylineGlass,
      );
      box(this.skyline, x - 8, h / 2, -122 + Math.sin(i * 38) * 72 + 12, 5, h, 5, skylineShade);
    }
    const skin = (
      parent: Group,
      map: Texture,
      length: number,
      height: number,
      width: number,
      lift: number,
    ) => {
      const mat = new MeshBasicMaterial({ map, side: DoubleSide, alphaTest: 0.43 });
      this.paints.push(mat);
      const geo = new PlaneGeometry(length, height);
      const uv = geo.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
      this.geometries.add(geo);
      for (const sign of [-1, 1]) {
        const m = new Mesh(geo, mat);
        m.position.set((sign * width) / 2, lift + height / 2, 0);
        m.rotation.y = (sign * Math.PI) / 2;
        parent.add(m);
      }
    };
    const dark = paint(0x323f46),
      shell = paint(0xc4483f),
      cream = paint(0xe8e3d7);
    for (let j = 0; j < 5; j++) box(this.tram, 0, 1.51, (j - 2) * 5.78, 2.39, 2.5, 5.54, shell);
    for (const end of [-1, 1]) box(this.tram, 0, 1.97, end * 14.33, 2.16, 1.21, 0.12, dark);
    skin(this.tram, streetcar!, 29.1, 4.24, 2.54, 0.07);
    box(this.ferry, 0, 0.34, 0, 8.1, 0.95, 38.5, paint(0x324e4b));
    box(this.ferry, 0, 2.4, 0, 7.21, 3.3, 34.8, cream);
    box(this.ferry, 0, 4.5, 0, 5.8, 1.0, 27.7, cream);
    skin(this.ferry, ferry!, 42, 8.7, 8.42, 0.05);
    this.root.add(this.tram, this.ferry);
    const run = new PlaneGeometry(1.22, 1.84);
    this.geometries.add(run);
    const uv = run.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (0.005 + 0.99 * uv.getX(i)) / 4, 1 - uv.getY(i));
    const runner = new Mesh(run, this.materials['TrailVisitors']);
    runner.position.y = 0.92;
    this.runner.add(runner);
    this.root.add(this.runner);
    const sail = new BufferGeometry();
    sail.setAttribute(
      'position',
      new Float32BufferAttribute([0, 0, -0.5, 0, 6, 0, 0, 0.45, 2.9], 3),
    );
    this.geometries.add(sail);
    for (let i = 0; i < 9; i++) {
      const boat = new Group();
      box(boat, 0, 0.08, 0, 1.74, 0.68, 6.4, cream);
      box(boat, 0, 3, 0, 0.07, 6, 0.07, grey);
      boat.add(new Mesh(sail, i % 3 === 0 ? shell : cream));
      this.root.add(boat);
      this.sailboats.push(boat);
    }
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.clock.value = t;
    // The skyline uses the same distant layer as Caribana. Its bearing stays fixed
    // in the world as the trail bends, while nearby condos and the rails pass freely.
    const eye = this.course.place(metres, 0, this.point);
    const skylineDistance = 1900 + 260 * Math.cos(metres / 4800);
    this.skyline.position.set(
      eye.x + skylineDistance,
      eye.y - 12,
      eye.z - 196 + 105 * Math.sin(metres / 3600),
    );

    this.tram.visible = Math.abs(metres - 2630) < 600;
    if (this.tram.visible) {
      const d = 2662 + 12 * Math.sin(t * 0.16);
      const p = this.course.place(d, -13.82, this.point);
      this.tram.position.set(p.x, p.y + 0.05, p.z);
      this.tram.rotation.y = p.heading;
      this.poses.streetcarPosition = this.tram.position.x;
    }
    this.ferry.visible = Math.abs(metres - 9880) < 920;
    if (this.ferry.visible) {
      const q = this.course.place(
        9942 + 13 * Math.sin(t * 0.045),
        70 + 14 * Math.sin(t * 0.053),
        this.point,
      );
      this.ferry.position.set(q.x, q.y - 1.06 + 0.079 * Math.sin(t * 0.99), q.z);
      this.ferry.rotation.set(0, q.heading + 0.96, 0.01 * Math.sin(t * 0.7));
      this.poses.ferryCrossing = this.ferry.position.z;
    }
    this.runner.visible = metres < 480;
    if (this.runner.visible) {
      const p = this.course.place(165 + 15 * Math.sin(t * 0.1), 1.95, this.point);
      this.runner.position.set(p.x, p.y + 0.055 + 0.086 * Math.abs(Math.sin(t * 3.1)), p.z);
      this.runner.rotation.y = p.heading;
      this.poses.runnerStride = this.runner.position.y;
    }
    for (const [i, b] of this.sailboats.entries()) {
      const d = 325 + i * 1474;
      b.visible = Math.abs(metres - d) < 1700;
      if (b.visible) {
        const p = this.course.place(
          d + 13 * Math.sin(t * 0.037 + i),
          78 + (i % 3) * 45 + 7 * Math.sin(t * 0.041 + i),
          this.point,
        );
        b.position.set(p.x, p.y - 1 + 0.08 * Math.sin(t * 0.7 + i), p.z);
        b.rotation.set(0, p.heading + 0.43 + i * 0.97, 0.045 * Math.sin(t * 0.68 + i));
      }
    }
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - metres);
      if (gap > 50) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to, lane, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (50 - gap) / 23);
      camera.x += (r.x - (4.8 * dx) / len - camera.x) * w;
      camera.z += (r.z - (4.8 * dz) / len - camera.z) * w;
      camera.y += (r.y + 2.35 - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y += (r.y + 1.55 + (18.8 * (p.y + lift - r.y - 2.35)) / (len + 4.8) - ahead.y) * w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    for (const item of new Set([
      ...this.geometries,
      ...this.paints,
      ...Object.values(this.materials),
      ...this.maps,
    ]))
      item.dispose();
  }
}
