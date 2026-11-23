// Sixth Street, Austin, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// historic entertainment block at dusk on a festival night, the street closed to traffic and the
// sky going orange and violet behind the Capitol dome. The rider rolls down the middle of the
// street between the old two- and three-storey limestone and brick fronts of the 1800s: their
// iron balconies and cornices, bar names in neon, chalkboards and open doors spilling light. Bands
// play on the balconies and on a corner stage under the festival banners, string lights zigzag
// across the street, and the crowd spills off the sidewalks, drifting between the bars; pedicabs
// wait at the kerb, a food truck serves tacos, and Texas flags hang from the balconies. Ahead,
// beyond the Driskill Hotel's corner tower, the Capitol's dome rises over the street. Built on the
// shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type CanvasTexture,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
} from 'three/webgpu';
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

/** The block repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 320;
const BEHIND = 24;
/** The sidewalks run WALK metres wide before the building fronts. */
const WALK = 4.5;

const FESTIVAL_WEAR = {
  tops: [
    '#ffffff',
    '#1d1f24',
    '#bf5700',
    '#c8102e',
    '#2a6a9a',
    '#ffd23f',
    '#e84a8a',
    '#2ec4b6',
    '#6a3a8a',
  ],
  bottoms: ['#2f3e5c', '#1d1f24', '#3a6a9a', '#e8d8b0', '#5a5f69'],
  skins: ['#f0c8a0', '#c48a5f', '#8d5a3b', '#e2b48c', '#f5d3b5', '#5a3a29'],
};

/** The bars' names in neon, each in its own colour. */
const BARS: readonly (readonly [string, string])[] = [
  ['LIVE MUSIC', '#ff3a6a'],
  ['THE LONGHORN', '#ffb020'],
  ['BLUES ON 6TH', '#3ab0ff'],
  ['ARMADILLO', '#4aff8a'],
  ['HONKY TONK', '#ff5ae0'],
  ['LONE STAR', '#ffe040'],
  ['TACOS', '#ff7a2a'],
  ['JAZZ', '#9a6aff'],
];

