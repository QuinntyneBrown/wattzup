import type { BufferGeometry, Texture, Vector3 } from 'three/webgpu';
import {
  CanvasTexture,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  SphereGeometry,
  TextureLoader,
} from 'three/webgpu';
import { color, mix, positionWorld, sin, smoothstep, texture, uniform, uv } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [120, 184, 0, 9],
  [1740, 1794, 21, 16],
  [3380, 3434, 23, 3.2],
  [5190, 5214, -9, 1.7],
  [7220, 7278, -6, 17],
  [8520, 8652, -3, 49],
] as const;

function streetTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#33323c';
  ctx.fillRect(0, 0, 512, 512);
  let seed = 949;
  const rand = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  const palette = ['#65606a', '#544550', '#8b7d79', '#212331', '#aca298'];
  for (let n = 0; n < 52000; n++) {
    ctx.fillStyle = palette[n % 5]!;
    ctx.globalAlpha = rand() * 0.57;
    ctx.fillRect(rand() * 512, rand() * 512, rand() * 2.3 + 0.5, rand() * 2 + 0.5);
  }
  // The fallen paper is baked into the street so it casts no additional draws at distance.
  for (let n = 0; n < 310; n++) {
    ctx.save();
    ctx.translate(rand() * 512, rand() * 512);
    ctx.rotate(rand() * 6.28);
    ctx.fillStyle = ['#cf569f', '#d8be69', '#7ebbb3', '#adc2d3', '#784692'][n % 5]!;
    ctx.globalAlpha = 0.55 + rand() * 0.4;
    ctx.fillRect(0, 0, 1 + rand() * 3, 0.7 + rand() * 1.4);
    ctx.restore();
  }
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

