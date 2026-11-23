// La Redoute, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Liège-Bastogne-Liège's
// wall above Remouchamps on race day in April, under a bright, broken spring sky. The rider
// punches up the steep, narrow road, its tarmac painted from kerb to kerb with the fans' names and
// slogans. The Ardennes woods close in on either side, beech and oak just coming into leaf over a
// floor of last year's brown leaves, with grey stone outcrops in the bank. Camper vans are wedged
// onto the verges where their owners have camped for days, and the fans line the road behind
// the crowd barriers, waving the black, yellow and red of Belgium and the yellow flag of
// Wallonia's red rooster; a frites stand fries in a lay-by. Ahead the wall climbs into the trees
// to a slate-roofed stone farmhouse at the top, and beyond it the E25's concrete viaduct strides
// across the valley. Built on the shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
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

/** The wall repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;

const FAN_WEAR = {
  tops: ['#ffd90f', '#1d1f24', '#c8102e', '#ffffff', '#2a6a9a', '#f08a2a', '#3a8a5a'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#3a6a9a'],
  skins: ['#f5d3b5', '#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b'],
};

/** The names and slogans painted on the road, in the order a rider meets them. */
const PAINT: readonly (readonly [string, string])[] = [
  ['ALLEZ PHIL', '#ffffff'],
  ['REDOUTE', '#ffd90f'],
  ['ALLEZ REMCO', '#ffffff'],
  ['ALÉ ALÉ', '#ff4a4a'],
  ['ALLEZ TIM', '#ffffff'],
  ['VAS-Y', '#ffd90f'],
];

