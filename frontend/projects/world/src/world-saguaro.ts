// Saguaro Desert's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the Sonoran
// desert outside Tucson at sunrise. The rider follows the park's loop road across the bajada
// through a forest of saguaros, tall and many-armed, among ocotillo with red tips, prickly pear,
// cholla and green-barked palo verde on the gravel and rock; a roadrunner darts across the road
// ahead, hot-air balloons drift up into the pink sky, the park's sign stands at the turn, and the
// Rincon and Tucson Mountains glow purple and gold on the horizon. Built on the shared kit
// (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
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
/** The park sign stands once a lap. */
const SIGN = 50;
/** The roadrunner crosses here once a lap. */
const CROSSING = 34;

const HIKER_WEAR = {
  tops: ['#ff9f1c', '#2f5a8a', '#e8e4dc', '#c8302a', '#2a6a4a'],
  bottoms: ['#c8b08a', '#5a5f69', '#2f3e5c'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b'],
};

export class SaguaroStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly hikers: { offset: number; x: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly roadrunner = new Group();
  private readonly balloons: Group[] = [];
  private readonly horizon = new Group();
  readonly backdrop = [this.horizon];
  private roadHalf = 0;
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.roadHalf = roadHalf;
    this.disposables.push(this.unit);
    this.addDesert(roadHalf, points);
    this.addSaguaros(roadHalf);
    this.addScrub(roadHalf);
    this.addSign(roadHalf);
    this.addRoadrunner();
    this.addHikers(roadHalf);
    this.addHorizon();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The balloons rise slowly and drift on the morning air, burners flaring now and then.
    this.balloons.forEach((b, k) => {
      b.position.y = 140 + k * 40 + ((seconds * 1.2 + k * 30) % 120);
      b.position.x = (b.userData['x'] as number) + Math.sin(seconds * 0.05 + k) * 30;
    });
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    // The roadrunner dashes across the road and back, head low, tail up.
    const metres = loopMetres(CROSSING, s, LOOP, BEHIND);
    const dash = Math.sin(this.time * 0.6);
    this.roadrunner.position.set(dash * (this.roadHalf + 4), heightAt(metres), -metres);
    this.roadrunner.rotation.y = Math.cos(this.time * 0.6) > 0 ? -Math.PI / 2 : Math.PI / 2;
    this.roadrunner.children[0]!.position.y = Math.abs(Math.sin(this.time * 18)) * 0.04;
    const crowd = this.crowd;
    if (crowd) {
      this.hikers.forEach((h, i) => {
        const m = loopMetres(h.offset + this.time * 0.9, s, LOOP, BEHIND);
        crowd.set(
          i,
          h.x,
          heightAt(Math.max(m, 0)) + Math.abs(Math.sin(this.time * 3 + h.phase)) * 0.04,
          -m,
          0,
          0.95,
          0,
        );
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The gravel shoulders and the bajada's sand and rock running away both sides. */
  private addDesert(roadHalf: number, points: number): void {
    const r = roadHalf;
    const sand = this.material({ map: this.repeat(desertTexture(), 6, 6), roughness: 1 });
    const gravel = this.material({ map: this.repeat(gravelTexture(), 2, 2), roughness: 1 });
    const line = this.material({ color: 0xf2c84a, roughness: 0.6 });
    this.ribbons.add(points, line, [
      [-r + 0.3, 0.012],
      [-r + 0.15, 0.012],
    ]);
    this.ribbons.add(points, line, [
      [r - 0.15, 0.012],
      [r - 0.3, 0.012],
    ]);
    for (const side of [-1, 1] as const) {
      const lay = (profile: [number, number][], material: MeshStandardMaterial) => {
        const mirrored = profile.map(([x, y]) => [side * x, y] as [number, number]);
        this.ribbons.add(points, material, side > 0 ? [...mirrored].reverse() : mirrored);
      };
      lay(
        [
          [r, 0.004],
          [r + 1.6, -0.05],
        ],
        gravel,
      );
      lay(
        [
          [r + 1.6, -0.05],
          [r + 30, 0.6],
          [r + 220, side > 0 ? 14 : 4],
          [r + 1400, side > 0 ? 80 : 30],
        ],
        sand,
      );
    }
  }

  /** The saguaro forest: tall fluted trunks with arms raised, scattered thick across the bajada. */
  private addSaguaros(roadHalf: number): void {
    const random = seeded(2401);
    const skin = this.material({
      map: this.repeat(ribTexture(), 1, 1),
      color: 0x7a9a5a,
      roughness: 0.8,
    });
    const shapes = [0, 1, 2, 3, 4, 5].map((k) => {
      const g = saguaroGeometry(seeded(2411 + k), k);
      this.disposables.push(g);
      return g;
    });
    for (let offset = 0; offset < LOOP; offset += 1.2 + random() * 2.4) {
      const side = random() < 0.5 ? -1 : 1;
      const d = 3 + random() ** 1.4 * 140;
      const holder = new Group();
      const cactus = new Mesh(shapes[Math.floor(random() * shapes.length)]!, skin);
      cactus.castShadow = d < 40;
      cactus.scale.setScalar(0.7 + random() * 0.7);
      cactus.rotation.y = random() * 6;
      cactus.position.y = groundAt(side, d) - 0.1;
      holder.add(cactus);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
    }
  }

  /** Ocotillo, prickly pear, cholla, palo verde and boulders among the saguaros. */
  private addScrub(roadHalf: number): void {
    const random = seeded(2421);
    const ocotillo = this.material({ color: 0x5a5a3a, roughness: 0.9 });
    const flame = this.material({ color: 0xff3a1a, emissive: 0xc82a10, emissiveIntensity: 0.4 });
    const pad = this.material({ color: 0x6a8a4a, roughness: 0.8 });
    const fruit = this.material({ color: 0xa8205a, roughness: 0.6 });
    const cholla = this.material({
      color: 0xd8d0a0,
      roughness: 0.9,
      emissive: 0x403820,
      emissiveIntensity: 0.3,
    });
    const bark = this.material({ color: 0x8ab04a, roughness: 0.8 });
    const leaves = this.material({ color: 0xa8c060, roughness: 1, flatShading: true });
    const rock = this.material({
      map: this.repeat(gravelTexture(), 1, 1),
      color: 0xb87a5a,
      roughness: 1,
      flatShading: true,
    });
    const stalk = new CylinderGeometry(0.03, 0.05, 3.2, 4);
    stalk.translate(0, 1.6, 0);
    const tip = new ConeGeometry(0.07, 0.4, 4);
    tip.translate(0, 3.3, 0);
    const disc = new SphereGeometry(0.3, 6, 4);
    disc.scale(1, 1.2, 0.3);
    const ball = new SphereGeometry(0.25, 6, 4);
    const crown = new DodecahedronGeometry(1.6, 0);
    crown.scale(1.3, 0.6, 1.3);
    const boulder = new DodecahedronGeometry(1, 0);
    this.disposables.push(stalk, tip, disc, ball, crown, boulder);
    for (let offset = 0; offset < LOOP; offset += 1 + random() * 2) {
      const side = random() < 0.5 ? -1 : 1;
      const d = 2.2 + random() ** 1.6 * 80;
      const kind = random();
      const plant = new Group();
      if (kind < 0.25) {
        for (let k = 0; k < 9; k++) {
          const lean = new Group();
          lean.add(new Mesh(stalk, ocotillo), new Mesh(tip, flame));
          lean.rotation.set((random() - 0.5) * 0.7, random() * 6, (random() - 0.5) * 0.7);
          plant.add(lean);
        }
      } else if (kind < 0.5) {
        for (let k = 0; k < 6; k++) {
          const p = new Mesh(disc, pad);
          p.position.set((random() - 0.5) * 0.8, 0.3 + random() * 0.7, (random() - 0.5) * 0.8);
          p.rotation.set(random() - 0.5, random() * 6, random() - 0.5);
          plant.add(p);
          if (random() < 0.5) {
            const f = new Mesh(ball, fruit);
            f.scale.setScalar(0.25);
            f.position.set(p.position.x, p.position.y + 0.35, p.position.z);
            plant.add(f);
          }
        }
      } else if (kind < 0.68) {
        for (let k = 0; k < 5; k++) {
          const b = new Mesh(ball, cholla);
          b.position.set((random() - 0.5) * 0.7, 0.3 + random() * 0.9, (random() - 0.5) * 0.7);
          plant.add(b);
        }
      } else if (kind < 0.82) {
        const trunk = new Mesh(stalk, bark);
        trunk.scale.set(3, 0.8, 3);
        const top = new Mesh(crown, leaves);
        top.position.y = 3;
        plant.add(trunk, top);
      } else {
        const b = new Mesh(boulder, rock);
        const size = 0.4 + random() ** 2 * 2.2;
        b.scale.set(size * (1 + random()), size * 0.7, size);
        b.rotation.set(random(), random() * 6, random());
        plant.add(b);
      }
      plant.position.y = groundAt(side, d) - 0.05;
      plant.children.forEach((c) => (c.castShadow = d < 30));
      const holder = new Group();
      holder.add(plant);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
    }
  }

  /** The park's carved wooden sign on its stone base by the road. */
  private addSign(roadHalf: number): void {
    const sign = new Group();
    const base = new Mesh(
      this.unit,
      this.material({ map: this.repeat(gravelTexture(), 1, 1), color: 0xb87a5a, roughness: 1 }),
    );
    base.scale.set(0.8, 1.2, 4.6);
    base.position.y = 0.6;
    const board = new Mesh(
      new PlaneGeometry(4.2, 1.3),
      this.material({ map: this.track(parkSignTexture()), roughness: 0.8 }),
    );
    board.position.set(0.42, 1.8, 0);
    board.rotation.y = Math.PI / 2;
    const back = new Mesh(this.unit, this.material({ color: 0x5a3a24, roughness: 0.9 }));
    back.scale.set(0.15, 1.5, 4.4);
    back.position.set(0.32, 1.8, 0);
    this.disposables.push(board.geometry);
    sign.add(base, back, board);
    sign.rotation.y = -0.5;
    sign.children.forEach((c) => (c.castShadow = true));
    this.group.add(sign);
    this.props.push({ mesh: sign, offset: SIGN, x: -roadHalf - 3.5 });
  }

  /** The roadrunner: speckled brown body, long tail cocked, crest up, legs a blur. */
  private addRoadrunner(): void {
    const brown = this.material({ color: 0x6a5a44, roughness: 0.8 });
    const bird = new Group();
    const body = new Mesh(new SphereGeometry(0.12, 8, 6), brown);
    body.scale.set(1, 0.8, 1.8);
    body.position.y = 0.32;
    const head = new Mesh(new SphereGeometry(0.06, 6, 5), brown);
    head.position.set(0, 0.42, -0.22);
    const beak = new Mesh(new ConeGeometry(0.02, 0.12, 4), this.material({ color: 0x2a2420 }));
    beak.rotation.x = -Math.PI / 2;
    beak.position.set(0, 0.42, -0.32);
    const tail = new Mesh(this.unit, brown);
    tail.scale.set(0.06, 0.03, 0.4);
    tail.position.set(0, 0.42, 0.3);
    tail.rotation.x = 0.6;
    const crest = new Mesh(new ConeGeometry(0.03, 0.1, 4), brown);
    crest.position.set(0, 0.5, -0.2);
    const legs = new Mesh(this.unit, this.material({ color: 0x3a3a3a }));
    legs.scale.set(0.05, 0.22, 0.12);
    legs.position.y = 0.11;
    this.disposables.push(body.geometry, head.geometry, beak.geometry, crest.geometry);
    bird.add(body, head, beak, tail, crest, legs);
    bird.scale.setScalar(2.2);
    this.roadrunner.add(bird);
    this.group.add(this.roadrunner);
  }

  /** Early hikers on the shoulders with their water bottles, beating the heat. */
  private addHikers(roadHalf: number): void {
    const random = seeded(2431);
    for (let offset = 30; offset < LOOP; offset += 40 + random() * 50)
      this.hikers.push({
        offset,
        x: (random() < 0.5 ? -1 : 1) * (roadHalf + 0.9),
        phase: random() * 6,
      });
    this.crowd = new Figures(this.group, this.disposables, this.hikers.length, HIKER_WEAR, 2437);
  }

  /** The Rincons and the Tucson Mountains glowing in the dawn, and hot-air balloons rising over them. */
  private addHorizon(): void {
    const random = seeded(2441);
    const range = new ConeGeometry(1, 1, 7);
    this.disposables.push(range);
    const near = this.material({
      map: this.track(rangeTexture('#c87a5a', '#7a4a5a')),
      roughness: 1,
      flatShading: true,
    });
    const far = this.material({
      map: this.track(rangeTexture('#a87a9a', '#6a5a8a')),
      roughness: 1,
      flatShading: true,
    });
    for (let k = 0; k < 16; k++) {
      const m = new Mesh(range, k % 2 ? near : far);
      const h = 120 + random() * 260;
      const z = -1100 - random() * 900;
      m.scale.set(300 + random() * 300, h, 260);
      m.position.set(-2200 + k * 290 + random() * 100, h / 2 - 20, z);
      m.rotation.y = random();
      this.horizon.add(m);
    }
    // The balloons.
    const envelope = new SphereGeometry(10, 16, 12);
    envelope.scale(1, 1.2, 1);
    const basket = new BoxGeometry(2.4, 2, 2.4);
    basket.translate(0, -15, 0);
    this.disposables.push(envelope, basket);
    const wicker = this.material({ color: 0x6a4a2a });
    [
      ['#ff6b5a', '#ffd23f'],
      ['#3a86ff', '#ffffff'],
      ['#9b5cff', '#ff9f1c'],
      ['#2ec4b6', '#ff2d78'],
    ].forEach(([a, b], k) => {
      const balloon = new Group();
      balloon.add(
        new Mesh(
          envelope,
          this.material({ map: this.track(balloonTexture(a!, b!)), roughness: 0.6 }),
        ),
        new Mesh(basket, wicker),
      );
      const x = -600 + k * 380 + random() * 120;
      balloon.userData['x'] = x;
      balloon.position.set(x, 160, -900 - random() * 500);
      balloon.scale.setScalar(3);
      this.balloons.push(balloon);
      this.horizon.add(balloon);
    });
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

/** The bajada's height d metres beyond the road's edge on a side, along the sand profile. */
function groundAt(side: number, d: number): number {
  if (d < 1.6) return -0.05 * (d / 1.6);
  if (d < 30) return -0.05 + ((d - 1.6) / 28.4) * 0.65;
  return 0.6 + ((d - 30) / 190) * ((side > 0 ? 14 : 4) - 0.6);
}

/** A saguaro: a fluted trunk and k-dependent arms that bend up toward the sky. */
function saguaroGeometry(random: () => number, k: number): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const height = 6 + random() * 5;
  const trunk = new CylinderGeometry(0.32, 0.38, height, 12);
  trunk.translate(0, height / 2, 0);
  const top = new SphereGeometry(0.32, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  top.translate(0, height, 0);
  parts.push(trunk, top);
  const arms = k === 0 ? 0 : 1 + Math.floor(random() * 4);
  for (let a = 0; a < arms; a++) {
    const angle = random() * Math.PI * 2;
    const y = height * (0.35 + random() * 0.3);
    const out = 0.9 + random() * 0.5;
    const up = 1.5 + random() * 2.5;
    const elbow = new CylinderGeometry(0.22, 0.24, out, 10);
    elbow.rotateZ(Math.PI / 2);
    elbow.translate(out / 2, y, 0);
    const rise = new CylinderGeometry(0.22, 0.22, up, 10);
    rise.translate(out, y + up / 2, 0);
    const cap = new SphereGeometry(0.22, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2);
    cap.translate(out, y + up, 0);
    for (const g of [elbow, rise, cap]) {
      g.rotateY(angle);
      parts.push(g);
    }
  }
  const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Sonoran desert floor: tan sand, red gravel and sparse dry grass. */
function desertTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#c8a07a', 2451);
    const random = seeded(2453);
    for (let i = 0; i < 240; i++) {
      g.fillStyle = [
        'rgba(150,90,60,0.4)',
        'rgba(120,120,70,0.45)',
        'rgba(230,200,160,0.4)',
        'rgba(90,70,50,0.35)',
      ][Math.floor(random() * 4)]!;
      g.fillRect(random() * 256, random() * 256, 2 + random() * 8, 2 + random() * 6);
    }
  });
}

/** The shoulders' loose red-brown gravel. */
function gravelTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#a8805a', 2461));
}

/** The saguaro's ribs, pale spines along each. */
function ribTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#9ac080';
    g.fillRect(0, 0, 64, 64);
    for (let x = 0; x < 64; x += 8) {
      g.fillStyle = '#4a6a3a';
      g.fillRect(x, 0, 3, 64);
      g.fillStyle = '#e8e0c0';
      for (let y = 2; y < 64; y += 6) g.fillRect(x + 4, y, 1, 2);
    }
  });
}

/** The park's carved sign. */
function parkSignTexture(): CanvasTexture {
  return canvasTexture(420, 130, (g) => {
    g.fillStyle = '#5a3a24';
    g.fillRect(0, 0, 420, 130);
    g.fillStyle = '#f2e4c4';
    g.font = 'bold 34px serif';
    g.textAlign = 'center';
    g.fillText('SAGUARO', 210, 50);
    g.font = 'bold 22px serif';
    g.fillText('NATIONAL PARK', 210, 84);
    g.font = '16px serif';
    g.fillText('Cactus Forest Loop Drive', 210, 112);
  });
}

/** A mountain range lit warm on its face at dawn, shadowed violet below. */
function rangeTexture(lit: string, shade: string): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    const fall = g.createLinearGradient(0, 0, 0, 128);
    fall.addColorStop(0, lit);
    fall.addColorStop(1, shade);
    g.fillStyle = fall;
    g.fillRect(0, 0, 64, 128);
  });
}

/** A balloon's envelope in two colours of gores. */
function balloonTexture(a: string, b: string): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    for (let x = 0; x < 128; x += 16) {
      g.fillStyle = (x / 16) % 2 ? a : b;
      g.fillRect(x, 0, 16, 64);
    }
  });
}