export class AustinStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: {
    offset: number;
    x: number;
    speed: number;
    phase: number;
    dance: boolean;
  }[] = [];
  private crowd: Figures | null = null;
  private readonly neon: MeshStandardMaterial[] = [];
  private readonly bulbs: MeshStandardMaterial[] = [];
  private readonly flags: Mesh[] = [];
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
    this.addStreet(roadHalf, points);
    this.addFronts(roadHalf);
    this.addStringLights(roadHalf);
    this.addStage(roadHalf);
    this.addKerbside(roadHalf);
    this.addCrowd(roadHalf);
    this.addSkyline();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The neon flickers and pulses; the string lights twinkle; the flags stir.
    this.neon.forEach(
      (m, k) =>
        (m.emissiveIntensity =
          1.6 +
          Math.sin(seconds * (2 + (k % 3)) + k) * 0.4 +
          (Math.sin(seconds * 23 + k * 7) > 0.97 ? -1.2 : 0)),
    );
    this.bulbs.forEach(
      (m, k) => (m.emissiveIntensity = 1.6 + Math.sin(seconds * 3 + k * 1.7) * 0.5),
    );
    this.flags.forEach((f, k) => (f.rotation.y = Math.sin(seconds * 1.4 + k) * 0.25));
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    const crowd = this.crowd;
    if (crowd) {
      this.people.forEach((p, i) => {
        const metres = loopMetres(p.offset + p.speed * this.time, s, LOOP, BEHIND);
        const bounce = p.dance
          ? Math.max(0, Math.sin(this.time * 7 + p.phase)) * 0.14
          : p.speed
            ? Math.abs(Math.sin(this.time * 4 + p.phase)) * 0.04
            : 0;
        const heading = p.speed
          ? p.speed > 0
            ? 0
            : Math.PI
          : p.x < 0
            ? -Math.PI / 2 + Math.sin(p.phase)
            : Math.PI / 2 + Math.sin(p.phase);
        crowd.set(i, p.x, heightAt(metres) + bounce, -metres, heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The street's worn asphalt, the granite kerbs and the brick-banded sidewalks. */
  private addStreet(roadHalf: number, points: number): void {
    const r = roadHalf;
    // The asphalt catches the warm spill from the bars and the string lights.
    const asphalt = this.material({
      map: this.repeat(asphaltTexture(), r * 2, 6),
      roughness: 0.6,
      metalness: 0.1,
      emissive: 0x3a2a30,
      emissiveIntensity: 0.6,
    });
    const walk = this.material({ map: this.repeat(sidewalkTexture(), 2, 2), roughness: 0.8 });
    this.ribbons.add(points, asphalt, [
      [r + 2, 0.012],
      [-r - 2, 0.012],
    ]);
    for (const side of [-1, 1]) {
      const inner = side * (r + 2);
      const outer = side * (r + 2 + WALK);
      this.ribbons.add(
        points,
        walk,
        side > 0
          ? [
              [outer, 0.15],
              [inner, 0.15],
              [inner, 0.01],
            ]
          : [
              [inner, 0.01],
              [inner, 0.15],
              [outer, 0.15],
            ],
      );
    }
  }

  /** The old limestone and brick fronts with their balconies, cornices, neon and lit doorways. */
  private addFronts(roadHalf: number): void {
    const random = seeded(4901);
    const x0 = roadHalf + 2 + WALK;
    const walls = ['#c8b48a', '#a8543a', '#d8c8a4', '#8a3a2a', '#b89a6a', '#7a4a3a'];
    const iron = this.material({ color: 0x1d1d1f, roughness: 0.5, metalness: 0.5 });
    const trim = this.material({ color: 0xe8dcc0, roughness: 0.8 });
    const texas = this.material({ map: this.track(texasTexture()), roughness: 0.8, side: 2 });
    const flagCloth = new PlaneGeometry(1.5, 1);
    flagCloth.translate(0.75, -0.5, 0);
    this.disposables.push(flagCloth);
    let k = 0;
    for (const side of [-1, 1])
      for (let offset = 0; offset < LOOP; k++) {
        const width = 9 + random() * 8;
        const floors = random() < 0.6 ? 2 : 3;
        const h = floors * 4.6 + 1.2;
        const wall = walls[Math.floor(random() * walls.length)]!;
        const front = new Group();
        const face = this.material({
          map: this.track(frontTexture(wall, floors, k)),
          emissiveMap: this.track(frontGlowTexture(floors, k)),
          emissive: 0xffd8a0,
          emissiveIntensity: 0.7,
          roughness: 0.85,
        });
        const body = new Mesh(this.unit, face);
        body.scale.set(12, h, width - 0.2);
        body.position.set(side * 6, h / 2, 0);
        const cornice = new Mesh(this.unit, trim);
        cornice.scale.set(0.8, 0.6, width - 0.2);
        cornice.position.set(-side * 0.3, h - 0.3, 0);
        front.add(body, cornice);
        // An iron balcony across the first floor, often with a Texas flag hanging from it.
        if (random() < 0.7) {
          const deck = new Mesh(this.unit, iron);
          deck.scale.set(1.6, 0.12, width - 1.5);
          deck.position.set(-side * 0.8, 4.6, 0);
          const rail = new Mesh(this.unit, iron);
          rail.scale.set(0.05, 1, width - 1.5);
          rail.position.set(-side * 1.55, 5.15, 0);
          front.add(deck, rail);
          for (let p = -width / 2 + 1; p < width / 2 - 0.5; p += 2.5) {
            const post = new Mesh(this.unit, iron);
            post.scale.set(0.08, 4.6, 0.08);
            post.position.set(-side * 1.5, 2.3, p);
            front.add(post);
          }
          if (random() < 0.5) {
            const flag = new Mesh(flagCloth, texas);
            flag.position.set(-side * 1.55, 5.6, -width / 4);
            flag.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
            this.flags.push(flag);
            front.add(flag);
          }
        }
        // The bar's name in neon over the door, standing off the wall.
        const [name, colour] = BARS[k % BARS.length]!;
        const glow = this.material({
          map: this.track(neonTexture(name, colour)),
          emissiveMap: this.track(neonTexture(name, colour)),
          emissive: 0xffffff,
          emissiveIntensity: 1.6,
          transparent: true,
          roughness: 0.4,
        });
        this.neon.push(glow);
        const sign = new Mesh(new PlaneGeometry(Math.min(width - 2, 6), 1.2), glow);
        sign.position.set(-side * 0.15, 3.6, 0);
        sign.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        this.disposables.push(sign.geometry);
        front.add(sign);
        // A blade sign hung out over the sidewalk.
        if (random() < 0.5) {
          const blade = new Mesh(new PlaneGeometry(1.6, 3.2), glow);
          blade.position.set(-side * 1.2, 7, width / 2 - 1);
          this.disposables.push(blade.geometry);
          front.add(blade);
        }
        front.children.forEach((c) => (c.castShadow = true));
        const holder = new Group();
        holder.add(front);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset: offset + width / 2, x: side * x0 });
        offset += width;
      }
  }

  /** String lights zigzagging across the street from balcony to balcony. */
  private addStringLights(roadHalf: number): void {
    const span = (roadHalf + 2 + WALK) * 2;
    const wire = this.material({ color: 0x1d1d1f });
    const bulb = new SphereGeometry(0.09, 6, 4);
    this.disposables.push(bulb);
    const tints = [0xfff0c0, 0xffd080, 0xffc0e0].map((c) => {
      const m = this.material({ color: c, emissive: c, emissiveIntensity: 1.6 });
      this.bulbs.push(m);
      return m;
    });
    for (let offset = 0; offset < LOOP; offset += 12) {
      const run = new Group();
      const length = Math.hypot(span, 8);
      const cable = new Mesh(this.unit, wire);
      cable.scale.set(length, 0.02, 0.02);
      cable.rotation.y = -Math.atan2(8, span);
      cable.position.y = 7.2;
      run.add(cable);
      for (let b = 0; b <= 16; b++) {
        const t = b / 16;
        const light = new Mesh(bulb, tints[b % tints.length]!);
        light.position.set(-span / 2 + t * span, 7.2 - Math.sin(t * Math.PI) * 1.1, -4 + t * 8);
        run.add(light);
      }
      const holder = new Group();
      holder.add(run);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: 0 });
    }
  }

  /** A corner stage under the festival banners, the band playing to the crowd. */
  private addStage(roadHalf: number): void {
    const deckMaterial = this.material({ color: 0x2a2a2e, roughness: 0.7 });
    const truss = this.material({ color: 0xc8c8cc, roughness: 0.4, metalness: 0.7 });
    const banner = this.material({
      map: this.track(bannerTexture()),
      emissiveMap: this.track(bannerTexture()),
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
      roughness: 0.8,
    });
    const spot = [0xff3a6a, 0x3ab0ff, 0xffd040].map((c) => {
      const m = this.material({ color: c, emissive: c, emissiveIntensity: 2 });
      this.neon.push(m);
      return m;
    });
    const stage = new Group();
    const deck = new Mesh(this.unit, deckMaterial);
    deck.scale.set(6, 1.2, 10);
    deck.position.y = 0.6;
    stage.add(deck);
    for (const z of [-5, 5])
      for (const x of [-3, 3]) {
        const leg = new Mesh(this.unit, truss);
        leg.scale.set(0.3, 6, 0.3);
        leg.position.set(x, 3, z);
        stage.add(leg);
      }
    const top = new Mesh(this.unit, truss);
    top.scale.set(6.4, 0.4, 10.4);
    top.position.y = 6.1;
    const sign = new Mesh(this.unit, banner);
    sign.scale.set(0.1, 1.4, 9);
    sign.position.set(-3.2, 7.1, 0);
    stage.add(top, sign);
    for (let k = 0; k < 6; k++) {
      const can = new Mesh(new CylinderGeometry(0.2, 0.3, 0.5, 8), spot[k % spot.length]!);
      can.position.set(-2.6, 5.6, -4 + k * 1.6);
      can.rotation.z = 0.6;
      this.disposables.push(can.geometry);
      stage.add(can);
    }
    // The band's amps and drum kit.
    const black = this.material({ color: 0x141416, roughness: 0.6 });
    const amps = new Mesh(this.unit, black);
    amps.scale.set(1, 1.6, 6);
    amps.position.set(2.2, 2, 0);
    const drum = new Mesh(
      new CylinderGeometry(0.6, 0.6, 0.6, 12),
      this.material({ color: 0xc8102e, roughness: 0.4 }),
    );
    drum.position.set(1, 1.5, 0);
    drum.rotation.z = Math.PI / 2;
    this.disposables.push(drum.geometry);
    stage.add(amps, drum);
    stage.children.forEach((c) => (c.castShadow = true));
    const holder = new Group();
    holder.add(stage);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 70, x: roadHalf + 2 + WALK - 3 });
    // The band on the stage.
    for (let k = 0; k < 3; k++)
      this.people.push({
        offset: 66 + k * 3.5,
        x: roadHalf + 2 + WALK - 3,
        speed: 0,
        phase: k,
        dance: true,
      });
  }

  /** Pedicabs waiting at the kerb and a food truck serving tacos. */
  private addKerbside(roadHalf: number): void {
    const random = seeded(4911);
    const black = this.material({ color: 0x1d1d1f, roughness: 0.6 });
    const canopies = [0xc8102e, 0x2a6a9a, 0xffd23f].map((c) =>
      this.material({ color: c, roughness: 0.6 }),
    );
    const wheel = new CylinderGeometry(0.34, 0.34, 0.06, 14);
    wheel.rotateZ(Math.PI / 2);
    this.disposables.push(wheel);
    for (let k = 0; k < 4; k++) {
      const cab = new Group();
      const seat = new Mesh(this.unit, canopies[k % canopies.length]!);
      seat.scale.set(1.1, 0.6, 0.8);
      seat.position.set(0, 0.8, 0.5);
      const hood = new Mesh(
        new SphereGeometry(0.65, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        canopies[k % canopies.length]!,
      );
      hood.scale.set(1, 1.1, 0.8);
      hood.position.set(0, 1.2, 0.6);
      this.disposables.push(hood.geometry);
      const frame = new Mesh(this.unit, black);
      frame.scale.set(0.08, 0.08, 1.6);
      frame.position.set(0, 0.55, -0.4);
      cab.add(seat, hood, frame);
      for (const [x, z] of [
        [-0.55, 0.6],
        [0.55, 0.6],
        [0, -1.2],
      ] as const) {
        const w = new Mesh(wheel, black);
        w.position.set(x, 0.34, z);
        cab.add(w);
      }
      cab.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(cab);
      this.group.add(holder);
      this.props.push({
        mesh: holder,
        offset: 20 + k * 3.2 + (k > 1 ? 150 : 0),
        x: -roadHalf - 1.2,
      });
    }
    // The taco truck, its hatch open and its menu lit.
    const truck = new Group();
    const body = this.material({
      map: this.track(tacoTruckTexture()),
      emissiveMap: this.track(tacoTruckTexture()),
      emissive: 0xffffff,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    });
    const box = new Mesh(this.unit, body);
    box.scale.set(2.3, 2.8, 6.5);
    box.position.y = 1.9;
    const cab = new Mesh(this.unit, this.material({ color: 0xf0f0ec, roughness: 0.4 }));
    cab.scale.set(2.2, 1.9, 1.6);
    cab.position.set(0, 1.45, -3.9);
    const awning = new Mesh(this.unit, canopies[0]!);
    awning.scale.set(1.2, 0.06, 4);
    awning.position.set(-1.6, 3.2, 0.4);
    awning.rotation.z = -0.25;
    truck.add(box, cab, awning);
    for (const z of [-3.6, 2.4]) {
      const w = new Mesh(wheel, black);
      w.scale.set(1, 1.3, 1.3);
      w.position.set(0, 0.42, z);
      truck.add(w);
    }
    truck.children.forEach((c) => (c.castShadow = true));
    const holder = new Group();
    holder.add(truck);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 120, x: roadHalf + 1.4 });
    for (let k = 0; k < 4; k++)
      this.people.push({
        offset: 118 + k * 1.1,
        x: roadHalf - 0.2,
        speed: 0,
        phase: random() * 6,
        dance: false,
      });
  }

  /** The festival crowd: on the sidewalks, spilling into the street, dancing outside the bars. */
  private addCrowd(roadHalf: number): void {
    const random = seeded(4921);
    for (let offset = 2; offset < LOOP; offset += 1 + random() * 1.6) {
      const side = random() < 0.5 ? -1 : 1;
      const inStreet = random() < 0.45;
      const kind = random();
      this.people.push({
        offset,
        x:
          side *
          (inStreet ? roadHalf - 0.6 + random() * 2.4 : roadHalf + 2.4 + random() * (WALK - 0.8)),
        speed: kind < 0.35 ? (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.5) : 0,
        phase: random() * 6,
        dance: kind > 0.75,
      });
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, FESTIVAL_WEAR, 4927);
  }

  /** Ahead: the Driskill Hotel's corner tower, downtown's towers, and the Capitol's dome over the street. */
  private addSkyline(): void {
    const random = seeded(4931);
    const granite = this.material({
      color: 0xd8a888,
      roughness: 0.6,
      emissive: 0x3a2018,
      emissiveIntensity: 0.4,
    });
    const capitol = new Group();
    const drum = new Mesh(new CylinderGeometry(22, 24, 40, 24), granite);
    drum.position.y = 70;
    const dome = new Mesh(new SphereGeometry(22, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), granite);
    dome.scale.set(1, 1.3, 1);
    dome.position.y = 90;
    const lantern = new Mesh(new CylinderGeometry(4, 5, 16, 12), granite);
    lantern.position.y = 126;
    const star = new Mesh(
      new SphereGeometry(2.5, 8, 6),
      this.material({ color: 0xffd860, emissive: 0xffc040, emissiveIntensity: 1.5 }),
    );
    star.position.y = 137;
    const base = new Mesh(this.unit, granite);
    base.scale.set(120, 50, 60);
    base.position.y = 25;
    capitol.add(base, drum, dome, lantern, star);
    for (const m of [drum, dome, lantern, star]) this.disposables.push(m.geometry);
    capitol.position.set(0, 0, -900);
    this.horizon.add(capitol);
    // Downtown's towers on either side, windows lit against the dusk.
    const towers = [0x2a3448, 0x3a4458, 0x22283a].map((c, k) =>
      this.material({
        color: c,
        roughness: 0.3,
        metalness: 0.4,
        emissiveMap: this.track(windowsTexture(k)),
        emissive: 0xffe0b0,
        emissiveIntensity: 1,
      }),
    );
    for (let k = 0; k < 24; k++) {
      const side = k % 2 ? 1 : -1;
      const h = 60 + random() * 140;
      const t = new Mesh(this.unit, towers[k % towers.length]!);
      t.scale.set(30 + random() * 20, h, 30 + random() * 20);
      t.position.set(side * (90 + random() * 300), h / 2, -400 - random() * 700);
      this.horizon.add(t);
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

/** The street's worn asphalt, patched and stained from years of festivals. */
function asphaltTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#55555c', 4941);
    const random = seeded(4943);
    for (let i = 0; i < 12; i++) {
      g.fillStyle = 'rgba(20,20,24,0.35)';
      g.fillRect(random() * 128, random() * 128, 10 + random() * 20, 6 + random() * 14);
    }
  });
}

