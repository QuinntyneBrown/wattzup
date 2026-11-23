// Stelvio Pass's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the eastern
// ramp's forty-eight hairpins stacked up an Italian alpine wall, on a crisp summer morning. The
// rider climbs between a grey cliff on the right and a stone parapet on the left, over meadows
// and larches falling to the valley. Ahead the wall rises with the road's switchbacks zigzagging
// up its face to the pass, and the Ortler's snowfields and white peaks stand above. Red-and-white
// posts top the parapet, the Tornante signs count down the hairpins, snow lies in patches on the
// slope, and fellow climbers grind up while others sweep down. Built on the shared kit
// (world-kit.ts) on the pattern of Old Town's street.
import {
  type BufferAttribute,
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  TorusGeometry,
  type Texture,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  canvasTexture,
  Figures,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The road repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
/** A Tornante sign stands every SIGN metres, counting down from FIRST. */
const SIGN = 80;
const FIRST = 24;

const CLIMBER_WEAR = {
  tops: ['#ff2d78', '#2dd4ff', '#ffd23f', '#1f5fbf', '#f5f5f0', '#2a7a4a', '#c8102e', '#1d1f24'],
  bottoms: ['#1d1f24', '#1d1f24', '#2f3e5c'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#f5d3b5'],
};

interface Climber {
  readonly bike: Mesh;
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly phase: number;
}

export class StelvioStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly climbers: Climber[] = [];
  private riders: Figures | null = null;
  private readonly horizon = new Group();
  readonly backdrop = [this.horizon];
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit);
    this.addSlopes(roadHalf, points);
    this.addPosts(roadHalf);
    this.addSigns(roadHalf);
    this.addLarches(roadHalf);
    this.addSnow(roadHalf);
    this.addClimbers(roadHalf);
    this.addWall();
  }

  setTime(seconds: number): void {
    this.time = seconds;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops far below the road, so the meadows fall away to the valley. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 500);
      position.setY(i * 2 + 1, p.height - 500);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    const riders = this.riders;
    if (riders) {
      this.climbers.forEach((c, i) => {
        const metres = loopMetres(c.offset + c.speed * this.time, s, LOOP, BEHIND);
        const y = heightAt(metres);
        const heading = c.speed > 0 ? 0 : Math.PI;
        const rock = c.speed > 0 ? Math.sin(this.time * 3.6 + c.phase) * 0.08 : 0;
        c.bike.position.set(c.x, y, -metres);
        c.bike.rotation.set(0, heading, rock);
        riders.set(
          i,
          c.x,
          y + 0.2,
          -metres,
          heading,
          0.95,
          Math.abs(Math.sin(this.time * 3.6 + c.phase)) * 0.03,
        );
      });
      riders.commit();
    }
    // The wall and the peaks keep their bearing as the road climbs.
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The cliff rising on the right, the parapet on the left, and the meadows falling away below it. */
  private addSlopes(roadHalf: number, points: number): void {
    const r = roadHalf;
    const cliff = this.material({ map: this.repeat(cliffTexture(), 8, 8), roughness: 0.95 });
    const meadow = this.material({ map: this.repeat(meadowTexture(), 10, 10), roughness: 1 });
    const far = this.material({
      map: this.repeat(meadowTexture(), 80, 80),
      color: 0xb8c8a8,
      roughness: 1,
    });
    const stone = this.material({ map: this.repeat(parapetTexture(), 1.5, 1.5), roughness: 0.9 });
    const verge = this.material({ color: 0x8a8a80, roughness: 1 });
    this.ribbons.add(points, meadow, [
      [r + 160, 110],
      [r + 40, 32],
    ]);
    this.ribbons.add(points, cliff, [
      [r + 40, 32],
      [r + 6, 18],
      [r + 2.2, 6],
      [r + 1.2, 0.3],
    ]);
    this.ribbons.add(points, verge, [
      [r + 1.2, 0.3],
      [r, 0.004],
    ]);
    this.ribbons.add(points, verge, [
      [-r, 0.004],
      [-r - 0.5, 0.02],
    ]);
    this.ribbons.add(points, stone, [
      [-r - 0.5, 0.02],
      [-r - 0.5, 0.75],
      [-r - 1.1, 0.8],
      [-r - 1.1, -0.6],
    ]);
    this.ribbons.add(points, meadow, [
      [-r - 1.1, -0.6],
      [-r - 40, -24],
      [-r - 160, -110],
    ]);
    this.ribbons.add(points, far, [
      [-r - 160, -110],
      [-r - 1500, -520],
    ]);
  }

  /** Red-and-white posts along the parapet's top, and reflector posts at the cliff's foot. */
  private addPosts(roadHalf: number): void {
    const striped = this.material({ map: this.track(postTexture()), roughness: 0.6 });
    const post = new BoxGeometry(0.14, 0.9, 0.14);
    post.translate(0, 1.2, 0);
    this.disposables.push(post);
    const parts: BufferGeometry[] = [];
    for (let z = 0; z < 40; z += 4) {
      const p = post.clone();
      p.translate(0, 0, -z);
      parts.push(p);
    }
    const row = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    this.disposables.push(row);
    for (let offset = 0; offset < LOOP; offset += 40) {
      const holder = new Group();
      holder.add(new Mesh(row, striped));
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 0.8 });
    }
  }

  /** The Tornante signs on the cliff side, counting the hairpins down to the pass. */
  private addSigns(roadHalf: number): void {
    const steel = this.material({ color: 0x8a8f99, metalness: 0.6, roughness: 0.4 });
    const pole = new CylinderGeometry(0.05, 0.05, 2.4, 6);
    pole.translate(0, 1.2, 0);
    const plate = new PlaneGeometry(1.1, 0.75);
    plate.translate(0, 2.2, 0.04);
    this.disposables.push(pole, plate);
    for (let offset = 30, n = FIRST; offset < LOOP; offset += SIGN, n--) {
      const face = this.material({ map: this.track(tornanteTexture(n)), roughness: 0.5 });
      const sign = new Group();
      sign.add(new Mesh(pole, steel), new Mesh(plate, face));
      sign.rotation.y = -0.35;
      this.group.add(sign);
      this.props.push({ mesh: sign, offset, x: roadHalf + 1 });
    }
  }

  /** Larches below the parapet, thinning as the road climbs out of the treeline. */
  private addLarches(roadHalf: number): void {
    const random = seeded(1201);
    const bark = this.material({ color: 0x4a3a2c, roughness: 1 });
    const needles = [0x4f7a3a, 0x5a8a44, 0x3f6a32].map((c) =>
      this.material({ color: c, roughness: 0.95 }),
    );
    const trunk = new CylinderGeometry(0.12, 0.22, 10, 6);
    trunk.translate(0, 5, 0);
    const crown = new ConeGeometry(1.8, 9, 8);
    crown.translate(0, 7, 0);
    this.disposables.push(trunk, crown);
    for (let offset = 0; offset < LOOP; offset += 4 + random() * 8) {
      const d = 6 + random() * 70;
      const tree = new Group();
      tree.add(new Mesh(trunk, bark), new Mesh(crown, needles[Math.floor(random() * 3)]!));
      tree.children.forEach((c) => (c.castShadow = true));
      tree.scale.setScalar(0.7 + random() * 0.6);
      tree.position.y = -0.6 - d * 0.6;
      this.group.add(tree);
      this.props.push({ mesh: tree, offset, x: -roadHalf - 1.1 - d });
    }
  }

  /** Patches of old snow lying on the slopes above and below the road. */
  private addSnow(roadHalf: number): void {
    const random = seeded(1213);
    const snow = this.material({ color: 0xf4f8fc, roughness: 0.7 });
    const patch = new SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(patch);
    for (let offset = 10; offset < LOOP; offset += 15 + random() * 25) {
      const above = random() < 0.6;
      const d = 4 + random() * 30;
      const holder = new Group();
      const mesh = new Mesh(patch, snow);
      mesh.scale.set(2 + random() * 5, 0.25, 2 + random() * 4);
      mesh.position.y = above ? Math.min(6 + d * 0.5, 30) : -0.6 - d * 0.6;
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: above ? roadHalf + 2 + d : -roadHalf - 1.1 - d });
    }
  }

  /** Fellow climbers grinding up the hairpins, and others sweeping down. */
  private addClimbers(roadHalf: number): void {
    const random = seeded(1217);
    const frame = this.material({ color: 0x1d1f24, metalness: 0.5, roughness: 0.4 });
    const bike = roadBikeGeometry();
    this.disposables.push(bike);
    for (let offset = 14; offset < LOOP; offset += 18 + random() * 24) {
      const up = random() < 0.7;
      const mesh = new Mesh(bike, frame);
      mesh.castShadow = true;
      this.group.add(mesh);
      this.climbers.push({
        bike: mesh,
        offset,
        x: up ? roadHalf - 0.8 - random() * 1.2 : -roadHalf + 0.9,
        speed: up ? 1.8 + random() * 1.2 : -(10 + random() * 3),
        phase: random() * 6.3,
      });
    }
    this.riders = new Figures(
      this.group,
      this.disposables,
      this.climbers.length,
      CLIMBER_WEAR,
      1223,
    );
  }

  /**
   * The wall ahead: the mountainside with the hairpins zigzagging up its face to the pass, the
   * snowfields above, and the Ortler's peaks behind.
   */
  private addWall(): void {
    const face = this.material({ map: this.track(hairpinTexture()), roughness: 1 });
    const snow = this.material({ color: 0xf2f6fa, roughness: 0.7 });
    const rock = this.material({
      map: this.repeat(cliffTexture(), 60, 60),
      color: 0xb0aca8,
      roughness: 1,
    });
    const wall = new Mesh(new PlaneGeometry(3200, 900), face);
    this.disposables.push(wall.geometry);
    wall.position.set(-80, 260, -1300);
    wall.rotation.x = -0.35;
    this.horizon.add(wall);
    const random = seeded(1229);
    for (let k = 0; k < 9; k++) {
      const peak = new ConeGeometry(160 + random() * 140, 380 + random() * 280, 7, 1);
      this.disposables.push(peak);
      const x = -900 + k * 230 + random() * 80;
      const base = new Mesh(peak, rock);
      base.position.set(x * 1.4, 760 + random() * 90, -1800 - random() * 250);
      const cap = new Mesh(peak, snow);
      cap.scale.setScalar(0.45);
      cap.position.copy(base.position);
      cap.position.y += (380 + 280) * 0.25;
      this.horizon.add(base, cap);
    }
    const field = new IcosahedronGeometry(1, 2);
    this.disposables.push(field);
    for (let k = 0; k < 5; k++) {
      const m = new Mesh(field, snow);
      m.scale.set(260 + random() * 200, 40, 160);
      m.position.set(-900 + k * 450, 690, -1520);
      this.horizon.add(m);
    }
    this.group.add(this.horizon);
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial(options);
    this.disposables.push(material);
    return material;
  }

  private repeat(texture: CanvasTexture, x: number, y: number) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1 / x, 1 / y);
    return this.track(texture);
  }
}

