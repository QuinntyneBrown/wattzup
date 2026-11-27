import type { BufferGeometry, Texture, Vector3 } from 'three/webgpu';
import {
  BoxGeometry,
  CanvasTexture,
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
import { color, mix, normalWorld, positionWorld, smoothstep, texture } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [140, 201, 13, 7],
  [2170, 2184, 2.7, 1.6],
  [4320, 4338, -6.8, 1],
  [6650, 6750, -141, 46],
  [8640, 8673, 4.5, 2.4],
  [10220, 10244, 7.1, 2.8],
] as const;
function fabric(basque: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;
  if (basque) {
    ctx.fillStyle = '#bc383b';
    ctx.fillRect(0, 0, 384, 240);
    ctx.lineWidth = 36;
    ctx.strokeStyle = '#398454';
    ctx.beginPath();
    ctx.moveTo(-18, -10);
    ctx.lineTo(402, 250);
    ctx.moveTo(402, -10);
    ctx.lineTo(-18, 250);
    ctx.stroke();
    ctx.fillStyle = '#f1e8d7';
    ctx.fillRect(169, 0, 45, 240);
    ctx.fillRect(0, 99, 384, 42);
  } else {
    ['#38548c', '#f0e8dc', '#cb5351'].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(i * 128, 0, 128, 240);
    });
  }
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  return map;
}
function cloud() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  for (let i = 0; i < 9; i++) {
    const x = 40 + i * 22,
      y = 63 + 14 * Math.cos(i * 2.7),
      g = ctx.createRadialGradient(x, y, 0, x, y, 43);
    g.addColorStop(0, 'rgba(234,239,244,.48)');
    g.addColorStop(1, 'rgba(234,239,244,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  return new CanvasTexture(c);
}
export class TourmaletPass {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicMaterial | MeshBasicNodeMaterial>;
  private readonly geo = new Set<BufferGeometry>();
  private readonly local: MeshBasicMaterial[] = [];
  private readonly devil = new Group();
  private readonly flags: { group: Group; cloth: PlaneGeometry; d: number }[] = [];
  private readonly chairs: Group[] = [];
  private readonly clouds: Mesh[] = [];
  private readonly point = place();
  private readonly target = place();
  private readonly poses = {
    devilStride: null as number | null,
    flagWave: null as number | null,
    chairTravel: null as number | null,
  };
  private readonly devilMap: Texture;
  static async load(course: Course) {
    const loader = new TextureLoader();
    const res = await Promise.allSettled(
      ['peaks', 'devil', 'fans', 'mongie', 'herd', 'pasture', 'bornes', 'chalk'].map((n) =>
        loader.loadAsync('courses/tourmalet-' + n + '.webp'),
      ),
    );
    const maps = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const err = res.find((r) => r.status === 'rejected');
    if (err) {
      for (const m of maps) m.dispose();
      throw err.reason;
    }
    return new TourmaletPass(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
      m.anisotropy = 4;
    }
    const [peaks, devil, fans, homes, herd, grass, bornes, chalk] = maps;
    grass!.wrapS = grass!.wrapT = RepeatWrapping;
    this.devilMap = devil!;
    this.devilMap.repeat.x = 0.25;
    const xz = positionWorld.xz;
    const land = new MeshBasicNodeMaterial({ side: DoubleSide });
    const tuft = texture(grass!, xz.mul(0.127)).rgb;
    land.colorNode = tuft.mul(normalWorld.y.abs().mul(0.34).add(0.69));
    const road = new MeshBasicNodeMaterial({ side: DoubleSide });
    road.colorNode = mix(
      color(0x505257),
      color(0x848487),
      smoothstep(0.03, 0.48, texture(grass!, xz.mul(0.84)).g),
    );
    this.materials = {
      PassTarmac: road,
      TourmaletPasture: land,
      PicBedrock: new MeshBasicMaterial({ map: grass, side: DoubleSide, color: 0xa4a3a8 }),
      PyreneanPeaks: new MeshBasicMaterial({ map: peaks, side: DoubleSide, fog: false }),
      SkiApartments: new MeshBasicMaterial({ map: homes, side: DoubleSide }),
      PassSupporters: new MeshBasicMaterial({ map: fans, side: DoubleSide, alphaTest: 0.48 }),
      PassLivestock: new MeshBasicMaterial({ map: herd, side: DoubleSide, alphaTest: 0.48 }),
      PaintedNames: new MeshBasicMaterial({ map: chalk, side: DoubleSide, alphaTest: 0.45 }),
      PassBornes: new MeshBasicMaterial({ map: bornes, side: DoubleSide }),
    };
    const runnerGeo = new PlaneGeometry(1.9, 2.48);
    const uv = runnerGeo.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
    const red = new MeshBasicMaterial({ map: devil, side: DoubleSide, alphaTest: 0.77 });
    const runner = new Mesh(runnerGeo, red);
    runner.position.y = 1.24;
    this.devil.add(runner);
    this.root.add(this.devil);
    this.geo.add(runnerGeo);
    this.local.push(red);
    const wood = new MeshBasicMaterial({ color: 0x866e51 }),
      iron = new MeshBasicMaterial({ color: 0x536169 }),
      chairSeat = new MeshBasicMaterial({ color: 0x9b5951 });
    this.local.push(wood, iron, chairSeat);
    const pole = new CylinderGeometry(0.034, 0.043, 3.15, 7),
      box = new BoxGeometry();
    this.geo.add(pole);
    this.geo.add(box);
    const flags = [fabric(true), fabric(false)];
    maps.push(...flags);
    const inks = flags.map((map) => new MeshBasicMaterial({ map, side: DoubleSide }));
    this.local.push(...inks);
    for (const [i, d] of [
      2150, 2193, 2201, 8380, 8580, 8618, 8655, 8664, 8680, 8715, 10194, 10240, 10257, 10313,
    ].entries()) {
      const g = new Group(),
        mast = new Mesh(pole, wood);
      mast.position.y = 1.575;
      g.add(mast);
      const p = course.place(d, (i % 3 ? -1 : 1) * 4.95);
      g.position.set(p.x, p.y, p.z);
      g.rotation.y = p.heading + 0.51 + (i % 2) * 0.4;
      const cloth = new PlaneGeometry(1.72, 0.97, 8, 2);
      cloth.translate(0.86, 2.63, 0);
      this.geo.add(cloth);
      g.add(new Mesh(cloth, inks[i % 2]));
      this.root.add(g);
      this.flags.push({ group: g, cloth, d });
    }
    const piece = (
      g: Group,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      depth: number,
      m: MeshBasicMaterial,
    ) => {
      const o = new Mesh(box, m);
      o.position.set(x, y, z);
      o.scale.set(w, h, depth);
      g.add(o);
      return o;
    };
    for (let i = 0; i < 8; i++) {
      const g = new Group();
      piece(g, 0, -1.18, 0, 0.074, 2.36, 0.09, iron);
      piece(g, 0, -2.4, 0, 1.9, 0.14, 0.83, chairSeat);
      piece(g, 0, -2.01, 0.37, 1.9, 0.75, 0.1, chairSeat);
      piece(g, 0, -1.94, -0.44, 1.96, 0.065, 0.08, iron);
      for (const side of [-1, 1]) piece(g, side * 0.92, -2.11, 0, 0.064, 0.54, 0.079, iron);
      this.chairs.push(g);
      this.root.add(g);
    }
    const mist = cloud();
    maps.push(mist);
    const vapour = new MeshBasicMaterial({
      map: mist,
      transparent: true,
      opacity: 0.54,
      depthWrite: false,
      side: DoubleSide,
    });
    const patch = new PlaneGeometry(146, 34);
    this.local.push(vapour);
    this.geo.add(patch);
    for (let i = 0; i < 9; i++) {
      const m = new Mesh(patch, vapour);
      this.clouds.push(m);
      this.root.add(m);
    }
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    // Each ascent has one supporter running a short stretch along the clear shoulder.
    const effort = this.course.stages.find((s) => metres >= s.from && metres < s.to);
    this.devil.visible =
      metres > 1800 && (effort?.kind === 'work' || Math.abs(metres - 2170) < 100 || metres > 9750);
    if (this.devil.visible) {
      const p = this.course.place(metres + 12.8 + 1.8 * Math.sin(t * 0.68), 2.95, this.point);
      const gait = t * 2.72;
      this.devil.position.set(p.x, p.y + 0.026 + 0.061 * Math.abs(Math.sin(gait)), p.z);
      this.devil.rotation.y = p.heading + 0.12;
      this.devilMap.offset.x = (Math.floor(t * 5.4) % 4) * 0.25;
      this.poses.devilStride = this.devil.position.y;
    }
    for (const [i, f] of this.flags.entries()) {
      f.group.visible = Math.abs(metres - f.d) < 230;
      if (!f.group.visible) continue;
      const pos = f.cloth.getAttribute('position');
      for (let j = 0; j < pos.count; j++) {
        const x = pos.getX(j);
        pos.setZ(
          j,
          x * 0.185 * Math.sin(t * 3.6 - x * 3.2 + i) + x * 0.078 * Math.sin(t * 4.9 + x),
        );
      }
      pos.needsUpdate = true;
      if (i === 6) this.poses.flagWave = pos.getZ(8);
    }
    for (const [i, g] of this.chairs.entries()) {
      g.visible = metres < 800;
      if (!g.visible) continue;
      const d = 115 + ((i * 54.6 + t * 2.6) % 435);
      const p = this.course.place(d, 11 + (i % 2 ? 2.1 : -2.1), this.point);
      g.position.set(p.x, p.y + 8.45, p.z);
      g.rotation.set(0, p.heading, 0.035 * Math.sin(t * 0.6 + i));
      if (i === 0) this.poses.chairTravel = g.position.x;
    }
    for (const [i, m] of this.clouds.entries()) {
      const d = 6250 + i * 87;
      m.visible = Math.abs(d - metres) < 1500;
      if (m.visible) {
        const p = this.course.place(d, -86 - 12 * i + 22 * Math.sin(t * 0.04 + i), this.point);
        m.position.set(p.x, p.y - 18 - 2 * i, p.z);
        m.rotation.y = p.heading + 0.65;
      }
    }
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - metres);
      if (gap > 50) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to, lane, this.target);
      if (at === 2170 && this.devil.visible) {
        p.x = this.devil.position.x;
        p.y = this.devil.position.y;
        p.z = this.devil.position.z;
      }
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
    for (const t of new Set([
      ...this.geo,
      ...this.local,
      ...Object.values(this.materials),
      ...this.maps,
    ]))
      t.dispose();
  }
}