/** The sidewalk's pale concrete with its red-brick band at the kerb. */
function sidewalkTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#a8a49c', 4951);
    g.fillStyle = 'rgba(60,58,54,0.35)';
    for (let y = 0; y < 64; y += 32) g.fillRect(0, y, 64, 1);
    g.fillStyle = '#8a4a34';
    g.fillRect(0, 0, 10, 64);
  });
}

/** An old commercial front: limestone or brick, tall arched windows, and its shopfront below. */
function frontTexture(wall: string, floors: number, k: number): CanvasTexture {
  const h = floors * 64 + 16;
  return canvasTexture(128, h, (g) => {
    speckle(g, 128, h, wall, 4961 + k);
    g.fillStyle = 'rgba(40,30,24,0.2)';
    for (let y = 0; y < h; y += 4) g.fillRect(0, y, 128, 1);
    for (let f = 1; f < floors; f++) {
      const top = h - (f + 1) * 64 + 8;
      for (let x = 12; x < 128; x += 28) {
        g.fillStyle = '#2a2420';
        g.fillRect(x, top + 10, 14, 34);
        g.beginPath();
        g.arc(x + 7, top + 10, 7, Math.PI, 0);
        g.fill();
        g.fillStyle = '#e8dcc0';
        g.fillRect(x - 2, top + 44, 18, 3);
      }
    }
    g.fillStyle = '#1a1614';
    g.fillRect(6, h - 56, 116, 56);
  });
}