/** A light road bike, along z: two wheels, its frame and drop bars. */
function roadBikeGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const z of [-0.5, 0.5]) {
    const wheel = new TorusGeometry(0.34, 0.02, 4, 18);
    wheel.rotateY(Math.PI / 2);
    wheel.translate(0, 0.35, z);
    parts.push(wheel);
  }
  const tube = (length: number, y: number, z: number, tilt: number) => {
    const t = new CylinderGeometry(0.02, 0.02, length, 5);
    t.rotateX(tilt);
    t.translate(0, y, z);
    parts.push(t);
  };
  tube(0.6, 0.72, -0.05, Math.PI / 2 - 0.1);
  tube(0.6, 0.55, 0.15, 0.3);
  tube(0.55, 0.55, -0.32, -0.6);
  const saddle = new BoxGeometry(0.1, 0.04, 0.24);
  saddle.translate(0, 0.9, 0.22);
  const bars = new BoxGeometry(0.42, 0.03, 0.03);
  bars.translate(0, 0.86, -0.42);
  parts.push(saddle, bars);
  const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Grey limestone cliff, streaked and ledged. */
function cliffTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#8e8a84', 1231);
    const random = seeded(1237);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '40,38,36' : '200,196,190'},${0.12 + random() * 0.2})`;
      g.fillRect(random() * 256, random() * 256, 3 + random() * 40, 2 + random() * 6);
    }
  });
}

/** Alpine meadow: short grass with stones and flowers. */
function meadowTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#6a9a48', 1249);
    const random = seeded(1259);
    for (let i = 0; i < 140; i++) {
      g.fillStyle = ['#e8e4dc', '#ffd23f', '#b088e0', '#8a8a80'][Math.floor(random() * 4)]!;
      g.fillRect(random() * 256, random() * 256, 2 + random() * 3, 2 + random() * 3);
    }
  });
}

/** The parapet's dressed grey stone. */
function parapetTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#a8a49c', 1277);
    g.fillStyle = 'rgba(50,45,40,0.45)';
    for (let y = 0; y < 128; y += 32) {
      g.fillRect(0, y, 128, 3);
      for (let x = (y / 32) % 2 ? 0 : 32; x < 128; x += 64) g.fillRect(x, y, 3, 32);
    }
  });
}

/** A post's red and white bands. */
function postTexture(): CanvasTexture {
  return canvasTexture(16, 64, (g) => {
    for (let y = 0; y < 64; y += 16) {
      g.fillStyle = (y / 16) % 2 ? '#f5f5f0' : '#d62828';
      g.fillRect(0, y, 16, 16);
    }
  });
}

/** A Tornante sign: white on brown, the hairpin's number and the height. */
function tornanteTexture(n: number): CanvasTexture {
  return canvasTexture(160, 108, (g) => {
    g.fillStyle = '#6b3a1e';
    g.fillRect(0, 0, 160, 108);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 4;
    g.strokeRect(5, 5, 150, 98);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.font = 'bold 20px sans-serif';
    g.fillText('TORNANTE', 80, 34);
    g.font = 'bold 42px sans-serif';
    g.fillText(String(n), 80, 78);
    g.font = '13px sans-serif';
    g.fillText(`${2758 - n * 32} m`, 80, 98);
  });
}

/**
 * The mountainside ahead: meadow below fading to scree and snow above, and the road's hairpins
 * zigzagging up its face, each traverse edged white by its parapet.
 */
function hairpinTexture(): CanvasTexture {
  return canvasTexture(1024, 768, (g) => {
    const slope = g.createLinearGradient(0, 768, 0, 0);
    slope.addColorStop(0, '#5f8a44');
    slope.addColorStop(0.45, '#7a8a5a');
    slope.addColorStop(0.7, '#9a9690');
    slope.addColorStop(0.92, '#dfe4ea');
    slope.addColorStop(1, '#f4f8fc');
    g.fillStyle = slope;
    g.fillRect(0, 0, 1024, 768);
    const random = seeded(1283);
    for (let i = 0; i < 900; i++) {
      const y = random() * 768;
      g.fillStyle =
        y < 300
          ? `rgba(255,255,255,${0.1 + random() * 0.3})`
          : `rgba(40,50,30,${0.08 + random() * 0.12})`;
      g.fillRect(random() * 1024, y, 4 + random() * 14, 2 + random() * 4);
    }
    // The hairpins: traverses back and forth up the face, narrowing with height.
    let y = 740;
    let left = 410;
    let right = 640;
    let fromLeft = true;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const path: [number, number][] = [[fromLeft ? left : right, y]];
    while (y > 170) {
      const rise = 18 + (y / 768) * 22;
      const x = fromLeft ? right : left;
      y -= rise;
      path.push([x, y]);
      fromLeft = !fromLeft;
      left += 3;
      right -= 3;
    }
    for (const [width, colour] of [
      [12, '#f2f2ee'],
      [8, '#4a4a50'],
    ] as const) {
      g.strokeStyle = colour;
      g.lineWidth = width;
      g.beginPath();
      path.forEach(([x, py], k) => (k ? g.lineTo(x, py) : g.moveTo(x, py)));
      g.stroke();
    }
    // The pass at the top: its hotels' roofs.
    g.fillStyle = '#6a3a2a';
    for (const x of [490, 512, 540]) g.fillRect(x, 140, 16, 12);
  });
}