export class RedouteStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; phase: number }[] = [];
  private crowd: Figures | null = null;
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
    this.addRoad(roadHalf, points);
    this.addWoods(roadHalf);
    this.addBarriers(roadHalf);
    this.addCampers(roadHalf);
    this.addFlags(roadHalf);
    this.addFrites(roadHalf);
    this.addFans(roadHalf);
    this.addValley();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    this.flags.forEach((f, k) => (f.rotation.y = Math.sin(seconds * 4 + k * 1.3) * 0.6));
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
        const metres = loopMetres(p.offset, s, LOOP, BEHIND);
        // The fans bounce and lean in, shouting the riders up the wall.
        const jump = Math.max(0, Math.sin(this.time * 5 + p.phase)) * 0.12;
        const heading =
          (p.x < 0 ? -Math.PI / 2 : Math.PI / 2) + Math.sin(this.time * 0.7 + p.phase) * 0.4;
        crowd.set(i, p.x, heightAt(metres) + jump, -metres, heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The painted road, its verges, and the wooded banks rising on either side. */
  private addRoad(roadHalf: number, points: number): void {
    const r = roadHalf;
    const tarmac = this.material({
      map: this.repeat(paintedRoadTexture(), r * 2, 60),
      roughness: 0.85,
    });
    const verge = this.material({ map: this.repeat(vergeTexture(), 2, 2), roughness: 1 });
    const floor = this.material({ map: this.repeat(leafLitterTexture(), 6, 6), roughness: 1 });
    this.ribbons.add(points, tarmac, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, verge, [
      [r + 3.5, 0.3],
      [r, 0.02],
    ]);
    this.ribbons.add(points, floor, [
      [r + 200, 70],
      [r + 30, 10],
      [r + 3.5, 0.3],
    ]);
    this.ribbons.add(points, verge, [
      [-r, 0.02],
      [-r - 3.5, 0.2],
    ]);
    this.ribbons.add(points, floor, [
      [-r - 3.5, 0.2],
      [-r - 30, 6],
      [-r - 200, 50],
    ]);
  }

  /** The Ardennes beech and oak woods just coming into leaf, and grey stone outcrops in the bank. */
  private addWoods(roadHalf: number): void {
    const random = seeded(5301);
    const bark = [0x8a8a84, 0x5a4a3e].map((c) => this.material({ color: c, roughness: 1 }));
    const leaves = [0x8ab840, 0x6a9a34, 0xa0c850, 0x4a7a2a].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const rock = this.material({ map: this.track(rockTexture()), roughness: 1, flatShading: true });
    const trunk = new CylinderGeometry(0.25, 0.4, 12, 6);
    trunk.translate(0, 6, 0);
    const crown = new DodecahedronGeometry(3.6, 1);
    crown.scale(1, 1.3, 1);
    const block = new DodecahedronGeometry(1, 0);
    this.disposables.push(trunk, crown, block);
    for (let offset = 0; offset < LOOP; offset += 2.5 + random() * 4)
      for (const side of [-1, 1]) {
        if (random() < 0.25) continue;
        const d = 6 + random() * 40;
        const tree = new Group();
        tree.add(new Mesh(trunk, bark[random() < 0.6 ? 0 : 1]!));
        for (let k = 0; k < 2; k++) {
          const c = new Mesh(crown, leaves[Math.floor(random() * leaves.length)]!);
          c.position.set((random() - 0.5) * 2, 11 + k * 3 + random() * 2, (random() - 0.5) * 2);
          tree.add(c);
        }
        tree.scale.setScalar(0.8 + random() * 0.5);
        tree.rotation.y = random() * 6;
        tree.children.forEach((m) => (m.castShadow = true));
        tree.position.y =
          side > 0
            ? 0.3 + Math.max(0, d - 3.5) * (9.7 / 26.5)
            : 0.2 + Math.max(0, d - 3.5) * (5.8 / 26.5);
        const holder = new Group();
        holder.add(tree);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
      }
    // Grey stone outcrops breaking out of the right-hand bank.
    for (let offset = 10; offset < LOOP; offset += 25 + random() * 30) {
      const outcrop = new Group();
      for (let k = 0; k < 3; k++) {
        const b = new Mesh(block, rock);
        b.scale.set(1.5 + random() * 2, 1 + random() * 1.6, 1.5 + random() * 2);
        b.position.set(random() * 2, 0.4 + random(), (random() - 0.5) * 3);
        b.rotation.y = random() * 3;
        b.castShadow = true;
        outcrop.add(b);
      }
      outcrop.position.y = 0.6;
      const holder = new Group();
      holder.add(outcrop);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 5 });
    }
  }

  /** The crowd barriers along both kerbs, sponsors' banners hung on them. */
  private addBarriers(roadHalf: number): void {
    const steel = this.material({ color: 0xc8cacc, roughness: 0.4, metalness: 0.7 });
    const banners = [0, 1, 2].map((k) =>
      this.material({ map: this.track(bannerTexture(k)), roughness: 0.8 }),
    );
    for (let offset = 0; offset < LOOP; offset += 2.5)
      for (const side of [-1, 1]) {
        if (offset % 60 > 40) continue;
        const barrier = new Group();
        const top = new Mesh(this.unit, steel);
        top.scale.set(0.05, 0.05, 2.4);
        top.position.y = 1.05;
        const bottom = new Mesh(this.unit, steel);
        bottom.scale.set(0.05, 0.05, 2.4);
        bottom.position.y = 0.2;
        barrier.add(top, bottom);
        for (let b = -1; b <= 1; b += 0.25) {
          const bar = new Mesh(this.unit, steel);
          bar.scale.set(0.02, 0.85, 0.02);
          bar.position.set(0, 0.62, b);
          barrier.add(bar);
        }
        if ((offset / 2.5) % 3 === 0) {
          const banner = new Mesh(this.unit, banners[((offset / 7.5) % 3) | 0]!);
          banner.scale.set(0.02, 0.8, 2.3);
          banner.position.set(-side * 0.03, 0.62, 0);
          barrier.add(banner);
        }
        const holder = new Group();
        holder.add(barrier);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: side * (roadHalf + 0.3) });
      }
  }

  /** Camper vans wedged onto the verges, their awnings out and chairs set in front. */
  private addCampers(roadHalf: number): void {
    const random = seeded(5311);
    const white = this.material({ color: 0xf0f0ec, roughness: 0.4 });
    const stripe = [0xc8102e, 0x2a6a9a, 0x3a3a3a].map((c) =>
      this.material({ color: c, roughness: 0.5 }),
    );
    const glass = this.material({ color: 0x1d2630, roughness: 0.1, metalness: 0.6 });
    const tyre = this.material({ color: 0x1d1f24, roughness: 0.8 });
    const awning = [0x2a6a9a, 0xe8a020, 0x3a8a5a].map((c) =>
      this.material({ color: c, roughness: 0.8 }),
    );
    for (let k = 0; k < 6; k++) {
      const side = k % 2 ? 1 : -1;
      const van = new Group();
      const body = new Mesh(this.unit, white);
      body.scale.set(2.3, 2.6, 6.5);
      body.position.y = 1.7;
      const band = new Mesh(this.unit, stripe[k % stripe.length]!);
      band.scale.set(2.32, 0.25, 6.5);
      band.position.y = 1.5;
      const cab = new Mesh(this.unit, glass);
      cab.scale.set(2.1, 0.8, 0.6);
      cab.position.set(0, 2, -3.1);
      const wheels = new Mesh(this.unit, tyre);
      wheels.scale.set(2.2, 0.7, 4.5);
      wheels.position.y = 0.35;
      const shade = new Mesh(this.unit, awning[k % awning.length]!);
      shade.scale.set(2.2, 0.06, 4);
      shade.position.set(-side * 2.2, 2.8, 0.5);
      shade.rotation.z = side * 0.15;
      van.add(body, band, cab, wheels, shade);
      van.children.forEach((c) => (c.castShadow = true));
      van.rotation.y = (random() - 0.5) * 0.2;
      van.position.y = 0.6;
      const holder = new Group();
      holder.add(van);
      this.group.add(holder);
      this.props.push({
        mesh: holder,
        offset: 45 + k * 52 + random() * 15,
        x: side * (roadHalf + 5.4),
      });
    }
  }

  /** Belgian tricolours and Wallonia's red-rooster flags waving over the crowd. */
  private addFlags(roadHalf: number): void {
    const random = seeded(5321);
    const belgium = this.material({ map: this.track(belgianTexture()), roughness: 0.8, side: 2 });
    const wallonia = this.material({ map: this.track(roosterTexture()), roughness: 0.8, side: 2 });
    const pole = this.material({ color: 0x2a2a2a, roughness: 0.6 });
    const cloth = new PlaneGeometry(1.2, 0.8);
    cloth.translate(0.6, 0, 0);
    this.disposables.push(cloth);
    for (let offset = 6; offset < LOOP; offset += 9 + random() * 12) {
      const side = random() < 0.5 ? -1 : 1;
      const stand = new Group();
      const stick = new Mesh(this.unit, pole);
      stick.scale.set(0.04, 3, 0.04);
      stick.position.y = 1.5;
      const flag = new Mesh(cloth, random() < 0.6 ? belgium : wallonia);
      flag.position.y = 2.6;
      stand.add(stick, flag);
      this.flags.push(flag);
      const holder = new Group();
      holder.add(stand);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + 1.2) });
    }
  }

  /** The frites stand in its lay-by, steam rising from the fryer. */
  private addFrites(roadHalf: number): void {
    const stand = new Group();
    const red = this.material({ map: this.track(fritesTexture()), roughness: 0.6 });
    const roof = this.material({ color: 0xf0f0ec, roughness: 0.6 });
    const body = new Mesh(this.unit, red);
    body.scale.set(2.4, 2.4, 4);
    body.position.y = 1.3;
    const top = new Mesh(this.unit, roof);
    top.scale.set(3.2, 0.15, 4.6);
    top.position.set(-0.4, 2.6, 0);
    stand.add(body, top);
    stand.children.forEach((c) => (c.castShadow = true));
    stand.position.y = 0.3;
    const holder = new Group();
    holder.add(stand);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 140, x: roadHalf + 3.8 });
  }

  /** The fans lining the barriers, thick near the top. */
  private addFans(roadHalf: number): void {
    const random = seeded(5331);
    for (let offset = 2; offset < LOOP; offset += 0.7 + random() * 1.3) {
      if (offset % 60 > 42 && random() < 0.7) continue;
      const side = random() < 0.5 ? -1 : 1;
      this.people.push({
        offset,
        x: side * (roadHalf + 0.8 + random() * 1.8),
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, FAN_WEAR, 5337);
  }

  /** The farmhouse at the top of the wall, and beyond it the E25's viaduct striding across the valley. */
  private addValley(): void {
    const random = seeded(5341);
    const concrete = this.material({ map: this.track(concreteTexture()), roughness: 0.9 });
    const viaduct = new Group();
    const deck = new Mesh(this.unit, concrete);
    deck.scale.set(1600, 4, 24);
    deck.position.y = 60;
    viaduct.add(deck);
    for (let k = -7; k <= 7; k++) {
      const pier = new Mesh(this.unit, concrete);
      pier.scale.set(7, 60, 12);
      pier.position.set(k * 100, 29, 0);
      viaduct.add(pier);
    }
    viaduct.rotation.y = 0.25;
    viaduct.position.set(0, -10, -620);
    this.horizon.add(viaduct);
    // The wooded hills across the valley.
    const woods = [0x5a8a34, 0x6a9a3a, 0x4a7a2a].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const hill = new DodecahedronGeometry(1, 1);
    this.disposables.push(hill);
    for (let k = 0; k < 10; k++) {
      const h = new Mesh(hill, woods[k % woods.length]!);
      h.scale.set(300 + random() * 300, 120 + random() * 80, 260);
      h.position.set(-1400 + k * 300 + random() * 100, 0, -1100 - random() * 400);
      this.horizon.add(h);
    }
    // The grey stone farmhouse with its slate roof at the top of the wall.
    const stone = this.material({ map: this.track(rockTexture()), roughness: 1 });
    const slate = this.material({ color: 0x3a3e46, roughness: 0.7 });
    const farm = new Group();
    const house = new Mesh(this.unit, stone);
    house.scale.set(14, 8, 10);
    house.position.y = 4;
    const roof = new Mesh(new ConeGeometry(9.5, 5, 4), slate);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1, 1, 0.75);
    roof.position.y = 10.5;
    this.disposables.push(roof.geometry);
    farm.add(house, roof);
    farm.position.set(-28, 40, -300);
    this.horizon.add(farm);
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

/** The tarmac painted with the fans' names and slogans, written for the riders coming up. */
function paintedRoadTexture(): CanvasTexture {
  return canvasTexture(256, 1024, (g) => {
    speckle(g, 256, 1024, '#5a5a5c', 5351);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    PAINT.forEach(([text, colour], k) => {
      g.save();
      g.translate(128, 80 + k * 160);
      g.scale(-1, 1.8);
      g.fillStyle = colour;
      g.globalAlpha = 0.85;
      g.font = 'bold 34px sans-serif';
      g.fillText(text, 0, 0);
      g.restore();
    });
  });
}

/** The verge's rough spring grass. */
function vergeTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#6a8a3a', 5361));
}

/** The wood's floor: last year's brown beech leaves with new green coming through. */
function leafLitterTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#8a6a44', 5371);
    const random = seeded(5373);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = ['#a8784a', '#6a5034', '#6a8a3a', '#b8905a'][Math.floor(random() * 4)]!;
      g.fillRect(random() * 128, random() * 128, 3 + random() * 4, 2 + random() * 3);
    }
  });
}