/** Where the front glows: its upstairs windows warm, its shopfront and doors spilling light. */
function frontGlowTexture(floors: number, k: number): CanvasTexture {
  const h = floors * 64 + 16;
  return canvasTexture(128, h, (g) => {
    g.fillStyle = '#000000';
    g.fillRect(0, 0, 128, h);
    const random = seeded(4971 + k);
    for (let f = 1; f < floors; f++) {
      const top = h - (f + 1) * 64 + 8;
      for (let x = 12; x < 128; x += 28)
        if (random() < 0.6) {
          g.fillStyle = random() < 0.5 ? '#c88a40' : '#e8b060';
          g.fillRect(x, top + 10, 14, 34);
        }
    }
    // The shopfront's panes between their mullions, and the open door.
    for (let x = 10; x < 60; x += 13) {
      g.fillStyle = random() < 0.5 ? '#c87a38' : '#e8a050';
      g.fillRect(x, h - 48, 10, 30);
    }
    g.fillStyle = '#ffd890';
    g.fillRect(70, h - 50, 18, 50);
    for (let x = 96; x < 124; x += 13) {
      g.fillStyle = '#b86a30';
      g.fillRect(x, h - 48, 10, 30);
    }
  });
}

/** A bar's name in neon tubing. */
function neonTexture(name: string, colour: string): CanvasTexture {
  return canvasTexture(256, 52, (g) => {
    g.clearRect(0, 0, 256, 52);
    g.font = 'bold 34px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = colour;
    g.shadowBlur = 10;
    g.strokeStyle = colour;
    g.lineWidth = 3;
    g.strokeText(name, 128, 27);
    g.fillStyle = '#ffffff';
    g.fillText(name, 128, 27);
  });
}

