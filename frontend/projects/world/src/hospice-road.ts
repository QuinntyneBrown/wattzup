import {
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import {
  color,
  cos,
  mix,
  positionLocal,
  positionWorld,
  sin,
  smoothstep,
  texture,
  uniform,
  uv,
  vec3,
} from 'three/tsl';
import type { Course, CoursePlace } from './course';
const views = [
  [120, 149, 1.2, 2.6],
  [4120, 4166, 0, 2.8],
  [8240, 8258, -4, 2.55],
  [12750, 12787, 40, 0],
  [15510, 15525, 8, 1.45],
  [17090, 17111, 3.4, 3.5],
] as const;
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

export class HospiceRoad {
  readonly root = new Group();
  readonly materials = {
    HospiceRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
    PassScree: new MeshBasicNodeMaterial({ side: DoubleSide }),
    HospiceStone: new MeshBasicMaterial({ side: DoubleSide }),
    SnowCut: new MeshBasicMaterial({ side: DoubleSide }),
    ColLake: new MeshBasicNodeMaterial({ side: DoubleSide }),
    PassPeaks: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.36, fog: false }),
  };
  private readonly lake = uniform(0);
  private readonly dogAngle = uniform(0);
  private readonly wind = uniform(0);
  private readonly dog = new Group();
  private readonly border = new Group();
  private readonly sheet = new PlaneGeometry(1, 1, 24, 14);
  private readonly board = new PlaneGeometry(1, 1);
  private readonly dogMat = new MeshBasicNodeMaterial({ side: DoubleSide, alphaTest: 0.41 });
  private readonly flags: MeshBasicNodeMaterial[] = [];
  private readonly signs: MeshBasicMaterial[] = [];
  private readonly paint: CanvasTexture[] = [];
  private readonly point = scratch();
  private readonly target = scratch();
  private readonly poses = {
    lakeRipple: null as number | null,
    dogHead: null as number | null,
    flagFold: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      [
        'stbernard-hospice',
        'stbernard-snow',
        'stbernard-ridges',
        'galibier-tarmac',
        'furka-scree',
        'stbernard-dog',
      ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const error = result.find((r) => r.status === 'rejected');
    if (error) {
      for (const m of maps) m.dispose();
      throw error.reason;
    }
    return new HospiceRoad(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const t of maps) {
      t.flipY = false;
      t.colorSpace = SRGBColorSpace;
    }
    const [stone, snow, peaks, road, scree, dog] = maps as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    this.materials.HospiceStone.map = stone;
    this.materials.SnowCut.map = snow;
    this.materials.PassPeaks.map = peaks;
    road.wrapS = road.wrapT = scree.wrapS = scree.wrapT = RepeatWrapping;
    road.anisotropy = 4;
    scree.anisotropy = 4;
    this.materials.HospiceRoad.colorNode = texture(road, positionWorld.xz.mul(0.18)).rgb;
    const ground = texture(scree, positionWorld.xz.mul(0.056)).rgb;
    const turf = smoothstep(
      0.05,
      0.85,
      sin(positionWorld.x.mul(0.019))
        .mul(0.57)
        .add(cos(positionWorld.z.mul(0.026)).mul(0.42)),
    );
    this.materials.PassScree.colorNode = mix(ground, ground.mul(color(0xa7bc7f)), turf.mul(0.84));
    const r = sin(
      positionWorld.z
        .mul(1.2)
        .add(this.lake)
        .add(sin(positionWorld.x.mul(0.55)).mul(1.4)),
    );
    this.materials.ColLake.colorNode = mix(color(0x37676d), color(0x648786), r.mul(0.16).add(0.44));
    dog.flipY = true;
    this.dogMat.colorNode = texture(dog).rgb;
    this.dogMat.opacityNode = texture(dog).a;
    // Pivot the neck inside the broad white ruff; paws, back and tail stay planted.
    const mask = smoothstep(0.35, 0.65, uv().x.oneMinus()).mul(smoothstep(0.36, 0.68, uv().y));
    const rot = this.dogAngle.mul(mask),
      dx = positionLocal.x.add(0.15),
      dy = positionLocal.y.sub(0.17);
    this.dogMat.positionNode = vec3(
      dx
        .mul(cos(rot))
        .sub(dy.mul(sin(rot)))
        .sub(0.15),
      dx
        .mul(sin(rot))
        .add(dy.mul(cos(rot)))
        .add(0.17),
      positionLocal.z.add(mask.mul(sin(rot)).mul(0.19)),
    );
    const animal = new Mesh(this.sheet, this.dogMat);
    animal.scale.set(2.14, 1.43, 1);
    animal.position.y = 0.75;
    this.dog.add(animal);
    this.locate(this.dog, 15523, 6.8);
    this.dog.rotation.y += 0.65;
    this.root.add(this.dog, this.border);
    this.flag(true, 17092, -5.65);
    this.flag(false, 17102, 5.6);
    this.sign('SUISSE', 17099, -5.2);
    this.sign('ITALIA', 17111, 5.2);
    this.update(0, 0);
  }
  private artwork(draw: (ctx: CanvasRenderingContext2D) => void) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;
    draw(ctx);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    this.paint.push(map);
    return map;
  }
  private locate(g: Group, d: number, lane: number) {
    const p = this.course.place(d, lane, this.point);
    g.position.set(p.x, p.y, p.z);
    g.rotation.y = p.heading;
  }
  private flag(swiss: boolean, d: number, lane: number) {
    const map = this.artwork((ctx) => {
      if (swiss) {
        ctx.fillStyle = '#bd3437';
        ctx.fillRect(0, 0, 256, 160);
        ctx.fillStyle = '#fffdf3';
        ctx.fillRect(112, 28, 32, 104);
        ctx.fillRect(66, 63, 124, 34);
      } else {
        for (const [j, c] of ['#387a57', '#f1eee2', '#b83d3c'].entries()) {
          ctx.fillStyle = c;
          ctx.fillRect((j * 256) / 3, 0, 86, 160);
        }
      }
    });
    const mat = new MeshBasicNodeMaterial({ side: DoubleSide, map });
    const end = uv().x,
      phase = this.wind.add(end.mul(6.9)).add(swiss ? 0 : 1);
    mat.positionNode = positionLocal.add(
      vec3(0, cos(phase).mul(end).mul(0.065), sin(phase).mul(end).mul(0.218)),
    );
    this.flags.push(mat);
    const flag = new Mesh(this.sheet, mat),
      g = new Group();
    g.add(flag);
    this.border.add(g);
    this.locate(g, d, lane);
    g.rotation.y += 0.58;
    const w = swiss ? 1.29 : 1.87;
    flag.scale.set(w, 1.19, 1);
    flag.position.set(w * 0.5, 4.61, 0);
  }
  private sign(label: string, d: number, lane: number) {
    const map = this.artwork((ctx) => {
      ctx.fillStyle = '#22496d';
      ctx.fillRect(0, 0, 256, 160);
      ctx.strokeStyle = '#e4e8e4';
      ctx.lineWidth = 7;
      ctx.strokeRect(8, 8, 240, 144);
      ctx.font = 'bold 45px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fbf7ea';
      ctx.fillText(label, 128, 81);
    });
    const mat = new MeshBasicMaterial({ side: DoubleSide, map });
    this.signs.push(mat);
    const sign = new Mesh(this.board, mat),
      g = new Group();
    g.add(sign);
    this.border.add(g);
    this.locate(g, d, lane);
    sign.scale.set(1.34, 0.82, 1);
    sign.position.y = 1.6;
    g.rotation.y += Math.PI;
  }
  update(metres: number, time: number) {
    this.lake.value = time * 0.84;
    this.wind.value = time * 2.46;
    this.dog.visible = Math.abs(metres - 15523) < 152;
    this.border.visible = Math.abs(metres - 17102) < 259;
    this.dogAngle.value = 0.12 * Math.sin(time * 0.93) + 0.052 * Math.sin(time * 1.69);
    this.poses.dogHead = this.dog.visible ? this.dogAngle.value : null;
    this.poses.lakeRipple = Math.abs(metres - 12750) < 240 ? this.lake.value : null;
    this.poses.flagFold = this.border.visible ? Math.sin(this.wind.value + 6.9) * 0.218 : null;
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    const d = metres;
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - d);
      if (gap > 49) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to, lane, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (49 - gap) / 24);
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
    for (const resource of [
      this.sheet,
      this.board,
      this.dogMat,
      ...this.flags,
      ...this.signs,
      ...this.paint,
      ...this.maps,
      ...Object.values(this.materials),
    ])
      resource.dispose();
  }
}