/** The Ardennes' grey sandstone and schist. */
function rockTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#8a8680', 5381);
    g.fillStyle = 'rgba(50,48,44,0.35)';
    for (let y = 4; y < 64; y += 9) g.fillRect(0, y, 64, 1);
  });
}

/** A sponsor's banner on the barriers. */
function bannerTexture(k: number): CanvasTexture {
  const [bg, fg, word] = [
    ['#ffd90f', '#1d1f24', 'LIÈGE'],
    ['#1d3a8a', '#ffffff', 'ARDENNES'],
    ['#c8102e', '#ffffff', 'LA REDOUTE'],
  ][k]!;
  return canvasTexture(128, 32, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, 128, 32);
    g.fillStyle = fg;
    g.font = 'bold 18px sans-serif';
    g.textAlign = 'center';
    g.fillText(word, 64, 23);
  });
}

/** The Belgian tricolour: black, yellow and red. */
function belgianTexture(): CanvasTexture {
  return canvasTexture(48, 32, (g) => {
    g.fillStyle = '#1d1d1d';
    g.fillRect(0, 0, 16, 32);
    g.fillStyle = '#ffd90f';
    g.fillRect(16, 0, 16, 32);
    g.fillStyle = '#ef3340';
    g.fillRect(32, 0, 16, 32);
  });
}

/** Wallonia's flag: a red rooster on yellow. */
function roosterTexture(): CanvasTexture {
  return canvasTexture(48, 32, (g) => {
    g.fillStyle = '#ffd90f';
    g.fillRect(0, 0, 48, 32);
    g.fillStyle = '#d8102e';
    g.beginPath();
    g.ellipse(24, 18, 9, 7, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(17, 9, 4, 0, Math.PI * 2);
    g.fill();
    g.fillRect(28, 6, 4, 10);
    g.fillRect(21, 24, 2, 6);
    g.fillRect(26, 24, 2, 6);
  });
}

/** The frites stand's red side and its sign. */
function fritesTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#c8102e';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#ffd90f';
    g.font = 'bold 14px sans-serif';
    g.textAlign = 'center';
    g.fillText('FRITES', 32, 24);
  });
}

/** The viaduct's weathered concrete. */
function concreteTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#a8a49c', 5391));
}