/** The Texas flag: the lone star on blue, the white and red bars. */
function texasTexture(): CanvasTexture {
  return canvasTexture(60, 40, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 60, 20);
    g.fillStyle = '#bf0a30';
    g.fillRect(0, 20, 60, 20);
    g.fillStyle = '#002868';
    g.fillRect(0, 0, 20, 40);
    g.fillStyle = '#ffffff';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 2.5 : 6;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      g.lineTo(10 + Math.cos(a) * r, 20 + Math.sin(a) * r);
    }
    g.fill();
  });
}

/** The festival banner over the stage. */
function bannerTexture(): CanvasTexture {
  return canvasTexture(256, 40, (g) => {
    g.fillStyle = '#bf5700';
    g.fillRect(0, 0, 256, 40);
    g.fillStyle = '#ffffff';
    g.font = 'bold 26px sans-serif';
    g.textAlign = 'center';
    g.fillText('LIVE ON SIXTH', 128, 29);
  });
}

/** The taco truck's painted side and its lit menu. */
function tacoTruckTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    g.fillStyle = '#2ec4b6';
    g.fillRect(0, 0, 128, 64);
    g.fillStyle = '#ffd23f';
    g.fillRect(20, 14, 88, 28);
    g.fillStyle = '#c8102e';
    g.font = 'bold 20px sans-serif';
    g.textAlign = 'center';
    g.fillText('TACOS', 64, 36);
  });
}

/** A tower's lit windows at dusk. */
function windowsTexture(k: number): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    g.fillStyle = '#000000';
    g.fillRect(0, 0, 64, 128);
    const random = seeded(4981 + k);
    for (let y = 2; y < 128; y += 6)
      for (let x = 2; x < 64; x += 6)
        if (random() < 0.35) {
          g.fillStyle = random() < 0.5 ? '#c8a060' : '#e8d0a0';
          g.fillRect(x, y, 4, 3);
        }
  });
}