export class TimesSquareCountdown {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicMaterial | MeshBasicNodeMaterial>;
  private readonly time = uniform(0);
  private readonly point = place();
  private readonly target = place();
  private readonly dummy = new Object3D();
  private readonly ball = new Group();
  private readonly boardCanvas = document.createElement('canvas');
  private readonly clockTexture: CanvasTexture;
  private readonly confetti: InstancedMesh;
  private readonly breath: InstancedMesh;
  private readonly geometries: BufferGeometry[] = [];
  private readonly local: MeshBasicMaterial[] = [];
  private readonly poses = {
    countdownNumeral: null as number | null,
    confettiHeight: null as number | null,
    breathRadius: null as number | null,
  };
  private lastSecond = -1;
  static async load(course: Course) {
    const loader = new TextureLoader();
    const res = await Promise.allSettled(
      ['facades', 'displays', 'revellers', 'police', 'signs'].map((n) =>
        loader.loadAsync('courses/timessquare-' + n + '.webp'),
      ),
    );
    const maps = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const error = res.find((r) => r.status === 'rejected');
    if (error) {
      for (const map of maps) map.dispose();
      throw error.reason;
    }
    return new TimesSquareCountdown(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const map of maps) {
      map.colorSpace = SRGBColorSpace;
      map.flipY = false;
      map.anisotropy = 4;
    }
    const [facades, ads, crowds, officers, signs] = maps;
    const pavement = streetTexture();
    maps.push(pavement);
    const asphalt = new MeshBasicNodeMaterial({ side: DoubleSide }),
      walk = new MeshBasicNodeMaterial({ side: DoubleSide });
    const w = positionWorld.xz;
    const stone = texture(pavement, w.mul(0.25)).rgb;
    const blocks = sin(w.x.mul(0.091).add(w.y.mul(0.038)).add(this.time.mul(0.17)))
      .mul(0.5)
      .add(0.5);
    const beam = sin(w.x.mul(0.38).add(w.y.mul(0.13)))
      .mul(0.5)
      .add(0.5);
    const reflection = mix(color(0x863777), color(0x2785a3), blocks);
    const curb = smoothstep(0.9, 8.8, uv().x.abs());
    asphalt.colorNode = stone
      .mul(0.83)
      .add(reflection.mul(beam.mul(0.24).add(0.09)).mul(curb.mul(0.68).add(0.32)));
    walk.colorNode = stone.mul(1.34).add(reflection.mul(0.16));
    const led = new MeshBasicNodeMaterial({ side: DoubleSide });
    led.colorNode = texture(ads!, uv()).rgb.mul(
      sin(positionWorld.x.mul(0.023).add(this.time.mul(0.67)))
        .mul(0.16)
        .add(1.14),
    );
    this.materials = {
      BroadwayAsphalt: asphalt,
      BroadwaySidewalk: walk,
      MidtownFacades: new MeshBasicMaterial({ map: facades, side: DoubleSide }),
      BroadwayLED: led,
      WinterCrowds: new MeshBasicMaterial({ map: crowds, side: DoubleSide, alphaTest: 0.42 }),
      PlazaOfficers: new MeshBasicMaterial({ map: officers, side: DoubleSide, alphaTest: 0.42 }),
      PlazaSigns: new MeshBasicMaterial({ map: signs, side: DoubleSide }),
    };
    this.boardCanvas.width = 640;
    this.boardCanvas.height = 256;
    this.clockTexture = new CanvasTexture(this.boardCanvas);
    this.clockTexture.colorSpace = SRGBColorSpace;
    const display = new MeshBasicMaterial({ map: this.clockTexture, side: DoubleSide, fog: false });
    this.local.push(display);
    const screen = new PlaneGeometry(15.6, 6.24);
    this.geometries.push(screen);
    for (const [d, lane, lift] of [
      [7288, -8, 17],
      [8636, -3, 48],
      [1804, -12, 20],
    ]) {
      const board = new Mesh(screen, display);
      const p = course.place(d, lane, this.point);
      board.position.set(p.x, p.y + lift, p.z);
      board.rotation.y = p.heading;
      this.root.add(board);
    }
    // Jewel facets and their dark leads keep the crystal ball distinct from a flat disc.
    const crystal = new IcosahedronGeometry(2.85, 2);
    const pos = crystal.getAttribute('position');
    const colors = new Float32Array(pos.count * 3);
    const c = new Color();
    for (let i = 0; i < pos.count; i += 3) {
      c.setHex(
        [0x9be7fe, 0xffdf88, 0xa9a2f3, 0x6aaeda, 0xfcbbdd, 0xdafaff][
          (((i * 11) / 3 + (i % 8)) % 6) | 0
        ]!,
      );
      for (let j = 0; j < 3; j++) c.toArray(colors, (i + j) * 3);
    }
    crystal.setAttribute('color', new Float32BufferAttribute(colors, 3));
    const glass = new MeshBasicMaterial({ vertexColors: true, fog: false }),
      wire = new MeshBasicMaterial({ color: 0x4b637b, wireframe: true });
    const frame = new Mesh(crystal, wire);
    frame.scale.setScalar(1.004);
    this.ball.add(new Mesh(crystal, glass), frame);
    this.geometries.push(crystal);
    this.local.push(glass, wire);
    this.root.add(this.ball);
    const paper = new PlaneGeometry(0.16, 0.082);
    const sheet = new MeshBasicMaterial({ side: DoubleSide });
    this.confetti = new InstancedMesh(paper, sheet, 420);
    for (let i = 0; i < this.confetti.count; i++)
      this.confetti.setColorAt(
        i,
        c.setHex([0xcd679f, 0xf0c15a, 0x93e0d5, 0xecc7ad, 0xb198e9][i % 5]!),
      );
    this.confetti.frustumCulled = false;
    this.root.add(this.confetti);
    const puff = new SphereGeometry(1, 7, 5);
    const mist = new MeshBasicMaterial({
      color: 0xb9b7c5,
      transparent: true,
      opacity: 0.19,
      depthWrite: false,
    });
    this.breath = new InstancedMesh(puff, mist, 18);
    this.breath.frustumCulled = false;
    this.root.add(this.breath);
    this.geometries.push(paper, puff);
    this.local.push(sheet, mist);
    this.update(0, 0);
  }
  private paintCountdown(seconds: number) {
    if (this.lastSecond === seconds) return;
    const ctx = this.boardCanvas.getContext('2d')!;
    ctx.fillStyle = '#140c27';
    ctx.fillRect(0, 0, 640, 256);
    ctx.fillStyle = '#ffd78c';
    ctx.textAlign = 'center';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(seconds ? 'TIMES SQUARE' : 'HAPPY NEW YEAR', 320, 56);
    ctx.fillStyle = '#fcf0c7';
    ctx.font = 'bold 138px monospace';
    ctx.fillText(
      seconds
        ? Math.floor(seconds / 60)
            .toString()
            .padStart(2, '0') +
            ':' +
            (seconds % 60).toString().padStart(2, '0')
        : '2027',
      320,
      202,
    );
    this.clockTexture.needsUpdate = true;
    this.lastSecond = seconds;
  }
  update(metres: number, t: number) {
    this.time.value = t;
    const seconds = Math.max(0, Math.ceil(this.course.duration - t));
    this.paintCountdown(seconds);
    this.poses.countdownNumeral = seconds;
    const p = this.course.place(8652, -3, this.point);
    this.ball.position.set(p.x, p.y + 70.5 + 7 * Math.min(1, seconds / 60), p.z);
    this.ball.rotation.y = t * 0.13;
    this.confetti.visible = metres > 6800;
    this.breath.visible = Math.abs(metres - 5190) < 310;
    if (this.confetti.visible) {
      const step = Math.floor(metres / 10) * 10;
      for (let i = 0; i < this.confetti.count; i++) {
        const origin = step - 9 + ((i * 17 - (step % 90) + 90) % 90);
        const time = (t * 0.31 + i * 0.317) % 1;
        const lane = 9.5 * Math.sin(i * 28.641) + 1.4 * Math.sin(t * 0.61 + i);
        const q = this.course.place(origin, lane, this.point);
        const y = 1 + 13 * (1 - time);
        this.dummy.position.set(q.x, q.y + y, q.z);
        this.dummy.rotation.set(i + t * 2.4, i * 0.7 + t * 1.6, i + t * 0.82);
        this.dummy.scale.setScalar(1 + (i % 4) * 0.25);
        this.dummy.updateMatrix();
        this.confetti.setMatrixAt(i, this.dummy.matrix);
        if (i === 0) this.poses.confettiHeight = y;
      }
      this.confetti.instanceMatrix.needsUpdate = true;
    }
    if (this.breath.visible) {
      for (let i = 0; i < this.breath.count; i++) {
        const age = (t * 0.47 + i * 0.31) % 1,
          rad = 0.04 + 0.16 * Math.sin(Math.PI * age);
        const d = 5167 + (i % 9) * 6.2,
          side = i < 9 ? -1 : 1;
        const q = this.course.place(d, side * (10.9 + age * 0.45), this.point);
        this.dummy.position.set(q.x, q.y + 1.72 + age * 0.27, q.z);
        this.dummy.scale.set(rad * 1.38, rad * 0.68, rad);
        this.dummy.rotation.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.breath.setMatrixAt(i, this.dummy.matrix);
        if (i === 0) this.poses.breathRadius = rad;
      }
      this.breath.instanceMatrix.needsUpdate = true;
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
    this.confetti.dispose();
    this.breath.dispose();
    for (const item of new Set([
      ...this.geometries,
      ...this.local,
      ...Object.values(this.materials),
      ...this.maps,
      this.clockTexture,
    ]))
      item.dispose();
  }
}
